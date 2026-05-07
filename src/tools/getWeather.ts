export interface NominatimResponse {
  lat: string;
  lon: string;
  address?: any;
  name?: string;
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  location?: string;
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    is_day?: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
    precipitation_sum?: number[];
  };
  error?: string;
}

// OpenStreetMap Nominatimで地名から座標を取得
export async function getCoordinatesFromLocation(
  location: string
): Promise<{ latitude: number; longitude: number; locationName: string } | null> {
  try {
    const params = new URLSearchParams({
      q: location,
      format: 'json',
      limit: '1',
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'umo-weather-bot',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as NominatimResponse[];

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      locationName: result.address?.city || result.address?.town || result.name || location,
    };
  } catch (error: any) {
    console.error(`Failed to get coordinates from location: ${error.message}`);
    return null;
  }
}

// 天気コードを日本語で説明する
function describeWeatherCode(code: number): string {
  const descriptions: { [key: number]: string } = {
    0: '快晴',
    1: 'ほぼ快晴',
    2: '部分的に曇り',
    3: '曇り',
    45: '霧',
    48: '霜を伴う霧',
    51: '軽い霧雨',
    53: '中程度の霧雨',
    55: '激しい霧雨',
    61: '軽い雨',
    63: '中程度の雨',
    65: '激しい雨',
    71: '軽い雪',
    73: '中程度の雪',
    75: '激しい雪',
    77: '雪粒',
    80: '軽い一時雨',
    81: '中程度の一時雨',
    82: '激しい一時雨',
    85: '軽い一時雪',
    86: '激しい一時雪',
    95: '雷を伴う雨',
    96: '雹を伴う雷雨',
    99: '雹を伴う雷雨',
  };
  return descriptions[code] || '不明な天気';
}

export async function getWeather(
  latitude: number,
  longitude: number,
  timezone: string = 'Asia/Tokyo',
  locationName?: string
): Promise<WeatherResponse> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day',
      daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum',
      timezone: timezone,
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    
    if (!response.ok) {
      return {
        latitude,
        longitude,
        timezone,
        location: locationName,
        error: `Open-Meteo API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as WeatherResponse;
    data.location = locationName;
    return data;
  } catch (error: any) {
    return {
      latitude,
      longitude,
      timezone,
      location: locationName,
      error: `Failed to fetch weather: ${error.message}`,
    };
  }
}

// 地名から天気を取得（Nominatim + Open-Meteo）
export async function getWeatherByLocation(
  location: string,
  timezone?: string
): Promise<WeatherResponse> {
  const coords = await getCoordinatesFromLocation(location);

  if (!coords) {
    return {
      latitude: 0,
      longitude: 0,
      timezone: timezone || 'Asia/Tokyo',
      location,
      error: `Could not find location: ${location}`,
    };
  }

  return getWeather(coords.latitude, coords.longitude, timezone || 'Asia/Tokyo', coords.locationName);
}

export function formatWeatherData(data: WeatherResponse): string {
  if (data.error) {
    return `エラー: ${data.error}`;
  }

  let result = '';
  if (data.location) {
    result += `【${data.location}の天気】\n`;
  }
  result += `位置: 緯度 ${data.latitude}, 経度 ${data.longitude}\n\n`;

  if (data.current) {
    result += `【現在の天気】\n`;
    if (data.current.temperature_2m !== undefined) {
      result += `気温: ${data.current.temperature_2m}°C\n`;
    }
    if (data.current.relative_humidity_2m !== undefined) {
      result += `湿度: ${data.current.relative_humidity_2m}%\n`;
    }
    if (data.current.weather_code !== undefined) {
      result += `天気: ${describeWeatherCode(data.current.weather_code)}\n`;
    }
    if (data.current.wind_speed_10m !== undefined) {
      result += `風速: ${data.current.wind_speed_10m} km/h\n`;
    }
    if (data.current.wind_direction_10m !== undefined) {
      result += `風向: ${data.current.wind_direction_10m}°\n`;
    }
  }

  return result;
}
