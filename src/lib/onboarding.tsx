/**
 * オンボーディング完了フラグ。
 * ゲート判定で毎回参照するので、DB 初期化を待たずに読める AsyncStorage に置く。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const KEY = 'historary.onboarded';

interface OnboardingValue {
  /** null = 判定中 */
  done: boolean | null;
  complete: () => Promise<void>;
  reset: () => Promise<void>;
}

const Ctx = createContext<OnboardingValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setDone(v === '1'))
      .catch(() => setDone(false));
  }, []);

  async function complete() {
    await AsyncStorage.setItem(KEY, '1');
    setDone(true);
  }

  async function reset() {
    await AsyncStorage.removeItem(KEY);
    setDone(false);
  }

  return <Ctx.Provider value={{ done, complete, reset }}>{children}</Ctx.Provider>;
}

export function useOnboarding(): OnboardingValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useOnboarding は <OnboardingProvider> の中で使ってください。');
  return ctx;
}
