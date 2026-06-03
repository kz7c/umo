import { Message } from "discord.js";

export async function messageToOpenAI(message: Message) {
  const content: any[] = [];

  // テキスト
  if (message.content) {
    content.push({
      type: "text",
      text: message.content,
    });
  }

  // 添付画像
  for (const attachment of message.attachments.values()) {
    if (attachment.contentType?.startsWith("image/")) {
      const response = await fetch(attachment.url);
      const buffer = Buffer.from(await response.arrayBuffer());

      content.push({
        type: "image_url",
        image_url: {
          url: `data:${attachment.contentType};base64,${buffer.toString("base64")}`,
        },
      });
    }
  }

  return {
    role: message.author.bot ? "assistant" : "user",
    content,
  };
}