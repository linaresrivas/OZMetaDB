"use client";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSelection } from "@/contexts/SelectionContext";

export default function ChangeRequestsPage() {
  const { setSelection } = useSelection();
  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Change Requests (skeleton)</h1>
        <Card>
          <CardHeader><CardTitle>Draft → Approve → Apply</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Next: store drafts in MetaDB and compute diffs for approvals.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setSelection({ type: "ChangeRequest", label: "New Draft", payload: { actions: [] } })}>
                New Draft (placeholder)
              </Button>
              <Button variant="outline" onClick={() => alert("Next: show diff + approvals")}>
                View Diff (placeholder)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
