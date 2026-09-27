/**
 * 課金（企画書 6章 / Phase 5）。RevenueCat SDK + Paywalls（ダッシュボードで作る V2 ペイウォール）。
 *
 *  - エンタイトルメント `premium` を持っていればプレミアム（要約版の出力回数が無制限）。
 *  - ペイウォールの見た目・商品は RevenueCat ダッシュボードの default Offering で管理する。
 *  - EXPO_PUBLIC_REVENUECAT_IOS_KEY 未設定、または iOS 以外では課金なし（全員無料プラン）で動く。
 *    react-native-purchases はネイティブモジュールなので、開発ビルドの再作成が必要。
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

export const PREMIUM_ENTITLEMENT = 'premium';

const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim();

export const isPurchasesConfigured = Platform.OS === 'ios' && Boolean(apiKey);

let configured = false;

function ensureConfigured(): boolean {
  if (!isPurchasesConfigured) return false;
  if (!configured) {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: apiKey! });
    configured = true;
  }
  return true;
}

function hasPremium(info: CustomerInfo): boolean {
  return info.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
}

interface PurchasesValue {
  /** null = 判定中 */
  isPremium: boolean | null;
  isAvailable: boolean;
  /** ペイウォールを表示する。購入 or 復元でプレミアムになったら true。 */
  showPaywall: () => Promise<boolean>;
  /** 購入を復元する。復元後にプレミアムなら true。 */
  restore: () => Promise<boolean>;
  manageSubscription: () => Promise<void>;
}

const Ctx = createContext<PurchasesValue | undefined>(undefined);

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState<boolean | null>(isPurchasesConfigured ? null : false);

  useEffect(() => {
    if (!ensureConfigured()) return;

    const listener = (info: CustomerInfo) => setIsPremium(hasPremium(info));
    Purchases.addCustomerInfoUpdateListener(listener);
    Purchases.getCustomerInfo()
      .then(listener)
      .catch((e) => {
        console.warn('課金情報の取得に失敗', e);
        setIsPremium(false);
      });
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  async function refresh(): Promise<boolean> {
    const info = await Purchases.getCustomerInfo();
    const premium = hasPremium(info);
    setIsPremium(premium);
    return premium;
  }

  async function showPaywall(): Promise<boolean> {
    if (!ensureConfigured()) return false;
    const result = await RevenueCatUI.presentPaywall();
    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
      return refresh();
    }
    return false;
  }

  async function restore(): Promise<boolean> {
    if (!ensureConfigured()) return false;
    const info = await Purchases.restorePurchases();
    const premium = hasPremium(info);
    setIsPremium(premium);
    return premium;
  }

  async function manageSubscription() {
    if (!ensureConfigured()) return;
    await Purchases.showManageSubscriptions();
  }

  return (
    <Ctx.Provider
      value={{
        isPremium,
        isAvailable: isPurchasesConfigured,
        showPaywall,
        restore,
        manageSubscription,
      }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePurchases(): PurchasesValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePurchases は <PurchasesProvider> の中で使ってください。');
  return ctx;
}
