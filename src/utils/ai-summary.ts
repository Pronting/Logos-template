export type AiSummaryType = "blog" | "bookReview" | "columnArticle";

export interface AiSummaryRecord {
  schemaVersion: number;
  promptVersion: string;
  model: string;
  contentHash: string;
  generatedAt: string;
  target: {
    type: AiSummaryType;
    locale: string;
    id: string;
    title: string;
  };
  summary: string;
}

const summaryModules = import.meta.glob("../data/ai-summaries/*.json", {
  eager: true,
});

export function createAiSummaryKey(type: AiSummaryType, locale: string, id: string): string {
  return `${type}/${locale}/${normalizeSummaryId(id)}`;
}

export function normalizeSummaryId(id: string): string {
  return id.replace(/^\/+|\/+$/g, "");
}

export function stripLocaleFromId(id: string, locales: readonly string[]): string {
  const parts = normalizeSummaryId(id).split("/");
  const last = parts[parts.length - 1];
  if (last && locales.includes(last)) return parts.slice(0, -1).join("/");
  return normalizeSummaryId(id);
}

export function summaryKeyToFileName(key: string): string {
  return `${encodeURIComponent(key).replace(/[^A-Za-z0-9_.-]/g, (ch) => {
    return `_${ch.charCodeAt(0).toString(16)}_`;
  })}.json`;
}

export function getAiSummary(key: string): AiSummaryRecord | null {
  const fileName = summaryKeyToFileName(key);
  const mod = summaryModules[`../data/ai-summaries/${fileName}`] as
    | { default?: AiSummaryRecord }
    | AiSummaryRecord
    | undefined;
  const record = mod && "default" in mod ? mod.default : mod;

  if (!record || typeof record.summary !== "string" || record.summary.trim() === "") {
    return null;
  }

  return record as AiSummaryRecord;
}
