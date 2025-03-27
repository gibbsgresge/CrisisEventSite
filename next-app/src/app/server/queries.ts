"use server";

import clientPromise from "@/lib/mongodb"; // Make sure this path is correct
import { ObjectId } from "mongodb";

export const getUserByEmail = async (email: string) => {
  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection("users");

  const user = await usersCollection.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  console.log(user);

  return user;
};
