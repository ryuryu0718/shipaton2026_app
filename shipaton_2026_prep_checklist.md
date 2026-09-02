# Shipaton 2026 準備チェックリスト

このファイルは「アプリの中身（企画）」ではなく、「開発を始めるまでの環境・アカウント準備」の進捗を記録するためのものです。企画内容は `shipaton_2026_project_plan.md`、法務文書は `privacy_policy_draft.md` / `terms_of_service_draft.md` を参照してください。

締切：2026年9月30日 23:45（太平洋時間）／ 日本時間 10月1日 15:45頃
最終更新：2026年9月1日

---

## 1. Apple Developer Program登録

- [x] https://developer.apple.com/programs/enroll/ から登録開始
- [x] Apple ID（2ファクタ認証有効）を用意（開発用に新規作成、普段使いのApple IDとは別）
- [x] Individual（個人）を選択
- [x] $99の支払い完了
- [ ] 審査完了（メール通知を待つ／1〜2日程度）
- 開始日：2026年9月2日
- 完了日：
- メモ：審査待ち

## 2. PC側の開発環境準備

- [ ] Node.js（LTS版）インストール
- [ ] Git インストール
- [ ] （Windowsの場合）WSL2 セットアップ
- [ ] Expo CLI / EAS CLI インストール（`npm install -g eas-cli`）
- 完了日：
- メモ（つまずいた点など）：

## 3. 各種アカウント作成

- [ ] Expoアカウント作成（https://expo.dev/）
- [ ] RevenueCatアカウント作成（https://www.revenuecat.com/）
- [ ] `eas login` でログイン確認
- 完了日：
- メモ：

## 4. 実機iPhoneの確保

- [x] 検証用iPhoneのあて（自分／家族／友人）を確認
- [x] 確保完了
- メモ：自分個人のiPhoneを使用

## 5. コード・法務文書のリポジトリ化

- [x] プロジェクト用フォルダ作成
- [x] `shipaton_2026_project_plan.md` を配置
- [x] `privacy_policy_draft.md` / `terms_of_service_draft.md` を配置
- [x] GitHubリポジトリ作成（`ryuryu0718/shipaton2026_app`）
- [ ] プライバシーポリシー・利用規約公開用のGitHub Pages設定（後日でも可）
- 完了日：2026年9月1日（GitHub Pages設定を除く）
- メモ：不要なzipファイルを削除済み

---

## Claude Codeへの引き継ぎ前チェック（最終確認）

- [ ] 上記1〜5がすべて完了
- [ ] `shipaton_2026_project_plan.md` の内容に更新漏れがない
- [ ] Claude Codeを起動するプロジェクトフォルダに、企画書・法務文書一式を配置済み

---

*このファイルは準備を進めるたびに追記・更新してください。次にこのチャットに戻ってきたときも、どこまで終わっているか一目でわかるようにするのが目的です。*
