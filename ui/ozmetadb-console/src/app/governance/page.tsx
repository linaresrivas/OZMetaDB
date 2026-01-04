"use client";

import { AppShell } from "@/components/shell/AppShell";
import { useSnapshot } from "@/contexts/SnapshotContext";
import { useSelection } from "@/contexts/SelectionContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/grid/DataGrid";
import { Scale, FileCheck, AlertTriangle, History, ArrowRight, ClipboardList } from "lucide-react";
import Link from "next/link";

export default function GovernancePage() {
  const { snapshot } = useSnapshot();
  const { setSelection } = useSelection();

  const govObj = snapshot?.objects?.governance ?? {};
  const policies = (govObj.policies ?? []) as any[];
  const rules = (govObj.rules ?? []) as any[];
  const changeRequests = (govObj.changeRequests ?? []) as any[];

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">Governance</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Manage data quality rules, compliance policies, and change requests
            </p>
          </div>
          <Link
            href="/governance/change-requests"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ClipboardList className="h-4 w-4" />
            Change Requests
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{policies.length}</div>
                  <div className="text-xs text-muted-foreground">Policies</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{rules.length}</div>
                  <div className="text-xs text-muted-foreground">Rules</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{changeRequests.length}</div>
                  <div className="text-xs text-muted-foreground">Change Requests</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Policies Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Governance Policies
            </CardTitle>
            <CardDescription>
              Data quality and compliance policy definitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {policies.length > 0 ? (
              <DataGrid
                rowData={policies.map(p => ({
                  id: p.id,
                  code: p.code,
                  name: p.name || p.code,
                  type: p.type || "—",
                  status: p.status || "Active",
                  description: p.description || "—",
                }))}
                columnDefs={[
                  { field: "code", headerName: "Code", width: 150 },
                  { field: "name", headerName: "Name", flex: 1 },
                  { field: "type", headerName: "Type", width: 120 },
                  { field: "status", headerName: "Status", width: 100 },
                  { field: "description", headerName: "Description", flex: 2 },
                ]}
                onRowClicked={(row: any) => {
                  const p = policies.find(x => x.id === row?.data?.id || x.code === row?.data?.code);
                  setSelection({ type: "Policy", id: p?.id, label: p?.code, payload: p });
                }}
                height={300}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileCheck className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No Policies Defined</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Load a snapshot with governance policy definitions to manage them here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/governance/change-requests"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Change Requests</h3>
                  <p className="text-xs text-muted-foreground">Review and approve pending changes</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
