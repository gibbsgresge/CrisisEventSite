"use server";

import clientPromise from "@/lib/mongodb"; // Make sure this path is correct
import { User } from "next-auth";

export const getUserByEmail = async (email: string) => {
  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection("users");

  const user = await usersCollection.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    ...user,
    _id: user._id.toString(), // Convert _id to a string
  } as unknown as User;
};
