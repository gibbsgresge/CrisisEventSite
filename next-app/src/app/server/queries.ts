"use server";

import clientPromise from "@/lib/mongodb"; // Make sure this path is correct
import { ObjectId } from "mongodb";
import { User } from "next-auth";
import { template } from "@/types"; // or wherever your types.ts is




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
  data: Omit<template, "id" | "createdAt">
) => {
  const client = await clientPromise;
  const db = client.db();
  const templatesCollection = db.collection("generated_templates");

  const result = await templatesCollection.insertOne({
    ...data,
    createdAt: new Date(),
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
    createdAt: template.createdAt || null,
  } as template;
};

// READ (all by recipient email)
export const gettemplatesByRecipient = async (email: string) => {
  const client = await clientPromise;
  const db = client.db();
  const templatesCollection = db.collection("generated_templates");

  const templates = await templatesCollection.find({ recipient: email }).toArray();

  return templates.map((templ) => ({
    id: templ._id.toString(),
    recipient: templ.recipient,
    category: templ.category,
    template: templ.template,
    attributes: templ.attributes || [],
    createdAt: templ.createdAt || null,
  })) as template[];
};

// UPDATE
export const updatetemplate = async (
  id: string,
  updates: Partial<Omit<template, "id" | "createdAt">>
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
export const deletetemplate = async (id: string) => {
  const client = await clientPromise;
  const db = client.db();
  const templatesCollection = db.collection("generated_templates");

  const result = await templatesCollection.deleteOne({ _id: new ObjectId(id) });

  if (!result.deletedCount) throw new Error("Failed to delete template");

  return { success: true };
};
