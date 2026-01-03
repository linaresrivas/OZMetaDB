"use client";

export function makeTranslator(snapshot: any, lang: string) {
  const translations = snapshot?.objects?.texts?.translations ?? [];
  const keys = snapshot?.objects?.texts?.textKeys ?? [];
  const byKey: Record<string,string> = {};
  for (const tr of translations) {
    if (tr.lang === lang && tr.textKeyId) byKey[tr.textKeyId] = tr.text;
  }
  const defaultByKey: Record<string,string> = {};
  for (const k of keys) {
    if (k.id) defaultByKey[k.id] = k.defaultText ?? k.code ?? "";
  }
  return (textKeyId?: string | null, fallback?: string) => {
    if (!textKeyId) return fallback ?? "";
    return byKey[textKeyId] ?? defaultByKey[textKeyId] ?? fallback ?? "";
  };
}
