"use client";

import React from "react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // Supabase takes care of sessions via cookies and the singleton client.
  // We can add a custom Context here if needed for cross-component state.
  return <>{children}</>;
}
