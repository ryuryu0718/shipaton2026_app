import { Sym } from '@/components/ui/symbol';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function EmptyState({
  icon = 'book.closed',
  title,
  message,
}: {
  icon?: string;
  title: string;
  message?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <Sym name={icon} size={44} tintColor={theme.textSecondary} />
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText themeColor="textSecondary" style={styles.message}>
          {message}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  title: { fontSize: 20, lineHeight: 28, textAlign: 'center' },
  message: { textAlign: 'center' },
});
