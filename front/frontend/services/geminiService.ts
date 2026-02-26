const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://foever-love.chuhaibox.com/api/v1';
const TOKEN_KEY = 'lovesync_auth_token';

const apiRequest = async <T>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<T> => {
  const token = localStorage.getItem(TOKEN_KEY);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `AI API Error: ${response.status} ${response.statusText} - ${text}`,
      );
    }

    const json = (await response.json()) as unknown;
    if (json && typeof json === 'object' && json !== null && 'data' in json) {
      return (json as { data: T }).data;
    }
    return json as T;
  } finally {
    window.clearTimeout(timeout);
  }
};

export const generateLoveNoteSuggestion = async (mood: string, partnerName: string): Promise<string> => {
  try {
    const result = await apiRequest<{ text: string }>('/ai/cupid/love-note', {
      mood,
      partnerName,
    });
    return result.text?.trim() || "我对你的爱无法用言语表达。";
  } catch (error) {
    console.error("Error generating love note:", error);
    return "有你在身边，我的世界都亮了。";
  }
};

export const getRelationshipAdvice = async (query: string): Promise<string> => {
  try {
    const result = await apiRequest<{ text: string }>('/ai/cupid/advice', {
      query,
    });
    return result.text?.trim() || "沟通是关键。试着敞开心扉去倾听对方。";
  } catch (error) {
    console.error("Error getting advice:", error);
    return "我现在无法连接到爱的频率，请稍后再试。";
  }
};

export const generateDateIdeas = async (interests: string): Promise<string[]> => {
  try {
    const result = await apiRequest<string[]>('/ai/cupid/date-ideas', {
      interests,
    });
    if (!Array.isArray(result) || result.length === 0) {
      return ["看电影", "一起做饭", "看星星"];
    }
    return result;
  } catch (error) {
    console.error("Error generating dates:", error);
    return ["公园野餐", "参观博物馆", "日落散步"];
  }
};

export const polishText = async (
  text: string,
  scene: 'note' | 'moment' | 'quest' | 'generic' = 'generic',
): Promise<string> => {
  try {
    const result = await apiRequest<{ text: string }>('/ai/polish', {
      text,
      scene,
    });
    return result.text?.trim() || text;
  } catch (error) {
    console.error('Error polishing text:', error);
    return text;
  }
};
