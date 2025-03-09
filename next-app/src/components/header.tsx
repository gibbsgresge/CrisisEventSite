"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { signIn, useSession } from "next-auth/react";
import AccountInfo from "@/components/ui/account-info";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b bg-background flex flex-1 justify-center px-4">
      {session && (
        <div className="flex items-center pr-6">
          <SidebarTrigger />
        </div>
      )}

      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={"/"}>
            <h1 className="text-lg">CrisisBrief</h1>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <ThemeSwitcher />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}

function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <>
        <AccountInfo />
      </>
    );
  }

  return (
    <>
      <Button onClick={() => signIn("github", { callbackUrl: "/new-summary" })}>
        Sign in
      </Button>
    </>
  );
}
