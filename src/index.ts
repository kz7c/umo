import { web } from './components/web';
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { gemini, imageUrlToBase64 } from './components/gemini';
import getReplyChain from './components/getReplyChain';
import { setDiscordClient } from './tools/getDiscordInfo';

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

  //console.log(fetchedMessages);
  
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
  
  // 画像を取得
  const images: any[] = [];
  if (message.attachments.size > 0) {
    for (const [_, attachment] of message.attachments) {
      if (attachment.contentType?.startsWith('image/')) {
        const imageData = await imageUrlToBase64(attachment.url);
        if (imageData) {
          images.push(imageData);
        }
      }
    }
  }
  
  try{

    let tryon = 0;// 再試行のカウンター変数
    let success = false;

    while(tryon < 5) {
      try {
        // Gemini API に質問＋履歴＋画像を送信
        const result = await gemini(ask, history, images.length > 0 ? images : undefined);

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
        break; // 成功したらループを抜ける

      } catch (error: any) {// Gemini のエラー
        if(error?.status !== 500 && error?.statusCode !== 500 && !error?.message?.includes('500')){// 500エラー以外は再試行しない
          await message.reply({
            content: `Gemini API エラーが発生しました。`,
            // allowedMentions: { repliedUser: false },
          });
          break;
        }
        console.error("Gemini API エラー:", error);
      }

      tryon++;
      await new Promise(resolve => setTimeout(resolve, 1000 * (2 ** tryon))); // 再試行前に待機（指数関数的に増加）
    }

    // 失敗時のみエラーメッセージを送信
    if (!success) {
      await message.reply({
        content: `Gemini API エラーが発生しました。再試行を試みましたが、残念ながら回答を取得できませんでした。`,
        // allowedMentions: { repliedUser: false },
      });
    }

  } catch(error) {// Geminiのエラーすら返信できない場合
    console.error("Discordエラー： Gemini のエラーの返信先が見つかりませんでした。");
  
  } finally {
    clearInterval(typingInterval);// タイピングインジケーター停止
    console.log("タスク完了");
  
  }


});


// Discord にログイン
client.login(process.env.DISCORD_TOKEN);

// web サーバーの起動
web();