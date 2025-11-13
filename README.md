# Hyper AI Agent

A high-performance AI agent framework for advanced task automation and problem-solving.

## Features
- 🚀 High-performance AI agent core
- 🔄 Task automation and orchestration
- 🧠 Advanced memory and context management
- 🤖 Multi-agent collaboration
- ⚡ Real-time processing

## Getting Started

### Prerequisites
- Python 3.9+
- pip

### Installation
```bash
# Clone the repository
git clone https://github.com/coffin399/coffin299-Hyper-AI-Agent.git
cd coffin299-Hyper-AI-Agent

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Project Structure
```
hyper-ai-agent/
├── src/                    # Source code
│   ├── core/              # Core agent functionality
│   ├── memory/            # Memory management
│   ├── tools/             # Built-in tools
│   └── utils/             # Utility functions
├── tests/                 # Test suite
├── examples/              # Example usage
└── docs/                  # Documentation
```

## Technology Stack
- **Desktop Shell**: Electron for cross-platform Windows/macOS builds
- **UI Layer**: React + TypeScript
- **Agent Runtime**: LangChain.js (BYOK—Bring Your Own Key)
- **Backend Services**: Python + FastAPI for AI processing and orchestration
- **Local Persistence**: SQLite for encrypted API key storage and long-term memory
- **IPC / API**: gRPC or REST between Electron renderer and FastAPI backend

### Advantages
- Unified JavaScript/TypeScript UI with native desktop packaging
- Consistent UX across Windows and macOS while remaining web-friendly
- Simple path to bundle user-supplied provider keys securely (BYOK)

## Core Feature Set

### 1. マルチプロバイダー対応
- OpenAI (GPT-4, GPT-4o)
- Anthropic (Claude)
- Google (Gemini)
- ローカルLLM (Ollama / KoboldCPP 連携)
- タブ単位でモデル選択・切り替え

### 2. コンテキスト管理システム
- 長期記憶をSQLiteへベクトル化保存
- 会話履歴の要約・圧縮
- 重要情報の自動抽出・タグ付け
- プロジェクト単位でのコンテキスト分離

### 3. ツール統合（Function Calling）
```
├── ファイルシステム操作
├── Webスクレイピング
├── カレンダー連携
├── メール送信
├── コード実行（サンドボックス内）
├── データベース操作
└── カスタムツール追加（プラグイン形式）
```

### 4. ワークフロービルダー
- ノーコードでタスクフロー設計
- 条件分岐・ループ処理
- マルチエージェント連携（例: リサーチャー→ライター→レビュアー）

### 5. RAG（検索拡張生成）
- PDF / Markdown / Docx の取り込み
- ベクトル検索によるナレッジベース構築
- Webページのスクラップ＆保存

### 6. タスク自動化
- Cronライクな定期実行
- ファイル監視トリガー
- Webhook受信でエージェント起動

### 7. プロンプトテンプレート管理
- テンプレート化と変数埋め込み
- コミュニティテンプレートのインポート / エクスポート

### 8. マルチチャット
- 複数会話スレッドをタブ / サイドバーで並行管理

### 9. エクスポート機能
- 会話を Markdown / PDF / JSON へ保存
- コード部分はシンタックスハイライト対応

### 10. コスト管理ダッシュボード
- トークン使用量の可視化
- API別の料金計算
- 月次レポート生成

### 11. デバッグモード
- 実送信プロンプトの表示
- トークン数リアルタイム表示
- レスポンスタイム計測

### 12. プラグインシステム
- JavaScriptでカスタムツールを追加可能

## Implementation Roadmap

### Phase 1 (MVP ~1ヶ月)
1. 基本チャットUI
2. マルチプロバイダー対応
3. APIキー管理（暗号化保存）
4. 会話履歴の保存

### Phase 2 (~2-3ヶ月)
5. ツール統合（ファイル操作 / Web検索）
6. RAG機能
7. プロンプトテンプレート

### Phase 3 (~3-6ヶ月)
8. ワークフロービルダー
9. タスク自動化
10. プラグインシステム

## License
Apache 2.0
