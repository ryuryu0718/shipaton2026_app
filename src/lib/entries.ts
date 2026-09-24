/**
 * 日記エントリーの読み書き（ローカル SQLite）。
 * 1エントリー = 本文 + 添付写真(0..n) + 今日楽しんだコンテンツ(0..n)。
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import { getDb } from './db';
import { newId } from './ids';
import { monthDay, todayISODate } from './date';

export type ContentCategory = 'music' | 'screen' | 'comedy' | 'book' | 'other';

export const CONTENT_CATEGORIES: { key: ContentCategory; label: string; sf: string }[] = [
  { key: 'music', label: '音楽', sf: 'music.note' },
  { key: 'screen', label: '映画/ドラマ', sf: 'film' },
  { key: 'comedy', label: 'お笑い', sf: 'face.smiling' },
  { key: 'book', label: '本', sf: 'book' },
  { key: 'other', label: 'その他', sf: 'sparkles' },
];

export interface EntryMedia {
  id: string;
  entry_id: string;
  local_uri: string;
  remote_url: string | null;
  width: number | null;
  height: number | null;
  position: number;
}

export interface ContentLog {
  id: string;
  entry_id: string;
  category: ContentCategory;
  title: string;
  note: string | null;
  position: number;
}

export interface Entry {
  id: string;
  entry_date: string; // YYYY-MM-DD
  body: string;
  created_at: string;
  updated_at: string;
}

export interface EntryWithRelations extends Entry {
  media: EntryMedia[];
  content: ContentLog[];
}

export interface EntryDraft {
  entryDate?: string;
  body?: string;
  media?: { localUri: string; remoteUrl?: string | null; width?: number; height?: number }[];
  content?: { category: ContentCategory; title: string; note?: string | null }[];
}

/** 一覧（新しい順）。entry_date 降順、同日は created_at 降順。 */
export async function listEntries(limit = 100, offset = 0): Promise<Entry[]> {
  const db = await getDb();
  return db.getAllAsync<Entry>(
    `SELECT id, entry_date, body, created_at, updated_at
       FROM entries
      WHERE deleted_at IS NULL
      ORDER BY entry_date DESC, created_at DESC
      LIMIT ? OFFSET ?`,
    [limit, offset],
  );
}

/** entry_date の範囲で取得（本の生成・カレンダー用）。古い順。 */
export async function listEntriesInRange(startISO: string, endISO: string): Promise<Entry[]> {
  const db = await getDb();
  return db.getAllAsync<Entry>(
    `SELECT id, entry_date, body, created_at, updated_at
       FROM entries
      WHERE deleted_at IS NULL AND entry_date BETWEEN ? AND ?
      ORDER BY entry_date ASC, created_at ASC`,
    [startISO, endISO],
  );
}

/** 「N年前の今日」。今日と同じ MM-DD で、今年以外のエントリーを新しい順で。 */
export async function listOnThisDay(refISO: string = todayISODate()): Promise<Entry[]> {
  const db = await getDb();
  const md = monthDay(refISO);
  const year = refISO.slice(0, 4);
  return db.getAllAsync<Entry>(
    `SELECT id, entry_date, body, created_at, updated_at
       FROM entries
      WHERE deleted_at IS NULL
        AND substr(entry_date, 6, 5) = ?
        AND substr(entry_date, 1, 4) <> ?
      ORDER BY entry_date DESC, created_at DESC`,
    [md, year],
  );
}

export async function getEntry(id: string): Promise<EntryWithRelations | null> {
  const db = await getDb();
  const entry = await db.getFirstAsync<Entry>(
    `SELECT id, entry_date, body, created_at, updated_at
       FROM entries WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );
  if (!entry) return null;
  const media = await db.getAllAsync<EntryMedia>(
    `SELECT * FROM entry_media WHERE entry_id = ? ORDER BY position ASC`,
    [id],
  );
  const content = await db.getAllAsync<ContentLog>(
    `SELECT * FROM content_logs WHERE entry_id = ? ORDER BY position ASC`,
    [id],
  );
  return { ...entry, media, content };
}

/** カウント（本の巻分割提案・統計用）。 */
export async function countEntries(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM entries WHERE deleted_at IS NULL`,
  );
  return row?.n ?? 0;
}

export async function countEntriesInRange(startISO: string, endISO: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM entries
      WHERE deleted_at IS NULL AND entry_date BETWEEN ? AND ?`,
    [startISO, endISO],
  );
  return row?.n ?? 0;
}

/** 記録がある日付の範囲（本の対象期間の初期値決めに使用）。記録が1件も無ければ null。 */
export async function getEntryDateBounds(): Promise<{ min: string; max: string } | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ min: string | null; max: string | null }>(
    `SELECT MIN(entry_date) AS min, MAX(entry_date) AS max
       FROM entries WHERE deleted_at IS NULL`,
  );
  if (!row?.min || !row.max) return null;
  return { min: row.min, max: row.max };
}

/** 本の生成用: 期間内のエントリーを写真・コンテンツタグ込みで取得（古い順）。 */
export async function listEntriesWithRelationsInRange(
  startISO: string,
  endISO: string,
): Promise<EntryWithRelations[]> {
  const db = await getDb();
  const entries = await db.getAllAsync<Entry>(
    `SELECT id, entry_date, body, created_at, updated_at
       FROM entries
      WHERE deleted_at IS NULL AND entry_date BETWEEN ? AND ?
      ORDER BY entry_date ASC, created_at ASC`,
    [startISO, endISO],
  );
  if (entries.length === 0) return [];

  const ids = entries.map((e) => e.id);
  const placeholders = ids.map(() => '?').join(',');
  const [media, content] = await Promise.all([
    db.getAllAsync<EntryMedia>(
      `SELECT * FROM entry_media WHERE entry_id IN (${placeholders}) ORDER BY entry_id, position`,
      ids,
    ),
    db.getAllAsync<ContentLog>(
      `SELECT * FROM content_logs WHERE entry_id IN (${placeholders}) ORDER BY entry_id, position`,
      ids,
    ),
  ]);

  const mediaByEntry = new Map<string, EntryMedia[]>();
  for (const m of media) {
    if (!mediaByEntry.has(m.entry_id)) mediaByEntry.set(m.entry_id, []);
    mediaByEntry.get(m.entry_id)!.push(m);
  }
  const contentByEntry = new Map<string, ContentLog[]>();
  for (const c of content) {
    if (!contentByEntry.has(c.entry_id)) contentByEntry.set(c.entry_id, []);
    contentByEntry.get(c.entry_id)!.push(c);
  }

  return entries.map((e) => ({
    ...e,
    media: mediaByEntry.get(e.id) ?? [],
    content: contentByEntry.get(e.id) ?? [],
  }));
}

export async function createEntry(draft: EntryDraft): Promise<string> {
  const db = await getDb();
  const id = newId();
  const now = new Date().toISOString();
  const entryDate = draft.entryDate ?? todayISODate();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `INSERT INTO entries (id, entry_date, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, entryDate, draft.body ?? '', now, now],
    );
    await writeRelations(tx, id, draft, now);
  });
  return id;
}

export async function updateEntry(id: string, draft: EntryDraft): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (tx) => {
    const sets: string[] = ['updated_at = ?'];
    const args: (string | null)[] = [now];
    if (draft.entryDate !== undefined) {
      sets.push('entry_date = ?');
      args.push(draft.entryDate);
    }
    if (draft.body !== undefined) {
      sets.push('body = ?');
      args.push(draft.body);
    }
    args.push(id);
    await tx.runAsync(`UPDATE entries SET ${sets.join(', ')} WHERE id = ?`, args);

    if (draft.media !== undefined) {
      await tx.runAsync(`DELETE FROM entry_media WHERE entry_id = ?`, [id]);
    }
    if (draft.content !== undefined) {
      await tx.runAsync(`DELETE FROM content_logs WHERE entry_id = ?`, [id]);
    }
    await writeRelations(tx, id, draft, now);
  });
}

/** ソフトデリート。本の生成やバックアップとの整合のため物理削除はしない。 */
export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE entries SET deleted_at = ? WHERE id = ?`, [
    new Date().toISOString(),
    id,
  ]);
}

// --- 内部 ---

async function writeRelations(
  tx: SQLiteDatabase,
  entryId: string,
  draft: EntryDraft,
  now: string,
) {
  if (draft.media) {
    for (let i = 0; i < draft.media.length; i++) {
      const m = draft.media[i];
      await tx.runAsync(
        `INSERT INTO entry_media (id, entry_id, local_uri, remote_url, width, height, position, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId(), entryId, m.localUri, m.remoteUrl ?? null, m.width ?? null, m.height ?? null, i, now],
      );
    }
  }
  if (draft.content) {
    for (let i = 0; i < draft.content.length; i++) {
      const c = draft.content[i];
      const title = c.title.trim();
      if (!title) continue;
      await tx.runAsync(
        `INSERT INTO content_logs (id, entry_id, category, title, note, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId(), entryId, c.category, title, c.note?.trim() || null, i],
      );
    }
  }
}
