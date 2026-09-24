import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  getEntry,
  listEntries,
  listOnThisDay,
  type Entry,
  type EntryWithRelations,
} from '@/lib/entries';

/** 一覧（新しい順）。画面フォーカス時に再取得。 */
export function useEntryList() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setEntries(await listEntries());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { entries, loading, reload };
}

/** 「N年前の今日」 */
export function useOnThisDay() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setEntries(await listOnThisDay());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { entries, loading };
}

/** 単一エントリー（詳細・編集用） */
export function useEntry(id: string | undefined) {
  const [entry, setEntry] = useState<EntryWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      setEntry(await getEntry(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { entry, loading, reload };
}
