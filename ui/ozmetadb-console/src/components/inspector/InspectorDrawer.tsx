"use client";
import { useSelection } from "@/contexts/SelectionContext";
import { useSnapshot } from "@/contexts/SnapshotContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InspectorDrawer({ open }: { open: boolean }) {
  const { selection } = useSelection();
  const { snapshot, error } = useSnapshot();
  if (!open) return null;

  return (
    <aside className="w-96 border-l bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40">
      <div className="p-4 border-b font-semibold">Inspector</div>
      <div className="p-4 space-y-3">
        {error && (
          <Card>
            <CardHeader><CardTitle>Snapshot error</CardTitle></CardHeader>
            <CardContent><div className="text-sm">{error}</div></CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Selection</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div><span className="font-medium">Type:</span> {selection?.type ?? "—"}</div>
              <div><span className="font-medium">Label:</span> {selection?.label ?? "—"}</div>
              <div><span className="font-medium">ID:</span> {selection?.id ?? "—"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Snapshot meta</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div><span className="font-medium">Version:</span> {snapshot?.meta?.version ?? "—"}</div>
              <div><span className="font-medium">Project:</span> {snapshot?.meta?.projectId ?? "—"}</div>
              <div><span className="font-medium">Exported:</span> {snapshot?.meta?.exportedAtUTC ?? "—"}</div>
            </div>
          </CardContent>
        </Card>

        {selection?.payload && (
          <Card>
            <CardHeader><CardTitle>Payload</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(selection.payload, null, 2)}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </aside>
  );
}
