import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Sym } from '@/components/ui/symbol';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMonthDayJa, formatTime, relativeJa } from '@/lib/date';
import type { Entry } from '@/lib/entries';

interface Props {
  entry: Entry;
  /** 日付の代わりに「N年前」を強調したいとき */
  yearsAgoLabel?: string;
  thumbUri?: string | null;
  mediaCount?: number;
  contentCount?: number;
}

function EntryCardBase({ entry, yearsAgoLabel, thumbUri, mediaCount = 0, contentCount = 0 }: Props) {
  const theme = useTheme();
  const preview = entry.body.trim();

  return (
    <Link href={`/entry/${entry.id}`} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}>
        <View style={styles.body}>
          <View style={styles.headerRow}>
            <ThemedText type="smallBold">
              {yearsAgoLabel ?? relativeJa(entry.entry_date)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatMonthDayJa(entry.entry_date)}・{formatTime(entry.created_at)}
            </ThemedText>
          </View>

          {preview ? (
            <ThemedText numberOfLines={3} style={styles.preview}>
              {preview}
            </ThemedText>
          ) : (
            <ThemedText numberOfLines={1} themeColor="textSecondary" style={styles.preview}>
              （本文なし）
            </ThemedText>
          )}

          {(mediaCount > 0 || contentCount > 0) && (
            <View style={styles.metaRow}>
              {mediaCount > 0 && (
                <View style={styles.metaItem}>
                  <Sym name="photo" size={13} tintColor={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {mediaCount}
                  </ThemedText>
                </View>
              )}
              {contentCount > 0 && (
                <View style={styles.metaItem}>
                  <Sym name="music.note.list" size={13} tintColor={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {contentCount}
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </View>

        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.thumb} contentFit="cover" />
        ) : null}
      </Pressable>
    </Link>
  );
}

export const EntryCard = memo(EntryCardBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  body: { flex: 1, gap: Spacing.one },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  preview: { fontSize: 15, lineHeight: 22 },
  metaRow: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.half },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  thumb: { width: 64, height: 64, borderRadius: Radius.md },
});
