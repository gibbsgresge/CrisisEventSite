// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "../../../src/lib/mongodb";
import bcrypt from "bcryptjs";

export default NextAuth({
  // Use the MongoDB adapter so that NextAuth can persist user and session data in your DB
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "example@domain.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const client = await clientPromise;
        const db = client.db();
        
        // Look up the user in your "users" collection
        const user = await db.collection("users").findOne({ email: credentials.email });
        if (!user) {
          throw new Error("No user found with the provided email");
        }
        
        // Compare the submitted password with the stored hashed password
        const isPasswordCorrect = bcrypt.compareSync(credentials.password, user.password);
        if (!isPasswordCorrect) {
          throw new Error("Incorrect password");
        }
        
        // Return the user object (NextAuth uses this to create a session)
        return { id: user._id, email: user.email, name: `${user.firstName} ${user.lastName}` };
      }
    })
  ],
  session: {
    strategy: "jwt", // or "database" if you prefer, but "jwt" is straightforward
  },
  secret: process.env.NEXTAUTH_SECRET,
});
