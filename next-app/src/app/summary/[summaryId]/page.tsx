"use client";
import { getSummaryById } from "@/app/server/queries";
import { useQuery } from "react-query";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { redirect, useParams } from "next/navigation";

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
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">{scrubTitle(summary.title)}</h1>
      <p className="text-sm text-muted-foreground">
        Category: {summary.category}
      </p>
      <div className="mt-4">
        <h2 className="text-xl">Summary:</h2>
        <p>{summary.summary}</p>
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">
          Created at: {new Date(summary.created_at).toLocaleString()} by{" "}
          {summary.recipient.email}
        </p>
      </div>
    </div>
  );
}
