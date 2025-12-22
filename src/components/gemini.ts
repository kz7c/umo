import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 会話履歴付きで質問して返答を取得する関数
export async function gemini(
  content: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  // 過去の履歴＋今回の質問をまとめる
  const messages = [...history, { role: 'user', content }];

  // 現状 generateContent は単純に文字列を送信
  const response = await ai.models.generateContent({
    model: 'gemma-3-27b-it',
    contents: messages.map(m => m.content).join('\n'),
  });

  // 空文字の場合はデフォルトメッセージを返す
  return response.text?.trim() || '返答できませんでした。';
}
