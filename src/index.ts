import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import 'dotenv/config';
import { web } from './components/web.js';
import { Client, GatewayIntentBits } from 'discord.js';
import getReplyChain from './components/getReplyChain.js';
import { setDiscordClient } from './tools/getDiscordInfo.js';
import { groq_core } from './components/groq.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,          // サーバー関連イベント
    GatewayIntentBits.GuildMessages,   // サーバー内メッセージ
    GatewayIntentBits.MessageContent,  // メッセージ本文の取得
  ],
});


// 起動時
client.once('clientReady', () => {

  if (!client.user) {
    console.error("致命的なエラー：client.user が未定義です。");
    process.exit(1);
  }

  setDiscordClient(client);

  console.log("==============================");
  console.log(`Bot起動しました: ${client.user.tag}`);
  console.log("==============================");

});


// メッセージを受信時
client.on('messageCreate', async (message) => {
  
  if (!client.user) {
    console.error("致命的なエラー：client.user が未定義です。");
    process.exit(1);
  }

  // BOT自身の発言は無視
  if (message.author.bot) return;

  // ボット自身が直接メンションされている場合のみ処理
  // @everyone や @role メンションは除外
  if (!message.mentions.has(client.user) || message.mentions.everyone) return;

  // テキストが送信できるチャンネルか確認
  if (!message.channel.isTextBased()){
    console.error("エラー：テキストが送信できないチャンネルからメッセージを受け取りました。");
    return;
  }


  // ===================================ここから正常な処理===================================
  const typingInterval = setInterval(() => {// タイピングインジケーターを定期的に送信
    message.channel.sendTyping().catch(console.error);
  }, 3000);

  // 質問を取得
  const ask = message.content;

  console.log(`質問: ${ask}`);

  // 返信チェーン全てを取得
  let fetchedMessages;
  fetchedMessages = await getReplyChain(message);
  
  console.log(fetchedMessages);
  
  // 会話履歴
  const history: ChatCompletionMessageParam[] = [];

  // role と content に分けて履歴を整形
  fetchedMessages.forEach((msg) => {
    const name = msg.author.globalName ?? msg.author.username;
    
    // Bot自身の発言
    if (msg.author.id === client.user?.id) {
      history.push({
        role: 'assistant',
        content: msg.content,
      });
      return;
    }

    // ユーザーの発言
    const text = `${name}:${msg.content}`;

    const imageParts = [...msg.attachments.values()]
      .filter((attachment) =>
        attachment.contentType?.startsWith('image/'),
      )
      .map((attachment) => ({
        type: 'image_url' as const,
        image_url: {
          url: attachment.url,
        },
      }));

    history.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text,
        },
        ...imageParts,
      ],
    });
  });



  
  // ================================ここからAIへのリクエスト===================================
  try{
    let success = false;
    let lastError: any = null; // 最後に発生したエラーを保持
    try {
      // Gemini API に質問＋履歴＋画像を送信
      const result = await groq_core(history);
      try {
        // 生成結果をメンションせずに Discord に送信
        await message.reply({
          content: result,
          //allowedMentions: { repliedUser: false },
        });

      } catch (sendError) {// 返信できなかった場合    
        console.error("Discordエラー：返信先が見つかりませんでした。");

      }

      success = true;

    } catch (error: any) {// Groq のエラー
      success = false;
      lastError = error;

    }

    // 失敗時のみエラーメッセージを送信
    if (!success) {
      await message.reply({
        content: `Groq API エラーが発生しました。再試行を試みましたが、残念ながら回答を取得できませんでした。`,
        // allowedMentions: { repliedUser: false },
      });
      console.error("Groq 最終エラー:", lastError);
      if (lastError?.stack) console.error("Groq 最終エラーのスタック:", lastError.stack);
      
      return;
    }

  } catch(error) {// Groqのエラーすら返信できない場合
    console.error("Discordエラー： Groq のエラーの返信先が見つかりませんでした。", error);
    if ((error as any)?.stack) console.error("Discordエラーのスタック:", (error as any).stack);
  
  } finally {
    clearInterval(typingInterval);// タイピングインジケーター停止
    console.log("タスク完了");
  
  }


});


// Discord にログイン
client.login(process.env.DISCORD_TOKEN);

// web サーバーの起動
web();