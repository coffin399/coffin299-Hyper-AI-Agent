# Hyper AI Agent Mobile App

React Nativeで開発されたHyper AI Agentのモバイルアプリケーションです。

## 機能

- 🤖 AIモデル管理 (GPT-4, Claude-2, Gemini Pro)
- 🔗 サービス連携 (Google, Discord, LINE)
- 📄 AIドキュメント生成
- 🎨 AIメディア生成 (画像, 動画, 音声)
- 🎤 AI会議 (音声認識, 議事録作成)
- 💬 AIチャット
- 📱 AI OCR (文字認識)

## 技術スタック

- **React Native 0.72.6**
- **TypeScript**
- **React Navigation 6**
- **React Native Paper 5**
- **Vector Icons**
- **Linear Gradient**

## 開発環境セットアップ

### 前提条件

- Node.js 18+
- React Native CLI
- Android Studio (Android開発)
- Xcode (iOS開発)

### インストール

```bash
# 依存関係をインストール
npm install

# iOSの場合 (macOSのみ)
cd ios && pod install

# Metroバンドラーを起動
npm start

# Androidで実行
npm run android

# iOSで実行
npm run ios
```

## ビルド

### デバッグビルド

```bash
# AndroidデバッグAPK
npm run build:android:debug

# 生成されたAPKの場所
# android/app/build/outputs/apk/debug/app-debug.apk
```

### リリースビルド

```bash
# AndroidリリースAPK
npm run build:android

# 生成されたAPKの場所
# android/app/build/outputs/apk/release/app-release.apk
```

## GitHub Actionsによる自動ビルド

このプロジェクトではGitHub Actionsを使用して自動ビルドを設定しています。

### トリガー

- `main`ブランチへのプッシュ
- `develop`ブランチへのプッシュ
- `main`ブランチへのPull Request
- 手動実行 (workflow_dispatch)

### ビルド成果物

- **Debug APK**: 30日間保存
- **Release APK**: 90日間保存 (手動実行時のみ)

### 手動リリースビルド

1. GitHubリポジトリの「Actions」タブに移動
2. 「Build Android APK」ワークフローを選択
3. 「Run workflow」をクリック
4. 「Create release build」をチェック
5. 「Run workflow」をクリック

## アプリケーション構造

```
mobile/
├── src/
│   ├── components/     # 再利用可能コンポーネント
│   ├── screens/        # 画面コンポーネント
│   ├── navigation/     # ナビゲーション設定
│   ├── services/       # APIサービス
│   ├── utils/          # ユーティリティ関数
│   └── types/          # TypeScript型定義
├── android/            # Androidネイティブコード
├── ios/                # iOSネイティブコード
├── assets/             # 画像・フォント等
└── __tests__/          # テストファイル
```

## 主要画面

### 1. ダッシュボード
- アプリケーション概要
- 統計情報
- クイックアクション

### 2. AIモデル管理
- モデル一覧
- 有効/無効切り替え
- 設定管理

### 3. サービス連携
- Google連携設定
- Discord連携設定
- LINE連携設定

### 4. AI機能
- AIドキュメント
- AIメディア
- AI会議
- AIチャット
- AI OCR

## 環境変数

`.env`ファイルを作成して以下の環境変数を設定してください：

```env
# APIエンドポイント
API_BASE_URL=https://your-api-server.com

# Google連携
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Discord連携
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# LINE連携
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_CHANNEL_SECRET=your-line-channel-secret
```

## パーミッション

このアプリは以下のパーミッションを要求します：

- `INTERNET` - ネットワーク通信
- `ACCESS_NETWORK_STATE` - ネットワーク状態確認
- `WRITE_EXTERNAL_STORAGE` - 外部ストレージ書き込み
- `READ_EXTERNAL_STORAGE` - 外部ストレージ読み取り
- `CAMERA` - カメラアクセス (OCR機能)
- `RECORD_AUDIO` - 音声録音 (会議機能)

## テスト

```bash
# テスト実行
npm test

# テストカバレッジ
npm test -- --coverage
```

## リント

```bash
# ESLint実行
npm run lint

# 自動修正
npm run lint -- --fix
```

## 貢献

1. Forkする
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。

## サポート

問題や質問がある場合は、GitHub Issuesを開いてください。
