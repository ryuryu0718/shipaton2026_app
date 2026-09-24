/**
 * アプリ全体のカラートークン。ライト/ダーク両対応。
 * デザイン方針（企画書 5-4）: 「重い・暗い」を避け、前向き・あたたかみのあるトーン。
 * ベースは紙のようなウォームオフホワイト、アクセントは落ち着いたテラコッタ。
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#2A2622',
    textSecondary: '#6B6157',
    background: '#F6F1E7',
    backgroundElement: '#FFFBF3',
    backgroundSelected: '#EFE6D4',
    border: '#E4D9C5',
    tint: '#B5623C',
    tintText: '#FFFFFF',
    danger: '#B23B3B',
  },
  dark: {
    text: '#F3EEE4',
    textSecondary: '#B0A797',
    background: '#1B1815',
    backgroundElement: '#262220',
    backgroundSelected: '#332E2A',
    border: '#3A342E',
    tint: '#D9825C',
    tintText: '#1B1815',
    danger: '#E06B6B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 22,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
