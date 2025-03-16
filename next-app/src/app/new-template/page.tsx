"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Delete, Plus, Sparkles, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";

// TODO: fetch event categories from db and dynamically fill
//       the combobox with categories
const frameworks = [
  {
    value: "hurricane",
    label: "Hurricane",
  },
  {
    value: "earthquake",
    label: "Earthquake",
  },
  {
    value: "mass-shooting",
    label: "Mass Shooting",
  },
];

// protected route
export default function GenerateTemplate() {
  const [urlValue, setUrlValue] = useState("");
  const [addedUrls, setAddedUrls] = useState<string[]>([]);

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");

  const [activeButton, setActiveButton] = useState("useAI");

  const { data: session } = useSession();
  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  /**
   * Add the input of url(s) to the addedUrls array without duplicates
   *
   * @param url the url input to be parsed for url(s) to add to addedUrls
   */
  const addUrl = (url: string) => {
    // Split the input by commas, trim any extra spaces, and filter out empty strings
    const urls = url
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u !== "");

    // Add only unique URLs to the addedUrls array
    setAddedUrls((prevUrls) => {
      const uniqueUrls = [...new Set([...prevUrls, ...urls])]; // Create a set to remove duplicates
      return uniqueUrls;
    });

    setUrlValue("");
  };

  /**
   * Remove the given url from the addedUrls array. This function is called
   * when the "X" mark is clicked next to a given url.
   *
   * @param urlToRemove remove this url from addedUrls
   */
  const deleteUrl = (urlToRemove: string) => {
    setAddedUrls(addedUrls.filter((url) => url !== urlToRemove));
  };

  return (
    <div className="flex flex-col items-center pt-20 w-full max-w-lg p-4">
      <div>
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
            <Textarea placeholder="Lorem ipsum..." />
          </div>
          <p className="text-sm text-muted-foreground pt-1">
            {activeButton === "useAI"
              ? "Enter summaries of other events in the same category and ensure they are in separate paragraphs."
              : "Enter the template you would like to upload as plain text."}
          </p>
        </div>
      </div>
      <div className="flex w-full justify-end pt-6">
        <Button disabled={!(addedUrls.length > 0 && category !== "")}>
          Submit
        </Button>
      </div>
    </div>
  );
}
