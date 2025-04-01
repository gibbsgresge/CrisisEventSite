// /types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by useSession, getSession, and in the JWT callback
   */
  interface User extends DefaultUser {
    role?: string;
  }

  interface Session {
    user: {
      role?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}

export interface template {
  id?: string; // string version of MongoDB ObjectId
  recipient: string;
  category: string;
  template: string;
  attributes: any[]; // You can make this more specific if you know the shape
  createdAt?: Date;
}

export interface summary {
  id: string;
  recipient: string;
  category: string;
  summary: string;
  title: string;
  created_at: Date;
}
