// 画像データの型定義
export type Img2Base64_type = {
  data: string; // Base64 encoded image data
  mimeType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
};

// URLから画像をBase64に変換する関数
export async function img2Base64(imageUrl: string): Promise<Img2Base64_type | null> {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    const contentType = response.headers.get('content-type');
    let mimeType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' = 'image/jpeg';
    
    if (contentType?.includes('png')) mimeType = 'image/png';
    else if (contentType?.includes('gif')) mimeType = 'image/gif';
    else if (contentType?.includes('webp')) mimeType = 'image/webp';
    
    return { data: base64, mimeType };
  } catch (error) {
    console.error('画像の変換に失敗しました:', error);
    return null;
  }
}