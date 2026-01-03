"use client";

import { AppShell } from "@/components/shell/AppShell";
import { useSnapshot } from "@/contexts/SnapshotContext";
import { useSelection } from "@/contexts/SelectionContext";
import React from "react";
import ReactFlow, { Background, Controls, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";

function buildGraph(workflows: any[], states: any[], transitions: any[]) {
  // pick first workflow for demo
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

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Workflows</h1>
        <div className="text-sm text-muted-foreground">
          Showing: {wf?.code ?? wf?.WF_Code ?? "—"} (first workflow in snapshot)
        </div>

        <div className="h-[560px] rounded-xl border overflow-hidden bg-white">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            onNodeClick={(_, n) => setSelection({ type: "WorkflowState", id: n.id, label: String(n.data?.label), payload: n })}
            onEdgeClick={(_, e) => setSelection({ type: "WorkflowTransition", id: e.id, label: String(e.label ?? ""), payload: e })}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </AppShell>
  );
}
