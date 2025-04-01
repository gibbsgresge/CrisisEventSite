"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Crown, PenBox } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import LoadingSpinner from "./ui/loading-spinner";
import { getUserByEmail } from "@/app/server/queries";
import { redirect, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User } from "next-auth";

// This is sample data.
const data = {
  navMain: [
    {
      title: "History",
      url: "#",
      items: [
        {
          title: "Hurricane Katrina",
          url: "#",
        },
        {
          title: "Hurricane Milton",
          url: "#",
          isActive: false,
        },
        {
          title: "7.0 Earthquake in Indonesia",
          url: "#",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex flex-1 items-center justify-between px-2">
          <h1 className="text-xl font-bold">CrisisBrief</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {user.role === "admin" && (
          <div className="px-2">
            <SidebarMenuButton>
              <Link href={"/admin"} className="flex items-center gap-2">
                <Crown size={20} />
                <span>Admin Panel</span>
              </Link>
            </SidebarMenuButton>
          </div>
        )}
        <div className="px-2">
          <SidebarMenuButton>
            <Link href={"/new-summary"} className="flex items-center gap-2">
              <PenBox size={20} />
              <span>New Summary</span>
            </Link>
          </SidebarMenuButton>
        </div>

        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
