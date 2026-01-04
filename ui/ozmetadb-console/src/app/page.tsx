"use client";

import { AppShell } from "@/components/shell/AppShell";
import { SnapshotCommandPalette } from "@/components/command/SnapshotCommandPalette";
import { useSnapshot } from "@/contexts/SnapshotContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Database,
  GitBranch,
  Shield,
  Scale,
  ArrowRight,
  Upload,
  Layers,
  Activity,
} from "lucide-react";

function StatCard({ title, value, description, icon, href }: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {description}
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickAction({ title, description, icon, href }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { snapshot } = useSnapshot();

  const tables = (snapshot?.objects?.model?.tables ?? []) as any[];
  const workflows = (snapshot?.objects?.workflows?.workflows ?? []) as any[];
  const roles = (snapshot?.objects?.security?.roles ?? []) as any[];
  const policies = (snapshot?.objects?.governance?.policies ?? []) as any[];

  const hasSnapshot = !!snapshot;

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome to OZMetaDB Console. Manage your metadata models, workflows, and governance.
            </p>
          </div>
          <SnapshotCommandPalette />
        </div>

        {/* Stats Grid */}
        {hasSnapshot ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Tables"
              value={tables.length}
              description="Data model entities"
              icon={<Database className="h-4 w-4" />}
              href="/model"
            />
            <StatCard
              title="Workflows"
              value={workflows.length}
              description="State machines"
              icon={<GitBranch className="h-4 w-4" />}
              href="/workflows"
            />
            <StatCard
              title="Roles"
              value={roles.length}
              description="Security roles"
              icon={<Shield className="h-4 w-4" />}
              href="/security"
            />
            <StatCard
              title="Policies"
              value={policies.length}
              description="Governance rules"
              icon={<Scale className="h-4 w-4" />}
              href="/governance"
            />
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-1">No Snapshot Loaded</h3>
              <p className="text-muted-foreground text-sm text-center max-w-md mb-4">
                Load a metadata snapshot to view statistics and manage your data model, workflows, and governance policies.
              </p>
              <SnapshotCommandPalette />
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common tasks and navigation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickAction
                title="Browse Data Model"
                description="View tables, fields, and relationships"
                icon={<Database className="h-5 w-5" />}
                href="/model"
              />
              <QuickAction
                title="Workflow Designer"
                description="Visual state machine editor"
                icon={<GitBranch className="h-5 w-5" />}
                href="/workflows/designer"
              />
              <QuickAction
                title="Security Configuration"
                description="Manage roles and permissions"
                icon={<Shield className="h-5 w-5" />}
                href="/security"
              />
              <QuickAction
                title="Governance Policies"
                description="Data quality and compliance rules"
                icon={<Scale className="h-5 w-5" />}
                href="/governance"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Status</CardTitle>
              <CardDescription>Current state overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Console</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Running</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${hasSnapshot ? "bg-green-500" : "bg-yellow-500"}`} />
                    <span className="text-sm font-medium">Snapshot</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {hasSnapshot ? "Loaded" : "Not loaded"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">API</span>
                  </div>
                  <span className="text-xs text-muted-foreground">localhost:8080</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
