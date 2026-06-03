import OpenAI from "openai";
import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/chat/completions";
import 'dotenv/config';
//import { toolRunner } from '../tools/toolRunner.ts';
//import { tools } from '../tools/toolDeclaration.ts';


/*-------------------
        Configs
-------------------*/
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const baseURL = "https://generativelanguage.googleapis.com/v1beta/openai/";

const SYSTEM_PROMPT = `あなたはDiscord上で活動する「羽毛」という名前のAIチャットボットです。ユーザーからの質問に対して、親しみやすく丁寧に答えてください。また、わからないものは「わからない」と答えてください。
また、各ユーザーの名は後にコロンをつけて表記します。例：「太郎:こんにちは、羽毛さん」これは、太郎さんがあなたに話しかけていることを示しています。
また、あなたのDiscord上のユーザIDは「${DISCORD_CLIENT_ID}」です。メッセージにそれが含まれている場合はあなたへのメンションと判断してください。
また、一度答えた内容を何度も引きずって答えることは避けてください。回答は簡潔に、要点を押さえて1900文字以内で答えてください。
なお、必要に応じてツールを呼び出すことができますが、５回以上は呼び出せません。
重要: ツール実行後、結果に「使用したAPI」や「クレジット表記」が含まれている場合は、それを必ず回答の最後に含めてください。削除したり省略したりしないでください。
<thought>タグや推論過程を出力しないでください。最終回答のみを返してください。`;


/*-------------------
        Types
-------------------*/
type HistoryMessage =
  | ChatCompletionUserMessageParam
  | ChatCompletionAssistantMessageParam;


/*-------------------
        Actions
-------------------*/
const openai = new OpenAI({
    apiKey: GEMINI_API_KEY,
    baseURL: baseURL
});

export async function umo_ai(
    history: HistoryMessage[],
    cachedToolResponses?: any[] // キャッシュされたツール結果
): Promise<string> {

    const response = await openai.chat.completions.create({
        model: "gemma-4-31b-it",
        messages: [
            {   role: "system",
                content: SYSTEM_PROMPT
            },
            ...history
        ] satisfies ChatCompletionMessageParam[],
        extra_body: {
            google: {
                thinking_config: {
                thinking_level: "none"
                }
            }
        }
    }as any);

    const rawContent = response.choices[0].message.content ?? "";

    console.log("=== OpenAI 生の応答 ===");
    console.log(rawContent);
    console.log("========================");
    return rawContent
      .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
      .trim();
}