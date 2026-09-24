import * as AppleAuthentication from 'expo-apple-authentication';
import { Sym } from '@/components/ui/symbol';
import { useState } from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';

export default function SignInScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { signInWithApple, continueAsGuest, appleAuthAvailable } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApple() {
    setBusy(true);
    setError(null);
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        setError('サインインに失敗しました。時間をおいて試してください。');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.hero}>
        <Sym name="book.pages" size={56} tintColor={theme.tint} />
        <ThemedText type="subtitle" style={styles.title}>
          今日をひとつ、{'\n'}残しておく。
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.lede}>
          思ったこと、うれしかったこと、なんでもない一日。
          1行の記録が積み重なって、いつか自分だけの1冊になります。
        </ThemedText>
      </View>

      <View style={styles.actions}>
        {Platform.OS === 'ios' && appleAuthAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={
              scheme === 'dark'
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={14}
            style={styles.appleButton}
            onPress={handleApple}
          />
        ) : (
          <Button
            label="Sign in with Apple"
            onPress={handleApple}
            loading={busy}
          />
        )}

        <Button label="まずはこの端末で始める" variant="ghost" onPress={continueAsGuest} />

        {error && (
          <ThemedText type="small" style={{ color: theme.danger, textAlign: 'center' }}>
            {error}
          </ThemedText>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'space-between', paddingVertical: Spacing.six },
  hero: { flex: 1, justifyContent: 'center', gap: Spacing.three },
  title: { textAlign: 'center', lineHeight: 40 },
  lede: { textAlign: 'center', lineHeight: 24 },
  actions: { gap: Spacing.two },
  appleButton: { height: 50, width: '100%' },
});
