/**
 * ローカル SQLite データベース。
 *
 * 設計方針: ヒストラリはローカルファースト。日記データの正本は端末内の SQLite に置き、
 * ネットワークが無くても記録・振り返り・本の生成ができる（企画書 3章「連用日記」文化の踏襲）。
 * Supabase は認証・写真ストレージ・将来のバックアップ同期にのみ使う（src/lib/auth.tsx）。
 *
 * 日付の持ち方（企画書 5-1）:
 *  - entry_date  … 「出来事があった日」YYYY-MM-DD（ローカル日付）。並び順・「N年前の今日」に使う。
 *  - created_at  … 「実際に入力した日時」ISO8601（UTC）。
 */
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'historary.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** 単一コネクションを使い回す。 */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}

/** PRAGMA user_version をバージョン管理に使う素朴なマイグレーション。 */
const MIGRATIONS: ((db: SQLite.SQLiteDatabase) => Promise<void>)[] = [
  // v1 — 初期スキーマ
  async (db) => {
    await db.execAsync(`
      CREATE TABLE entries (
        id           TEXT PRIMARY KEY NOT NULL,
        entry_date   TEXT NOT NULL,                -- YYYY-MM-DD（出来事があった日）
        body         TEXT NOT NULL DEFAULT '',
        created_at   TEXT NOT NULL,                -- ISO8601（入力日時）
        updated_at   TEXT NOT NULL,
        deleted_at   TEXT                          -- ソフトデリート
      );
      CREATE INDEX idx_entries_entry_date ON entries (entry_date);
      CREATE INDEX idx_entries_md ON entries (substr(entry_date, 6, 5));  -- 「N年前の今日」用（MM-DD）

      CREATE TABLE entry_media (
        id          TEXT PRIMARY KEY NOT NULL,
        entry_id    TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
        local_uri   TEXT NOT NULL,
        remote_url  TEXT,
        width       INTEGER,
        height      INTEGER,
        position    INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT NOT NULL
      );
      CREATE INDEX idx_entry_media_entry ON entry_media (entry_id);

      -- 今日楽しんだコンテンツ（企画書 5-1）。V1 は自由記述タグ。
      CREATE TABLE content_logs (
        id          TEXT PRIMARY KEY NOT NULL,
        entry_id    TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
        category    TEXT NOT NULL,                 -- music | screen | comedy | book | other
        title       TEXT NOT NULL,
        note        TEXT,
        position    INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX idx_content_logs_entry ON content_logs (entry_id);
      CREATE INDEX idx_content_logs_category ON content_logs (category);

      -- 緊急連絡先（企画書 5-1）。「終活情報」ではなく一般的な呼び方で最小構成。
      CREATE TABLE emergency_contacts (
        id           TEXT PRIMARY KEY NOT NULL,
        name         TEXT NOT NULL,
        relationship TEXT,
        method       TEXT,                         -- phone | email | line | other
        contact_value TEXT,
        message      TEXT,
        position     INTEGER NOT NULL DEFAULT 0,
        created_at   TEXT NOT NULL,
        updated_at   TEXT NOT NULL
      );

      -- 生成済みの本（企画書 5-2）。
      CREATE TABLE books (
        id          TEXT PRIMARY KEY NOT NULL,
        kind        TEXT NOT NULL,                 -- full | summary
        title       TEXT NOT NULL,
        range_start TEXT,                          -- entry_date
        range_end   TEXT,
        pdf_uri     TEXT,
        page_count  INTEGER NOT NULL DEFAULT 0,
        entry_count INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT NOT NULL
      );
      CREATE INDEX idx_books_created ON books (created_at);

      -- 汎用 key-value（オンボーディング完了フラグ、要約版の月次出力回数など）。
      CREATE TABLE meta (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);
  },
];

async function migrate(db: SQLite.SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  let version = row?.user_version ?? 0;
  for (let i = version; i < MIGRATIONS.length; i++) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await MIGRATIONS[i](tx as unknown as SQLite.SQLiteDatabase);
    });
    version = i + 1;
    // PRAGMA はパラメータバインド不可のため値を直接埋め込む（整数のみ）。
    await db.execAsync(`PRAGMA user_version = ${version};`);
  }
}

/** テスト・「最初からやり直す」用。全テーブルを破棄して再マイグレーション。 */
export async function resetDb() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS entry_media;
    DROP TABLE IF EXISTS content_logs;
    DROP TABLE IF EXISTS emergency_contacts;
    DROP TABLE IF EXISTS books;
    DROP TABLE IF EXISTS meta;
    DROP TABLE IF EXISTS entries;
    PRAGMA user_version = 0;
    PRAGMA foreign_keys = ON;
  `);
  await migrate(db);
}
