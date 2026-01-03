"use client";

export function TopBar({ onToggleInspector }: { onToggleInspector: () => void }) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40">
      <div className="flex items-center gap-3">
        <button className="text-sm px-3 py-1 rounded-md hover:bg-black/5" aria-label="Project switcher">
          Client / Project / Env (placeholder)
        </button>
        <button className="text-sm px-3 py-1 rounded-md hover:bg-black/5" aria-label="Global search">
          ⌘K Search (placeholder)
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button className="text-sm px-3 py-1 rounded-md hover:bg-black/5" onClick={onToggleInspector}>
          Toggle Inspector
        </button>
        <button className="text-sm px-3 py-1 rounded-md hover:bg-black/5">
          User (placeholder)
        </button>
      </div>
    </header>
  );
}
