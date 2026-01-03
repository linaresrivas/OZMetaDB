import type { Snapshot, UiThemeRow } from "./types";

export type ThemeTokens = Record<string, string | number | boolean | null>;

export function pickTheme(snapshot: Snapshot, code = "Default"): ThemeTokens {
  const themes = (snapshot.objects?.uiThemes ?? []) as UiThemeRow[];
  const row = themes.find((t) => t.UT_Code === code) ?? themes[0];
  if (!row?.UT_TokensJSON) return {};
  try {
    return JSON.parse(row.UT_TokensJSON) as ThemeTokens;
  } catch {
    return {};
  }
}

export function applyThemeTokens(tokens: ThemeTokens) {
  const root = document.documentElement;
  Object.entries(tokens).forEach(([k, v]) => {
    const key = k.startsWith("--") ? k : `--${k}`;
    root.style.setProperty(key, String(v));
  });
}
