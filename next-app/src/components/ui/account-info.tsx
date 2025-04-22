import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Label } from "./label";
import { Input } from "./input";
import { Button } from "./button";
import { Separator } from "./separator";
import { Settings } from "lucide-react";
import Toggle from "./toggle-slider";
import { useEffect, useState } from "react";
import { User } from "next-auth";
import {
  getUserByEmail,
  updateUserEmailNotificationPreference,
} from "@/app/server/queries";
import { useMutation, useQueryClient } from "react-query";
import { toast, useToast } from "@/hooks/use-toast";
import LoadingSpinner from "./loading-spinner";

export default function AccountInfo() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user info
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
  }, [session]);

  // Handle Role Update
  const { mutate: changeNotificationPreference } = useMutation(
    async ({
      userId,
      newPreference,
    }: {
      userId: string;
      newPreference: boolean;
    }) => updateUserEmailNotificationPreference(userId, newPreference),
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Notification preferences updated.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update notification preferences.",
          variant: "destructive",
        });
      },
    }
  );

  if (isLoading) return <LoadingSpinner />;

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
            <Separator />
            <div className="p-2">
              <div className="flex justify-between ">
                Email Notifications
                <Toggle
                  checked={user?.emailNotifications ?? false}
                  onChange={(newValue: boolean) => {
                    if (user?.id) {
                      changeNotificationPreference({
                        userId: user.id,
                        newPreference: newValue,
                      });
                      setUser({ ...user, emailNotifications: newValue });
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                You will only receive notifications when summaries or templates
                are done generating if this setting is on.
              </p>
            </div>

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
