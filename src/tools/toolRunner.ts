import { getDiscordUserInfo } from './getDiscordInfo';

export async function toolRunner(name: string, args: any): Promise<any> {
  switch (name) {
    case 'nowTime':
        console.log(`ツール呼び出し: ${name} args:`, args);
        return Promise.resolve({ time: new Date().toLocaleString() });
    case 'getDiscordUserInfo':
        console.log(`ツール呼び出し: ${name} args:`, args);
        return await getDiscordUserInfo(args.userId);
    default:
      return Promise.resolve({ error: `不明なツール: ${name}` });
  }
}