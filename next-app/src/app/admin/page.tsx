"use client";

import { useSession } from "next-auth/react";
import { useRouter, redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllUsers, getUserByEmail } from "../server/queries";
import { User } from "next-auth";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useQuery } from "react-query";
import { Button } from "@/components/ui/button";

export default function AdminPanel() {
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

  if (isLoading || !user) return <LoadingSpinner />;

  return (
    <div>
      <h1>Hi, {session.user.name}</h1>
      <Button onClick={() => redirect("/admin/users")}>Users</Button>
      <Button onClick={() => redirect("/admin/templates")}>Templates</Button>
    </div>
  );
}
