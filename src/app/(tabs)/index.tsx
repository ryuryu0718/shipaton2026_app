import { Link, useRouter } from 'expo-router';
import { Sym } from '@/components/ui/symbol';
import { StyleSheet, View } from 'react-native';

import { EntryCard } from '@/components/entry-card';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useEntryList, useOnThisDay } from '@/hooks/use-entries';
import { formatLongJa, todayISODate, yearsAgo } from '@/lib/date';

export default function TodayScreen() {
  const theme = useTheme();
  const router = useRouter();
  const today = todayISODate();

  const { entries, loading } = useEntryList();
  const { entries: onThisDay } = useOnThisDay();

  const wroteToday = entries.some((e) => e.entry_date === today);
  const recent = entries.slice(0, 3);

  return (
    <Screen scroll padBottom={BottomTabInset + Spacing.four}>
      <View style={styles.header}>
        <ThemedText type="small" themeColor="textSecondary">
          {formatLongJa(today)}
        </ThemedText>
        <ThemedText type="subtitle">今日</ThemedText>
      </View>

      <Card style={styles.writeCard}>
        <ThemedText type="smallBold">
          {wroteToday ? 'きょうの分は記録済みです' : '今日はどんな一日でしたか？'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.writeHint}>
          1行でも、写真だけでも大丈夫。書けない日があっても問題ありません。
        </ThemedText>
        <Button
          label={wroteToday ? 'もう一度書く' : '今日のことを書く'}
          onPress={() => router.push('/entry/new')}
        />
        <Link href={{ pathname: '/entry/new', params: { pickDate: '1' } }} asChild>
          <ThemedText type="small" themeColor="textSecondary" style={styles.backdateLink}>
            過去の日付でさかのぼって書く →
          </ThemedText>
        </Link>
      </Card>

      {onThisDay.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sym name="clock.arrow.circlepath" size={16} tintColor={theme.textSecondary} />
            <ThemedText type="smallBold">N年前の今日</ThemedText>
          </View>
          <View style={styles.list}>
            {onThisDay.map((e) => (
              <EntryCard key={e.id} entry={e} yearsAgoLabel={`${yearsAgo(e.entry_date)}年前`} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="smallBold">最近の記録</ThemedText>
          {entries.length > recent.length && (
            <Link href="/timeline" asChild>
              <ThemedText type="small" themeColor="tint">
                すべて見る
              </ThemedText>
            </Link>
          )}
        </View>

        {!loading && entries.length === 0 ? (
          <Card>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              まだ記録がありません。{'\n'}
              今日のことはもちろん、覚えている昔の思い出を過去の日付で書き足すこともできます。
            </ThemedText>
          </Card>
        ) : (
          <View style={styles.list}>
            {recent.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Spacing.three, paddingBottom: Spacing.three, gap: Spacing.half },
  writeCard: { gap: Spacing.two },
  writeHint: { marginBottom: Spacing.one },
  backdateLink: { textAlign: 'center', marginTop: Spacing.two },
  section: { marginTop: Spacing.five, gap: Spacing.two },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  list: { gap: Spacing.two },
  emptyText: { lineHeight: 22 },
});
