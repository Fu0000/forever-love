import { Injectable } from '@nestjs/common';
import dns from 'node:dns';
import { AppException } from '../../common/errors/app.exception';

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } | null }>;
  error?: { message?: string };
};

const ensureTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value : `${value}/`;

try {
  // Many VPS/Docker environments have IPv6 disabled; prefer IPv4 to avoid timeouts.
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore if not supported by runtime.
}

@Injectable()
export class AiService {
  private getBaseUrl(): string {
    return process.env.OPENAI_BASE_URL ?? 'https://api.123nhh.me/v1';
  }

  private getApiKey(): string {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new AppException(
        500,
        'OPENAI_NOT_CONFIGURED',
        'OPENAI_API_KEY is not configured',
      );
    }
    return key;
  }

  private getModel(): string {
    return process.env.OPENAI_MODEL ?? 'GPT-5.3 Codex';
  }

  private async chat(system: string, user: string): Promise<string> {
    const apiKey = this.getApiKey();
    const model = this.getModel();
    const baseUrl = ensureTrailingSlash(this.getBaseUrl());
    const url = new URL('chat/completions', baseUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_completion_tokens: 250,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: controller.signal,
      });

      const text = await response.text();
      let json: ChatCompletionResponse | null = null;
      try {
        json = text ? (JSON.parse(text) as ChatCompletionResponse) : null;
      } catch {
        json = null;
      }

      if (!response.ok) {
        const message =
          json?.error?.message ??
          (text ? text.slice(0, 500) : `HTTP ${response.status}`);
        throw new AppException(502, 'OPENAI_ERROR', message);
      }

      const content = json?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        throw new AppException(
          502,
          'OPENAI_BAD_RESPONSE',
          'Empty response from OpenAI',
        );
      }
      return content.trim();
    } catch (error) {
      if (error instanceof AppException) throw error;
      if ((error as Error)?.name === 'AbortError') {
        throw new AppException(504, 'OPENAI_TIMEOUT', 'OpenAI request timed out');
      }
      throw new AppException(502, 'OPENAI_ERROR', (error as Error)?.message ?? 'OpenAI request failed');
    } finally {
      clearTimeout(timeout);
    }
  }

  async cupidAdvice(query: string): Promise<string> {
    return this.chat(
      '你是爱神丘比特，一位充满智慧、温暖和同理心的情感导师。请给情侣们提供简洁、实用且充满爱意的建议。请用中文回答，字数控制在100字以内，除非用户要求更多。',
      query,
    );
  }

  async cupidLoveNote(mood: string, partnerName: string): Promise<string> {
    return this.chat(
      '你是恋爱文案高手，写甜蜜、轻盈、真诚的中文情话，避免引号和长篇大论。',
      `为我的伴侣（名字叫${partnerName}）写一段简短、甜蜜、浪漫的情话（30字以内）。心情是：${mood}。不要包含引号。`,
    );
  }

  async cupidDateIdeas(interests: string): Promise<string[]> {
    const raw = await this.chat(
      '你是约会策划师。请只返回一个 JSON 字符串数组（数组内每项是一个约会点子）。不要输出任何额外文字。',
      `为一对对以下内容感兴趣的情侣列出3个独特且浪漫的约会主意：${interests}。`,
    );

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error('not array');
      }
      return parsed
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
        .slice(0, 10);
    } catch {
      // Fallback: split lines/bullets if model didn't respect JSON-only
      return raw
        .split(/\r?\n+/)
        .map((line) => line.replace(/^[\-\*\d\.\)\s]+/, '').trim())
        .filter(Boolean)
        .slice(0, 3);
    }
  }

  async polishText(
    text: string,
    scene: 'note' | 'moment' | 'quest' | 'generic' = 'generic',
  ): Promise<string> {
    const prefix =
      scene === 'note'
        ? '恋爱日记'
        : scene === 'moment'
          ? '甜蜜瞬间'
          : scene === 'quest'
            ? '恋爱任务'
            : '文本';

    return this.chat(
      `你是一位中文写作润色编辑。请在**不改变原意**的前提下，润色下面这段${prefix}内容：\n` +
        `- 保持关键信息与事实不变\n` +
        `- 语气更自然、更好读、更有氛围\n` +
        `- 不要加入原文没有的新情节\n` +
        `- 输出仅包含润色后的正文，不要解释`,
      text,
    );
  }
}
