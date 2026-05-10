import 'dotenv/config';
import { Interactions, Type ,GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { toolRunner } from '../tools/toolRunner';
import { tools } from '../tools/toolDeclaration';
import fetch from 'node-fetch';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_PROMPT = `あなたはDiscord上で活動する「羽毛」という名前のAIチャットボットです。ユーザーからの質問に対して、親しみやすく丁寧に答えてください。また、わからないものは「わからない」と答えてください。
また、各ユーザーの名は後にコロンをつけて表記します。例：「太郎:こんにちは、羽毛さん」これは、太郎さんがあなたに話しかけていることを示しています。
また、あなたのDiscord上のユーザIDは「${DISCORD_CLIENT_ID}」です。メッセージにそれが含まれている場合はあなたへのメンションと判断してください。
また、一度答えた内容を何度も引きずって答えることは避けてください。回答は簡潔に、要点を押さえて1900文字以内で答えてください。
なお、必要に応じてツールを呼び出すことができますが、５回以上は呼び出せません。
重要: ツール実行後、結果に「使用したAPI」や「クレジット表記」が含まれている場合は、それを必ず回答の最後に含めてください。削除したり省略したりしないでください。`;

const MAX_DEPTH = 6;// 無限ループ防止のため、ツール呼び出しの最大深度を設定(使うたびに減らす)

// ツール実行結果の型定義
export type ToolExecutionResult = {
  text: string;
  toolResponses?: any[];
};


// ここでGeminiを呼び出す
export async function gemini(
  text: string,
  interactionId: string | null,
  images?: string[],
) {
  // メッセージのpartsを構築
  const inputParts: any[] = [{ type: 'text', text: text }];
  
  // 画像がある場合はpartsに追加
  if (images && images.length > 0) {
    for (const uri of images) {
      inputParts.push({
        inlineData: {
          type: 'image',
          uri: uri,
        },
      });
    }
  }

  // Genaiに送信
  const interactionFrame = {
    model: "gemma-4-31b-it",
    input: inputParts,
    tools: tools,
    system_instruction: SYSTEM_PROMPT,
    ...(interactionId ? { previous_interaction_id: interactionId } : {}),// 前回のやりとりがある場合はIDを渡す
  };
  const interaction = await ai.interactions.create(interactionFrame);

  if (!interaction) {
    return { text: 'Gemini APIからの応答がありませんでした。' };
  }

  /*if(interaction.steps && interaction.steps.length >0){
    for (const step of interaction.steps) {
        if (step.type === 'function_call') {
        console.log(`Function to call: ${step.name}`);
        console.log(`Arguments: ${JSON.stringify(step.arguments)}`);
        }
    }
  }*/

  let depth = 0;//カウンター変数
  while (interaction.steps?.length && depth < MAX_DEPTH) {
    depth++;

    const toolResponseParts = await Promise.all(
      response.functionCalls.map(async (fc: any) => {
        const name = fc.name ?? '';    // 呼び出されたツールの名前
        const id = fc.id ?? '';        // 呼び出しID（レスポンスと紐づけるため）
        const args = fc.args ?? {};    // ツールに渡された引数

        if (!name || !id) {
          return {
            functionResponse: {
              name: name || 'unknown',
              id,
              response: { error: 'Tool call missing name or id' },
            },
          };
        }

        const toolRunnerResult = await toolRunner(name, args);

        const toolResponse = {
          functionResponse: {
            name,
            id,
            response: toolRunnerResult ?? { error: 'No response from tool' },
          },
        };
        toolResponses.push(toolResponse); // キャッシュに追加
        return toolResponse;
      })
    );

    // ツール呼び出しの結果を Gemini に送信し、次のレスポンスを取得
    response = await chat.sendMessage({ message: toolResponseParts });

  }

  return {
    text: response.text?.trim() || '返答できませんでした。',
    toolResponses: toolResponses.length > 0 ? toolResponses : undefined,
  };
}

