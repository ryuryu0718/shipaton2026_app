import { useRouter } from 'expo-router';
import { Sym } from '@/components/ui/symbol';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboarding } from '@/lib/onboarding';

const POINTS: { icon: string; title: string; body: string }[] = [
  {
    icon: 'pencil.line',
    title: '1行でいい',
    body: '「疲れた」だけでも立派な記録。書けない日があっても大丈夫です。',
  },
  {
    icon: 'clock.arrow.circlepath',
    title: 'N年前の今日',
    body: '同じ日付の過去の記録がそっと表示されます。昔の思い出を過去の日付で書き足すこともできます。',
  },
  {
    icon: 'book.closed',
    title: 'いつか1冊の本に',
    body: '積み重なった記録は、まとめて読める本になります。家族に残すこともできます。',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { complete } = useOnboarding();

  async function start(writeFirst: boolean) {
    await complete();
    if (writeFirst) router.replace('/entry/new');
    else router.replace('/');
  }

  return (
    <Screen scroll contentStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">ようこそ、ヒストラリへ</ThemedText>
        <ThemedText themeColor="textSecondary">
          毎日をちょっとずつ残していく日記アプリです。
        </ThemedText>
      </View>

      <View style={styles.points}>
        {POINTS.map((p) => (
          <View key={p.title} style={styles.point}>
            <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
              <Sym name={p.icon} size={22} tintColor={theme.tint} />
            </View>
            <View style={styles.pointText}>
              <ThemedText type="smallBold">{p.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {p.body}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="さっそく1件書いてみる" onPress={() => start(true)} />
        <Button label="あとで書く" variant="ghost" onPress={() => start(false)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.five, paddingVertical: Spacing.six },
  header: { gap: Spacing.two },
  points: { gap: Spacing.four },
  point: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: { flex: 1, gap: Spacing.half, paddingTop: Spacing.half },
  actions: { gap: Spacing.two },
});
