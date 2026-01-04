import "./globals.css";
import { SnapshotProvider } from "@/contexts/SnapshotContext";
import { AuthProvider } from "@/auth/AuthProvider";
import { SelectionProvider } from "@/contexts/SelectionContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OZMetaDB Console",
  description: "Metadata Operating System Console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <SnapshotProvider>
                <SelectionProvider>
                  {children}
                </SelectionProvider>
              </SnapshotProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
