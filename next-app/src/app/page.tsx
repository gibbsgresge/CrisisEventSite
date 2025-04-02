"use client";

import { Button } from "@/components/ui/button";
import { User } from "next-auth";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserByEmail } from "@/app/server/queries";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function Home() {
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
          router.replace("/new-summary");
          return; // Prevents state update after redirect
        } else {
          router.replace("/admin");
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
}
