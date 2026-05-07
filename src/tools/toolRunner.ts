import { getDiscordUserInfo } from './getDiscordInfo';
import { getWeatherByLocation, formatWeatherData } from './getWeather';

const WEATHER_CREDIT = `

---
**ライセンス**
- [© OpenStreetMap](https://www.openstreetmap.org/) - 地理情報の取得
- [Weather data by Open-Meteo.com](https://open-meteo.com/) - 天気情報の取得`;

export async function toolRunner(name: string, args: any): Promise<any> {
  switch (name) {
    case 'nowJPTime':
        console.log(`ツール呼び出し: ${name} args:`, args);
        return { time: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) };
    case 'getDiscordUserInfo':
        console.log(`ツール呼び出し: ${name} args:`, args);
        return await getDiscordUserInfo(args.userId);
    case 'getWeatherInfo':
        console.log(`ツール呼び出し: ${name} args:`, args);
        const weatherData = await getWeatherByLocation(args.location, args.timezone || 'Asia/Tokyo');
        const formatted = formatWeatherData(weatherData) + WEATHER_CREDIT;
        return { 
          weather_info: formatted
        };
    default:
      return { error: `不明なツール: ${name}` };
  }
}