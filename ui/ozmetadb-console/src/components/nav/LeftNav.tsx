"use client";
import { useSnapshot } from "@/contexts/SnapshotContext";
import { useSelection } from "@/contexts/SelectionContext";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  FolderKanban,
  Database,
  GitBranch,
  Shield,
  Scale,
  Settings,
  Layers,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="h-4 w-4" />,
  Projects: <FolderKanban className="h-4 w-4" />,
  Model: <Database className="h-4 w-4" />,
  Workflows: <GitBranch className="h-4 w-4" />,
  Security: <Shield className="h-4 w-4" />,
  Governance: <Scale className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  Dashboard: <LayoutDashboard className="h-4 w-4" />,
};

export function LeftNav() {
  const { snapshot } = useSnapshot();
  const { setSelection } = useSelection();
  const pathname = usePathname();

  const mainNav = [
    { label: "Home", href: "/", icon: "Home" },
    { label: "Projects", href: "/projects", icon: "Projects" },
    { label: "Model", href: "/model", icon: "Model" },
    { label: "Workflows", href: "/workflows", icon: "Workflows" },
    { label: "Security", href: "/security", icon: "Security" },
    { label: "Governance", href: "/governance", icon: "Governance" },
  ];

  const bottomNav = [
    { label: "Settings", href: "/settings", icon: "Settings" },
  ];

  const pages = (snapshot?.objects?.ui?.pages ?? []) as any[];
  const items = pages.length
    ? pages.map((p) => ({ label: p.code, href: p.route, id: p.id, icon: "Layers" }))
    : mainNav;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-56 border-r bg-sidebar flex flex-col">
      <div className="p-4 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Layers className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sidebar-foreground">OZMetaDB</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map((it: any) => (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              isActive(it.href) && "bg-sidebar-accent text-sidebar-foreground font-medium"
            )}
            onClick={() => setSelection({ type: "UiPage", id: it.id, label: it.label })}
          >
            {iconMap[it.icon] || <Layers className="h-4 w-4" />}
            {it.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-2 border-t border-sidebar-border mt-auto">
        {bottomNav.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              isActive(it.href) && "bg-sidebar-accent text-sidebar-foreground font-medium"
            )}
          >
            {iconMap[it.icon]}
            {it.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
