/**
 * 生成済みの本（企画書 5-2）。
 * V1 はデジタル完結: expo-print で HTML→PDF を作り、アプリ内ビューアで読む。
 * PDF は印刷業界標準（250〜300ページ / 無線綴じ想定）に寄せて出力し、
 * 紙が欲しい人は外部の印刷サービスへ自分で持ち込める。
 *
 * ※ PDF 生成本体は Phase 4 で実装。ここではメタデータの読み書きのみ。
 */
import { getDb } from './db';
import { addDaysISO, todayISODate } from './date';
import { countEntriesInRange, getEntryDateBounds } from './entries';
import { newId } from './ids';
import { getMeta, setMeta, META_KEYS } from './meta';

export type BookKind = 'full' | 'summary';

export interface Book {
  id: string;
  kind: BookKind;
  title: string;
  range_start: string | null;
  range_end: string | null;
  pdf_uri: string | null;
  page_count: number;
  entry_count: number;
  created_at: string;
}

/** 1エントリーあたりのおおよそのページ数（本文＋写真込みの平均見積り）。 */
export const PAGES_PER_ENTRY = 1.2;

/** 巻分割の提案しきい値（企画書 5-2: 250〜300ページ相当）。 */
export const BOOK_SUGGESTION_PAGES = 300;

export function estimatePages(entryCount: number): number {
  return Math.ceil(entryCount * PAGES_PER_ENTRY);
}

export async function listBooks(): Promise<Book[]> {
  const db = await getDb();
  return db.getAllAsync<Book>(`SELECT * FROM books ORDER BY created_at DESC`);
}

export async function getBook(id: string): Promise<Book | null> {
  const db = await getDb();
  return db.getFirstAsync<Book>(`SELECT * FROM books WHERE id = ?`, [id]);
}

export interface CreateBookInput {
  kind: BookKind;
  title: string;
  rangeStart: string;
  rangeEnd: string;
  pdfUri: string;
  pageCount: number;
  entryCount: number;
}

export async function createBook(input: CreateBookInput): Promise<string> {
  const db = await getDb();
  const id = newId();
  await db.runAsync(
    `INSERT INTO books
       (id, kind, title, range_start, range_end, pdf_uri, page_count, entry_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.kind,
      input.title,
      input.rangeStart,
      input.rangeEnd,
      input.pdfUri,
      input.pageCount,
      input.entryCount,
      new Date().toISOString(),
    ],
  );
  return id;
}

async function getLastFullBookRangeEnd(): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ range_end: string | null }>(
    `SELECT range_end FROM books WHERE kind = 'full' ORDER BY range_end DESC LIMIT 1`,
  );
  return row?.range_end ?? null;
}

export interface NextFullBookRange {
  start: string;
  end: string;
  entryCount: number;
}

/**
 * 次の全文版が対象にする期間。前回の全文版の続きから今日まで
 * （まだ1冊も無ければ最初の記録から）。対象になる記録が無ければ null。
 */
export async function getNextFullBookRange(): Promise<NextFullBookRange | null> {
  const bounds = await getEntryDateBounds();
  if (!bounds) return null;

  const lastEnd = await getLastFullBookRangeEnd();
  const start = lastEnd && lastEnd >= bounds.min ? addDaysISO(lastEnd, 1) : bounds.min;
  if (start > bounds.max) return null; // 直近の1冊にすべて含まれている

  const entryCount = await countEntriesInRange(start, bounds.max);
  return { start, end: bounds.max, entryCount };
}

/** 要約版の無料出力回数（企画書 6章: 無料プランは月1回）。V1 は全員この上限。 */
export const FREE_SUMMARY_EXPORTS_PER_MONTH = 1;

function summaryExportKey(): string {
  return `${META_KEYS.summaryExportsPrefix}${todayISODate().slice(0, 7)}`;
}

export async function getSummaryExportCountThisMonth(): Promise<number> {
  const v = await getMeta(summaryExportKey());
  return v ? Number(v) || 0 : 0;
}

export async function recordSummaryExport(): Promise<void> {
  const current = await getSummaryExportCountThisMonth();
  await setMeta(summaryExportKey(), String(current + 1));
}
