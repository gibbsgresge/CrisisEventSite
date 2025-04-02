"use server";

import clientPromise from "@/lib/mongodb"; // Make sure this path is correct
import { ObjectId } from "mongodb";
import { User } from "next-auth";
import { Template, Summary } from "@/types"; // or wherever your types.ts is

export const getUserByEmail = async (email: string) => {
  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection("users");

  const user = await usersCollection.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user._id.toString(),
    name: user.name || "",
    email: user.email || "",
    image: user.image || "",
    emailVerified: user.emailVerified || null,
    role: user.role || "user",
  } as User;
};

export const getAllUsers = async () => {
  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection("users");

  // Fetch all users from the collection
  const users = await usersCollection.find().toArray();

  if (!users || users.length === 0) {
    return [];
  }

  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name || "",
    email: user.email || "",
    image: user.image || "",
    emailVerified: user.emailVerified || null,
    role: user.role || "user",
  }));
};

export const updateUserRole = async (userId: string, newRole: string) => {
  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection("users");

  // Convert to ObjectId ONLY if necessary
  const filter = { _id: new ObjectId(userId) };

  const updateDocument = {
    $set: { role: newRole },
  };

  const result = await usersCollection.updateOne(filter, updateDocument);

  console.log("Filter used:", filter);
  console.log("Result:", result);

  if (result.matchedCount === 0) {
    throw new Error(`User with ID ${userId} not found`);
  }
  if (result.modifiedCount === 0) {
    throw new Error("User role update failed (role might be the same)");
  }

  return { success: true };
};

export const deleteUser = async (userId: string) => {
  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection("users");

  const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });

  if (!result.deletedCount) {
    throw new Error("Failed to delete user");
  }

  return { success: true };
};

// CREATE
export const createtemplate = async (
  data: Omit<Template, "id" | "createdAt">
) => {
  const client = await clientPromise;
  const db = client.db();
  const templatesCollection = db.collection("generated_templates");

  const result = await templatesCollection.insertOne({
    ...data,
    created_at: new Date(),
  });

  return { id: result.insertedId.toString() };
};

// READ (one by ID)
export const gettemplateById = async (id: string) => {
  const client = await clientPromise;
  const db = client.db();
  const templatesCollection = db.collection("generated_templates");

  const template = await templatesCollection.findOne({ _id: new ObjectId(id) });

  if (!template) throw new Error("template not found");

  return {
    id: template._id.toString(),
    recipient: template.recipient,
    category: template.category,
    template: template.template,
    attributes: template.attributes || [],
    createdAt: template.created_at || null,
  } as template;
};

// READ (all by recipient email)
export const gettemplatesByRecipient = async (email: string) => {
  const client = await clientPromise;
  const db = client.db();
  const templatesCollection = db.collection("generated_templates");

  const templates = await templatesCollection
    .find({ recipient: email })
    .toArray();

  return templates.map((templ) => ({
    id: templ._id.toString(),
    recipient: templ.recipient,
    category: templ.category,
    template: templ.template,
    attributes: templ.attributes || [],
    createdAt: templ.created_at || null,
  })) as template[];
};
//  Get all templates
export const getAllTemplates = async () => {
  const client = await clientPromise;
  const db = client.db();
  const templatesCollection = db.collection("generated_templates");

  const templates = await templatesCollection.find({}).toArray();

  return templates.map((templ) => ({
    id: templ._id.toString(),
    recipient: templ.recipient,
    category: templ.category,
    template: templ.template,
    attributes: templ.attributes || [],
    createdAt: templ.created_at || null,
  })) as template[];
};

// UPDATE
export const updateTemplate = async (
  id: string,
  updates: Partial<Omit<Template, "id" | "createdAt">>
) => {
  const client = await clientPromise;
  const db = client.db();
  const templatesCollection = db.collection("generated_templates");

  const result = await templatesCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updates }
  );

  if (result.matchedCount === 0) throw new Error("template not found");
  if (result.modifiedCount === 0) throw new Error("Update failed");

  return { success: true };
};

// DELETE
export const deleteTemplate = async (id: string) => {
  const client = await clientPromise;
  const db = client.db();
  const templatesCollection = db.collection("generated_templates");

  const result = await templatesCollection.deleteOne({ _id: new ObjectId(id) });

  if (!result.deletedCount) throw new Error("Failed to delete template");

  return { success: true };
};

// CREATE SUMMARY
export const createSummary = async (
  data: Omit<Summary, "id" | "created_at">
) => {
  const client = await clientPromise;
  const db = client.db();
  const summarysCollection = db.collection("generated_summarys");

  const result = await summarysCollection.insertOne({
    ...data,
    created_at: new Date(),
  });

  return { id: result.insertedId.toString() };
};

// GET ALL SUMMARIES
export const getAllSummarys = async (): Promise<Summary[]> => {
  const client = await clientPromise;
  const db = client.db();
  const summarysCollection = db.collection("generated_summarys");

  const summarys = await summarysCollection.find({}).toArray();

  return summarys.map((templ) => ({
    id: templ._id.toString(),
    recipient: templ.recipient,
    category: templ.category,
    title: templ.title,
    summary: templ.summary,
    created_at: templ.created_at || null,
  }));
};

// GET SUMMARY BY ID
export const getSummaryById = async (id: string): Promise<Summary | null> => {
  const client = await clientPromise;
  const db = client.db();
  const summarysCollection = db.collection("generated_summarys");

  const summaryDoc = await summarysCollection.findOne({
    _id: new ObjectId(id),
  });

  if (!summaryDoc) return null;

  return {
    id: summaryDoc._id.toString(),
    recipient: summaryDoc.recipient,
    category: summaryDoc.category,
    title: summaryDoc.title,
    summary: summaryDoc.summary,
    created_at: summaryDoc.created_at || null,
  };
};

// UPDATE SUMMARY BY ID
export const updateSummaryById = async (
  id: string,
  updatedData: Partial<Omit<Summary, "id" | "created_at">>
): Promise<boolean> => {
  const client = await clientPromise;
  const db = client.db();
  const summarysCollection = db.collection("generated_summarys");

  const result = await summarysCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData }
  );

  return result.modifiedCount > 0;
};

// DELETE SUMMARY BY ID
export const deleteSummaryById = async (id: string): Promise<boolean> => {
  const client = await clientPromise;
  const db = client.db();
  const summarysCollection = db.collection("generated_summarys");

  const result = await summarysCollection.deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount > 0;
};
