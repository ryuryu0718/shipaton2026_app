import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  title: string;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}

/** モーダル画面用の簡易ヘッダー（キャンセル / タイトル / 実行）。 */
export function ModalHeader({
  title,
  onCancel,
  onSubmit,
  submitLabel = '保存',
  submitDisabled = false,
}: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.bar, { borderBottomColor: theme.border }]}>
      <Pressable onPress={onCancel} hitSlop={12} style={styles.side}>
        <ThemedText themeColor="textSecondary">キャンセル</ThemedText>
      </Pressable>
      <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
        {title}
      </ThemedText>
      <Pressable
        onPress={onSubmit}
        disabled={submitDisabled}
        hitSlop={12}
        style={[styles.side, styles.right]}>
        <ThemedText
          type="smallBold"
          style={{ color: submitDisabled ? theme.textSecondary : theme.tint }}>
          {submitLabel}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  side: { minWidth: 88, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center', fontSize: 16 },
});
