import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Sym } from '@/components/ui/symbol';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Radius, Spacing } from '@/constants/theme';
import { useEntry } from '@/hooks/use-entries';
import { useTheme } from '@/hooks/use-theme';
import { formatLongJa, formatTime } from '@/lib/date';
import { CONTENT_CATEGORIES, deleteEntry } from '@/lib/entries';
import { deleteMediaFile } from '@/lib/media';

export default function EntryDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entry, loading } = useEntry(id);

  function confirmDelete() {
    Alert.alert('この記録を削除しますか？', '元に戻せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          if (!entry) return;
          entry.media.forEach((m) => deleteMediaFile(m.local_uri));
          await deleteEntry(entry.id);
          router.back();
        },
      },
    ]);
  }

  if (!loading && !entry) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <EmptyState icon="doc" title="記録が見つかりません" />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable onPress={() => router.push({ pathname: '/entry/new', params: { id } })} hitSlop={10}>
                <Sym name="square.and.pencil" size={20} tintColor={theme.tint} />
              </Pressable>
              <Pressable onPress={confirmDelete} hitSlop={10}>
                <Sym name="trash" size={19} tintColor={theme.danger} />
              </Pressable>
            </View>
          ),
        }}
      />
      {entry && (
        <ScrollView
          style={{ backgroundColor: theme.background }}
          contentContainerStyle={styles.content}>
          <ThemedText type="subtitle" style={styles.date}>
            {formatLongJa(entry.entry_date)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatTime(entry.created_at)} に記録
          </ThemedText>

          {entry.body.trim() ? (
            <ThemedText style={styles.body}>{entry.body}</ThemedText>
          ) : null}

          {entry.media.length > 0 && (
            <View style={styles.photos}>
              {entry.media.map((m) => (
                <Image
                  key={m.id}
                  source={{ uri: m.remote_url ?? m.local_uri }}
                  style={styles.photo}
                  contentFit="cover"
                />
              ))}
            </View>
          )}

          {entry.content.length > 0 && (
            <View style={styles.contentBlock}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                この日楽しんだもの
              </ThemedText>
              {entry.content.map((c) => {
                const cat = CONTENT_CATEGORIES.find((x) => x.key === c.category);
                return (
                  <View key={c.id} style={styles.contentRow}>
                    <Sym name={cat?.sf ?? 'tag'} size={14} tintColor={theme.textSecondary} />
                    <ThemedText style={styles.flex}>{c.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {cat?.label}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', gap: Spacing.four, alignItems: 'center' },
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: Spacing.six },
  date: { marginBottom: 0 },
  body: { fontSize: 17, lineHeight: 28, marginTop: Spacing.two },
  photos: { gap: Spacing.two, marginTop: Spacing.three },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.md },
  contentBlock: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
  contentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
});
