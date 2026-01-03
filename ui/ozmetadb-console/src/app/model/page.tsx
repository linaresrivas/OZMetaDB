import { AppShell } from "@/components/shell/AppShell";

export default function Page() {
  return (
    <AppShell>
      <div className="p-6 space-y-2">
        <h1 className="text-2xl font-semibold">Model</h1>
        <p className="text-muted-foreground">
          Placeholder route. Bind this to Meta.UiPage + Meta.UiComponent definitions.
        </p>
      <div className="mt-4 text-sm"><span className="font-medium">Demo links:</span> <a className="underline" href="/model/grid">AG Grid editor</a></div>
      </div>
    </AppShell>
  );
}
