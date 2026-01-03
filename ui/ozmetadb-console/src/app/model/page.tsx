"use client";

import { AppShell } from "@/components/shell/AppShell";
import { useSnapshot } from "@/contexts/SnapshotContext";
import { useSelection } from "@/contexts/SelectionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/grid/DataGrid";

export default function ModelPage() {
  const { snapshot } = useSnapshot();
  const { setSelection } = useSelection();

  const tables = (snapshot?.objects?.model?.tables ?? []) as any[];

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Model</h1>

        <Card>
          <CardHeader><CardTitle>Tables</CardTitle></CardHeader>
          <CardContent>
            <DataGrid
              rowData={tables.map(t => ({ id: t.id, schema: t.schema, code: t.code, fields: (t.fields ?? []).length }))}
              columnDefs={[
                { field: "schema" },
                { field: "code" },
                { field: "fields" },
              ]}
              onRowClicked={(row: any) => {
                const t = tables.find(x => (x.id ?? x.code) === (row?.data?.id ?? row?.data?.code));
                setSelection({ type: "Table", id: t?.id, label: `${t?.schema}.${t?.code}`, payload: t });
              }}
              height={460}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Selected table fields</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Click a table row to view details in Inspector.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
