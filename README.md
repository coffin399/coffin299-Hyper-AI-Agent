# Hyper AI Agent

🚀 BYOK multi-provider AI agent with RAG and automation

Hyper AI Agentは、複数のAIプロバイダーに対応し、RAG（検索拡張生成）と自動化機能を統合したデスクトップAIエージェントです。APIキーはローカルでAES暗号化され、セキュアに利用できます。

## 🎯 主な機能

### 🤖 AIプロバイダー対応
- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic** (Claude-3)
- **Google Gemini**
- **Ollama** (ローカルモデル)
- 自動フェイルオーバーと負荷分散
- 会話単位でのモデル切り替え

### 🧠 コンテキスト管理
- 会話履歴の永続化
- ベクトルメモリ検索 (RAG)
- 自動要約機能
- セマンティック検索
- プロジェクト単位でのコンテキスト分離

### 🛠️ ツール統合
- ファイルシステム操作
- Webスクレイピング
- カレンダー管理
- メール送信
- コード実行 (サンドボックス)
- データベースクエリ
- カスタムツール追加 (プラグイン形式)

### ⚡ 自動化
- Cronスケジュール
- ファイル監視トリガー
- Webhook対応
- ワークフロー実行

### 🖥️ ローカルモデル管理
- PCスペック別モデル推奨
- Qwen3/Gemma3対応
- 一括ダウンロード/削除
- リアルタイム進捗表示

### 📊 その他機能
- マルチチャット (タブ管理)
- エクスポート (Markdown/PDF/JSON)
- コスト管理ダッシュボード
- デバッグモード
- プロンプトテンプレート管理

## 🏗️ 技術スタック

- **デスクトップ**: Electron (Windows/macOS/Linux)
- **UI**: React + TypeScript + Material-UI
- **AIエージェント**: LangChain.js (BYOK)
- **バックエンド**: Python + FastAPI
- **データベース**: SQLite (ローカル)
- **通信**: REST API
- **暗号化**: Fernet (AES 128 + HMAC-SHA256)

## 📦 インストール

### プリビルド版 (推奨)

[Releases](https://github.com/coffin299/coffin299-Hyper-AI-Agent/releases) から各プラットフォーム版をダウンロード

#### Windows
1. `Hyper-AI-Agent-Setup-*.exe` をダウンロード
2. インストーラーを実行
3. アプリケーションを起動

#### macOS
1. `Hyper-AI-Agent-*.dmg` をダウンロード
2. DMGファイルを開く
3. アプリケーションフォルダにドラッグ

#### Linux
1. `Hyper-AI-Agent-*.AppImage` をダウンロード
2. 実行権限を付与: `chmod +x *.AppImage`
3. 実行: `./Hyper-AI-Agent-*.AppImage`

### 開発版

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

## ⚙️ 初期設定

1. **APIキー設定**
   - OpenAI、Anthropic、GoogleのAPIキーを設定
   - キーはローカルでAES暗号化されて保存

2. **ローカルモデル (オプション)**
   - Ollamaをインストール
   - アプリ内で推奨モデルをダウンロード

3. **プロジェクト作成**
   - 新規プロジェクトを作成して開始

## 📁 プロジェクト構造

```
hyper-ai-agent/
├── src/                    # Pythonバックエンド
│   ├── core/              # コア機能 (エージェント、DB、設定)
│   ├── providers/         # AIプロバイダー実装
│   ├── services/          # サービス層 (会話、メモリ、ツール)
│   ├── tools/             # ツール実装
│   └── api/               # FastAPIルート
├── frontend/              # Reactフロントエンド
│   ├── src/
│   │   ├── components/    # UIコンポーネント
│   │   └── App.tsx        # メインアプリ
│   └── public/
├── .github/workflows/     # CI/CD設定
├── electron.js            # Electronメインプロセス
└── package.json           # Electron依存関係
```

## 🔒 セキュリティ

- **APIキー暗号化**: Fernet (AES 128 + HMAC-SHA256) でローカル暗号化
- **BYOK方式**: ユーザー自身のキーを管理
- **ローカル処理**: 機密データはローカルDBに保存
- **サンドボックス**: コード実行は隔離環境

## 🚀 使い方

### 基本的なチャット
1. プロバイダーを選択
2. メッセージを送信
3. AI応答を受け取る

### ツール利用
```
ファイルを検索してください
このURLの内容を要約してください
カレンダーに予定を追加してください
```

### 自動化設定
1. 自動化ルールを作成
2. トリガー (Cron/ファイル監視/Webhook) を設定
3. アクション (ツール実行) を選択

### ローカルモデル
1. 設定からシステム情報を確認
2. 推奨モデルをダウンロード
3. プロバイダーとして選択

## 🧪 開発

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

## 🤝 貢献

1. Fork
2. ブランチ作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Pull Request

## 📄 ライセンス

MIT License - [LICENSE](LICENSE) を参照

## 🔗 リンク

- [ドキュメント](https://github.com/coffin299/coffin299-Hyper-AI-Agent/wiki)
- [バグ報告](https://github.com/coffin299/coffin299-Hyper-AI-Agent/issues)
- [機能要望](https://github.com/coffin299/coffin299-Hyper-AI-Agent/discussions)
- [Releases](https://github.com/coffin299/coffin299-Hyper-AI-Agent/releases)
