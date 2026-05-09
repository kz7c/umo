import 'dotenv/config';
import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { toolRunner } from '../tools/toolRunner';
import { tools } from '../tools/toolDeclaration';
import fetch from 'node-fetch';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 画像データの型定義
type ImageData = {
  data: string; // Base64 encoded image data
  mimeType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
};

// URLから画像をBase64に変換する関数
export async function imageUrlToBase64(imageUrl: string): Promise<ImageData | null> {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    const contentType = response.headers.get('content-type');
    let mimeType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' = 'image/jpeg';
    
    if (contentType?.includes('png')) mimeType = 'image/png';
    else if (contentType?.includes('gif')) mimeType = 'image/gif';
    else if (contentType?.includes('webp')) mimeType = 'image/webp';
    
    return { data: base64, mimeType };
  } catch (error) {
    console.error('画像の変換に失敗しました:', error);
    return null;
  }
}

const SYSTEM_PROMPT = `あなたはDiscord上で活動する「羽毛」という名前のAIチャットボットです。ユーザーからの質問に対して、親しみやすく丁寧に答えてください。また、わからないものは「わからない」と答えてください。
また、各ユーザーの名は後にコロンをつけて表記します。例：「太郎:こんにちは、羽毛さん」これは、太郎さんがあなたに話しかけていることを示しています。
また、あなたのDiscord上のユーザIDは「${DISCORD_CLIENT_ID}」です。メッセージにそれが含まれている場合はあなたへのメンションと判断してください。
また、一度答えた内容を何度も引きずって答えることは避けてください。回答は簡潔に、要点を押さえて1900文字以内で答えてください。
なお、必要に応じてツールを呼び出すことができますが、５回以上は呼び出せません。
重要: ツール実行後、結果に「使用したAPI」や「クレジット表記」が含まれている場合は、それを必ず回答の最後に含めてください。削除したり省略したりしないでください。`;

const MAX_DEPTH = 6;// 無限ループ防止のため、ツール呼び出しの最大深度を設定

// ツール実行結果の型定義
export type ToolExecutionResult = {
  text: string;
  toolResponses?: any[];
};

// ここでGeminiを呼び出す
export async function gemini(
  ask: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  images?: ImageData[],
  cachedToolResponses?: any[] // キャッシュされたツール結果
) {
  const chat = ai.chats.create({
    model: "gemma-4-31b-it",
    history: history,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      toolConfig: {
          includeServerSideToolInvocations: true,
      },
      tools: [
        {
          functionDeclarations: tools,
        },
        {
          googleSearch: {},
        }
      ],
    },
  });

  // メッセージのpartsを構築（テキスト＋画像）
  const messageParts: any[] = [{ text: ask }];
  
  if (images && images.length > 0) {
    for (const image of images) {
      messageParts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      });
    }
  }

  // Gemini API に質問＋履歴を送信
  let response = await chat.sendMessage({
    message: messageParts.length === 1 ? ask : messageParts,
  });

  let depth = 0;// カウンター変数
  let toolResponses: any[] = [];// ツール実行結果をキャッシュ

  // キャッシュされたツール結果がある場合は使用
  if (cachedToolResponses && cachedToolResponses.length > 0) {
    response = await chat.sendMessage({ message: cachedToolResponses });
    return {
      text: response.text?.trim() || '返答できませんでした。',
      toolResponses: cachedToolResponses,
    };
  }

  while (response.functionCalls?.length && depth < MAX_DEPTH) {
    depth++;

    const toolResponseParts = await Promise.all(
      response.functionCalls.map(async (fc) => {
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

