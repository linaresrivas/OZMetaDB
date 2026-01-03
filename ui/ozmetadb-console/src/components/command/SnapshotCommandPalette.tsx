"use client";

import { useMemo, useState } from "react";
import { useSnapshot } from "@/contexts/SnapshotContext";
import { useSelection } from "@/contexts/SelectionContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SnapshotCommandPalette() {
  const { snapshot } = useSnapshot();
  const { setSelection } = useSelection();
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const out: any[] = [];
    const tables = snapshot?.objects?.model?.tables ?? [];
    for (const t of tables as any[]) out.push({ type: "Table", id: t.id, label: `${t.schema}.${t.code}`, payload: t });
    const pages = snapshot?.objects?.ui?.pages ?? [];
    for (const p of pages as any[]) out.push({ type: "UiPage", id: p.id, label: `Page: ${p.code} (${p.route})`, payload: p });
    const wf = snapshot?.objects?.workflows?.workflows ?? [];
    for (const w of wf as any[]) out.push({ type: "Workflow", id: w.id, label: `Workflow: ${w.code}`, payload: w });
    return out;
  }, [snapshot]);

  const filtered = items.filter((it) => it.label.toLowerCase().includes(q.toLowerCase())).slice(0, 30);

  return (
    <Card>
      <CardHeader><CardTitle>Command Palette (snapshot)</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Search tables/pages/workflows..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-64 overflow-auto border rounded-md">
          {filtered.map((it) => (
            <button
              key={`${it.type}:${it.id ?? it.label}`}
              className="w-full text-left px-3 py-2 text-sm hover:bg-black/5"
              onClick={() => setSelection(it)}
            >
              <span className="text-muted-foreground mr-2">[{it.type}]</span>{it.label}
            </button>
          ))}
          {!filtered.length && <div className="p-3 text-sm text-muted-foreground">No results.</div>}
        </div>
      </CardContent>
    </Card>
  );
}
