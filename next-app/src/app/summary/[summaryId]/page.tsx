"use client";
import {
  deleteSummaryById,
  getSummaryById,
  getUserByEmail,
} from "@/app/server/queries";
import { useMutation, useQuery, useQueryClient } from "react-query";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { redirect, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Copy, Trash } from "lucide-react"; // Make sure you have lucide-react installed
import { useToast } from "@/hooks/use-toast";
import { User } from "next-auth";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SummaryPage() {
  const params = useParams<{ summaryId: string }>();
  // React Query to fetch all users
  const {
    data: summary,
    error,
    isLoading: queryLoading,
  } = useQuery({
    queryKey: [`${params.summaryId}`],
    queryFn: async () => {
      const summary = await getSummaryById(params.summaryId);
      return summary;
    },
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary.summary);
    setCopied(true);
    toast({
      title: "Summary Copied to Clipboard",
      variant: "default",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const [user, setUser] = useState<User | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // check if user is signed in
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "loading" && (!session || !session.user?.email)) {
      redirect("/api/auth/signin");
    }
  }, [session, status]);

  // Handle Template Deletion
  const { mutate: removeSummary } = useMutation(
    async (summaryId: string) => deleteSummaryById(summaryId),
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Summary deleted.",
          variant: "default",
        });
        queryClient.invalidateQueries(["summaries"]);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete summary.",
          variant: "destructive",
        });
      },
    }
  );

  const handleDelete = (summaryId: string) => {
    removeSummary(summaryId);
    redirect("/new-summary");
  };

  // fetch user object to send to backend on POST
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!session || !session.user || !session.user.email) {
          return;
        }
        const userResponse = await getUserByEmail(session.user.email);
        setUser(userResponse);
        console.log(userResponse);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, [session]);

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

  useEffect(() => {
    if (!queryLoading && !summary) {
      toast({
        title: "Error",
        description: `Error finding template with ID: ${params.summaryId}`,
        variant: "destructive",
      });
      redirect("/new-summary");
    }
  }, [queryLoading, summary]);

  if (queryLoading) return <LoadingSpinner />;

  return (
    summary && (
      <div className="container mx-auto max-w-3xl p-4">
        <h1 className="text-3xl font-bold">{scrubTitle(summary.title)}</h1>
        <Card className="mt-4 group relative bg-muted p-4 transition">
          <p>{summary.summary}</p>
          <Button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            title={copied ? "Copied!" : "Copy summary"}
            size={"icon"}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </Card>
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Created at: {new Date(summary.created_at).toLocaleString()} by{" "}
            {summary.recipient.email} using {summary.category} Template
          </p>
          <Button
            onClick={() => {
              if (!summary.id) return;
              handleDelete(summary.id);
            }}
            variant="destructive"
            size="sm"
          >
            <Trash className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>
    )
  );
}
