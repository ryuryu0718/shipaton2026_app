import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Sym } from '@/components/ui/symbol';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/lib/onboarding';
import { usePurchases } from '@/lib/purchases';
import { resetDb } from '@/lib/db';

const PRIVACY_URL = 'https://ryuryu0718.github.io/shipaton2026_app/privacy-policy';
const TERMS_URL = 'https://ryuryu0718.github.io/shipaton2026_app/terms';

export default function SettingsScreen() {
  const router = useRouter();
  const { status, email, signOut, isSupabaseConfigured } = useAuth();
  const { reset: resetOnboarding } = useOnboarding();
  const purchases = usePurchases();

  async function openPaywall() {
    try {
      await purchases.showPaywall();
    } catch (e) {
      console.error('ペイウォールの表示に失敗', e);
      Alert.alert('購入画面を開けませんでした', '時間をおいてもう一度お試しください。');
    }
  }

  async function restorePurchases() {
    try {
      const premium = await purchases.restore();
      Alert.alert(
        premium ? '購入を復元しました' : '復元できる購入が見つかりませんでした',
        premium ? 'プレミアムをご利用いただけます。' : undefined,
      );
    } catch (e) {
      console.error('購入の復元に失敗', e);
      Alert.alert('購入を復元できませんでした', '時間をおいてもう一度お試しください。');
    }
  }

  const accountLabel = !isSupabaseConfigured
    ? '日記はこの端末に保存しています'
    : status === 'guest'
      ? 'ゲスト（この端末のみ）'
      : email ?? (status === 'signedIn' ? 'サインイン済み' : '未サインイン');

  return (
    <Screen scroll padBottom={BottomTabInset + Spacing.six}>
      <View style={styles.header}>
        <ThemedText type="subtitle">設定</ThemedText>
      </View>

      <Section title="アカウント">
        <Row icon="person.crop.circle" label={accountLabel} />
        {/* Supabase 未設定（V1）ではアカウント機能を出さない。設定すれば自動で戻る。 */}
        {isSupabaseConfigured && status === 'guest' && (
          <Row
            icon="apple.logo"
            label="Sign in with Apple でバックアップに備える"
            onPress={() => router.replace('/sign-in')}
          />
        )}
        {isSupabaseConfigured && status !== 'signedOut' && (
          <Row
            icon="rectangle.portrait.and.arrow.right"
            label="サインアウト"
            danger
            onPress={() =>
              Alert.alert('サインアウトしますか？', '端末内の日記データはそのまま残ります。', [
                { text: 'キャンセル', style: 'cancel' },
                { text: 'サインアウト', style: 'destructive', onPress: () => signOut() },
              ])
            }
          />
        )}
      </Section>

      <Section title="残したいこと">
        <Row
          icon="phone.arrow.up.right"
          label="緊急連絡先"
          onPress={() => router.push('/emergency-contacts')}
        />
      </Section>

      <Section title="プラン">
        {!purchases.isAvailable ? (
          <Row icon="star" label="無料プラン" />
        ) : purchases.isPremium ? (
          <>
            <Row icon="star.fill" label="プレミアム（ご利用中）" />
            <Row
              icon="creditcard"
              label="サブスクリプションを管理"
              onPress={() => purchases.manageSubscription().catch(() => {})}
            />
          </>
        ) : (
          <>
            <Row icon="star" label="プレミアムにアップグレード" onPress={openPaywall} />
            <Row icon="arrow.clockwise" label="購入を復元" onPress={restorePurchases} />
          </>
        )}
      </Section>

      <Section title="規約">
        <Row
          icon="hand.raised"
          label="プライバシーポリシー"
          onPress={() => Linking.openURL(PRIVACY_URL)}
        />
        <Row icon="doc.text" label="利用規約" onPress={() => Linking.openURL(TERMS_URL)} />
      </Section>

      {__DEV__ && (
        <Section title="開発用">
          <Row
            icon="trash"
            label="ローカルDBをリセット"
            danger
            onPress={() =>
              Alert.alert('DBをリセット', 'すべての日記データを削除します（開発用）。', [
                { text: 'キャンセル', style: 'cancel' },
                {
                  text: '削除',
                  style: 'destructive',
                  onPress: async () => {
                    await resetDb();
                    await resetOnboarding();
                  },
                },
              ])
            }
          />
          <Row
            icon="info.circle"
            label={`Supabase: ${isSupabaseConfigured ? '設定済み' : '未設定（ローカル専用）'}`}
          />
        </Section>
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
        ヒストラリ v{Constants.expoConfig?.version ?? '1.0.0'}
      </ThemedText>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const theme = useTheme();
  const color = danger ? theme.danger : theme.text;
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && onPress ? { opacity: 0.85 } : null,
      ]}>
      <Sym name={icon} size={18} tintColor={danger ? theme.danger : theme.textSecondary} />
      <ThemedText style={[styles.rowLabel, { color }]}>{label}</ThemedText>
      {onPress ? (
        <Sym name="chevron.right" size={13} tintColor={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: Spacing.three },
  section: { marginTop: Spacing.four, gap: Spacing.one },
  sectionTitle: { marginLeft: Spacing.one },
  sectionBody: { gap: Spacing.half },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { flex: 1, fontSize: 15 },
  version: { textAlign: 'center', marginTop: Spacing.six },
});
