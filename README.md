# umo (羽毛bot)

Discord上で動作する、Google Gemini APIを活用したAIチャットボットです。

## 特徴

- **Gemini AI 連携**: 最新のGemma-3モデル（gemma-3-27b-it）を使用して、自然な会話が可能です。
- **文脈理解**: Discordの返信チェーンを遡り、過去の会話の流れを理解した上で回答します。
- **ヘルスチェック用Webサーバー**: Discordボットの稼働状況を確認するための軽量なExpressサーバーを内蔵しています。
- **親しみやすい返答**: 「羽毛bot」として、親しみやすく丁寧な言葉遣いで対応します。

## 動作要件

- Node.js (v18以上推奨)
- npm
- Discord Bot トークン
- Google Gemini API キー

## インストール

1. リポジトリをクローンまたはダウンロードします。
2. 必要なパッケージをインストールします。

   ```bash
   npm install
   ```

## 設定

プロジェクトのルートディレクトリに `.env` ファイルを作成し、以下の環境変数を設定してください。

```env
DISCORD_TOKEN=あなたのDiscordボットトークン
GEMINI_API_KEY=あなたのGeminiAPIキー
```

## 使い方

### ビルド

TypeScriptファイルをコンパイルします。

```bash
npm run build
```

### 起動

ボットを起動します。

```bash
npm start
```

### Discordでの操作

1. ボットがサーバーに参加していることを確認します。
2. ボットに対してメンション（`@羽毛bot`）を付けて話しかけます。
3. ボットのリプライに対してさらに返信することで、会話を続けることができます。

## 技術スタック

- **言語**: TypeScript
- **ライブラリ**:
  - `discord.js`: Discord APIとの連携
  - `@google/genai`: Gemini APIの利用
  - `express`: Webサーバー
  - `dotenv`: 環境変数の管理

## ライセンス

[GNU GENERAL PUBLIC LICENSE](LICENSE)
