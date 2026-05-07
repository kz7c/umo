import { Client } from 'discord.js';

let client: Client;

export function setDiscordClient(discordClient: Client) {
  client = discordClient;
}

export async function getDiscordUserInfo(userId: string) {
  if (!client) {
    return { error: 'Discord client not initialized' };
  }

  try {
    // まずキャッシュから取得
    let user = client.users.cache.get(userId);
    
    // キャッシュにないなら API 呼び出し
    if (!user) {
      user = await client.users.fetch(userId);
    }

    return {
      id: user.id,
      username: user.username,
      globalName: user.globalName,
      discriminator: user.discriminator,
      avatar: user.avatarURL(),
      bot: user.bot,
      system: user.system,
      createdAt: user.createdAt?.toISOString(),
    };
  } catch (error: any) {
    return { error: `User not found: ${error.message}` };
  }
}
