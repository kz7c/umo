import 'dotenv/config';
import { Interactions, Type, GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { toolRunner } from '../tools/toolRunner';
import { tools } from '../tools/toolDeclaration';
import fetch from 'node-fetch';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_PROMPT = `あなたはDiscord上で活動する「羽毛」という名前のAIチャットボットです。ユーザーからの質問に対して、親しみやすく丁寧に答えてください。また、わからないものは「わからない」と答えてください。
また、各ユーザーの名は後にコロンをつけて表記します。例：「太郎:こんにちは、羽毛さん」これは、太郎さんがあなたに話しかけていることを示しています。
また、あなたのDiscord上のユーザIDは「${DISCORD_CLIENT_ID}」です。メッセージにそれが含まれている場合はあなたへのメンションと判断してください。
また、一度答えた内容を何度も引きずって答えることは避けてください。回答は簡潔に、要点を押さえて1900文字以内で答えてください。
なお、必要に応じてツールを呼び出すことができますが、５回以上は呼び出せません。
重要: ツール実行後、結果に「使用したAPI」や「クレジット表記」が含まれている場合は、それを必ず回答の最後に含めてください。削除したり省略したりしないでください。`;

// ツール実行結果の型定義
export type ToolExecutionResult = {
  text: string;
  toolResponses?: any[];
};


// ここでGeminiを呼び出す
export async function gemini(
  text: string,
  interactionId: string | null,
  images?: string[],
) {
  // メッセージのpartsを構築
  const inputParts: any[] = [{ type: 'text', text: text }];

  // 画像がある場合はpartsに追加
  if (images && images.length > 0) {
    for (const uri of images) {
      inputParts.push({
        type: 'image',
        uri: uri,
      });
    }
  }

  // Genaiに送信
  const interactionFrame = {
    model: "gemma-4-31b-it",
    input: inputParts,
    tools: tools,
    tool_config: { include_server_side_tool_invocations: true },
    system_instruction: SYSTEM_PROMPT,
    ...(interactionId ? { previous_interaction_id: interactionId } : {}),// 前回のやりとりがある場合はIDを渡す
  };
  let interaction = await ai.interactions.create(interactionFrame as any);


  if (!interaction) {
    return { text: '500：Gemini APIに接続できませんでした。' ,interactionId: `${interactionId}`};
  }

  let depth = 6;// ツール呼び出しの最大深度を設定

  interactionId = interaction.id;

  //ツール呼び出しを処理するループ
  while (depth > 0) {
    // ツール呼び出しがなければループを抜ける
    if (!interaction.steps) {
      break;
    }

    // function_call ステップを検出
    const functionCallSteps = interaction.steps.filter(
      (step: any) => step.type === 'function_call'
    );

    // ツール呼び出しがなければループを抜ける
    if (functionCallSteps.length === 0) {
      break;
    }

    depth--;// ツール利用回数の消費

    // 並列関数呼び出し: 複数の関数を同時に実行
    const functionResults = await Promise.all(
      functionCallSteps.map(async (step: any) => {
        try {
          const result = await toolRunner(step.name, step.arguments || {});
          return {
            type: 'function_result' as const,
            name: step.name,
            call_id: step.id,
            result: [
              {
                type: 'text' as const,
                text: typeof result === 'string' ? result : JSON.stringify(result),
              },
            ],
          };
        } catch (error) {
          console.error(`ツール実行エラー (${step.name}):`, error);
          return {
            type: 'function_result' as const,
            name: step.name,
            call_id: step.id,
            result: [
              {
                type: 'text' as const,
                text: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      })
    );


    // 結果をモデルに送り返す
    interaction = await ai.interactions.create({
      model: "gemma-4-31b-it",
      input: functionResults,
      tools: tools,
      tool_config: { include_server_side_tool_invocations: true },
      previous_interaction_id: interactionId,
    } as any);

    if (!interaction) {
      console.error('Gemini APIからの応答がありませんでした。');
      return { text: '500：Gemini APIがツールを処理できませんでした。', interactionId: `${interactionId}` };
    }
  }

  if (!interaction.steps) {
    console.error('Gemini APIからの応答にstepsが含まれていませんでした。');
    return { text: '500：Gemini APIからの応答が破損しました。', interactionId: `${interactionId}` };
  }

  // 1. steps が存在しない、または空の場合はエラーを返す
  if (!interaction.steps || interaction.steps.length === 0) {
    console.error('Gemini APIからの応答にstepsが含まれていませんでした。');
    return { text: '500：Gemini APIからの応答が破損しました。', interactionId: `${interactionId}` };
  }

  // 2. モデルのテキスト回答が含まれる 'model_output' ステップを探す
  // （最後が thought や function_call で終わっている可能性を考慮し、確実に回答を取得する）
  const modelTurnSteps = interaction.steps.filter((s: any) => s.type === 'model_output');
  const lastModelTurn = modelTurnSteps.at(-1) as any; // 型エラー回避のため一時的に any キャスト

  if (!lastModelTurn) {
    console.error('Gemini APIからの応答にmodel_outputステップが含まれていませんでした。');
    return { text: '500：Gemini APIからテキストの応答がありませんでした。', interactionId: `${interactionId}` };
  }

  // 3. テキストを安全に抽出（Interactions API の仕様に合わせる）
  // プロパティが存在しない場合に備えてオプショナルチェーン (?.) を使用します
  const replyText =
    lastModelTurn.content?.[0]?.text ||
    '500：Gemini APIからの応答テキストが空でした。';

  console.log('Geminiからの最終応答:', replyText);
  return { text: replyText, interactionId: `${interactionId}` };
}