"use client";

import { AppShell } from "@/components/shell/AppShell";
import { useSnapshot } from "@/contexts/SnapshotContext";
import { useSelection } from "@/contexts/SelectionContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/grid/DataGrid";
import { Shield, Users, Key, Lock, FileEdit, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SecurityPage() {
  const { snapshot } = useSnapshot();
  const { setSelection } = useSelection();

  const secObj = snapshot?.objects?.security ?? {};
  const roles = (secObj.roles ?? []) as any[];
  const permissions = (secObj.permissions ?? []) as any[];
  const policies = (secObj.policies ?? []) as any[];

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Manage roles, permissions, and access control policies
            </p>
          </div>
          <Link
            href="/security/policy-editor"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <FileEdit className="h-4 w-4" />
            Policy Editor
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{roles.length}</div>
                  <div className="text-xs text-muted-foreground">Roles</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{permissions.length}</div>
                  <div className="text-xs text-muted-foreground">Permissions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{policies.length}</div>
                  <div className="text-xs text-muted-foreground">Policies</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roles Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Roles
            </CardTitle>
            <CardDescription>
              Security roles and their assigned permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roles.length > 0 ? (
              <DataGrid
                rowData={roles.map(r => ({
                  id: r.id,
                  code: r.code,
                  name: r.name || r.code,
                  description: r.description || "—",
                  permissions: r.permissions?.length ?? 0,
                }))}
                columnDefs={[
                  { field: "code", headerName: "Code", width: 150 },
                  { field: "name", headerName: "Name", flex: 1 },
                  { field: "permissions", headerName: "Permissions", width: 120 },
                  { field: "description", headerName: "Description", flex: 2 },
                ]}
                onRowClicked={(row: any) => {
                  const r = roles.find(x => x.id === row?.data?.id || x.code === row?.data?.code);
                  setSelection({ type: "Role", id: r?.id, label: r?.code, payload: r });
                }}
                height={300}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No Roles Defined</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Load a snapshot with security role definitions to manage them here.
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
              href="/security/policy-editor"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileEdit className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Policy Editor</h3>
                  <p className="text-xs text-muted-foreground">Edit access control policies</p>
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
