"use client";

import { useSession } from "next-auth/react";
import { useRouter, redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllUsers, getUserByEmail } from "@/app/server/queries";
import { User } from "next-auth";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useQuery } from "react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { title } from "process";

export default function AdminPanelUsers() {
  const [user, setUser] = useState<User | null>(null);
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

  if (isLoading || queryLoading || !user) return <LoadingSpinner />;

  return (
    <div>
      <Button variant={"ghost"} onClick={() => redirect("/admin")} title="Back">
        <ArrowLeft />
      </Button>
      <h2>All Users:</h2>
      <ul>
        {users?.map((user: User) => (
          <li key={user.id}>
            {user.name} ({user.email}) - {user.role}
          </li>
        ))}
      </ul>
    </div>
  );
}
