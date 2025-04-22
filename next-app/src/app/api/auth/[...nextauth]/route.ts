// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb"; // adjust if your lib path is different
import { ObjectId } from "mongodb";

// Just to confirm this file is loading
console.log("[NextAuth] Loading route.ts...");

export const authOptions: NextAuthOptions = {
  // 1) Explicitly set session strategy to 'jwt'

  // 2) The secret used to encrypt/decrypt tokens

  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt", // default is 'jwt' in modern NextAuth
  },

  // 3) Configure your provider(s)
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],

  // 4) Use MongoDB adapter to store and retrieve user accounts
  adapter: MongoDBAdapter(clientPromise),

  // 5) Callbacks: attach 'role' to JWT and session
  callbacks: {
    /**
     * Called whenever a JWT is created or updated.
     * We'll log the incoming token and user, then attach the user's role if present.
     */
    async jwt({ token, user }) {
      console.log("[callbacks.jwt] incoming token:", token);
      console.log("[callbacks.jwt] incoming user:", user);

      // If this is the initial sign-in, 'user' will be defined
      if (user) {
        token.role = user.role;
      }

      console.log("[callbacks.jwt] final token (with role):", token);
      return token;
    },

    /**
     * Called whenever the session is checked/refreshed.
     * We'll log the token, then add 'role' to the session.user object if present.
     */
    async session({ session, token }) {
      console.log("[callbacks.session] incoming token:", token);
      if (token.role) {
        session.user.role = token.role;
      }
      console.log("[callbacks.session] final session (with role):", session);
      return session;
    },
  },

  // 6) Events: e.g., assign 'admin' to the first user, 'user' to everyone else
  events: {
    async createUser({ user }) {
      console.log("[events.createUser] new user:", user);
      try {
        const db = (await clientPromise).db();
        const usersCollection = db.collection("users");

        // Count how many users are in the DB so far
        const userCount = await usersCollection.countDocuments();
        // If this is the first user, make them admin, otherwise user
        const defaultRole = userCount === 1 ? "admin" : "user";

        // Add role and email notifications to the existing user document
        const result = await usersCollection.updateOne(
          { _id: new ObjectId(user.id) },
          { $set: { role: defaultRole, emailNotifications: true } }
        );
        console.log("[events.createUser] updateOne result:", result);

        console.log("[events.createUser] assigned role:", defaultRole);
      } catch (error) {
        console.error("[events.createUser] error:", error);
      }
    },
  },
};

// NextAuth handler
const handler = NextAuth(authOptions);

// Export named functions for GET and POST
export { handler as GET, handler as POST };
