import { NextRequest, NextResponse } from 'next/server';
import { WorkTranslatorService, WorkTranslationRequest } from '@/services/WorkTranslatorService';

/**
 * @swagger
 * /api/work-translator:
 *   post:
 *     summary: 翻译工作语言的隐含意思
 *     description: 使用AI分析工作场所语言的表面意思和隐含意思，并提供应对建议
 *     tags:
 *       - AI工具
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: 需要分析的工作语言文本
 *                 example: "You have great potential"
 *               context:
 *                 type: string
 *                 description: 可选的上下文信息
 *                 example: "Said during performance review"
 *     responses:
 *       200:
 *         description: 成功分析工作语言
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 originalText:
 *                   type: string
 *                   description: 原始文本
 *                 surfaceMeaning:
 *                   type: string
 *                   description: 表面意思
 *                 hiddenMeaning:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 可能的隐含意思
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 应对建议
 *                 confidence:
 *                   type: number
 *                   description: 分析置信度
 *       400:
 *         description: 请求数据无效
 *       500:
 *         description: 服务器内部错误
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== Work Translator API Debug ===');
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    
    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const { text, context }: WorkTranslationRequest = requestBody;
    
    console.log('Extracted parameters:', { text, context });
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.error('Invalid text parameter:', text);
      return NextResponse.json(
        { error: 'Text is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (text.length > 1000) {
      console.error('Text too long:', text.length);
      return NextResponse.json(
        { error: 'Text must be less than 1000 characters' },
        { status: 400 }
      );
    }
    
    console.log('Calling WorkTranslatorService.translateWorkLanguage...');
    const result = await WorkTranslatorService.translateWorkLanguage({
      text: text.trim(),
      context: context?.trim()
    });
    
    console.log('WorkTranslatorService result:', result);
    console.log('=== End Work Translator API Debug ===');
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('=== Work Translator API Error ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== End API Error Debug ===');
    return NextResponse.json(
      { error: error.message || 'Failed to translate work language' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/work-translator:
 *   get:
 *     summary: 获取常见工作语言模式
 *     description: 返回预定义的常见工作语言模式和解释
 *     tags:
 *       - AI工具
 *     responses:
 *       200:
 *         description: 成功获取常见模式
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patterns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       phrase:
 *                         type: string
 *                         description: 常见短语
 *                       meaning:
 *                         type: string
 *                         description: 隐含意思
 *                       suggestion:
 *                         type: string
 *                         description: 应对建议
 */
export async function GET() {
  try {
    const patterns = WorkTranslatorService.getCommonPatterns();
    return NextResponse.json({ patterns });
  } catch (error: any) {
    console.error('Failed to get common patterns:', error);
    return NextResponse.json(
      { error: 'Failed to get common patterns' },
      { status: 500 }
    );
  }
}