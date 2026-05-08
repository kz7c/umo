import { getDiscordUserInfo } from './getDiscordInfo';
import { getLocation } from './getLocation';
import { getWeather } from './getWeather';
import { formatWeatherData } from './getWeather';

const LOCATION_CREDIT = `[© OpenStreetMap](https://www.openstreetmap.org/) - 地理情報の取得`;
const WEATHER_CREDIT = `[Weather data by Open-Meteo.com](https://open-meteo.com/) - 天気情報の取得`;

export async function toolRunner(name: string, args: any): Promise<any> {
  switch (name) {
    case 'nowJPTime':
        console.log(`ツール呼び出し: ${name} args:`, args);
        return { time: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) };
    
    case 'getDiscordUserInfo':
        console.log(`ツール呼び出し: ${name} args:`, args);
        if (!args || !args.userId) {
          return { error: 'userId is required' };
        }
        return await getDiscordUserInfo(args.userId);

    case 'getLocationInfo':
        console.log(`ツール呼び出し: ${name} args:`, args);
        if (!args || !args.location) {
          return { error: 'location is required' };
        }
        return { data: await getLocation(args.location), credit: LOCATION_CREDIT };

    case 'getWeatherInfo':
        console.log(`ツール呼び出し: ${name} args:`, args);
        // 引数チェック
        if (!args || !args.latitude || !args.longitude || !args.locationName || !args.date) {
          return { error: 'latitude, longitude, locationName, date, and timezone are required' };
        }

        // 天気データを取得して整形して返す
        const weatherData = await getWeather(args.latitude, args.longitude, args.date, args.timezone || 'Asia/Tokyo', args.locationName);
        const formatted = formatWeatherData(weatherData) + WEATHER_CREDIT;
        return JSON.parse(JSON.stringify({
          data: formatted,
          credit: WEATHER_CREDIT
        }));

    
    default:
      return { error: `不明なツール: ${name}` };
  }
}