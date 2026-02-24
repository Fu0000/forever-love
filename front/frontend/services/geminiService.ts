import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

const MODEL_NAME = 'gemini-2.5-flash';

export const generateLoveNoteSuggestion = async (mood: string, partnerName: string): Promise<string> => {
  try {
    const prompt = `为我的伴侣（名字叫${partnerName}）写一段简短、甜蜜、浪漫的情话（30字以内）。心情是：${mood}。不要包含引号。请用中文回答。`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        role: 'user',
        parts: [{ text: prompt }]
      }
    });

    return response.text?.trim() || "我对你的爱无法用言语表达。";
  } catch (error) {
    console.error("Error generating love note:", error);
    return "有你在身边，我的世界都亮了。";
  }
};

export const getRelationshipAdvice = async (query: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        role: 'user',
        parts: [{ text: query }]
      },
      config: {
        systemInstruction: "你是爱神丘比特，一位充满智慧、温暖和同理心的情感导师。请给情侣们提供简洁、实用且充满爱意的建议。请用中文回答，字数控制在100字以内，除非用户要求更多。"
      }
    });

    return response.text?.trim() || "沟通是关键。试着敞开心扉去倾听对方。";
  } catch (error) {
    console.error("Error getting advice:", error);
    return "我现在无法连接到爱的频率，请稍后再试。";
  }
};

export const generateDateIdeas = async (interests: string): Promise<string[]> => {
  try {
    const prompt = `为一对对以下内容感兴趣的情侣列出3个独特且浪漫的约会主意：${interests}。只返回一个JSON字符串数组。请用中文。`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        role: 'user',
        parts: [{ text: prompt }]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return ["看电影", "一起做饭", "看星星"];
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating dates:", error);
    return ["公园野餐", "参观博物馆", "日落散步"];
  }
};