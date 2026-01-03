import { AppShell } from "@/components/shell/AppShell";

export default function Page() {
  return (
    <AppShell>
      <div className="p-6 space-y-2">
        <h1 className="text-2xl font-semibold">Generators</h1>
        <p className="text-muted-foreground">
          Placeholder route. Bind this to Meta.UiPage + Meta.UiComponent definitions.
        </p>
      </div>
    </AppShell>
  );
}
