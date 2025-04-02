"use client";

import { useSession } from "next-auth/react";
import { useRouter, redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllUsers, getUserByEmail } from "../server/queries";
import { User } from "next-auth";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useQuery } from "react-query";
import { Button } from "@/components/ui/button";
import { Newspaper, Plus, Users } from "lucide-react";

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
      <div className="flex flex-col px-4 w-full max-w-3xl">
        <div className="flex items-center gap-2 py-4">
          <h1 className="text-3xl">Hi, {session.user.name}</h1>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 w-full justify-between">
            <Button
              className="flex-1"
              onClick={() => redirect("/admin/users")}
              variant={"outline"}
            >
              <Users />
              Users
            </Button>
            <Button
              className="flex-1"
              onClick={() => redirect("/admin/generated-templates")}
              variant={"outline"}
            >
              <Newspaper /> Templates
            </Button>
          </div>
          <div className="flex gap-4 w-full justify-between">
            <Button
              className="flex-1"
              onClick={() => redirect("/admin/new-template")}
            >
              <Plus />
              Create Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
