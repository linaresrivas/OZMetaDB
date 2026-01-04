"use client";

import { LeftNav } from "@/components/nav/LeftNav";
import { TopBar } from "@/components/nav/TopBar";
import { InspectorDrawer } from "@/components/inspector/InspectorDrawer";
import { CommandPalette } from "@/components/search/CommandPalette";
import { AIChatPanel, AIChatTrigger } from "@/components/chat";
import { useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <LeftNav />
      <div className="flex-1 flex flex-col">
        <TopBar onToggleInspector={() => setInspectorOpen((v) => !v)} />
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto">{children}</div>
          <InspectorDrawer open={inspectorOpen} />
        </main>
      </div>
      <CommandPalette />

      {/* AI Chat */}
      {!chatOpen && <AIChatTrigger onClick={() => setChatOpen(true)} />}
      <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
