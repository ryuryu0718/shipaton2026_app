import * as Crypto from 'expo-crypto';

/** 端末内で完結する ID 生成。将来 Supabase と同期する際もそのまま主キーに使える。 */
export function newId(): string {
  return Crypto.randomUUID();
}
