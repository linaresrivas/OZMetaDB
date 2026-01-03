"use client";

import * as React from "react";
import { Command } from "cmdk";
import { useSnapshot } from "@/contexts/SnapshotContext";
import { Button } from "@/components/ui/button";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const { snapshot } = useSnapshot();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;

  const items: { label: string; href: string }[] = [
    { label: "Projects", href: "/projects" },
    { label: "Model (AG Grid demo)", href: "/model/grid" },
    { label: "Workflow Designer", href: "/workflows/designer" },
    { label: "Policy Editor", href: "/security/policy-editor" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl rounded-2xl border border-black/10 bg-white shadow-xl">
        <div className="p-3 border-b border-black/10 flex items-center justify-between">
          <div className="text-sm font-medium">Search</div>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
        </div>
        <Command className="p-2">
          <Command.Input placeholder="Type to search..." className="w-full p-3 text-sm outline-none" />
          <Command.List className="max-h-80 overflow-auto">
            <Command.Empty className="p-3 text-sm text-muted-foreground">No results.</Command.Empty>
            {items.map((it) => (
              <Command.Item
                key={it.href}
                value={it.label}
                className="cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-black/5"
                onSelect={() => {
                  window.location.href = it.href;
                  setOpen(false);
                }}
              >
                {it.label}
              </Command.Item>
            ))}
          </Command.List>
          <div className="px-3 py-2 text-xs text-muted-foreground border-t border-black/10">
            Snapshot loaded: {snapshot ? "yes" : "no"}
          </div>
        </Command>
      </div>
    </div>
  );
}
