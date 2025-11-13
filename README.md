# Hyper AI Agent

🚀 BYOK multi-provider AI agent with RAG, automation, and mobile support

Hyper AI Agentは、複数のAIプロバイダーに対応し、RAG（検索拡張生成）と自動化機能を統合したAIエージェントです。デスクトップ版とモバイル版（Android）を提供し、APIキーはローカルでAES暗号化され、セキュアに利用できます。

## 🎯 主な機能

### 🤖 AIプロバイダー対応
- **OpenAI** (GPT-4, GPT-3.5, GPT-4o)
- **Anthropic** (Claude-3 Opus, Sonnet, Haiku)
- **Google Gemini** (Gemini Pro, Gemini 1.5)
- **Ollama** (ローカルモデル - Llama3, Qwen, Gemma)
- 自動フェイルオーバーと負荷分散
- 会話単位でのモデル切り替え

### 📱 モバイルアプリ (Android)
- **React Native 0.72.6** ベースのネイティブアプリ
- **ダッシュボード**: 統計・クイックアクション
- **AIモデル管理**: GPT-4/Claude/Gemini切り替え
- **サービス連携**: Google/Discord/LINE設定
- **AI機能**: ドキュメント/メディア/会議/チャット/OCR
- **Material Design**: React Native Paper 5.11.1使用
- **ダークテーマ**: 切換対応
- **GitHub Actions**: 自動APKビルド (Debug/Release)

### 🧠 コンテキスト管理
- 会話履歴の永続化
- ベクトルメモリ検索 (RAG)
- 自動要約機能
- セマンティック検索
- プロジェクト単位でのコンテキスト分離

### 🛠️ ツール統合
- ファイルシステム操作
- Webスクレイピング (Playwright)
- カレンダー管理 (Google Calendar)
- メール送信 (SMTP)
- コード実行 (サンドボックス)
- データベースクエリ (SQLite)
- カスタムツール追加 (プラグイン形式)

### ⚡ 自動化
- Cronスケジュール (APScheduler)
- ファイル監視トリガー (Watchdog)
- Webhook対応
- ワークフロー実行

### 🖥️ ローカルモデル管理
- PCスペック別モデル推奨
- Qwen3/Gemma3/Llama3対応
- 一括ダウンロード/削除
- リアルタイム進捗表示

### 📊 その他機能
- マルチチャット (タブ管理)
- エクスポート (Markdown/PDF/JSON)
- コスト管理ダッシュボード
- デバッグモード
- プロンプトテンプレート管理

## 🏗️ 技術スタック

### デスクトップ版
- **デスクトップ**: Electron 28.0.0 (Windows/macOS/Linux)
- **UI**: React 18.2.0 + TypeScript 4.9.5 + Material-UI 5.15.0
- **AIエージェント**: LangChain 0.3.7 (BYOK)
- **バックエンド**: Python + FastAPI 0.115.0
- **データベース**: SQLite (ローカル) + SQLAlchemy 2.0.35
- **通信**: REST API
- **暗号化**: Cryptography 43.0.3 (AES 128 + HMAC-SHA256)

### モバイル版 (Android)
- **フレームワーク**: React Native 0.72.6
- **UI**: React Native Paper 5.11.1 + Material Design
- **ナビゲーション**: React Navigation 6
- **アイコン**: React Native Vector Icons 10.0.0
- **ビルド**: Gradle 7.5.1 + GitHub Actions
- **署名**: Debug/Releaseキーストア
- **ターゲット**: Android API 21-33

## 📦 インストール

### デスクトップ版

#### プリビルド版 (推奨)
[Releases](https://github.com/coffin299/coffin299-Hyper-AI-Agent/releases) から各プラットフォーム版をダウンロード

##### Windows
1. `Hyper-AI-Agent-Setup-*.exe` をダウンロード
2. インストーラーを実行
3. アプリケーションを起動

##### macOS
1. `Hyper-AI-Agent-*.dmg` をダウンロード
2. DMGファイルを開く
3. アプリケーションフォルダにドラッグ

##### Linux
1. `Hyper-AI-Agent-*.AppImage` をダウンロード
2. 実行権限を付与: `chmod +x *.AppImage`
3. 実行: `./Hyper-AI-Agent-*.AppImage`

#### 開発版
```bash
# リポジトリをクローン
git clone https://github.com/coffin299/coffin299-Hyper-AI-Agent.git
cd coffin299-Hyper-AI-Agent

# Python環境設定
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# フロントエンド依存関係
cd frontend
npm install
npm run build
cd ..

# Electron依存関係
npm install

# 起動
npm run dev
```

### モバイル版 (Android)

#### GitHub Actionsビルド (推奨)
1. [Releases](https://github.com/coffin299/coffin299-Hyper-AI-Agent/releases) からAPKをダウンロード
2. AndroidでAPKをインストール
3. アプリケーションを起動

#### 手動ビルド
```bash
# モバイルディレクトリへ移動
cd mobile

# 依存関係をインストール
npm install

# Metroバンドラーを起動
npm start

# Androidで実行
npm run android

# ビルド
npm run build:android:debug    # デバッグ版
npm run build:android          # リリース版
```

#### GitHub Actions自動ビルド
- **トリガー**: Push/PR/手動実行
- **成果物**: Debug APK (30日) / Release APK (90日)
- **自動リリース**: タグとGitHubリリース作成
- **ビルドマトリックス**: Ubuntu/Windows/macOS (Electron), Ubuntu (Android)

## ⚙️ 初期設定

### デスクトップ版
1. **APIキー設定**
   - OpenAI、Anthropic、GoogleのAPIキーを設定
   - キーはローカルでAES暗号化されて保存

2. **ローカルモデル (オプション)**
   - Ollamaをインストール
   - アプリ内で推奨モデルをダウンロード

3. **プロジェクト作成**
   - 新規プロジェクトを作成して開始

### モバイル版
1. **APIエンドポイント設定**
   - バックエンドサーバーのURLを設定
   - ローカルネットワークまたはクラウドサーバー

2. **サービス連携**
   - Google、Discord、LINEのAPIキーを設定
   - 各サービスの連携を有効化

3. **AI機能利用**
   - AIドキュメント、メディア生成、会議、チャット、OCR機能を使用

## 📁 プロジェクト構造

```
hyper-ai-agent/
├── src/                    # Pythonバックエンド
│   ├── core/              # コア機能 (エージェント、DB、設定)
│   ├── providers/         # AIプロバイダー実装
│   ├── services/          # サービス層 (会話、メモリ、ツール)
│   │   ├── automation_service.py
│   │   ├── calendar_service.py
│   │   ├── chat_service.py
│   │   ├── discord_service.py
│   │   ├── document_service.py
│   │   ├── email_service.py
│   │   ├── google_service.py
│   │   ├── line_service.py
│   │   ├── media_service.py
│   │   ├── meeting_service.py
│   │   ├── ocr_service.py
│   │   └── ...
│   ├── tools/             # ツール実装
│   └── api/               # FastAPIルート
├── frontend/              # Reactフロントエンド (デスクトップ)
│   ├── src/
│   │   ├── components/    # UIコンポーネント
│   │   └── App.tsx        # メインアプリ
│   └── public/
├── mobile/                # React Nativeモバイル版
│   ├── android/           # Androidネイティブコード
│   ├── ios/               # iOSコード (将来対応)
│   ├── src/               # モバイルUIコンポーネント
│   ├── App.tsx            # モバイルメインアプリ
│   └── package.json       # React Native依存関係
├── .github/workflows/     # CI/CD設定
│   └── release.yml        # Android/Electronビルド
├── electron.js            # Electronメインプロセス
├── preload.js             # Electronプリロードスクリプト
├── package.json           # Electron依存関係
├── requirements.txt       # Python依存関係
└── .env.example           # 環境変数テンプレート
```

## 🔒 セキュリティ

- **APIキー暗号化**: Cryptography 43.0.3 (AES 128 + HMAC-SHA256) でローカル暗号化
- **BYOK方式**: ユーザー自身のキーを管理
- **ローカル処理**: 機密データはローカルDBに保存
- **サンドボックス**: コード実行は隔離環境
- **モバイルセキュリティ**: Android署名 + パーミッション管理

## 🚀 使い方

### デスクトップ版
#### 基本的なチャット
1. プロバイダーを選択
2. メッセージを送信
3. AI応答を受け取る

#### ツール利用
```
ファイルを検索してください
このURLの内容を要約してください
カレンダーに予定を追加してください
```

#### 自動化設定
1. 自動化ルールを作成
2. トリガー (Cron/ファイル監視/Webhook) を設定
3. アクション (ツール実行) を選択

#### ローカルモデル
1. 設定からシステム情報を確認
2. 推奨モデルをダウンロード
3. プロバイダーとして選択

### モバイル版
#### ダッシュボード
- アプリケーション概要と統計情報
- クイックアクションで各機能へアクセス

#### AIモデル管理
- GPT-4、Claude-3、Gemini Proの切り替え
- モデルの有効/無効設定

#### サービス連携
- Google、Discord、LINEのAPI設定
- 連携ステータスと機能管理

#### AI機能
- **AIドキュメント**: 文書生成・要約
- **AIメディア**: 画像・動画・音声生成
- **AI会議**: 音声認識・議事録作成
- **AIチャット**: 対話型AI
- **AI OCR**: 画像文字認識

## 🧪 開発

### デスクトップ版
```bash
# テスト実行
pytest

# フロントエンド開発サーバー
cd frontend && npm start

# バックエンド開発サーバー
python -m uvicorn src.api.server:app --reload

# Electron開発モード
npm run dev
```

### モバイル版
```bash
# 依存関係インストール
cd mobile && npm install

# Metroバンドラー起動
npm start

# Android開発
npm run android

# ビルド
npm run build:android:debug
npm run build:android

# テスト
npm test

# リント
npm run lint
```

### GitHub Actions
- **自動ビルド**: Push/PR/手動実行でAPK生成
- **成果物**: Debug/Release APKを自動アップロード
- **リリース**: 手動実行でGitHubリリース作成
- **マトリックスビルド**: Windows/macOS/Linux (Electron), Ubuntu (Android)

## 🤝 貢献

1. Fork
2. ブランチ作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Pull Request

## 📄 ライセンス

Apache2.0 License - [LICENSE](LICENSE) を参照

## 🔗 リンク

- [ドキュメント](https://github.com/coffin299/coffin299-Hyper-AI-Agent/wiki)
- [バグ報告](https://github.com/coffin299/coffin299-Hyper-AI-Agent/issues)
- [機能要望](https://github.com/coffin299/coffin299-Hyper-AI-Agent/discussions)
- [Releases](https://github.com/coffin299/coffin299-Hyper-AI-Agent/releases)
- [GitHub Actionsビルド](https://github.com/coffin299/coffin299-Hyper-AI-Agent/actions/workflows/release.yml)
