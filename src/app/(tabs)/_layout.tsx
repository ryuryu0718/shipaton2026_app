import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

/**
 * 4タブ構成（企画書 5-5）:
 *  1. 今日        … 日記の記入 / 「N年前の今日」
 *  2. これまで     … カレンダー / タイムラインでの振り返り
 *  3. 本棚        … 生成済みの本（全文版・要約版）
 *  4. 設定        … アカウント / 緊急連絡先 / サブスク管理
 */
export default function TabsLayout() {
  const scheme = useColorScheme();
  const c = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={c.background}
      indicatorColor={c.backgroundSelected}
      labelStyle={{ color: c.textSecondary, selected: { color: c.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>今日</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sun.max.fill" md="today" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="timeline">
        <NativeTabs.Trigger.Label>これまで</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="books">
        <NativeTabs.Trigger.Label>本棚</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="books.vertical.fill" md="menu_book" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>設定</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
