/** meta テーブルの薄いラッパー（key-value）。 */
import { getDb } from './db';

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string | null }>(
    `SELECT value FROM meta WHERE key = ?`,
    [key],
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export const META_KEYS = {
  onboardingDone: 'onboarding_done',
  lastBookSuggestionDismissedAt: 'last_book_suggestion_dismissed_at',
  /** 要約版の月次出力回数。キーは `summary_exports:YYYY-MM`。 */
  summaryExportsPrefix: 'summary_exports:',
} as const;
