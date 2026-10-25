# UMO（羽毛bot）

Discord 上で動作する、Groq API を利用した AI チャットボットです。

## 特徴

- Groq API と `qwen/qwen3.8-27b` による 高速 AI 応答
- Discord の返信チェーンを利用した会話履歴の取得
- 画像添付ファイルを含むメッセージへの対応
- 天気・位置情報・Discord ユーザー情報ツール
- オンライン検索
- 稼働確認用の HTTP サーバー（ポート 3000）

## 動作要件

- Node.js 18 以上
- npm
- Discord Bot トークン
- Groq API キー

## セットアップ

```bash
npm install
npm run build
```

プロジェクトルートに `.env` を作成します。

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
GROQ_API_KEY=your_groq_api_key
```

## 起動

```bash
npm start
```

起動後、`http://localhost:3000/` にアクセスすると稼働状態を確認できます。

## Discord での使い方

1. Bot を Discord サーバーに招待します。
2. Bot にメンションして話しかけます。
3. Bot の返信に返信すると、返信チェーンを文脈として利用します。

## 外部サービス

- [Groq](https://groq.com/)
- [Tavily](https://tavily.com/) - 検索
- [© OpenStreetMap](https://www.openstreetmap.org/) - 地理情報の取得
- [Weather data by Open-Meteo.com](https://open-meteo.com/) - 天気情報の取得

## ライセンス

[GNU AFFERO GENERAL PUBLIC LICENSE](LICENSE)