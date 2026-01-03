"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Snapshot } from "@/lib/types";
import { loadSnapshot } from "@/lib/snapshot";
import { applyThemeTokens, pickTheme } from "@/lib/theme";

type SnapshotState = {
  snapshot: Snapshot | null;
  error: string | null;
  reload: () => Promise<void>;
};

const Ctx = createContext<SnapshotState | null>(null);

export function SnapshotProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    try {
      setError(null);
      const s = await loadSnapshot();
      setSnapshot(s);
      const tokens = pickTheme(s, "Default");
      applyThemeTokens(tokens);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const value = useMemo(() => ({ snapshot, error, reload }), [snapshot, error]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSnapshot() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSnapshot must be used within SnapshotProvider");
  return v;
}
