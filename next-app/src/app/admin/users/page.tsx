"use client";

import { useSession } from "next-auth/react";
import { useRouter, redirect } from "next/navigation";
import { useEffect, useState } from "react";
import {
  deleteUser,
  getAllUsers,
  getUserByEmail,
  updateUserRole,
} from "@/app/server/queries";
import { User } from "next-auth";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Trash, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function AdminPanelUsers() {
  const [user, setUser] = useState<User | null>(null);
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Fetch user role
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!session?.user?.email) return;

        const userResponse = await getUserByEmail(session.user.email);
        setUser(userResponse);

        if (userResponse.role !== "admin") {
          router.replace("/unauthorized");
          return; // Prevents state update after redirect
        }

        console.log(users);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user:", error);
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [session, router]);

  // React Query to fetch all users
  const {
    data: users,
    error,
    isLoading: queryLoading,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const users = await getAllUsers(); // Get all users using your existing function
      return users; // Return the users array
    }, // Fetch users using React Query
  });

  // Handle Role Update
  const { mutate: changeRole } = useMutation(
    async ({ userId, role }: { userId: string; role: string }) =>
      updateUserRole(userId, role),
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "User role updated.",
          variant: "default",
        });
        queryClient.invalidateQueries(["users"]); // Refresh user list
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update user role.",
          variant: "destructive",
        });
      },
    }
  );

  // Handle User Deletion
  const { mutate: removeUser } = useMutation(
    async (userId: string) => deleteUser(userId),
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "User deleted.",
          variant: "default",
        });
        queryClient.invalidateQueries(["users"]);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete user.",
          variant: "destructive",
        });
      },
    }
  );

  if (isLoading || queryLoading || !user) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center gap-2 py-4">
        <Button
          variant={"ghost"}
          onClick={() => redirect("/admin")}
          title="Back"
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-3xl">Users</h1>
      </div>
      {/* Table to display users */}
      <Card>
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-background-accent">
              <th className="px-4 py-2 text-left">Avatar</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Make Admin</th>
              <th className="px-4 py-2 text-left">Make User</th>
              <th className="px-4 py-2 text-left">Remove</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user: User) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-2">
                  <Avatar>
                    <AvatarImage
                      src={user.image || "/default-avatar.png"}
                      alt={user.name || "unknown"}
                    />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                </td>
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.role}</td>

                {/* Make admin */}
                <td className="px-4 py-2">
                  <div className="flex justify-center items-center">
                    <Button
                      variant={"ghost"}
                      onClick={() =>
                        changeRole({ userId: user.id, role: "admin" })
                      }
                    >
                      <Crown />
                    </Button>
                  </div>
                </td>

                {/* Make user */}
                <td className="px-4 py-2">
                  <div className="flex justify-center items-center">
                    <Button
                      variant={"ghost"}
                      onClick={() =>
                        changeRole({ userId: user.id, role: "user" })
                      }
                    >
                      <UserCheck />
                    </Button>
                  </div>
                </td>

                {/* Delete user */}
                <td className="px-4 py-2">
                  <div className="flex justify-center items-center">
                    <Button
                      variant={"ghost"}
                      onClick={() => {
                        if (
                          confirm("Are you sure you want to delete this user?")
                        ) {
                          console.log("user", user.id);
                          removeUser(user.id);
                        }
                      }}
                    >
                      <Trash />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
