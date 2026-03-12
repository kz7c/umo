import { Message } from "discord.js";
export default async function getReplyChain(message: Message) {// 返信チェーンを取得する関数
    const chain = [message];

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

    return chain.reverse(); // 元の順番
}