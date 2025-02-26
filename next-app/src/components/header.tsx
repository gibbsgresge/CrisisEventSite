import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "./theme-switcher";

export default function Header() {
  return (
    <header className="border-b bg-background flex flex-1 justify-center">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={"/"}>
            <h1>CrisisBrief</h1>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <ThemeSwitcher />
          <Link href={"/login"}>
            <Button>Login</Button>
          </Link>
          <Link href={"/register"}>
            <Button variant={"outline"}>Register</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
