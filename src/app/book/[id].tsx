import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Sym } from '@/components/ui/symbol';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getBook, type Book } from '@/lib/books';
import { formatLongJa } from '@/lib/date';

export default function BookViewerScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBook(id).then((b) => {
      setBook(b);
      setLoading(false);
    });
  }, [id]);

  async function share() {
    if (!book?.pdf_uri) return;
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(book.pdf_uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    }
  }

  async function print() {
    if (!book?.pdf_uri) return;
    // AirPrint / 「ファイルに保存」経由で、しまうまプリント等の外部印刷サービスへ橋渡しできる。
    await Print.printAsync({ uri: book.pdf_uri });
  }

  if (!loading && !book) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <EmptyState icon="book.closed" title="本が見つかりません" />
      </>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: book?.title ?? '',
          headerRight: () =>
            book?.pdf_uri ? (
              <View style={styles.headerActions}>
                {Platform.OS === 'ios' && (
                  <Pressable onPress={print} hitSlop={10}>
                    <Sym name="printer" size={19} tintColor={theme.tint} />
                  </Pressable>
                )}
                <Pressable onPress={share} hitSlop={10}>
                  <Sym name="square.and.arrow.up" size={20} tintColor={theme.tint} />
                </Pressable>
              </View>
            ) : null,
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.tint} />
        </View>
      ) : book?.pdf_uri ? (
        <WebView
          source={{ uri: book.pdf_uri }}
          style={styles.flex}
          originWhitelist={['*']}
        />
      ) : (
        <View style={styles.center}>
          <ThemedText themeColor="textSecondary">PDF が見つかりません</ThemedText>
        </View>
      )}

      {book && (
        <View style={[styles.footer, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary">
            {book.kind === 'summary' ? '要約版' : '全文版'}・{book.page_count}ページ・
            {book.entry_count}件の記録・{formatLongJa(book.created_at.slice(0, 10))}生成
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: Spacing.four, alignItems: 'center' },
  footer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
});
