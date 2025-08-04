export interface WorkTranslationRequest {
  text: string;
  context?: string;
}

export interface WorkTranslationResponse {
  originalText: string;
  surfaceMeaning: string;
  hiddenMeaning: string[];
  suggestions: string[];
  confidence: number;
}

export class WorkTranslatorService {
  private static readonly OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  private static readonly OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  private static readonly MODEL = 'deepseek/deepseek-chat-v3-0324:free';

  static async translateWorkLanguage(request: WorkTranslationRequest): Promise<WorkTranslationResponse> {
    try {
      console.log('=== Work Language Translation Debug ===');
      console.log('Input text:', request.text);
      console.log('Context:', request.context);

      if (!this.OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key is not configured');
      }

      const systemPrompt = `You are an expert workplace communication analyst. Your job is to decode hidden meanings in workplace language, especially from managers and bosses. 

When given a workplace statement, analyze it and provide:
1. Surface meaning (what it literally says)
2. Hidden meanings (what it might actually mean)
3. Actionable suggestions (how to respond)

Focus on common workplace scenarios like performance feedback, task assignments, company culture statements, etc.

Respond in JSON format with the following structure:
{
  "surfaceMeaning": "What the statement literally says",
  "hiddenMeaning": ["Possible hidden meaning 1", "Possible hidden meaning 2", "Possible hidden meaning 3"],
  "suggestions": ["Actionable suggestion 1", "Actionable suggestion 2", "Actionable suggestion 3"],
  "confidence": 0.85
}

All responses should be in English and professional.`;

      const userPrompt = `Analyze this workplace statement: "${request.text}"${request.context ? ` Context: ${request.context}` : ''}

Please decode the hidden meanings and provide actionable suggestions for how to respond.`;

      const response = await fetch(`${this.OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'https://1000ai.ai',
          'X-Title': '1000ai.ai Work Language Translator',
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      console.log('OpenRouter API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenRouter API error:', errorData);
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('OpenRouter API response:', data);

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenRouter API');
      }

      // 尝试解析JSON响应
      let parsedResponse;
      try {
        // 清理可能的markdown代码块标记
        const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
        parsedResponse = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', content);
        // 如果JSON解析失败，创建一个基本的响应
        parsedResponse = {
          surfaceMeaning: "Unable to parse detailed analysis",
          hiddenMeaning: [content.substring(0, 200) + "..."],
          suggestions: ["Please try rephrasing your input"],
          confidence: 0.5
        };
      }

      const result: WorkTranslationResponse = {
        originalText: request.text,
        surfaceMeaning: parsedResponse.surfaceMeaning || "Analysis not available",
        hiddenMeaning: Array.isArray(parsedResponse.hiddenMeaning) ? parsedResponse.hiddenMeaning : [parsedResponse.hiddenMeaning || "Analysis not available"],
        suggestions: Array.isArray(parsedResponse.suggestions) ? parsedResponse.suggestions : [parsedResponse.suggestions || "No suggestions available"],
        confidence: parsedResponse.confidence || 0.7
      };

      console.log('Final result:', result);
      console.log('=== End Work Language Translation Debug ===');

      return result;

    } catch (error: any) {
      console.error('=== Work Translation Error ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('=== End Error Debug ===');
      throw new Error(`Failed to translate work language: ${error.message}`);
    }
  }

  // 预定义的常见工作语言模式
  static getCommonPatterns(): Array<{phrase: string, meaning: string, suggestion: string}> {
    return [
      {
        phrase: "You have great potential",
        meaning: "Your current performance isn't meeting expectations, but we're not ready to give up on you yet",
        suggestion: "Ask for specific areas to improve and request regular feedback sessions"
      },
      {
        phrase: "This should be simple, I need it by tomorrow",
        meaning: "I've already promised this to someone else and the deadline is non-negotiable, regardless of complexity",
        suggestion: "Immediately assess the scope and communicate any concerns about feasibility"
      },
      {
        phrase: "We have a flat organizational structure",
        meaning: "There's limited career advancement and decision-making is centralized",
        suggestion: "Ask for specific examples of career progression and decision-making processes"
      },
      {
        phrase: "Keep up the good work",
        meaning: "You're performing adequately but not exceptionally, don't expect any immediate rewards",
        suggestion: "Ask for specific feedback on what's working well and request more challenging assignments"
      },
      {
        phrase: "Let's discuss this further",
        meaning: "I disagree with your proposal but don't want to reject it outright",
        suggestion: "Ask for specific concerns and concrete next steps with deadlines"
      }
    ];
  }
}