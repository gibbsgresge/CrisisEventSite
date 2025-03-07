"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Header() {
  return (
    <header className="border-b bg-background flex flex-1 justify-center px-6">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={"/"}>
            <h1>CrisisBrief</h1>
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
        {session?.user?.name}
        <Button onClick={() => signOut({ callbackUrl: "/" })}>Sign Out</Button>
      </>
    );
  }

  return (
    <>
      <Button onClick={() => signIn("github", { callbackUrl: "/dashboard" })}>
        Sign in
      </Button>
    </>
  );
}
