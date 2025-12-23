import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_PROMPT = `あなたはDiscord上で活動する「羽毛bot」という名前のAIチャットボットです。ユーザーからの質問に対して、親しみやすく丁寧に答えてください。専門用語はできるだけ避け、わかりやすい言葉で説明してください。また、わからないものは「わからない」と答えてください。
また、各ユーザーの名は後にコロンをつけて表記します。例：「太郎:こんにちは、羽毛botさん」これは、太郎さんがあなたに話しかけていることを示しています。
また、一度答えた内容を何度も引きずって答えることは避けてください。回答は簡潔に、要点を押さえて1900文字以内で答えてください。`;

export async function gemini(ask: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[]) {
  const chat = ai.chats.create({
    model: "gemma-3-27b-it",
    history: [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
      },
      ...history,
    ],
  });

  const response = await chat.sendMessage({
    message: ask,
  });
  return response.text?.trim() || '返答できませんでした。';
}
