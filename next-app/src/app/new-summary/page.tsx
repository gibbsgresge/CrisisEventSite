"use client";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Delete, Plus, X } from "lucide-react";
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
export default function Dashboard() {
  const [urlValue, setUrlValue] = useState("");
  const [addedUrls, setAddedUrls] = useState<string[]>([]);

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");

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
        <h1 className="text-3xl font-bold">New Summary</h1>
      </div>

      <div className="flex flex-col w-full gap-6 pt-6">
        {/* URLS input */}
        <div>
          <Label>Enter URL(s)</Label>
          <div className="flex w-full items-center space-x-2 pt-1">
            <Input
              type="url"
              placeholder="https://vt.edu"
              value={urlValue}
              onChange={(e) => {
                setUrlValue(e.target.value);
              }}
            />
            <Button type="submit" onClick={() => addUrl(urlValue)}>
              <Plus />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-1">
            {
              " You can add multiple URLs at once by entering them in a comma separated list. (e.g. https://vt.edu, https://crisisbrief.com)"
            }
          </p>
        </div>

        {/* Added URLs */}
        <div>
          <Label>Added URL(s)</Label>
          <div className="flex flex-col w-full items-center pt-1">
            <Separator />
            {addedUrls.map((url, index) => (
              <div
                title={url}
                className="flex w-full justify-between"
                key={index}
              >
                <p className="truncate">{url}</p>
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  onClick={() => deleteUrl(url)}
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Event Category input */}
        <div className="flex flex-col">
          <Label>Select Crisis Event Category</Label>
          <div className="pt-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {category
                    ? frameworks.find(
                        (framework) => framework.value === category
                      )?.label
                    : "Select Category..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search categories..." />
                  <CommandList>
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                      {frameworks.map((framework) => (
                        <CommandItem
                          key={framework.value}
                          value={framework.value}
                          onSelect={(currentCategory) => {
                            setCategory(
                              currentCategory === category
                                ? ""
                                : currentCategory
                            );
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              category === framework.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {framework.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
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
