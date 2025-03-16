import * as React from "react";

import { SearchForm } from "@/components/search-form";
import { VersionSwitcher } from "@/components/version-switcher";
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
import { PenBox } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Admin",
      url: "#",
      items: [
        {
          title: "New Template",
          url: "/new-template",
        },
        {
          title: "Test Template Accuracy",
          url: "#",
        },
      ],
    },
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
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex flex-1 items-center justify-between px-2">
          <h1 className="text-xl font-bold">CrisisBrief</h1>
          <Link href={"/new-summary"} title="New Summary">
            <Button variant={"ghost"} size={"icon"}>
              <PenBox size={16} />
            </Button>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
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
