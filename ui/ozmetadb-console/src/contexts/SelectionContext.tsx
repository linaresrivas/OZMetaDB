"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

export type Selection = { type: string; id?: string; label?: string; payload?: any };
type SelState = { selection: Selection | null; setSelection: (s: Selection | null) => void };
const Ctx = createContext<SelState | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const value = useMemo(() => ({ selection, setSelection }), [selection]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useSelection() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSelection must be used within SelectionProvider");
  return v;
}
