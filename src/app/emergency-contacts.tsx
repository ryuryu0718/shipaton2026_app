import { useFocusEffect } from 'expo-router';
import { Sym } from '@/components/ui/symbol';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  CONTACT_METHODS,
  createContact,
  deleteContact,
  listContacts,
  updateContact,
  type ContactMethod,
  type EmergencyContact,
} from '@/lib/contacts';

type Editing = {
  id?: string;
  name: string;
  relationship: string;
  method: ContactMethod | null;
  contactValue: string;
  message: string;
};

const EMPTY: Editing = {
  name: '',
  relationship: '',
  method: 'phone',
  contactValue: '',
  message: '',
};

export default function EmergencyContactsScreen() {
  const theme = useTheme();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [editing, setEditing] = useState<Editing | null>(null);

  const reload = useCallback(() => {
    listContacts().then(setContacts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function save() {
    if (!editing || !editing.name.trim()) return;
    const draft = {
      name: editing.name,
      relationship: editing.relationship,
      method: editing.method,
      contactValue: editing.contactValue,
      message: editing.message,
    };
    if (editing.id) await updateContact(editing.id, draft);
    else await createContact(draft);
    setEditing(null);
    reload();
  }

  function remove(id: string) {
    Alert.alert('削除しますか？', undefined, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await deleteContact(id);
          reload();
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <ThemedText type="small" themeColor="textSecondary">
        もしものときに連絡してほしい相手を登録しておけます。名前と、ひとことだけでも大丈夫です。
      </ThemedText>

      {contacts.map((c) => (
        <Card key={c.id} style={styles.card}>
          <View style={styles.cardHead}>
            <ThemedText type="smallBold">{c.name}</ThemedText>
            <View style={styles.cardActions}>
              <Pressable
                hitSlop={8}
                onPress={() =>
                  setEditing({
                    id: c.id,
                    name: c.name,
                    relationship: c.relationship ?? '',
                    method: (c.method as ContactMethod) ?? 'phone',
                    contactValue: c.contact_value ?? '',
                    message: c.message ?? '',
                  })
                }>
                <Sym name="square.and.pencil" size={17} tintColor={theme.tint} />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => remove(c.id)}>
                <Sym name="trash" size={16} tintColor={theme.danger} />
              </Pressable>
            </View>
          </View>
          {c.relationship ? (
            <ThemedText type="small" themeColor="textSecondary">
              {c.relationship}
            </ThemedText>
          ) : null}
          {c.contact_value ? (
            <ThemedText type="small" themeColor="textSecondary">
              {CONTACT_METHODS.find((m) => m.key === c.method)?.label}: {c.contact_value}
            </ThemedText>
          ) : null}
          {c.message ? <ThemedText style={styles.msg}>「{c.message}」</ThemedText> : null}
        </Card>
      ))}

      {editing ? (
        <Card style={styles.form}>
          <ThemedText type="smallBold">
            {editing.id ? '連絡先を編集' : '連絡先を追加'}
          </ThemedText>
          <Input
            placeholder="名前 *"
            value={editing.name}
            onChangeText={(t) => setEditing({ ...editing, name: t })}
          />
          <Input
            placeholder="関係性（例: 長女、親友）"
            value={editing.relationship}
            onChangeText={(t) => setEditing({ ...editing, relationship: t })}
          />
          <View style={styles.methodRow}>
            {CONTACT_METHODS.map((m) => {
              const active = m.key === editing.method;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setEditing({ ...editing, method: m.key })}
                  style={[
                    styles.methodChip,
                    {
                      backgroundColor: active ? theme.tint : theme.background,
                      borderColor: active ? theme.tint : theme.border,
                    },
                  ]}>
                  <ThemedText type="small" style={{ color: active ? theme.tintText : theme.text }}>
                    {m.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <Input
            placeholder="連絡先（電話番号・メールなど）"
            value={editing.contactValue}
            onChangeText={(t) => setEditing({ ...editing, contactValue: t })}
          />
          <Input
            placeholder="伝えたいメッセージ（任意）"
            value={editing.message}
            multiline
            onChangeText={(t) => setEditing({ ...editing, message: t })}
          />
          <View style={styles.formActions}>
            <Button label="キャンセル" variant="ghost" onPress={() => setEditing(null)} />
            <Button label="保存" onPress={save} disabled={!editing.name.trim()} />
          </View>
        </Card>
      ) : (
        <Button label="連絡先を追加" variant="secondary" onPress={() => setEditing({ ...EMPTY })} />
      )}
    </ScrollView>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      {...props}
      style={[
        styles.input,
        { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
        props.multiline && { minHeight: 64, textAlignVertical: 'top' },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  card: { gap: Spacing.one },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardActions: { flexDirection: 'row', gap: Spacing.three },
  msg: { marginTop: Spacing.one, fontSize: 15, lineHeight: 22 },
  form: { gap: Spacing.two },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  methodRow: { flexDirection: 'row', gap: Spacing.one, flexWrap: 'wrap' },
  methodChip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
});
