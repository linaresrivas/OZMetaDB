import { AppShell } from "@/components/shell/AppShell";

export default function HomePage() {
  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Home</h1>
        <p className="text-muted-foreground">
          Starter OZMetaDB Console. Replace placeholders by binding to MetaDB snapshot exports.
        </p>
      </div>
    </AppShell>
  );
}
