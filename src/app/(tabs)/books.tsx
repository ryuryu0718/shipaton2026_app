import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Sym } from '@/components/ui/symbol';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatLongJa } from '@/lib/date';
import {
  BOOK_SUGGESTION_PAGES,
  estimatePages,
  getNextFullBookRange,
  listBooks,
  type Book,
  type NextFullBookRange,
} from '@/lib/books';

export default function BooksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [nextRange, setNextRange] = useState<NextFullBookRange | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [b, range] = await Promise.all([listBooks(), getNextFullBookRange()]);
        setBooks(b);
        setNextRange(range);
        setLoading(false);
      })();
    }, []),
  );

  const entryCount = nextRange?.entryCount ?? 0;
  const pages = estimatePages(entryCount);
  const progress = Math.min(1, pages / BOOK_SUGGESTION_PAGES);
  const ready = pages >= BOOK_SUGGESTION_PAGES;

  return (
    <Screen scroll padBottom={BottomTabInset + Spacing.six}>
      <View style={styles.header}>
        <ThemedText type="subtitle">本棚</ThemedText>
      </View>

      <Card style={styles.progressCard}>
        <ThemedText type="smallBold">
          {books.some((b) => b.kind === 'full') ? '次の1冊まで' : '最初の1冊まで'}
        </ThemedText>
        {entryCount > 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            まだ本になっていない記録はおよそ {pages} ページ分。{BOOK_SUGGESTION_PAGES}
            ページ相当たまると、1冊にまとめる目安です（それより少なくても作れます）。
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            記録がたまるとここに進捗が表示されます。
          </ThemedText>
        )}
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
          <View
            style={[styles.fill, { backgroundColor: theme.tint, width: `${progress * 100}%` }]}
          />
        </View>
        <Pressable
          disabled={entryCount === 0}
          onPress={() => router.push('/book/new')}
          style={({ pressed }) => [
            styles.generateRow,
            { opacity: entryCount === 0 ? 0.4 : pressed ? 0.6 : 1 },
          ]}>
          <Sym name="sparkles" size={15} tintColor={theme.tint} />
          <ThemedText type="small" themeColor="tint">
            {ready ? '本を作る' : '本を作る（早めに作ることもできます）'}
          </ThemedText>
        </Pressable>
      </Card>

      <ThemedText type="smallBold" style={styles.listHeader}>
        できあがった本
      </ThemedText>

      {!loading && books.length === 0 ? (
        <EmptyState
          icon="books.vertical"
          title="まだ本はありません"
          message="記録がたまると、ここに全文版と要約版が並びます。"
        />
      ) : (
        <View style={styles.list}>
          {books.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => router.push(`/book/${b.id}`)}
              style={({ pressed }) => [
                styles.bookRow,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                pressed && { opacity: 0.9 },
              ]}>
              <Sym
                name={b.kind === 'summary' ? 'doc.text' : 'book.closed'}
                size={26}
                tintColor={theme.tint}
              />
              <View style={styles.bookMeta}>
                <ThemedText type="smallBold">{b.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {b.kind === 'summary' ? '要約版' : '全文版'}・{b.page_count}ページ・
                  {formatLongJa(b.created_at.slice(0, 10))}
                </ThemedText>
              </View>
              <Sym name="chevron.right" size={14} tintColor={theme.textSecondary} />
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: Spacing.three },
  progressCard: { gap: Spacing.two },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: Spacing.one },
  fill: { height: '100%', borderRadius: 4 },
  generateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  listHeader: { marginTop: Spacing.five, marginBottom: Spacing.two },
  list: { gap: Spacing.two },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  bookMeta: { flex: 1, gap: 2 },
});
