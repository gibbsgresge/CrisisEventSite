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
import { getSummaryByEmail, getUserByEmail } from "@/app/server/queries";
import { redirect, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User } from "next-auth";
import { useQuery } from "react-query";

// // This is sample data.
// const data = {
//   navMain: [
//     {
//       title: "History",
//       url: "#",
//       items: [
//         {
//           title: "Hurricane Katrina",
//           url: "#",
//         },
//         {
//           title: "Hurricane Milton",
//           url: "#",
//           isActive: false,
//         },
//         {
//           title: "7.0 Earthquake in Indonesia",
//           url: "#",
//         },
//       ],
//     },
//   ],
// };

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

  // React Query to fetch all users
  const {
    data: summaries,
    error,
    isLoading: queryLoading,
  } = useQuery({
    queryKey: ["summaries"],
    queryFn: async () => {
      if (!session.user.email) return;
      const summaries = await getSummaryByEmail(session.user.email);
      console.log("fetching sumarries");
      return summaries;
    },
  });

  const scrubTitle = (title: string): string => {
    if (!title) return "";
    // Remove "Answer" and any non-alphanumeric characters (except spaces and periods)
    return title
      .replace(/\bAnswer\b/gi, "") // Remove the word "Answer", case insensitive
      .replace(/[^a-zA-Z0-9\s.]/g, "") // Remove all non-alphanumeric characters except spaces and periods
      .replace(/\btitle\b/gi, "") // Remove the word "title" (case insensitive)
      .replace(/-{3,}/g, "") // Remove sets of three or more hyphens
      .trim(); // Trim leading/trailing whitespace
  };

  // Dynamically construct sidebar data
  const navData = {
    navMain: [
      {
        title: "History",
        url: "#",
        items:
          summaries?.map((summary) => ({
            title: scrubTitle(summary.title),
            url: `/summary/${summary.id}`,
            isActive: false,
            id: summary.id,
          })) || [],
      },
    ],
  };

  if (isLoading || queryLoading || !user) return <LoadingSpinner />;
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex flex-1 items-center justify-between px-2">
          <Link href={"/"}>
            <h1 className="text-xl font-bold">CrisisBrief</h1>
          </Link>
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
        {navData.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <Link href={item.url}>
                        <p className="truncate">{item.title}</p>
                      </Link>
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
