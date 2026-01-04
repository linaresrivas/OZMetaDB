"use client";

import { AppShell } from "@/components/shell/AppShell";
import { useSnapshot } from "@/contexts/SnapshotContext";
import { useSelection } from "@/contexts/SelectionContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactFlow, Background, Controls, MiniMap, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GitBranch, Circle, ArrowRight, Info, Workflow } from "lucide-react";
import Link from "next/link";

function buildGraph(workflows: any[], states: any[], transitions: any[]) {
  const wf = workflows?.[0];
  const st = states?.filter((s) => (s.workflowId ?? s.WF_ID) === (wf?.id ?? wf?.WF_ID)) ?? [];
  const tr = transitions?.filter((t) => (t.workflowId ?? t.WF_ID) === (wf?.id ?? wf?.WF_ID)) ?? [];

  const nodes: Node[] = st.map((s, i) => ({
    id: (s.id ?? s.ST_ID) as string,
    position: { x: (i % 4) * 220, y: Math.floor(i / 4) * 120 },
    data: { label: s.code ?? s.ST_Code },
    type: "default",
  }));

  const edges: Edge[] = tr.map((t, i) => ({
    id: (t.id ?? t.TRN_ID ?? `e${i}`) as string,
    source: (t.fromStateId ?? t.FromST_ID) as string,
    target: (t.toStateId ?? t.ToST_ID) as string,
    label: t.code ?? t.TRN_Code,
    animated: false,
  }));

  return { wf, nodes, edges };
}

export default function WorkflowsPage() {
  const { snapshot } = useSnapshot();
  const { setSelection } = useSelection();

  const wfObj = snapshot?.objects?.workflows ?? {};
  const workflows = (wfObj.workflows ?? []) as any[];
  const states = (wfObj.states ?? []) as any[];
  const transitions = (wfObj.transitions ?? []) as any[];

  const { wf, nodes, edges } = buildGraph(workflows, states, transitions);
  const hasData = nodes.length > 0;

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Visualize and manage state machines and workflow definitions
            </p>
          </div>
          <Link
            href="/workflows/designer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Workflow className="h-4 w-4" />
            Open Designer
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{workflows.length}</div>
                  <div className="text-xs text-muted-foreground">Workflows</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Circle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{states.length}</div>
                  <div className="text-xs text-muted-foreground">States</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{transitions.length}</div>
                  <div className="text-xs text-muted-foreground">Transitions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              {wf?.code ?? wf?.WF_Code ?? "Workflow Diagram"}
            </CardTitle>
            <CardDescription>
              {hasData
                ? "Click on states or transitions to view details in the Inspector"
                : "Load a snapshot with workflow definitions to visualize them"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <div className="h-[480px] rounded-lg border overflow-hidden bg-background">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  fitView
                  onNodeClick={(_, n) => setSelection({
                    type: "WorkflowState",
                    id: n.id,
                    label: String(n.data?.label),
                    payload: n
                  })}
                  onEdgeClick={(_, e) => setSelection({
                    type: "WorkflowTransition",
                    id: e.id,
                    label: String(e.label ?? ""),
                    payload: e
                  })}
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <GitBranch className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No Workflows Found</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                  Load a snapshot containing workflow definitions to visualize them here.
                </p>
                <Link
                  href="/workflows/designer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Info className="h-4 w-4" />
                  Try the interactive designer
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
