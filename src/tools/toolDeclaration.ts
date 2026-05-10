import { Interactions, Type } from '@google/genai';

// 使わせたいツール宣言（Geminiに「こういう関数がある」と教える）
export const tools: Interactions.Tool[] = [
  { 
    type: 'google_search' // Google検索を行うツール
  },
  {
    type: 'google_maps'// 地図情報を取得するツール
  },
  {
    type: 'url_context'// URLの内容を取得してコンテキストとして提供するツール
  },
  {
    type: 'function',
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
    type: 'function',
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
    type: 'function',
    name: 'getLocationInfo',
    description: 'Get geographic coordinates (latitude, longitude) and location name from a location string. Uses OpenStreetMap Nominatim API.',
    parameters: {
      type: "object",
      properties: {
        location: { type: Type.STRING, description: 'Location name (e.g., "Tokyo", "Mount Fuji", "Eiffel Tower", "Paris")' },
        reason: { type: Type.STRING, description: 'Reason (in Japanese)' },
      },
      required: ['location', 'reason'],
    },
  },
  {
    type: 'function',
    name: 'getWeatherInfo',
    description: 'Get hourly and daily weather information for a location on a specific date. Uses OpenStreetMap Nominatim to find coordinates, then fetches detailed weather from Open-Meteo API.',
    parameters: {
      type: "object",
      properties: {
        latitude: { type: Type.NUMBER, description: 'Latitude of the location' },
        longitude: { type: Type.NUMBER, description: 'Longitude of the location' },
        locationName: { type: Type.STRING, description: 'Location name (e.g., "Tokyo", "静岡県庁", "Eiffel Tower")' },
        date: { type: Type.STRING, description: 'Target date in YYYY-MM-DD format (e.g., "2026-05-08")' },
        timezone: { type: Type.STRING, description: 'Timezone (e.g., "Asia/Tokyo", optional, default: "Asia/Tokyo")' },
        reason: { type: Type.STRING, description: 'Reason (in Japanese)' },
      },
      required: ['latitude', 'longitude', 'locationName', 'date', 'reason'],
    },
  },
];
