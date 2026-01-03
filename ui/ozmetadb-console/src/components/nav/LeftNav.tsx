"use client";
import { useSnapshot } from "@/contexts/SnapshotContext";
import { useSelection } from "@/contexts/SelectionContext";

export function LeftNav() {
  const { snapshot } = useSnapshot();
  const { setSelection } = useSelection();

  const fallback = [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "Model", href: "/model" },
    { label: "Workflows", href: "/workflows" },
    { label: "Security", href: "/security" },
    { label: "Governance", href: "/governance" },
  ];

  const pages = (snapshot?.objects?.ui?.pages ?? []) as any[];
  const items = pages.length ? pages.map((p) => ({ label: p.code, href: p.route, id: p.id })) : fallback;

  return (
    <aside className="w-56 border-r bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40">
      <div className="p-4 font-semibold">OZMetaDB</div>
      <nav className="px-2 space-y-1">
        {items.map((it: any) => (
          <a
            key={it.href}
            href={it.href}
            className="block rounded-md px-3 py-2 text-sm hover:bg-black/5"
            onClick={() => setSelection({ type: "UiPage", id: it.id, label: it.label })}
          >
            {it.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
