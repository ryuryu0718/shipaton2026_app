# Shipaton 2026 完全ロードマップ（初心者・Mac不要ルート）

対象：プログラミングほぼ未経験、iOS向けアプリを作る、Macの実機は持っていない（または古くて不安）人向け。
今日は2026年8月13日。締切（2026年9月30日 23:45 太平洋時間 ＝ 日本時間だと10月1日 15:45頃）まで、残り約7週間です。

**この版のポイント**：開発〜ビルド〜App Storeへの提出まで、すべてクラウド経由で行い、手元にMacがなくても完結する「Expo（React Native）+ EAS Build」ルートで進めます。

---

## 1. Shipatonとは（おさらい）

RevenueCat社主催の「世界最大級のモバイルアプリハッカソン」。期間中に**完全に新しいアプリ**を開発し、App Store（またはGoogle Play／Samsung Galaxy Store）で実際に公開して、RevenueCatのSDKで課金または広告を実装することが条件です。既存アプリの更新は対象外。

- 開催期間：2026年8月1日〜9月30日
- 賞金総額：$685,000以上（グランプリ1位 $100,000）
- 参加条件：13〜99歳、一部国・地域は対象外

---

## 2. 初心者が誤解しやすいポイント

- **「新規アプリ」が必須**：過去に作ったアプリの改修では参加資格を満たしません。
- **課金 or 広告の実装が必須**：無料アプリを作るだけではダメで、RevenueCat SDK経由で「アプリ内購入」または「広告（RevenueCat Ads）」のどちらかを組み込む必要があります。
- **ストア公開が必須**：デモだけでなく、実際にApp Storeで一般公開（または審査通過）する必要があります（Next Gen Award＝学生限定カテゴリーのみ例外）。
- **Apple Developer Programへの登録が必要**：年間$99（約15,000円）。これはMacの有無に関係なく必須です。登録はブラウザから可能ですが、審査に1〜2日かかることがあるので早めに着手しましょう。

---

## 3. なぜMacなしで進められるのか

通常のiOS開発では「Xcode」というMac専用ソフトでコードを書き、ビルドし、審査に提出します。今回使う**Expo**というフレームワークは、この流れを次のように変えてくれます。

| 作業 | 通常のiOS開発 | Expoルート（今回採用） |
|---|---|---|
| コードを書く言語 | Swift | JavaScript / TypeScript（React Native） |
| コードを書く場所 | Mac + Xcode | Windows / Linux / 何でもOK（VS Codeなど） |
| アプリの形にビルド | 手元のMacで実行 | Expoのクラウド上のMacサーバーが代行（`eas build`コマンド） |
| App Storeへ提出 | 手元のMac（Xcode／Transporter）から | クラウド経由でコマンド1つ（`eas submit`） |

つまり、自分の作業はコードを書いてコマンドを打つだけで、実際に「Macが必要な部分」はすべてExpo社のクラウドが肩代わりしてくれます。RevenueCatもExpo／React Nativeを公式にサポートしているので、SDK統合の面でも問題ありません。

**唯一の注意点**：EAS Buildの無料枠は月15回のiOSビルドまで。ハッカソンで1本のアプリを作る分には十分な回数です。

---

## 4. 全体スケジュール（逆算プラン）

| 時期 | やること |
|---|---|
| 〜8月17日頃 | 環境準備（Apple Developer登録、Devpost登録、Discord参加、アイデア決定） |
| 8月18日〜9月上旬 | Expoでアプリ開発、RevenueCat SDK統合 |
| 9月上旬〜9月15日頃 | EAS Buildで開発ビルド作成、TestFlightでテスト、課金のサンドボックス検証 |
| 9月16日頃 | `eas submit`でApp Store審査に申請（審査に数日かかるため余裕を持つ） |
| 9月23日頃まで | 公開・最終調整（バッファ期間） |
| 9月30日 23:45（太平洋時間）まで | Devpostへ提出物をアップロード（動画、スクショ、URLなど） |

**初心者の場合、開発に使える時間が最重要です。9月中旬には「動くアプリ」を完成させておくのが理想。**

---

## 5. ステップ0：環境・アカウント準備（今すぐやること）

1. **Devpostで参加登録**：公式ページ（https://revenuecat-shipaton-2026.devpost.com/）の「Join hackathon」をクリック。
2. **Discordに参加**：Devpostページからリンクあり。質問や情報収集に必須。週2回の専門家ライブストリームもここで告知されます。
3. **Apple Developer Programに登録**：https://developer.apple.com/programs/ から。年間$99。「Individual」でOK。ブラウザから登録可能（Macは不要）。
4. **RevenueCatアカウント作成**：https://www.revenuecat.com/ で無料アカウント作成。
5. **Node.js のインストール**：お使いのPC（Windows／Linuxどちらでも可）にNode.jsをインストール（https://nodejs.org/ からLTS版を入れればOK）。
6. **Expoアカウント作成**：https://expo.dev/ で無料アカウント作成。EAS Buildを使うのに必要です。

---

## 6. ステップ1：アプリのアイデアを決める

過去の受賞傾向から、初心者にもおすすめできるコツ：

- **シンプルで単一目的**：機能を絞る（「これ1つができる」アプリ）。
- **収益化モデルが明確**：サブスクリプション（例：週額・月額のプレミアム機能）か、買い切り課金か、広告か、最初から決めておく。
- **iOS優先**：受賞作はiOSが多い傾向（あなたの選択と合致）。
- **「作れそう」から逆算する**：やりたいことよりも「未経験でも7週間で形にできるもの」を優先。習慣トラッカー、シンプルな計算・変換ツール、日記・メモアプリ、ちょっとしたゲーム、AI活用ツール（画像生成・要約など）は初心者でも到達しやすいジャンルです。

アイデアが固まっていないとのことなので、次のやり取りで一緒に案出しをすることもできます（得意なこと・興味のある分野・解決したい悩みなどを教えてもらえると絞り込みやすいです）。

---

## 7. ステップ2：開発環境のセットアップとコーディング

### 7-1. プロジェクト作成

PC（Windows/Linux）のターミナルで以下を実行：

```sh
npx create-expo-app@latest my-app
cd my-app
npx expo install expo-dev-client
```

### 7-2. コードを書く

- 画面や機能はJavaScript／TypeScript（React Native）で書きます。
- Expo Router（画面遷移の仕組み）やUIコンポーネントは、公式ドキュメントとAIコーディング支援（Claudeなど）を組み合わせながら進めるのがおすすめです。「こういう画面・機能を作りたい」と伝えて、コードを生成してもらい、貼り付けて動作確認する、という進め方が未経験でも一番早いです。
- 開発中の画面確認は「Expo Go」というアプリをスマホに入れると、コードを保存するたびにリアルタイムでプレビューできます（ただし課金機能はExpo Goでは動作確認できないので注意、後述）。
- **最初は「動くだけ」を目指す**：デザインや最適化は後回しにし、まず画面が表示されて基本機能が動く状態を早く作りましょう。

---

## 8. ステップ3：RevenueCat SDK統合

1. **パッケージ追加**：
   ```sh
   npx expo install react-native-purchases react-native-purchases-ui
   ```
2. **App Store Connectで商品作成**：Apple Developer登録後、App Store Connect上でサブスクリプションや買い切りの「App内課金」商品を作成。
3. **RevenueCatダッシュボードで設定**：
   - プロジェクト作成 → App Store Connectと連携
   - 「エンタイトルメント」（例：`pro`などのアクセス権）を作成
   - 作成した商品をRevenueCatに登録
   - 「オファリング」（表示する商品の組み合わせ）を作成
4. **アプリ側でSDKを初期化**（エントリーポイントに追加）：
   ```tsx
   import Purchases, { LOG_LEVEL } from 'react-native-purchases';

   useEffect(() => {
     Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
     Purchases.configure({ apiKey: '<Appleの場合のAPIキー>' });
   }, []);
   ```
5. **ペイウォール（課金画面）を表示**：`react-native-purchases-ui`の`RevenueCatUI.presentPaywallIfNeeded()`を使うと、RevenueCatダッシュボードでノーコードに近い形でデザインしたペイウォール画面をアプリに組み込めます。コードをあまり書かずに実装できるので初心者にもおすすめです。

**重要**：この時点から先はExpo Go（スマホの汎用プレビューアプリ）では課金機能のテストができません。次のステップの「開発ビルド」が必要になります。

---

## 9. ステップ4：EAS Buildでビルド・テスト

1. **EAS CLIのセットアップ**（PC側）：
   ```sh
   npm install -g eas-cli
   eas login
   eas init
   eas build:configure
   ```
2. **開発ビルドを作成**（クラウド上のMacがビルドしてくれる）：
   ```sh
   eas build --platform ios --profile development
   ```
   ビルドが完了すると、インストール用のリンクが発行されます。実機（iPhone）があればそこに直接インストールでき、なければTestFlight経由でも確認できます。
3. **実機でテスト**：サンドボックスアカウント（Appleのテスト用購入環境）を使い、実際に「購入」操作をして課金が正しく反映されるか確認。
4. iPhone実機がない場合は、iOSシミュレータ用ビルド（`--profile ios-simulator`）も作れますが、購入機能のテストには実機推奨です。周りにiPhoneを貸してもらえる人がいると安心です。

---

## 10. ステップ5：App Store申請・提出

1. **本番ビルド作成**：
   ```sh
   eas build --platform ios --profile production
   ```
2. **App Storeへ提出**（これもクラウド経由、Mac不要）：
   ```sh
   eas submit --platform ios
   ```
3. アプリアイコン（1024×1024px）、スクリーンショット（1179×2556px、デバイス枠なし）などストア掲載用素材も事前に準備し、App Store Connect（ブラウザ）から入力。
4. 9月16日頃までに審査申請を出すのが目安（Appleの審査は通常1〜3日ですが、混雑や却下対応を考えると余裕を持つべき）。

---

## 11. ステップ6：Devpostへ提出

提出期限までに以下をDevpostにアップロード：

1. アプリの説明文（機能説明）
2. デモ動画（最大2分、YouTubeまたはVimeoでホスト、実機画面を映す）
3. ストア公開URL（App Store）
4. アプリアイコン（1024×1024px）
5. スクリーンショット
6. レビュー用の無料トライアルまたはプロモコード（審査員がアプリを試せるように）

---

## 12. 困ったときのリソース

- **公式Discord**：質問・情報交換はほぼここに集約されています。
- **公式Codelab（コードラボ）**：https://revenuecat.github.io/codelabs/shipaton-2026-prep.html
- **RevenueCat × Expo公式チュートリアル**：https://expo.dev/blog/expo-revenuecat-in-app-purchase-tutorial
- **RevenueCat Expo導入ドキュメント**：https://www.revenuecat.com/docs/getting-started/installation/expo
- **週2回の専門家ライブストリーム**：Discordで告知
- **オフィスアワー／国内イベント**：全国6都市で説明会やワークショップが予定されているとのことなので、Discordや公式サイトで最新情報をチェック

---

## 13. 次にやるべきこと（今日から）

1. Devpost登録＋Discord参加（10分で完了）
2. Apple Developer Program登録（審査待ちがあるので最優先で着手）
3. Node.js・Expoアカウントのセットアップ
4. アプリのアイデアを1つに絞る（一緒に相談可能）

---

*このガイドは2026年8月13日時点の公式情報をもとに作成しています。ルールや料金体系、EAS Buildの無料枠などは変更される可能性があるため、最新情報は必ず公式サイト（jp.shipaton.com）、Devpostページ、Expo公式ドキュメントで確認してください。*
