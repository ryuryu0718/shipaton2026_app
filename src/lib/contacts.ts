/**
 * 緊急連絡先（企画書 5-1 / 8章）。
 * 「終活情報」ではなく「緊急連絡先の設定」という一般的な呼び方で、
 * 名前・関係性・連絡手段・伝えたいメッセージのみのミニマム構成。
 */
import { getDb } from './db';
import { newId } from './ids';

export type ContactMethod = 'phone' | 'email' | 'line' | 'other';

export const CONTACT_METHODS: { key: ContactMethod; label: string }[] = [
  { key: 'phone', label: '電話' },
  { key: 'email', label: 'メール' },
  { key: 'line', label: 'LINE' },
  { key: 'other', label: 'その他' },
];

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string | null;
  method: ContactMethod | null;
  contact_value: string | null;
  message: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ContactDraft {
  name: string;
  relationship?: string | null;
  method?: ContactMethod | null;
  contactValue?: string | null;
  message?: string | null;
}

export async function listContacts(): Promise<EmergencyContact[]> {
  const db = await getDb();
  return db.getAllAsync<EmergencyContact>(
    `SELECT * FROM emergency_contacts ORDER BY position ASC, created_at ASC`,
  );
}

export async function getContact(id: string): Promise<EmergencyContact | null> {
  const db = await getDb();
  return db.getFirstAsync<EmergencyContact>(`SELECT * FROM emergency_contacts WHERE id = ?`, [id]);
}

export async function createContact(draft: ContactDraft): Promise<string> {
  const db = await getDb();
  const id = newId();
  const now = new Date().toISOString();
  const row = await db.getFirstAsync<{ next: number }>(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next FROM emergency_contacts`,
  );
  await db.runAsync(
    `INSERT INTO emergency_contacts
       (id, name, relationship, method, contact_value, message, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      draft.name.trim(),
      draft.relationship?.trim() || null,
      draft.method ?? null,
      draft.contactValue?.trim() || null,
      draft.message?.trim() || null,
      row?.next ?? 0,
      now,
      now,
    ],
  );
  return id;
}

export async function updateContact(id: string, draft: ContactDraft): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE emergency_contacts
        SET name = ?, relationship = ?, method = ?, contact_value = ?, message = ?, updated_at = ?
      WHERE id = ?`,
    [
      draft.name.trim(),
      draft.relationship?.trim() || null,
      draft.method ?? null,
      draft.contactValue?.trim() || null,
      draft.message?.trim() || null,
      new Date().toISOString(),
      id,
    ],
  );
}

export async function deleteContact(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM emergency_contacts WHERE id = ?`, [id]);
}
