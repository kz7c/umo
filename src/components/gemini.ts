import 'dotenv/config';
import { GoogleGenAI, Type, type FunctionDeclaration, type GenerateContentResponse } from "@google/genai";
import { toolRunner } from '../tools/toolRunner';
import fetch from 'node-fetch';

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

const SYSTEM_PROMPT = `あなたはDiscord上で活動する「羽毛」という名前のAIチャットボットです。ユーザーからの質問に対して、親しみやすく丁寧に答えてください。専門用語はできるだけ避け、わかりやすい言葉で説明してください。また、わからないものは「わからない」と答えてください。
また、各ユーザーの名は後にコロンをつけて表記します。例：「太郎:こんにちは、羽毛さん」これは、太郎さんがあなたに話しかけていることを示しています。
また、一度答えた内容を何度も引きずって答えることは避けてください。回答は簡潔に、要点を押さえて1900文字以内で答えてください。`;

const MAX_DEPTH = 5;// 無限ループ防止のため、ツール呼び出しの最大深度を設定

// 使わせたいツール宣言（Geminiに「こういう関数がある」と教える）
const tools: FunctionDeclaration[] = [
  {
    name: 'nowTime',
    description: 'Get the current time.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: { type: Type.STRING, description: 'Reason (in Japanese)' },
      },
      required: ['reason'],
    },
  },
];


// ここでGeminiを呼び出す
export async function gemini(
  ask: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  images?: ImageData[]
) {
  const chat = ai.chats.create({
    model: "gemma-4-31b-it",
    history: history,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [
        {
          functionDeclarations: tools,
        },
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

        return {
          functionResponse: {
            name,
            id,
            response: toolRunnerResult ?? { error: 'No response from tool' },
          },
        };
      })
    );

    // ツール呼び出しの結果を Gemini に送信し、次のレスポンスを取得
    response = await chat.sendMessage({ message: toolResponseParts });

  }

  return response.text?.trim() || '返答できませんでした。';
}

