import { Type, type FunctionDeclaration } from "@google/genai";

// 使わせたいツール宣言（Geminiに「こういう関数がある」と教える）
export const tools: FunctionDeclaration[] = [
  {
    name: 'nowJPTime',
    description: 'Get the current time in Japan Tokyo.',
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
  {
    name: 'getWeatherInfo',
    description: 'Get current weather information for a location. Uses OpenStreetMap Nominatim to find coordinates from location name, then fetches weather from Open-Meteo API.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: { type: Type.STRING, description: 'Location name (e.g., "Tokyo", "静岡県庁", "Eiffel Tower")' },
        timezone: { type: Type.STRING, description: 'Timezone (e.g., "Asia/Tokyo", optional, default: "Asia/Tokyo")' },
        reason: { type: Type.STRING, description: 'Reason (in Japanese)' },
      },
      required: ['location', 'reason'],
    },
  },
];
