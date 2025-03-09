import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Label } from "./label";
import { Input } from "./input";
import { Button } from "./button";

export default function AccountInfo() {
  const { data: session } = useSession();

  return (
    <>
      <Popover>
        <PopoverTrigger>
          <Avatar>
            <AvatarFallback>{session?.user?.name?.slice(0, 1)}</AvatarFallback>
            {session?.user?.image && session?.user?.name && (
              <AvatarImage
                src={session?.user?.image}
                alt={session?.user?.name}
              />
            )}
          </Avatar>
        </PopoverTrigger>
        <PopoverContent>
          <div className="grid gap-4">
            <Button onClick={() => signOut({ callbackUrl: "/" })}>
              Sign Out
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
