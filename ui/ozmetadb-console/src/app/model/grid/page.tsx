"use client";

import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

const rowData = [
  { code: "TR_ID", type: "UUIDv7", meaning: "Transaction PK" },
  { code: "TREM_ApprovedBy", type: "UUIDv7", meaning: "Employee FK (ApprovedBy)" },
  { code: "_CreateDate", type: "datetime2", meaning: "Created timestamp (UTC)" },
];

const colDefs = [
  { field: "code", editable: true, width: 220 },
  { field: "type", editable: true, width: 180 },
  { field: "meaning", editable: true, flex: 1 },
];

export default function ModelGridPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Model Grid (AG Grid)</h1>
        <Card>
          <CardHeader>
            <CardTitle>Fields editor (demo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="ag-theme-quartz" style={{ height: 420 }}>
              <AgGridReact rowData={rowData} columnDefs={colDefs as any} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Next: bind this grid to Meta.Table/Meta.Field from the snapshot and write back via API (ChangeRequest).
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
