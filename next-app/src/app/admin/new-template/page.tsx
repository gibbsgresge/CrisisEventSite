"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "react-query";
import axios from "axios";
import { getUserByEmail } from "../../server/queries";
import { User } from "next-auth";
import { useToast } from "@/hooks/use-toast";

// protected route
export default function GenerateTemplate() {
  const [category, setCategory] = useState("");
  const [context, setContext] = useState<string>("");

  const [activeButton, setActiveButton] = useState("useAI");

  const { toast } = useToast();

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
          router.replace("/unauthorized");
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user:", error);
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [session, router]);

  const {
    mutate,
    isLoading: mutationLoading,
    isError,
    isSuccess,
    error,
  } = useMutation({
    mutationFn: async ({
      category,
      context,
    }: {
      category: string;
      context: string;
    }) => {
      const response = await axios.post(
        "http://localhost:5000/generate-template",
        {
          user: user,
          category: category,
          text: context,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response) {
        throw new Error("Failed to generate template");
      }

      return response;
    },
    onError: (error: string) => {
      toast({
        title: "Error",
        description: error || "Something went wrong.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      if (isError) return; // Skip the success toast if error occurs
      toast({
        title: "Generating...",
        description:
          "You will receive an email when your template is done generating!",
        variant: "default",
      });
    },
    onSettled: () => {
      // Resetting loading state or clearing any success/error-specific actions
    },
  });

  const handleSubmit = () => {
    mutate({ category, context });
  };

  if (isLoading || mutationLoading || !user) return <LoadingSpinner />;

  return (
    <div className="flex flex-col items-center pt-20 w-full max-w-lg p-4">
      <div className="relative w-full flex justify-center gap-2 py-4">
        <Button
          variant={"ghost"}
          onClick={() => redirect("/admin")}
          title="Back"
          size={"icon"}
          className="absolute left-0"
        >
          <ArrowLeft className="w-24 h-24" />
        </Button>
        <h1 className="text-3xl font-bold">New Template</h1>
      </div>

      <Card className="flex gap-6 px-4 py-2 w-full justify-center mt-6">
        <Button
          className="w-full"
          variant={activeButton === "useAI" ? "default" : "ghost"}
          onClick={() => setActiveButton("useAI")}
        >
          <Sparkles /> Use AI
        </Button>
        <Button
          variant={activeButton !== "useAI" ? "default" : "ghost"}
          className="w-full"
          onClick={() => setActiveButton("manual")}
        >
          Manual
        </Button>
      </Card>

      <div className="flex flex-col w-full gap-6 pt-6">
        <div>
          <div className="flex flex-col gap-2">
            <Label>Crisis Event Category</Label>
            <Input
              type="text"
              placeholder="e.g. Hurricane, Mass Shooting, Earthquake"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground pt-1">
            {
              "Enter the Crisis Event Category for the template you are creating. This will be the name shown to users who use the template."
            }
          </p>
        </div>

        <div>
          <div className="flex flex-col gap-2">
            <Label>
              {activeButton === "useAI"
                ? "Example Summaries for Similar Events"
                : "Your Template"}
            </Label>
            <Textarea
              placeholder="Lorem ipsum..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground pt-1">
            {activeButton === "useAI"
              ? "Enter summaries of other events in the same category and ensure they are in separate paragraphs."
              : "Enter the template you would like to upload as plain text."}
          </p>
        </div>

        <div className="flex w-full justify-end pt-6">
          <Button
            disabled={
              (category === "" && context === "") || isLoading || isSuccess
            }
            onClick={handleSubmit}
          >
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </div>

        {isLoading && <LoadingSpinner />}
      </div>
    </div>
  );
}
