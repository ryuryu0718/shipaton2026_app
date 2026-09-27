import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Sym } from '@/components/ui/symbol';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  FREE_SUMMARY_EXPORTS_PER_MONTH,
  createBook,
  estimatePages,
  getNextFullBookRange,
  getSummaryExportCountThisMonth,
  listBooks,
  recordSummaryExport,
  type NextFullBookRange,
} from '@/lib/books';
import { formatRangeJa } from '@/lib/date';
import { getEntryDateBounds, listEntriesWithRelationsInRange } from '@/lib/entries';
import { usePurchases } from '@/lib/purchases';
import { buildBookHtml, renderBookPdf } from '@/lib/pdf';
import { selectHighlights } from '@/lib/summary';

type Kind = 'full' | 'summary';

export default function NewBookScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isPremium, isAvailable: purchasesAvailable, showPaywall } = usePurchases();

  const [kind, setKind] = useState<Kind>('full');
  const [fullRange, setFullRange] = useState<NextFullBookRange | null>(null);
  const [allBounds, setAllBounds] = useState<{ min: string; max: string } | null>(null);
  const [volumeNumber, setVolumeNumber] = useState(1);
  const [summaryUsed, setSummaryUsed] = useState(0);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [range, bounds, books, used] = await Promise.all([
          getNextFullBookRange(),
          getEntryDateBounds(),
          listBooks(),
          getSummaryExportCountThisMonth(),
        ]);
        setFullRange(range);
        setAllBounds(bounds);
        setVolumeNumber(books.filter((b) => b.kind === 'full').length + 1);
        setSummaryUsed(used);
        setLoadingInfo(false);
      })();
    }, []),
  );

  const fullEntryCount = fullRange?.entryCount ?? 0;
  const summaryRemaining = Math.max(0, FREE_SUMMARY_EXPORTS_PER_MONTH - summaryUsed);

  const canGenerateFull = fullEntryCount > 0;
  // プレミアムは要約版を無制限に作れる（企画書 6章）
  const summaryLocked = !isPremium && summaryRemaining <= 0;
  const canGenerateSummary = Boolean(allBounds) && !summaryLocked;
  const canGenerate = kind === 'full' ? canGenerateFull : canGenerateSummary;
  const offerUpgrade =
    kind === 'summary' && Boolean(allBounds) && summaryLocked && purchasesAvailable;

  async function upgrade() {
    try {
      await showPaywall();
    } catch (e) {
      console.error('ペイウォールの表示に失敗', e);
      setError('購入画面を開けませんでした。時間をおいてもう一度お試しください。');
    }
  }

  async function generate() {
    if (generating || !canGenerate) return;
    setGenerating(true);
    setError(null);
    try {
      if (kind === 'full' && fullRange) {
        const entries = await listEntriesWithRelationsInRange(fullRange.start, fullRange.end);
        const rangeLabel = formatRangeJa(fullRange.start, fullRange.end);
        const title = `ヒストラリ 第${volumeNumber}巻（${rangeLabel}）`;
        const html = await buildBookHtml(entries, { title, rangeLabel });
        const { uri, pageCount } = await renderBookPdf(html);
        const id = await createBook({
          kind: 'full',
          title,
          rangeStart: fullRange.start,
          rangeEnd: fullRange.end,
          pdfUri: uri,
          pageCount,
          entryCount: entries.length,
        });
        router.replace(`/book/${id}`);
      } else if (kind === 'summary' && allBounds) {
        const all = await listEntriesWithRelationsInRange(allBounds.min, allBounds.max);
        const highlights = selectHighlights(all);
        const rangeLabel = formatRangeJa(allBounds.min, allBounds.max);
        const title = `ヒストラリ 要約版（${rangeLabel}）`;
        const html = await buildBookHtml(highlights, { title, rangeLabel });
        const { uri, pageCount } = await renderBookPdf(html);
        const id = await createBook({
          kind: 'summary',
          title,
          rangeStart: allBounds.min,
          rangeEnd: allBounds.max,
          pdfUri: uri,
          pageCount,
          entryCount: highlights.length,
        });
        await recordSummaryExport();
        router.replace(`/book/${id}`);
      }
    } catch (e) {
      console.error('本の生成に失敗', e);
      setError('本の生成に失敗しました。もう一度お試しください。');
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <Screen contentStyle={styles.generatingWrap}>
        <Stack.Screen options={{ title: '本を作る', headerBackVisible: false, gestureEnabled: false }} />
        <ActivityIndicator size="large" color={theme.tint} />
        <ThemedText themeColor="textSecondary" style={{ marginTop: Spacing.three }}>
          生成しています…（写真が多いと少し時間がかかります）
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={{ gap: Spacing.three, paddingTop: Spacing.three }}>
      <Stack.Screen options={{ title: '本を作る' }} />

      <KindOption
        selected={kind === 'full'}
        onPress={() => setKind('full')}
        icon="book.closed"
        title={`全文版・第${volumeNumber}巻`}
        description={
          loadingInfo
            ? '読み込み中…'
            : fullRange
              ? `${formatRangeJa(fullRange.start, fullRange.end)}・${fullEntryCount}件の記録（およそ${estimatePages(fullEntryCount)}ページ）`
              : 'まだ記録がありません'
        }
        disabled={!loadingInfo && !canGenerateFull}
      />

      <KindOption
        selected={kind === 'summary'}
        onPress={() => setKind('summary')}
        icon="sparkles"
        title="要約版"
        description={
          loadingInfo
            ? '読み込み中…'
            : !allBounds
              ? 'まだ記録がありません'
              : isPremium
                ? 'ハイライトだけを抜き出した短い本（プレミアム：何度でも作成できます）'
                : summaryRemaining > 0
                  ? `ハイライトだけを抜き出した短い本（今月あと${summaryRemaining}回作成できます）`
                  : purchasesAvailable
                    ? '今月の無料分を使い切りました。プレミアムなら何度でも作成できます。'
                    : '今月の出力回数を使い切りました。来月また作成できます。'
        }
        disabled={!loadingInfo && !allBounds}
      />

      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        {kind === 'full'
          ? '記録をそのまま収めた本です。ページをめくって読めるほか、PDFとして書き出して印刷サービスに持ち込むこともできます。'
          : '本文の長さ・写真・タグの多さから、月ごとに印象的な記録を選んで1冊にまとめます。'}
      </ThemedText>

      {error && (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      )}

      {offerUpgrade ? (
        <Button label="プレミアムで要約版を作り放題にする" onPress={upgrade} />
      ) : (
        <Button
          label={kind === 'full' ? 'この内容で全文版を作る' : 'この内容で要約版を作る'}
          onPress={generate}
          disabled={loadingInfo || !canGenerate}
        />
      )}
    </Screen>
  );
}

function KindOption({
  selected,
  onPress,
  icon,
  title,
  description,
  disabled,
}: {
  selected: boolean;
  onPress: () => void;
  icon: string;
  title: string;
  description: string;
  disabled: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Card
        style={{
          ...styles.option,
          borderColor: selected ? theme.tint : theme.border,
          opacity: disabled ? 0.5 : 1,
        }}>
        <View style={[styles.optionIcon, { backgroundColor: theme.backgroundSelected }]}>
          <Sym name={icon} size={20} tintColor={theme.tint} />
        </View>
        <View style={styles.optionText}>
          <ThemedText type="smallBold">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        </View>
        {selected && <Sym name="checkmark.circle.fill" size={20} tintColor={theme.tint} />}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1.5,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, gap: 2 },
  note: { lineHeight: 20 },
  generatingWrap: { alignItems: 'center', justifyContent: 'center' },
});
