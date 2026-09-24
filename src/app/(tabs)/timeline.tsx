import { useRouter } from 'expo-router';
import { Sym } from '@/components/ui/symbol';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { EntryCard } from '@/components/entry-card';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useEntryList } from '@/hooks/use-entries';
import { useTheme } from '@/hooks/use-theme';
import { fromISODate } from '@/lib/date';
import type { Entry } from '@/lib/entries';

type Row = { type: 'month'; key: string; label: string } | { type: 'entry'; key: string; entry: Entry };

export default function TimelineScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { entries, loading } = useEntryList();

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let lastMonth = '';
    for (const e of entries) {
      const month = e.entry_date.slice(0, 7); // YYYY-MM
      if (month !== lastMonth) {
        const d = fromISODate(e.entry_date);
        out.push({
          type: 'month',
          key: `m-${month}`,
          label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
        });
        lastMonth = month;
      }
      out.push({ type: 'entry', key: e.id, entry: e });
    }
    return out;
  }, [entries]);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <ThemedText type="subtitle">これまでの記録</ThemedText>
        {entries.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            {entries.length}件
          </ThemedText>
        )}
      </View>

      {!loading && entries.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="まだ記録がありません"
          message="「今日」タブから最初の1件を書いてみましょう。"
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.six, gap: Spacing.two }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) =>
            item.type === 'month' ? (
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.monthLabel}>
                {item.label}
              </ThemedText>
            ) : (
              <EntryCard entry={item.entry} />
            )
          }
        />
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="新しい記録を書く"
        onPress={() => router.push('/entry/new')}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
        ]}>
        <Sym name="square.and.pencil" size={22} tintColor={theme.tintText} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  monthLabel: { marginTop: Spacing.three, marginBottom: Spacing.one },
  fab: {
    position: 'absolute',
    right: Spacing.one,
    bottom: BottomTabInset + Spacing.three,
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
