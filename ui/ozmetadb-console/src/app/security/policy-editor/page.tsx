"use client";

import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Editor from "@monaco-editor/react";

const sample = `# Example ABAC policy DSL (placeholder)
allow read on Case when user.role in ["Clerk","Judge"] and row.court_id == user.court_id
deny  read on Case when row.sealed == true and user.role != "Judge"
`;

export default function PolicyEditorPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Policy Editor (Monaco)</h1>
        <Card>
          <CardHeader>
            <CardTitle>Portable DSL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[520px] border border-black/10 rounded-xl overflow-hidden">
              <Editor height="520px" defaultLanguage="yaml" defaultValue={sample} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Next: compile this DSL via generator contracts and validate in CI.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
