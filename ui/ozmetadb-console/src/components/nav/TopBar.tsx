"use client";

import { Search, PanelRight, User, ChevronDown, Settings, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function TopBar({ onToggleInspector }: { onToggleInspector: () => void }) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-accent border transition-colors" aria-label="Project switcher">
          <span className="text-muted-foreground">Workspace</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium">Default Project</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground ml-1" />
        </button>
        <div className="h-6 w-px bg-border hidden sm:block" />
        <button className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors" aria-label="Global search">
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-muted rounded border">
            ⌘K
          </kbd>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground" title="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="text-muted-foreground" title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
        <div className="h-6 w-px bg-border mx-1" />
        <Button variant="ghost" size="icon" onClick={onToggleInspector} title="Toggle Inspector">
          <PanelRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="User menu" className="ml-1">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        </Button>
      </div>
    </header>
  );
}
