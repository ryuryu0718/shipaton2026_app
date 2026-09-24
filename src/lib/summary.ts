/**
 * 要約版のハイライト抽出（企画書 5-2: 「AIがハイライトを自動抽出した要約版」）。
 *
 * V1 は API キーをクライアントに置かずに済む、ルールベースの簡易版で代替する
 * （文章量・写真・タグの多さでスコアリングし、月ごとに上位を残す）。
 * 将来、サーバー側（Supabase Edge Function 等）で Claude API を呼ぶ本物の
 * AI 要約に差し替える際も、呼び出し側のインターフェースは変えずに済む設計。
 */
import type { EntryWithRelations } from './entries';

function scoreEntry(e: EntryWithRelations): number {
  const lengthScore = Math.min(e.body.trim().length, 400) / 40; // 文章量
  const mediaScore = e.media.length * 3; // 写真つき
  const contentScore = e.content.length * 2; // 今日楽しんだものタグ
  return lengthScore + mediaScore + contentScore;
}

/**
 * 月ごとに上位 `maxPerMonth` 件を残して時系列順に返す。
 * 記録が少ない月はある分だけ残る（無理に埋めない）。
 */
export function selectHighlights(
  entries: EntryWithRelations[],
  maxPerMonth = 3,
): EntryWithRelations[] {
  const byMonth = new Map<string, EntryWithRelations[]>();
  for (const e of entries) {
    const month = e.entry_date.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(e);
  }

  const picked: EntryWithRelations[] = [];
  for (const monthEntries of byMonth.values()) {
    const ranked = [...monthEntries].sort((a, b) => scoreEntry(b) - scoreEntry(a));
    picked.push(...ranked.slice(0, maxPerMonth));
  }

  return picked.sort(
    (a, b) =>
      a.entry_date.localeCompare(b.entry_date) || a.created_at.localeCompare(b.created_at),
  );
}
