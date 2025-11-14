# デスクトップ版起動ガイド

## 開発モードで起動

デスクトップ版を開発モードで起動するには、**2つのプロセス**を同時に実行する必要があります：

### 1. フロントエンド開発サーバーを起動

```bash
cd frontend
npm install
npm start
```

これで `http://localhost:3000` でReact開発サーバーが起動します。

### 2. Electronアプリを起動（別のターミナル）

```bash
npm run dev
```

## プロダクションビルド

フロントエンドをビルドしてからElectronアプリをパッケージ化：

```bash
# フロントエンドをビルド
npm run build:frontend

# Electronアプリをパッケージ化
npm run build        # すべてのプラットフォーム
npm run build:win    # Windows用
npm run build:mac    # macOS用
```

## トラブルシューティング

### 白い画面が表示される場合

1. **開発モード**: フロントエンド開発サーバー（`npm start`）が起動しているか確認
2. **プロダクション**: `frontend/build/` ディレクトリが存在するか確認
   - 存在しない場合: `npm run build:frontend` を実行

### DevToolsで確認

開発モードでは自動的にDevToolsが開きます。コンソールでエラーを確認してください。
