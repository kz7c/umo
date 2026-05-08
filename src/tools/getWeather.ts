// 天気情報のレスポンス
export interface WeatherResponse {
  latitude: number; // 緯度
  longitude: number; // 経度
  timezone: string; // タイムゾーン（例: Asia/Tokyo）
  location?: string; // 地名（オプション）
  current?: CurrentWeather;
  hourly?: HourlyWeather;
  daily?: DailyWeather;
  error?: string; // エラーメッセージ（エラー時のみ存在）
}

// 現在の天気情報
interface CurrentWeather {
  temperature_2m?: number; // 気温（℃）
  relative_humidity_2m?: number; // 相対湿度（%）
  weather_code?: number; // 天気コード（0-99）
  wind_speed_10m?: number; // 10m風速（km/h）
  wind_direction_10m?: number; // 10m風向（度）
  is_day?: number; // 昼間フラグ（0=夜、1=昼）
}

// 1時間ごとの天気情報
interface HourlyWeather {
  time?: string[]; // 日時情報の配列（ISO 8601形式）
  temperature_2m?: number[]; // 気温の配列（℃）
  weather_code?: number[]; // 天気コードの配列
  precipitation?: number[]; // 降水量の配列（mm）
  wind_speed_10m?: number[]; // 10m風速の配列（km/h）
}

// 1日単位の天気情報
interface DailyWeather {
  time?: string[]; // 日時情報の配列
  temperature_2m_max?: number[]; // 最高気温の配列（℃）
  temperature_2m_min?: number[]; // 最低気温の配列（℃）
  weather_code?: number[]; // 天気コードの配列
  precipitation_sum?: number[]; // 降水量の合計の配列（mm）
}


// 天気コードを日本語で説明
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


// step1 天気データをAPIから取得する関数============================================
export async function getWeather(
  latitude: number,
  longitude: number,
  date: string,
  timezone: string = 'Asia/Tokyo',
  locationName?: string
): Promise<WeatherResponse> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day',
      hourly: 'temperature_2m,weather_code,precipitation,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min,weather_code',
      start_date: date,
      end_date: date,
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
  } catch (error) {
    const err: any = error;
    return {
      latitude,
      longitude,
      timezone,
      location: locationName,
      error: `Failed to fetch weather: ${err?.message || err}`,
    };
  }
}



// step2 天気データを見やすい形式に整形して返す関数=================================
export function formatWeatherData(data: WeatherResponse): string {
  // エラーが存在する場合
  if (data.error) {
    return `エラー: ${data.error}`;
  }

  let result = '';
  
  // ヘッダー情報
  if (data.location) {
    result += `【${data.location}の1時間ごとの天気予報】\n`;
  }
  result += `位置: 緯度 ${data.latitude}, 経度 ${data.longitude}\n`;
  result += `タイムゾーン: ${data.timezone}\n\n`;

  // 現在の天気情報を出力
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
    result += `\n`;
  }

  // 日間データを出力
  if (data.daily && data.daily.time && data.daily.time.length > 0) {
    result += `【日間の天気】\n`;
    result += `${'日付'.padEnd(12)} | ${'最高気温'.padEnd(8)} | ${'最低気温'.padEnd(8)} | ${'天気'}\n`;
    result += `-`.repeat(50) + `\n`;
    
    for (let i = 0; i < data.daily.time.length; i++) {
      const dateStr = data.daily.time[i];
      const maxTemp = data.daily.temperature_2m_max?.[i] ?? 'N/A';
      const minTemp = data.daily.temperature_2m_min?.[i] ?? 'N/A';
      const weather = data.daily.weather_code?.[i] !== undefined
        ? describeWeatherCode(data.daily.weather_code[i])
        : 'N/A';
      
      result += `${dateStr.padEnd(12)} | ${String(maxTemp).padEnd(8)} | ${String(minTemp).padEnd(8)} | ${weather}\n`;
    }
    result += `\n`;
  }

  // 1時間ごとのデータを出力
  if (data.hourly && data.hourly.time && data.hourly.time.length > 0) {
    result += `【時間ごとの天気】\n`;
    result += `${'時刻'.padEnd(20)} | ${'気温'.padEnd(8)} | ${'天気'.padEnd(12)} | ${'降水量'.padEnd(8)} | ${'風速'}\n`;
    result += `-`.repeat(70) + `\n`;
    
    // 各時間のデータをループして出力
    for (let i = 0; i < data.hourly.time.length; i++) {
      const time = data.hourly.time[i]; // ISO 8601形式の日時
      const temp = data.hourly.temperature_2m?.[i] ?? 'N/A'; // 気温
      const weather = data.hourly.weather_code?.[i] !== undefined 
        ? describeWeatherCode(data.hourly.weather_code[i]) 
        : 'N/A'; // 天気
      const precip = data.hourly.precipitation?.[i] ?? 0; // 降水量
      const wind = data.hourly.wind_speed_10m?.[i] ?? 'N/A'; // 風速
      
      // 時刻を HH:MM 形式に抽出
      const timeStr = time.split('T')[1]?.substring(0, 5) || time;
      
      result += `${timeStr.padEnd(20)} | ${String(temp).padEnd(8)} | ${weather.padEnd(12)} | ${String(precip).padEnd(8)} | ${wind}\n`;
    }
  } else {
    result += `利用可能な時間ごとのデータがありません\n`;
  }

  return result;
}
