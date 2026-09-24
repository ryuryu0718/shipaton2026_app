/**
 * 認証コンテキスト。
 *
 * V1 の方針（企画書 5-5 オンボーディング）:
 *  - 外部ログインは Sign in with Apple のみ（Apple 審査要件に合わせ、他は提供しない）。
 *  - Supabase 未設定、または Apple 認証が使えない環境（Expo Go / シミュレータ等）では
 *    「ゲストモード」で端末内に閉じて利用できる。データはローカル SQLite に貯まる。
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { supabase, isSupabaseConfigured } from './supabase';

type AuthSession = { user?: { id: string; email?: string | null } };

type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'guest';

interface AuthValue {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
  isSupabaseConfigured: boolean;
  appleAuthAvailable: boolean;
  signInWithApple: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const GUEST_KEY = 'historary.guest';

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAuthAvailable)
        .catch(() => setAppleAuthAvailable(false));
    }
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const applySession = (session: AuthSession | null) => {
      if (session?.user) {
        setUserId(session.user.id);
        setEmail(session.user.email ?? null);
        setStatus('signedIn');
        return true;
      }
      return false;
    };

    const resolveGuestOrSignedOut = async () => {
      const guest = await AsyncStorage.getItem(GUEST_KEY);
      setStatus(guest ? 'guest' : 'signedOut');
    };

    (async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const hadSession = applySession(data.session);
        const sub = supabase.auth.onAuthStateChange(
          (_event: string, session: AuthSession | null) => {
            applySession(session);
          },
        );
        unsub = () => sub.data.subscription.unsubscribe();
        if (!hadSession) await resolveGuestOrSignedOut();
      } else {
        await resolveGuestOrSignedOut();
      }
    })();

    return () => unsub?.();
  }, []);

  async function signInWithApple() {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error('Apple から identityToken を取得できませんでした。');
    }

    if (supabase) {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;
      // onAuthStateChange が status を更新する。
    } else {
      // Supabase 未設定: Apple の user id をそのまま使ってローカル利用。
      await AsyncStorage.removeItem(GUEST_KEY);
      setUserId(credential.user);
      setEmail(credential.email ?? null);
      setStatus('signedIn');
    }
  }

  async function continueAsGuest() {
    await AsyncStorage.setItem(GUEST_KEY, '1');
    setStatus('guest');
  }

  async function signOut() {
    await AsyncStorage.removeItem(GUEST_KEY);
    if (supabase) await supabase.auth.signOut();
    setUserId(null);
    setEmail(null);
    setStatus('signedOut');
  }

  const value = useMemo<AuthValue>(
    () => ({
      status,
      userId,
      email,
      isSupabaseConfigured,
      appleAuthAvailable,
      signInWithApple,
      continueAsGuest,
      signOut,
    }),
    [status, userId, email, appleAuthAvailable],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth は <AuthProvider> の中で使ってください。');
  return ctx;
}
