/**
 * Supabase クライアント。
 *
 * 役割は限定的（企画書 7章）:
 *  - 認証（Sign in with Apple）
 *  - 写真ストレージ（本の PDF 生成でリモート URL を参照できるようにする / 企画書 5-2）
 *  - 将来: 複数ベンダーへのバックアップ同期（上位プラン）
 *
 * 日記データそのものの正本は端末内 SQLite（src/lib/db.ts）。
 *
 * 環境変数は app の起動時に EXPO_PUBLIC_ プレフィックスで注入される（.env 参照）。
 * 未設定でもアプリはローカル専用モードで動作する。
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
