"use client";

// given session provider cannot be used in server components, so exporting as client component
import { SessionProvider } from "next-auth/react";
export default SessionProvider;
