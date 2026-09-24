/**
 * 日付ユーティリティ。すべて「端末のローカル日付」基準で扱う。
 * entry_date は YYYY-MM-DD 文字列、表示は日本語ロケール。
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → 'YYYY-MM-DD'（ローカル） */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 今日の 'YYYY-MM-DD'（ローカル） */
export function todayISODate(): string {
  return toISODate(new Date());
}

/** 'YYYY-MM-DD' → ローカル Date（正午基準。タイムゾーンずれで前日/翌日になるのを防ぐ） */
export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** 'YYYY-MM-DD' の 'MM-DD' 部分 */
export function monthDay(iso: string): string {
  return iso.slice(5);
}

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];

/** 例: 「2026年9月10日(木)」 */
export function formatLongJa(iso: string): string {
  const d = fromISODate(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS_JA[d.getDay()]})`;
}

/** 例: 「9月10日(木)」 */
export function formatMonthDayJa(iso: string): string {
  const d = fromISODate(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS_JA[d.getDay()]})`;
}

/** 相対表現。「今日」「昨日」「3日前」「先月」など、ゆるめの粒度。 */
export function relativeJa(iso: string, base: Date = new Date()): string {
  const target = fromISODate(iso);
  const baseMid = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12);
  const diffDays = Math.round((baseMid.getTime() - target.getTime()) / 86_400_000);
  if (diffDays === 0) return '今日';
  if (diffDays === 1) return '昨日';
  if (diffDays === -1) return '明日';
  if (diffDays > 1 && diffDays < 7) return `${diffDays}日前`;
  if (diffDays >= 7 && diffDays < 28) return `${Math.floor(diffDays / 7)}週間前`;
  return formatLongJa(iso);
}

/** ISO日時（created_at）を「9:41」のような時刻に */
export function formatTime(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  return `${d.getHours()}:${pad(d.getMinutes())}`;
}

/** entry_date が base より何年前か（同じ月日で、年だけ違うもの）。0 は当年なので対象外。 */
export function yearsAgo(iso: string, base: Date = new Date()): number {
  return base.getFullYear() - fromISODate(iso).getFullYear();
}

/** 'YYYY-MM-DD' に日数を加算（負数で減算）。本の期間範囲の計算に使用。 */
export function addDaysISO(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** 例: 「2026年1月〜2026年9月」（同月なら「2026年9月」1つだけ） */
export function formatRangeJa(startISO: string, endISO: string): string {
  const s = fromISODate(startISO);
  const e = fromISODate(endISO);
  const start = `${s.getFullYear()}年${s.getMonth() + 1}月`;
  const end = `${e.getFullYear()}年${e.getMonth() + 1}月`;
  return start === end ? start : `${start}〜${end}`;
}
