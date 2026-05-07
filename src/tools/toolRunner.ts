import { getDiscordUserInfo } from './getDiscordInfo';
import { getWeatherByLocation, formatWeatherData } from './getWeather';

export async function toolRunner(name: string, args: any): Promise<any> {
  switch (name) {
    case 'nowJPTime':
        console.log(`ツール呼び出し: ${name} args:`, args);
        return Promise.resolve({ time: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) });
    case 'getDiscordUserInfo':
        console.log(`ツール呼び出し: ${name} args:`, args);
        return await getDiscordUserInfo(args.userId);
    case 'getWeatherInfo':
        console.log(`ツール呼び出し: ${name} args:`, args);
        const weatherData = await getWeatherByLocation(args.location, args.timezone || 'Asia/Tokyo');
        return { formatted: formatWeatherData(weatherData), raw: weatherData };
    default:
      return Promise.resolve({ error: `不明なツール: ${name}` });
  }
}