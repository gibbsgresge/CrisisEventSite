"use client";

import { useSession } from "next-auth/react";
import { useRouter, redirect } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getAllTemplates,
  getAllUsers,
  getUserByEmail,
  updateTemplate,
  deleteTemplate,
} from "@/app/server/queries";
import { User } from "next-auth";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast, useToast } from "@/hooks/use-toast";
import { template } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function GeneratedTemplates() {
  const [user, setUser] = useState<User | null>(null);
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { toast } = useToast();

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
          return; // Prevents state update after redirect
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user:", error);
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [session, router]);

  // React Query to fetch all users
  const {
    data: templates,
    error,
    isLoading: queryLoading,
  } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const templates = await getAllTemplates();
      return templates;
    },
  });

  // Handle Template Update
  const { mutate: changeTemplate } = useMutation(
    async ({
      templateId,
      updateData,
    }: {
      templateId: string;
      updateData: UpdateTemplateData;
    }) => {
      if (!updateData) return;

      return await updateTemplate(templateId, updateData);
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Template updated.",
          variant: "default",
        });
        queryClient.invalidateQueries(["templates"]); // Refresh user list
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update template.",
          variant: "destructive",
        });
      },
    }
  );

  // Handle Template Deletion
  const { mutate: removeTemplate } = useMutation(
    async (templateId: string) => deleteTemplate(templateId),
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Template deleted.",
          variant: "default",
        });
        queryClient.invalidateQueries(["templates"]);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete template.",
          variant: "destructive",
        });
      },
    }
  );

  const handleUpdate = (templateId: string, updates: UpdateTemplateData) => {
    changeTemplate({ templateId, updateData: updates });
  };

  const handleDelete = (templateId: string) => {
    removeTemplate(templateId);
  };

  if (isLoading || queryLoading || !user) return <LoadingSpinner />;

  return (
    <div className="flex flex-col px-4 w-full max-w-3xl">
      <div className="flex items-center gap-2 py-4">
        <Button
          variant={"ghost"}
          onClick={() => redirect("/admin")}
          title="Back"
          size={"icon"}
        >
          <ArrowLeft className="w-24 h-24" />
        </Button>
        <h1 className="text-3xl">Templates</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 w-full">
        {templates?.map((template) => (
          <EditableTemplateCard
            key={template.id}
            template={template}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

type UpdateTemplateData = {
  category?: string;
  attributes?: string[];
};

interface EditableTemplateCardProps {
  template: template;
  onUpdate: (templateId: string, updates: UpdateTemplateData) => void;
  onDelete: (templateId: string) => void;
}

// Editable Template Card Component
function EditableTemplateCard({
  template,
  onUpdate,
  onDelete,
}: EditableTemplateCardProps) {
  const [editableTemplate, setEditableTemplate] = useState<template>(template);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (field: string, value: string | string[]) => {
    setEditableTemplate((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttributeChange = (index: number, newValue: string) => {
    const updatedAttributes = [...editableTemplate.attributes];
    updatedAttributes[index] = newValue;
    setEditableTemplate((prev) => ({ ...prev, attributes: updatedAttributes }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Input
            value={editableTemplate.category}
            onChange={(e) => handleChange("category", e.target.value)}
            disabled={!isEditing}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={editableTemplate.template}
          onChange={(e) => handleChange("template", e.target.value)}
          disabled={!isEditing}
          className="h-lg"
          rows={6}
        />

        <Separator className="my-2" />

        <CardTitle className="mt-2">Attributes</CardTitle>
        {editableTemplate.attributes?.length > 0 && (
          <ul className="flex flex-col gap-2 mt-2 text-xs text-muted-foreground">
            {editableTemplate.attributes.map((attr, index) => (
              <li key={index} className="flex gap-2">
                <Input
                  value={attr}
                  onChange={(e) => handleAttributeChange(index, e.target.value)}
                  disabled={!isEditing}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        )}

        {editableTemplate.createdAt && (
          <p className="mt-2 text-xs text-muted-foreground">
            Created on: {new Date(editableTemplate.createdAt).toLocaleString()}{" "}
            by {editableTemplate.recipient}
          </p>
        )}

        <div className="flex gap-2 mt-4">
          {isEditing ? (
            <Button
              onClick={() => {
                if (
                  !template.id ||
                  !editableTemplate.category ||
                  !editableTemplate.attributes
                )
                  return;
                const updates: UpdateTemplateData = {
                  category: editableTemplate.category,
                  attributes: editableTemplate.attributes,
                };
                console.log(template.id, updates);
                onUpdate(template.id, updates);
                setIsEditing(false);
              }}
              variant="outline"
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
            >
              Edit
            </Button>
          )}

          <Button
            onClick={() => {
              if (!template.id) return;
              onDelete(template.id);
            }}
            variant="destructive"
            size="sm"
          >
            <Trash className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
