"use server";

import clientPromise from "@/lib/mongodb"; // Make sure this path is correct
import { ObjectId } from "mongodb";
import { User } from "next-auth";
import { Templant } from "@/types"; // or wherever your types.ts is




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
export const createTemplant = async (
  data: Omit<Templant, "id" | "createdAt">
) => {
  const client = await clientPromise;
  const db = client.db();
  const templantsCollection = db.collection("generated_templants");

  const result = await templantsCollection.insertOne({
    ...data,
    createdAt: new Date(),
  });

  return { id: result.insertedId.toString() };
};

// READ (one by ID)
export const getTemplantById = async (id: string) => {
  const client = await clientPromise;
  const db = client.db();
  const templantsCollection = db.collection("generated_templants");

  const templant = await templantsCollection.findOne({ _id: new ObjectId(id) });

  if (!templant) throw new Error("Templant not found");

  return {
    id: templant._id.toString(),
    recipient: templant.recipient,
    category: templant.category,
    template: templant.template,
    attributes: templant.attributes || [],
    createdAt: templant.createdAt || null,
  } as Templant;
};

// READ (all by recipient email)
export const getTemplantsByRecipient = async (email: string) => {
  const client = await clientPromise;
  const db = client.db();
  const templantsCollection = db.collection("generated_templants");

  const templants = await templantsCollection.find({ recipient: email }).toArray();

  return templants.map((templ) => ({
    id: templ._id.toString(),
    recipient: templ.recipient,
    category: templ.category,
    template: templ.template,
    attributes: templ.attributes || [],
    createdAt: templ.createdAt || null,
  })) as Templant[];
};

// UPDATE
export const updateTemplant = async (
  id: string,
  updates: Partial<Omit<Templant, "id" | "createdAt">>
) => {
  const client = await clientPromise;
  const db = client.db();
  const templantsCollection = db.collection("generated_templants");

  const result = await templantsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updates }
  );

  if (result.matchedCount === 0) throw new Error("Templant not found");
  if (result.modifiedCount === 0) throw new Error("Update failed");

  return { success: true };
};

// DELETE
export const deleteTemplant = async (id: string) => {
  const client = await clientPromise;
  const db = client.db();
  const templantsCollection = db.collection("generated_templants");

  const result = await templantsCollection.deleteOne({ _id: new ObjectId(id) });

  if (!result.deletedCount) throw new Error("Failed to delete templant");

  return { success: true };
};
