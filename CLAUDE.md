@AGENTS.md

# ヒストラリ（Historary）— 開発ガイド

Shipaton 2026 提出アプリ。企画の全体像は `docs/shipaton_2026_project_plan.md`（最重要）。
締切: 2026-09-30 23:45 PT（日本時間 10/1 15:45）。開発者はプログラミングほぼ未経験。

## コンセプト（1行）
今日あったこと・思ったことを気軽に日記形式で記録すると、蓄積されていつか家族に残せる
「自分史・エンディングノート」になるアプリ。「終活」は前面に出さない。

## アーキテクチャの決定

- **Expo SDK 57 / React Native 0.86 / expo-router**。`create-expo-app` 既定テンプレート由来。
  ナビゲーションは `expo-router/unstable-native-tabs` の `NativeTabs`（`src/app/(tabs)/_layout.tsx`）を
  ルート Stack（`src/app/_layout.tsx`）が包む構成。詳細画面・モーダルはルート Stack に積む。
- **ローカルファースト**。日記データの正本は端末内 SQLite（`src/lib/db.ts`、`expo-sqlite`）。
  ネットワーク無しで記録・振り返り・本の生成ができる。マイグレーションは `PRAGMA user_version`。
- **Supabase は補助**（`src/lib/supabase.ts`）。認証（Sign in with Apple）、写真ストレージ、
  将来のバックアップ同期のみ。`.env` 未設定でもアプリはローカル専用モードで完全に動く。
- **認証**（`src/lib/auth.tsx`）: V1 は Sign in with Apple のみ。Supabase 未設定や
  Apple 認証不可の環境（Expo Go / シミュレータ）では「ゲストモード」で端末内に閉じて利用可。
  **V1 の提出は Sign in with Apple を隠してローカル専用**（2026-09-28 決定）。Supabase 未設定時は
  サインイン画面を出さずゲストで開始し、設定画面のアカウント操作も非表示。コードは残してあり、
  `.env` に Supabase を設定すれば自動で復活する。**いずれ戻す予定**。戻すときは App Store 審査要件の
  アプリ内アカウント削除（+ Apple トークン失効）も同時に実装すること。
- **課金**（`src/lib/purchases.tsx`）: RevenueCat。エンタイトルメント `premium`、ペイウォールは
  ダッシュボードの default Offering（Paywalls V2 を `RevenueCatUI.presentPaywall()` で表示）。
  プレミアム = 要約版の出力無制限。`EXPO_PUBLIC_REVENUECAT_IOS_KEY` 未設定なら全員無料プランで動く。
- **写真**（`src/lib/media.ts`）: ピッカーの URI は `Paths.document/media/` へコピーして永続化。
  本の PDF 生成時は `File.base64()` で data URI 化して埋め込む（remote_url があればそちら優先）。
- **テーマ**（`src/constants/theme.ts`）: 紙のようなウォームオフホワイト + テラコッタ。
  ライト/ダーク対応。`ThemedText` / `ThemedView` / `useTheme` はテンプレート由来を流用。
- アイコンは `expo-symbols`（SF Symbols）。**iOS 専用表示** — 提出も検証も iPhone なので許容。
  Android/web では多くのアイコンが空になる。

## ディレクトリ

```
src/
  app/                  expo-router のルート
    _layout.tsx         プロバイダ + ルート Stack + 認証/オンボーディングのゲート
    (tabs)/             4タブ: index=今日 / timeline=これまで / books=本棚 / settings=設定
    entry/new.tsx       記入エディタ（新規・編集兼用。?id= で編集、?pickDate=1 で日付選択を開く）
    entry/[id].tsx      エントリー詳細
    book/new.tsx        本の生成フロー（Phase 4 で実装）
    book/[id].tsx       本ビューア（Phase 4 で実装）
    sign-in.tsx / onboarding.tsx / emergency-contacts.tsx
  lib/                  db, entries, contacts, books, meta, media, date, ids, supabase, auth, onboarding
  hooks/                use-entries（一覧 / N年前の今日 / 単一）, use-theme, use-color-scheme
  components/           entry-card, themed-text, themed-view, ui/（screen, button, card, empty-state, modal-header）
```

## 日付の扱い（重要 / 企画書 5-1）
- `entry_date` = 出来事があった日（YYYY-MM-DD, ローカル）。並び順・「N年前の今日」に使う。
- `created_at` = 実際に入力した日時（ISO8601）。
- 過去日付でのさかのぼり入力を最初からサポート（コールドスタート緩和）。
- ヘルパーはすべて `src/lib/date.ts`。タイムゾーンずれ回避のため文字列⇔Date は正午基準。

## 進め方（フェーズ）
0. 基盤 ✅ / 1. 日記コア ✅（記入・一覧・詳細・編集・削除・写真・コンテンツタグ）
2. 振り返り（N年前の今日は実装済み。カレンダー表示は今後）
3. 緊急連絡先 ✅（最小構成）
4. 本生成 ✅（[src/lib/pdf.ts](src/lib/pdf.ts) で HTML→PDF、[book/new.tsx](src/app/book/new.tsx) で全文版/要約版の選択、
   [book/[id].tsx](src/app/book/[id].tsx) で WebView による PDF ビューア + 共有/AirPrint。
   要約版のハイライト抽出は AI ではなくルールベースの暫定版（[src/lib/summary.ts](src/lib/summary.ts) 参照、将来 API に差し替え）。
   **react-native-webview / expo-sharing はネイティブモジュールなので EAS の開発ビルドを再作成しないと実機に反映されない。**）
5. 課金（RevenueCat / Paywalls V2 / コンテクスチュアル表示）— アプリ側は実装済み（要約版の上限到達時と
   設定画面からペイウォール、購入の復元、サブスク管理）。App Store Connect / RevenueCat の設定と実機検証が残り
6. ストア素材・プライバシーポリシー公開・EAS Build・審査

## EAS / 実機
- EAS プロジェクト: `@ryuryu07/historary`（owner: `ryuryu07`）
- bundle identifier: `com.ryuryu0718.historary`（仮。確定後に変更する場合は要相談）
- 開発ビルドは `eas build --profile development --platform ios`、起動は `npm start`（`expo start --dev-client`）
- **ネイティブモジュールを追加したら dev build の再作成が必要**（JSのみの変更は `npm start` のホットリロードで反映される）

## コマンド
- `npx expo start` 開発サーバ / `npm run lint` / `npx tsc --noEmit` 型チェック
- `npx expo-doctor` 依存の健全性
- ネイティブ確認は EAS Build（Mac 不要ルート、企画書 7章）。`expo-sqlite` 等が入るため Expo Go 不可、Dev Client が必要。

## やらないこと（V1スコープ / 企画書 10章）
見守り/チェックイン、自社製本発送、USB発送、複数クラウド自動バックアップ、
Instagram シェア、家族の寄稿、未成年本人の家族プラン（COPPA 対応が必要なため将来）。
遺言書の自動生成は実装しない（弁護士法72条 / 企画書 8章）。
