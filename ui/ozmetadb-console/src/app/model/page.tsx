"use client";

import { AppShell } from "@/components/shell/AppShell";
import { useSnapshot } from "@/contexts/SnapshotContext";
import { useSelection, useSelectionValue } from "@/contexts/SelectionContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/grid/DataGrid";
import { Database, Table, Columns, Info } from "lucide-react";

export default function ModelPage() {
  const { snapshot } = useSnapshot();
  const { setSelection } = useSelection();
  const selection = useSelectionValue();

  const tables = (snapshot?.objects?.model?.tables ?? []) as any[];
  const selectedTable = selection?.type === "Table" ? selection.payload : null;
  const fields = selectedTable?.fields ?? [];

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Data Model</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Browse and manage table definitions, fields, and relationships
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Table className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{tables.length}</div>
                  <div className="text-xs text-muted-foreground">Tables</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Columns className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {tables.reduce((acc, t) => acc + (t.fields?.length ?? 0), 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Fields</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {new Set(tables.map(t => t.schema)).size}
                  </div>
                  <div className="text-xs text-muted-foreground">Schemas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Tables
            </CardTitle>
            <CardDescription>
              Click a row to view table details in the Inspector panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tables.length > 0 ? (
              <DataGrid
                rowData={tables.map(t => ({
                  id: t.id,
                  schema: t.schema,
                  code: t.code,
                  fields: (t.fields ?? []).length,
                  description: t.description || "—",
                }))}
                columnDefs={[
                  { field: "schema", headerName: "Schema", width: 120 },
                  { field: "code", headerName: "Table Name", flex: 1 },
                  { field: "fields", headerName: "Fields", width: 100 },
                  { field: "description", headerName: "Description", flex: 2 },
                ]}
                onRowClicked={(row: any) => {
                  const t = tables.find(x => (x.id ?? x.code) === (row?.data?.id ?? row?.data?.code));
                  setSelection({ type: "Table", id: t?.id, label: `${t?.schema}.${t?.code}`, payload: t });
                }}
                height={400}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Database className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No Tables Found</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Load a snapshot containing table definitions to view them here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Table Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Columns className="h-5 w-5" />
              {selectedTable ? `Fields: ${selectedTable.schema}.${selectedTable.code}` : "Table Fields"}
            </CardTitle>
            <CardDescription>
              {selectedTable
                ? `${fields.length} fields defined`
                : "Select a table to view its field definitions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTable && fields.length > 0 ? (
              <DataGrid
                rowData={fields.map((f: any, idx: number) => ({
                  ordinal: idx + 1,
                  code: f.code,
                  dataType: f.dataType || f.type || "—",
                  nullable: f.nullable ? "Yes" : "No",
                  description: f.description || "—",
                }))}
                columnDefs={[
                  { field: "ordinal", headerName: "#", width: 60 },
                  { field: "code", headerName: "Field Name", flex: 1 },
                  { field: "dataType", headerName: "Data Type", width: 120 },
                  { field: "nullable", headerName: "Nullable", width: 100 },
                  { field: "description", headerName: "Description", flex: 2 },
                ]}
                height={300}
              />
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Info className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {selectedTable ? "This table has no fields defined." : "Click a table row above to view its fields."}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
