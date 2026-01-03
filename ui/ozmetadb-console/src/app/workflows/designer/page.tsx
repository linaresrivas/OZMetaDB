"use client";

import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactFlow, { Background, Controls, MiniMap, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const nodes: Node[] = [
  { id: "new", position: { x: 0, y: 0 }, data: { label: "New" } },
  { id: "review", position: { x: 220, y: 0 }, data: { label: "Review" } },
  { id: "closed", position: { x: 440, y: 0 }, data: { label: "Closed" } },
];

const edges: Edge[] = [
  { id: "e1-2", source: "new", target: "review", label: "Submit" },
  { id: "e2-3", source: "review", target: "closed", label: "Approve" },
];

export default function WorkflowDesignerPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Workflow Designer (React Flow)</h1>
        <Card>
          <CardHeader>
            <CardTitle>State machine (demo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 520 }} className="rounded-xl overflow-hidden border border-black/10">
              <ReactFlow nodes={nodes} edges={edges} fitView>
                <MiniMap />
                <Controls />
                <Background />
              </ReactFlow>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Next: bind nodes/edges to Meta.WorkflowState/Meta.WorkflowTransition and enable guard/action DSL editing.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
