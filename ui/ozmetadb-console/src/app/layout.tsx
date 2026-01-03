import "./globals.css";
import { SnapshotProvider } from "@/contexts/SnapshotContext";
import { AuthProvider } from "@/auth/AuthProvider";
import { SelectionProvider } from "@/contexts/SelectionContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OZMetaDB Console",
  description: "Metadata Operating System Console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <AuthProvider><SnapshotProvider><SelectionProvider>{children}</SelectionProvider></SnapshotProvider></AuthProvider>
      </body>
    </html>
  );
}
