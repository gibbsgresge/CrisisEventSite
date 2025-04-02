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
import {
  Check,
  ChevronsUpDown,
  Delete,
  Plus,
  UploadCloud,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useToast } from "@/hooks/use-toast";
import { User } from "next-auth";
import { getAllTemplates, getUserByEmail } from "@/app/server/queries";
import { useMutation, useQuery } from "react-query";
import axios from "axios";
import LoadingSpinner from "@/components/ui/loading-spinner";

// protected route
export default function Dashboard() {
  const [addedUrls, setAddedUrls] = useState<string[]>([]);

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [templateID, setTemplateID] = useState<string>("");

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

  // Fetch templates
  // React Query to fetch all users
  const {
    data: templates,
    error: templateError,
    isLoading: queryLoading,
  } = useQuery({
    queryKey: ["generated_templates"],
    queryFn: async () => {
      const templates = await getAllTemplates();
      console.log(templates);
      return templates;
    },
  });

  /**
   * Remove the given url from the addedUrls array. This function is called
   * when the "X" mark is clicked next to a given url.
   *
   * @param urlToRemove remove this url from addedUrls
   */
  const deleteUrl = (urlToRemove: string) => {
    setAddedUrls(addedUrls.filter((url) => url !== urlToRemove));
  };

  /**
   * Reads a text file and extracts URLs from it.
   * @param file The uploaded text file.
   */
  const handleFileUpload = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const urls = text
          .split("\n")
          .map((url) => url.trim())
          .filter((url) => url.length > 0);
        setAddedUrls((prev) => [...new Set([...prev, ...urls])]);
      };
      reader.readAsText(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: { "text/plain": [".txt"] },
    multiple: true, // Enable multiple file uploads
    onDragEnter: (e: { preventDefault: () => any }) => e.preventDefault(),
    onDragOver: (e: { preventDefault: () => any }) => e.preventDefault(),
    onDragLeave: (e: { preventDefault: () => any }) => e.preventDefault(),
  });

  const { mutate, isLoading, isError, isSuccess, error } = useMutation({
    mutationFn: async ({
      user,
      category,
      urls,
      templateID,
    }: {
      category: string;
      urls: string[];
      user: User;
      templateID: string;
    }) => {
      const response = await axios.post(
        "http://localhost:5000/generate-summary",
        {
          user: user,
          urls: addedUrls,
          category: category,
          template_id: templateID,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response) {
        throw new Error("Failed to generate summary");
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
          "You will receive an email when your summary is done generating!",
        variant: "default",
      });
    },
    onSettled: () => {
      // Resetting loading state or clearing any success/error-specific actions
    },
  });

  const handleSubmit = () => {
    console.log({
      user: user,
      category: category,
      urls: addedUrls,
      template_id: templateID,
    });
    if (!user || !category || !addedUrls || !templateID) return;
    mutate({ category, urls: addedUrls, user, templateID });
  };

  if (isLoading && queryLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col items-center pt-20 w-full max-w-3xl p-4">
      <div>
        <h1 className="text-3xl font-bold">New Summary</h1>
      </div>

      <div className="flex flex-col w-full gap-6 pt-6">
        {/* File Upload Box */}
        <div className="flex flex-col gap-2">
          <Label>Upload URL File</Label>
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer",
              isDragActive ? "border-primary" : "border-muted"
            )}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">
              Drag & drop a .txt file here, or click to upload
            </p>
          </div>
        </div>

        {/* Added URLs */}
        <div className="flex flex-col gap-2">
          <Label>Added URL(s)</Label>
          <div className="flex flex-col w-full items-center gap-1">
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
        <div className="flex flex-col gap-2">
          <Label>Select Crisis Event Category</Label>
          <div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {category
                    ? templates &&
                      templates.find(
                        (template) => template.category === category
                      )?.category
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
                      {templates &&
                        templates.map((template) => (
                          <CommandItem
                            key={template.id}
                            value={template.category}
                            onSelect={(currentCategory) => {
                              setCategory(
                                currentCategory === category
                                  ? ""
                                  : currentCategory
                              );

                              const selectedTemplate = templates.find(
                                (t) => t.category === currentCategory
                              );
                              setTemplateID(selectedTemplate?.id || "");

                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                category === template.category
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {template.category}
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
        <Button
          disabled={
            !(addedUrls.length > 0 && category !== "") || isLoading || isSuccess
          }
          onClick={() => handleSubmit()}
        >
          {isLoading || queryLoading ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
