"use client";

import * as React from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, RowClickedEvent, GridReadyEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { cn } from "@/lib/utils";

interface DataGridProps {
  rowData: any[];
  columnDefs: ColDef[];
  onRowClicked?: (event: RowClickedEvent) => void;
  onGridReady?: (event: GridReadyEvent) => void;
  height?: number | string;
  className?: string;
  defaultColDef?: ColDef;
}

export function DataGrid({
  rowData,
  columnDefs,
  onRowClicked,
  onGridReady,
  height = 400,
  className,
  defaultColDef,
}: DataGridProps) {
  const gridRef = React.useRef<AgGridReact>(null);

  const defaultColDefMerged: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
    ...defaultColDef,
  };

  const handleGridReady = (event: GridReadyEvent) => {
    event.api.sizeColumnsToFit();
    onGridReady?.(event);
  };

  return (
    <div
      className={cn("ag-theme-alpine", className)}
      style={{ height: typeof height === "number" ? `${height}px` : height, width: "100%" }}
    >
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDefMerged}
        onRowClicked={onRowClicked}
        onGridReady={handleGridReady}
        animateRows={true}
        rowSelection="single"
        suppressCellFocus={true}
      />
    </div>
  );
}
