import { web } from './components/web';
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { gemini } from './components/gemini';
import getReplyChain from './components/getReplyChain';

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
  await message.channel.sendTyping(); 

  // メンション部分を除去して質問文だけを取得
  const ask = message.content.slice(`<@!?${client.user.id}>`.length - 1).trim();

  // 直近のメッセージを取得（今の message は除外）
  let fetchedMessages;

  // 返信チェーン全てを取得
  fetchedMessages = await getReplyChain(message);
  /*if (message.channel.isThread()) {
    // スレッド内：直前の20件
    fetchedMessages = await message.channel.messages.fetch({
      limit: 20,
      before: message.id,
    });

  } else {
    // 通常チャンネル：直前の10件
    fetchedMessages = await message.channel.messages.fetch({
      limit: 10,
      before: message.id,
    });

  }*/

  // console.log(fetchedMessages);
  
  // Gemini に渡す会話履歴
  const history: {
    role: 'user' | 'model';
    parts: { text: string }[];
  }[] = [];

  // role と content に分けて履歴を整形
  fetchedMessages.forEach(msg => {

    const name = msg.author.globalName ?? msg.author.username;

    if (msg.author.id === client.user?.id) {// 羽毛の発言
    
      history.push({
        role: 'model',
        parts: [{ text: `${msg.content}` }],
      });

    } else {// 他者の発言
      
      history.push({
        role: 'user',
        parts: [{ text: `${name}:${msg.content}` }],
      });
    
    }

  });
  // console.log(JSON.stringify(history, null, 2));
  
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
        content: 'Gemini API エラーが発生しました。',
        allowedMentions: { repliedUser: false },
      });
    
    }

  } catch(error) {// Geminiのエラーすら返信できない場合

    console.error("エラー： Gemini のエラーの返信先が見つかりませんでした。");
  
  }

});


// Discord にログイン
client.login(process.env.DISCORD_TOKEN);

// web サーバーの起動
web();