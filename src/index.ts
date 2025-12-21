import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { gemini } from './gemini';


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

  // メンションされていない場合
  if (!message.mentions.has(client.user)) return;

  // テキストが送信できるチャンネルか確認
  if (!message.channel.isTextBased()){
    console.error("エラー：テキストが送信できないチャンネルからメッセージを受け取りました。");
    return;
  }


  // ===================================ここから正常な処理===================================


  // メンション部分を除去して質問文だけを取得
  const ask = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();

  // 過去メッセージを最大4件取得
  const fetchedMessages = await message.channel.messages.fetch({ limit: 4});

  // Gemini に渡す会話履歴
  const history: {
    role: 'user' | 'assistant';
    content: string;
  }[] = [];

  // 古い順に並び替え
  fetchedMessages.reverse().forEach(msg => {

    const name = msg.author.globalName ?? msg.author.username;

    if (msg.author.id === client.user?.id) {// 羽毛の発言

      history.push({
        role: 'assistant',
        content: `${msg.content}`,
      });

    } else {// 他者の発言
      
      history.push({
        role: 'user',
        content: `${name}:${msg.content}`,
      });
    
    }

  });

  try{

    try {
      
      // Gemini API に質問＋履歴を送信
      const result = await gemini(ask, history);

      try {
      
        // 生成結果をメンションせずに Discord に送信
        await message.reply({
          content: result,
          allowedMentions: { repliedUser: false },
        });
      
      } catch (sendError) {// 返信できなかった場合
    
        console.error("エラー：返信先が見つかりませんでした。");

      }

    } catch (error) {// Gemini のエラー
      
      await message.reply({
        content: `処理中にエラーが発生しました。`,
        allowedMentions: { repliedUser: false },
      });
    
    }

  } catch(error) {// Geminiのエラーすら返信できない場合

    console.error("エラー： Gemini のエラーの返信先が見つかりませんでした。");
  
  }

});


// Discord にログイン
client.login(process.env.DISCORD_TOKEN);
