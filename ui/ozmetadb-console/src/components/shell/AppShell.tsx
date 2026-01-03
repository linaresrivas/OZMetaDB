"use client";

import { LeftNav } from "@/components/nav/LeftNav";
import { TopBar } from "@/components/nav/TopBar";
import { InspectorDrawer } from "@/components/inspector/InspectorDrawer";
import { CommandPalette } from "@/components/search/CommandPalette";
import { useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [inspectorOpen, setInspectorOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      <LeftNav />
      <div className="flex-1 flex flex-col">
        <TopBar onToggleInspector={() => setInspectorOpen((v) => !v)} />
        <main className="flex-1 flex">
          <div className="flex-1">{children}</div>
          <InspectorDrawer open={inspectorOpen} />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
