import { Type, type FunctionDeclaration } from "@google/genai";

// 使わせたいツール宣言（Geminiに「こういう関数がある」と教える）
export const tools: FunctionDeclaration[] = [
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
  {
    name: 'getDiscordUserInfo',
    description: 'Get information about a Discord user.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userId: { type: Type.STRING, description: 'Discord user ID' },
        reason: { type: Type.STRING, description: 'Reason (in Japanese)' },
      },
      required: ['userId', 'reason'],
    },
  },
];
