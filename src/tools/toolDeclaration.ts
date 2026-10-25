export const tools = [
  {
    type: "function",
    function: {
      name: "nowJPTime",
      description: 'Get the current time in Japan Tokyo.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Reason (in Japanese)' },
        },
        required: ['reason'],
      },
    },
  },

  {
    type: "function",
    function: {
      name: 'getDiscordUserInfo',
      description: 'Get information about a Discord user.',
      parameters: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'Discord user ID' },
          reason: { type: 'string', description: 'Reason (in Japanese)' },
        },
        required: ['userId', 'reason'],
      },
    },
  },

  {
    type: "function",
    function: {
      name: 'getLocationInfo',
      description: 'Get geographic coordinates (latitude, longitude) and location name from a location string. Uses OpenStreetMap Nominatim API.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'Location name (e.g., "Tokyo", "Mount Fuji", "Eiffel Tower", "Paris")' },
          reason: { type: 'string', description: 'Reason (in Japanese) must include the string "[© OpenStreetMap](https://www.openstreetmap.org/)"' },
        },
        required: ['location', 'reason'],
      },
    },
  },

  {
    type: "function",
    function: {
      name: 'getWeatherInfo',
      description: 'Get hourly and daily weather information for a location on a specific date. Uses OpenStreetMap Nominatim to find coordinates, then fetches detailed weather from Open-Meteo API.',
      parameters: {
        type: 'object',
        properties: {
          latitude: { type: 'number', description: 'Latitude of the location' },
          longitude: { type: 'number', description: 'Longitude of the location' },
          locationName: { type: 'string', description: 'Location name (e.g., "Tokyo", "静岡県庁", "Eiffel Tower")' },
          date: { type: 'string', description: 'Target date in YYYY-MM-DD format (e.g., "2026-05-08")' },
          timezone: { type: 'string', description: 'Timezone (e.g., "Asia/Tokyo", optional, default: "Asia/Tokyo")' },
          reason: { type: 'string', description: 'Reason (in Japanese) must include the string "[Weather data by Open-Meteo.com](https://open-meteo.com/)"' },
        },
        required: ['latitude', 'longitude', 'locationName', 'date', 'reason'],
      },
    },
  },

  {
    type: "function",
    function: {
      name: 'getSearch',
      description: 'Search for information on the internet.',
      parameters: {
        type: 'object',
        properties: {
          terms: { type: 'string', description: 'Search terms' },
          reason: { type: 'string', description: 'Reason (in Japanese)' },
        },
        required: ['terms', 'reason'],
      },
    },
  },
];

