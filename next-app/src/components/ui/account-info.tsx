import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Label } from "./label";
import { Input } from "./input";
import { Button } from "./button";
import { Separator } from "./separator";
import { Settings } from "lucide-react";

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
            <div className="flex gap-4 items-center">
              <div>
                <Avatar>
                  <AvatarFallback>
                    {session?.user?.name?.slice(0, 1)}
                  </AvatarFallback>
                  {session?.user?.image && session?.user?.name && (
                    <AvatarImage
                      src={session?.user?.image}
                      alt={session?.user?.name}
                    />
                  )}
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {session?.user?.name}
                </span>
                <span className="truncate text-xs">{session?.user?.email}</span>
              </div>
            </div>

            {/* <Separator />
            <div>
              <span>Settings</span>
            </div> */}
            <Separator />
            <Button
              variant={"ghost"}
              className="flex gap-2 items-center justify-start"
            >
              <Settings size={20} />
              <span>Settings</span>
            </Button>
            <Button
              className="mt-1"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign Out
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
