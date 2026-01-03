import type { Snapshot } from "./types";

export async function loadSnapshot(): Promise<Snapshot> {
  const res = await fetch("/snapshot.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load snapshot.json (${res.status})`);
  return (await res.json()) as Snapshot;
}
