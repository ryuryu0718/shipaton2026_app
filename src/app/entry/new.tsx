import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sym } from '@/components/ui/symbol';

import { ThemedText } from '@/components/themed-text';
import { ModalHeader } from '@/components/ui/modal-header';
import { Radius, Spacing } from '@/constants/theme';
import { useEntry } from '@/hooks/use-entries';
import { useTheme } from '@/hooks/use-theme';
import { formatLongJa, fromISODate, toISODate, todayISODate } from '@/lib/date';
import {
  CONTENT_CATEGORIES,
  createEntry,
  updateEntry,
  type ContentCategory,
} from '@/lib/entries';
import { pickImages, type PickedImage } from '@/lib/media';

type DraftMedia = PickedImage & { remoteUrl?: string | null };
type DraftContent = { category: ContentCategory; title: string; note?: string | null };

interface FormInitial {
  entryDate: string;
  body: string;
  media: DraftMedia[];
  content: DraftContent[];
}

export default function EntryEditorScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; pickDate?: string }>();
  const isEdit = Boolean(params.id);
  const { entry, loading } = useEntry(params.id);

  // 編集時はデータ取得を待ってから、キー付きでフォームを初期化する
  // （effect で setState して流し込むのを避ける）。
  if (isEdit && (loading || !entry)) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ModalHeader
          title="記録を編集"
          onCancel={() => router.back()}
          onSubmit={() => {}}
          submitDisabled
        />
        <ActivityIndicator style={{ marginTop: Spacing.six }} color={theme.tint} />
      </SafeAreaView>
    );
  }

  const initial: FormInitial = entry
    ? {
        entryDate: entry.entry_date,
        body: entry.body,
        media: entry.media.map((m) => ({
          localUri: m.local_uri,
          remoteUrl: m.remote_url,
          width: m.width ?? 0,
          height: m.height ?? 0,
        })),
        content: entry.content.map((c) => ({
          category: c.category,
          title: c.title,
          note: c.note,
        })),
      }
    : { entryDate: todayISODate(), body: '', media: [], content: [] };

  return (
    <EntryForm
      key={entry?.id ?? 'new'}
      entryId={params.id}
      isEdit={isEdit}
      openPickerInitially={params.pickDate === '1'}
      initial={initial}
    />
  );
}

function EntryForm({
  entryId,
  isEdit,
  openPickerInitially,
  initial,
}: {
  entryId?: string;
  isEdit: boolean;
  openPickerInitially: boolean;
  initial: FormInitial;
}) {
  const theme = useTheme();
  const router = useRouter();

  const [entryDate, setEntryDate] = useState(initial.entryDate);
  const [body, setBody] = useState(initial.body);
  const [media, setMedia] = useState<DraftMedia[]>(initial.media);
  const [content, setContent] = useState<DraftContent[]>(initial.content);
  const [showPicker, setShowPicker] = useState(openPickerInitially);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(
    () => body.trim().length > 0 || media.length > 0 || content.length > 0,
    [body, media, content],
  );

  async function addPhotos() {
    const picked = await pickImages(6 - media.length);
    if (picked.length) setMedia((prev) => [...prev, ...picked]);
  }

  async function save() {
    if (!canSave || saving) return;
    setSaving(true);
    const draft = {
      entryDate,
      body: body.trim(),
      media: media.map((m) => ({
        localUri: m.localUri,
        remoteUrl: m.remoteUrl ?? null,
        width: m.width,
        height: m.height,
      })),
      content,
    };
    try {
      if (isEdit && entryId) {
        await updateEntry(entryId, draft);
      } else {
        await createEntry(draft);
      }
      router.back();
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ModalHeader
        title={isEdit ? '記録を編集' : '記録する'}
        onCancel={() => router.back()}
        onSubmit={save}
        submitDisabled={!canSave || saving}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          {/* 日付 */}
          <Pressable
            onPress={() => setShowPicker((v) => !v)}
            style={[styles.dateRow, { borderColor: theme.border }]}>
            <Sym name="calendar" size={16} tintColor={theme.textSecondary} />
            <ThemedText style={styles.dateText}>{formatLongJa(entryDate)}</ThemedText>
            <ThemedText type="small" themeColor="tint">
              {entryDate === todayISODate() ? '今日' : '変更'}
            </ThemedText>
          </Pressable>

          {showPicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={fromISODate(entryDate)}
                mode="date"
                maximumDate={new Date()}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_e, date) => {
                  if (Platform.OS !== 'ios') setShowPicker(false);
                  if (date) setEntryDate(toISODate(date));
                }}
              />
              {Platform.OS === 'ios' && (
                <Pressable onPress={() => setShowPicker(false)} style={styles.pickerDone}>
                  <ThemedText type="smallBold" themeColor="tint">
                    完了
                  </ThemedText>
                </Pressable>
              )}
            </View>
          )}

          {/* 本文 */}
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="今日はどんな一日でしたか？ 1行でも大丈夫です。"
            placeholderTextColor={theme.textSecondary}
            multiline
            autoFocus={!isEdit}
            style={[styles.body, { color: theme.text }]}
            textAlignVertical="top"
          />

          {/* 写真 */}
          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              写真
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
              {media.map((m, i) => (
                <View key={m.localUri} style={styles.thumbBox}>
                  <Image source={{ uri: m.localUri }} style={styles.thumb} contentFit="cover" />
                  <Pressable
                    onPress={() => setMedia((prev) => prev.filter((_, idx) => idx !== i))}
                    style={styles.thumbRemove}>
                    <Sym name="xmark.circle.fill" size={20} tintColor="#fff" />
                  </Pressable>
                </View>
              ))}
              {media.length < 6 && (
                <Pressable
                  onPress={addPhotos}
                  style={[styles.addThumb, { borderColor: theme.border }]}>
                  <Sym name="photo.badge.plus" size={22} tintColor={theme.textSecondary} />
                </Pressable>
              )}
            </ScrollView>
          </View>

          {/* 今日楽しんだコンテンツ */}
          <ContentAdder value={content} onChange={setContent} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ContentAdder({
  value,
  onChange,
}: {
  value: DraftContent[];
  onChange: (v: DraftContent[]) => void;
}) {
  const theme = useTheme();
  const [category, setCategory] = useState<ContentCategory>('music');
  const [title, setTitle] = useState('');

  function add() {
    const t = title.trim();
    if (!t) return;
    onChange([...value, { category, title: t }]);
    setTitle('');
  }

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        今日楽しんだもの（音楽・映画・お笑い・本など）
      </ThemedText>

      <View style={styles.chipRow}>
        {CONTENT_CATEGORIES.map((c) => {
          const active = c.key === category;
          return (
            <Pressable
              key={c.key}
              onPress={() => setCategory(c.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.tint : theme.backgroundElement,
                  borderColor: active ? theme.tint : theme.border,
                },
              ]}>
              <ThemedText type="small" style={{ color: active ? theme.tintText : theme.text }}>
                {c.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.addInputRow}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="作品名など"
          placeholderTextColor={theme.textSecondary}
          onSubmitEditing={add}
          returnKeyType="done"
          style={[styles.addInput, { color: theme.text, borderColor: theme.border }]}
        />
        <Pressable onPress={add} style={[styles.addBtn, { backgroundColor: theme.backgroundElement }]}>
          <Sym name="plus" size={16} tintColor={theme.tint} />
        </Pressable>
      </View>

      {value.length > 0 && (
        <View style={styles.tagList}>
          {value.map((item, i) => {
            const cat = CONTENT_CATEGORIES.find((c) => c.key === item.category);
            return (
              <View
                key={`${item.title}-${i}`}
                style={[styles.tag, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Sym name={cat?.sf ?? 'tag'} size={12} tintColor={theme.textSecondary} />
                <ThemedText type="small">{item.title}</ThemedText>
                <Pressable onPress={() => onChange(value.filter((_, idx) => idx !== i))} hitSlop={8}>
                  <Sym name="xmark" size={11} tintColor={theme.textSecondary} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dateText: { flex: 1, fontSize: 15 },
  pickerWrap: { alignItems: 'center' },
  pickerDone: { alignSelf: 'flex-end', padding: Spacing.two },
  body: { minHeight: 160, fontSize: 17, lineHeight: 26 },
  section: { gap: Spacing.two },
  thumbRow: { flexDirection: 'row' },
  thumbBox: { marginRight: Spacing.two },
  thumb: { width: 84, height: 84, borderRadius: Radius.md },
  thumbRemove: { position: 'absolute', top: -6, right: 0 },
  addThumb: {
    width: 84,
    height: 84,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addInputRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  addInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  addBtn: { padding: Spacing.two, borderRadius: Radius.sm },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
