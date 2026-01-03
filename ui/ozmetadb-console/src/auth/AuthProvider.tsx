"use client";

import React from "react";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "./msal";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
