import { Message } from "discord.js";

export type ReplyChain = Message[] & {
    images: string[];
};

export default async function getReplyChain(message: Message): Promise<ReplyChain> {// 返信チェーンを取得する関数
    const chain: Message[] = [message];

    let current = message;

    while (current.reference) {
        try {
            const parent = await current.fetchReference();
            chain.push(parent);
            current = parent;
        } catch (err) {
            break;
        }
    }

    const orderedChain = chain.reverse(); // 元の順番
    const images = orderedChain.flatMap(currentMessage =>
        [...currentMessage.attachments.values()]
            .filter(attachment => attachment.contentType?.startsWith('image/'))
            .map(attachment => attachment.url),
    );

    return Object.assign(orderedChain, { images });
}