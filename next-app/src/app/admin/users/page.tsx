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
import { ArrowLeft, Crown, CrownIcon, Trash, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "./data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

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

  // React Query to fetch all users
  const {
    data: users,
    error,
    isLoading: queryLoading,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const users = await getAllUsers();
      return users;
    },
  });

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
  }, [session, router, users]);

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

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => changeRole({ userId: user.id, role: "admin" })}
              >
                <Crown />
                Make Admin
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => changeRole({ userId: user.id, role: "user" })}
              >
                <UserCheck />
                Make User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => removeUser(user.id)}
              >
                <Trash />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading || queryLoading || !user) return <LoadingSpinner />;

  return (
    <div className="flex flex-col px-4 w-full max-w-3xl">
      <div className="flex items-center gap-2 py-4">
        <Button
          variant={"ghost"}
          onClick={() => redirect("/admin")}
          title="Back"
          size={"icon"}
        >
          <ArrowLeft className="w-24 h-24" />
        </Button>
        <h1 className="text-3xl">Users</h1>
      </div>
      <div className="container py-10 mx-auto">
        {users && <DataTable columns={columns} data={users} />}
      </div>
    </div>
  );
}
