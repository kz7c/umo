import { tavily } from "@tavily/core";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';
const tvly = tavily({ apiKey: TAVILY_API_KEY });

export async function getSearch(text: string): Promise<string> {
    const result = await tvly.search(text, { maxResults: 10 });
    
    //console.log("Search results:", result.results.filter(({ score }) => score >= 0.5)// 0.5以上のスコアを持つ結果のみを返す
    //        .sort((a, b) => b.score - a.score) // スコアの降順でソート
    //        .slice(0, 4)// 最大4件までに制限
    //        .map(({ url, title, content, score }) => ({
    //            url,
    //            title,
    //            content: content.slice(0, 1000),
                //score,
    //        })));

    return JSON.stringify(
        result.results
            .filter(({ score }) => score >= 0.5)// 0.5以上のスコアを持つ結果のみを返す
            .sort((a, b) => b.score - a.score) // スコアの降順でソート
            .slice(0, 4)// 最大4件までに制限
            .map(({ url, title, content, score }) => ({
                url,
                title,
                content: content.slice(0, 1000),
                //score,
            }))
    );
}