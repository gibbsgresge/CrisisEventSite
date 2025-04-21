"use client";
import { getSummaryById, getUserByEmail } from "@/app/server/queries";
import { useQuery } from "react-query";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { redirect, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Copy } from "lucide-react"; // Make sure you have lucide-react installed
import { useToast } from "@/hooks/use-toast";
import { User } from "next-auth";
import { useSession } from "next-auth/react";

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

  // check if user is signed in
  const { data: session } = useSession();
  if (!session || !session.user || !session.user.email) {
    redirect("/api/auth/signin");
  }

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

  if (queryLoading) return <LoadingSpinner />;

  if (!summary) redirect("/");

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <h1 className="text-3xl font-bold">{scrubTitle(summary.title)}</h1>
      <div className="mt-4 relative group bg-muted/40 p-4 rounded-md transition">
        <p>{summary.summary}</p>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md p-1"
          title={copied ? "Copied!" : "Copy summary"}
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">
          Created at: {new Date(summary.created_at).toLocaleString()} by{" "}
          {summary.recipient.email} using {summary.category} Template
        </p>
      </div>
    </div>
  );
}
