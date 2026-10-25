import 'dotenv/config';
import Groq from 'groq-sdk';
import { tools } from '../tools/toolDeclaration.js';
import { toolRunner } from '../tools/toolRunner.js';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
const groq = new Groq({ apiKey: GROQ_API_KEY });

const GROQ_MODEL = 'qwen/qwen3.8-27b';
const MAX_TOOL_CALL_DEPTH = 6;
const MAX_RETRIES = 3; // 最大リトライ回数を設定
const SYSTEM_PROMPT = `あなたはDiscord上で活動する「羽毛」という名前のAIチャットボットです。わからないものは「わからない」と答えてください。
例：「太郎:こんにちは、羽毛さん」これは、太郎さんがあなたに話しかけていることを示しています。
あなたのDiscord上のユーザIDは「${DISCORD_CLIENT_ID}」です。メッセージにそれが含まれている場合はあなたへのメンションと判断してください。
回答は簡潔に、要点を押さえて1900文字以内で答えてください。
マークダウン形式の表、TeX形式の数式は利用できません。
グラフは、https://www.wolframalpha.com/input?i=plot+ の後にurlエンコードした数式を入力することで描画できます。https://www.wolframalpha.com/input?i=plot+y%3D2x%5E2%2B3x%2B5%2Cy%3D2x%2B1 このようにすることで、２つの数式を同時に描画できます。グラフを描く場合は、URLを提示してください。
なお、必要に応じてツールを呼び出すことができますが、${MAX_TOOL_CALL_DEPTH}回以上は呼び出せません。`;


export async function groq_core(history?: Groq.Chat.ChatCompletionMessageParam[]):Promise<string> {  // メッセージの取得 ※暫定
  const messages : any[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...(history || []),
  ];

  // ツール呼び出しの理由を格納する配列
  let tool_reasons :string[] = []

  // ツール呼び出しの深さを制限するためのループ
  for (let depth = 0; depth < MAX_TOOL_CALL_DEPTH +1; depth++) {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: 900
    },
    { 
      maxRetries: MAX_RETRIES
    });

    const message = response.choices[0].message;

    // AIの応答を会話履歴に追加
    messages.push(message);

    // ツール呼び出しがなければここで終了
    if (!message.tool_calls?.length) {
      let msgContent = "";
      for (const part of tool_reasons) {
        msgContent += "-# " + part + "\n";
      }
      msgContent += message.content ?? '';

      return msgContent;
    }

    // 要求されたツールを実行
    for (const toolCall of message.tool_calls) {
      const toolArguments = JSON.parse(toolCall.function.arguments) as {
        reason?: string;
        [key: string]: unknown;
      };

      tool_reasons.push( "[" + toolCall.function.name + "]" + (toolArguments.reason ?? ''));

      const result = await toolRunner(
        toolCall.function.name,
        toolArguments,
      );

      // 実行結果をAIに返す
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

  }

  throw new Error('ツール呼び出しの上限に達しました');
}