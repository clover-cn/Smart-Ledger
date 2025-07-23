import { intentKeywords, mockProducts } from './mockData.js';

/**
 * 意图识别服务
 */
export class IntentService {
  /**
   * 分析用户输入，识别购买意图
   * @param {string} userInput - 用户输入文本
   * @param {string} userId - 用户ID
   * @returns {Object} 意图识别结果
   */
  analyzeIntent(userInput, userId = 'default') {
    const result = {
      hasIntent: false,
      confidence: 0,
      category: null,
      keywords: [],
      relatedProducts: [],
      intentType: null, // 'explicit' | 'implicit'
      timestamp: new Date().toISOString()
    };

    if (!userInput || typeof userInput !== 'string') {
      return result;
    }

    const input = userInput.toLowerCase().trim();
    
    // 检查显式购买意图关键词
    const explicitIntents = this.detectExplicitIntent(input);
    
    // 检查隐式需求意图
    const implicitIntents = this.detectImplicitIntent(input);
    
    // 合并结果，优先显式意图
    let finalIntent = explicitIntents.confidence > implicitIntents.confidence ? 
                     explicitIntents : implicitIntents;
    
    if (finalIntent.confidence > 0.6) {
      result.hasIntent = true;
      result.confidence = finalIntent.confidence;
      result.category = finalIntent.category;
      result.keywords = finalIntent.keywords;
      result.intentType = finalIntent.type;
      result.relatedProducts = this.findRelatedProducts(finalIntent.category, finalIntent.keywords);
    }

    return result;
  }

  /**
   * 检测显式购买意图（直接询问产品）
   */
  detectExplicitIntent(input) {
    const result = {
      confidence: 0,
      category: null,
      keywords: [],
      type: 'explicit'
    };

    // 购买意图关键词
    const buyingKeywords = ['买', '购买', '哪家好', '推荐', '比较', '选择', '怎么样'];
    const hasBuyingIntent = buyingKeywords.some(keyword => input.includes(keyword));

    if (hasBuyingIntent) {
      // 检查产品关键词
      for (const [keyword, intentData] of Object.entries(intentKeywords)) {
        if (input.includes(keyword.toLowerCase())) {
          result.confidence = Math.max(result.confidence, intentData.confidence);
          result.category = intentData.category;
          result.keywords.push(keyword);
          
          // 添加相关关键词
          intentData.relatedKeywords.forEach(related => {
            if (input.includes(related.toLowerCase())) {
              result.keywords.push(related);
              result.confidence = Math.min(result.confidence + 0.1, 1.0);
            }
          });
        }
      }
    }

    return result;
  }

  /**
   * 检测隐式需求意图（从问题推断需求）
   */
  detectImplicitIntent(input) {
    const result = {
      confidence: 0,
      category: null,
      keywords: [],
      type: 'implicit'
    };

    // 隐式需求映射
    const implicitMappings = {
      '牙疼': { category: '口腔护理', keywords: ['牙膏', '牙刷'], confidence: 0.8 },
      '牙龈出血': { category: '口腔护理', keywords: ['牙膏'], confidence: 0.9 },
      '口腔溃疡': { category: '口腔护理', keywords: ['牙膏', '漱口水'], confidence: 0.85 },
      '上班通勤': { category: '自行车', keywords: ['自行车', '电动车'], confidence: 0.7 },
      '减肥运动': { category: '自行车', keywords: ['自行车', '运动'], confidence: 0.6 },
      '办公需要': { category: '电脑', keywords: ['笔记本', '电脑'], confidence: 0.75 },
      '学习编程': { category: '电脑', keywords: ['笔记本', '电脑'], confidence: 0.8 }
    };

    for (const [problem, mapping] of Object.entries(implicitMappings)) {
      if (input.includes(problem)) {
        result.confidence = mapping.confidence;
        result.category = mapping.category;
        result.keywords = mapping.keywords;
        break;
      }
    }

    return result;
  }

  /**
   * 根据类别和关键词查找相关产品
   */
  findRelatedProducts(category, keywords) {
    if (!category) return [];

    return mockProducts
      .filter(product => {
        // 匹配类别
        if (product.category !== category) return false;
        
        // 匹配关键词
        return keywords.some(keyword => 
          product.keywords.some(productKeyword => 
            productKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(productKeyword.toLowerCase())
          )
        );
      })
      .sort((a, b) => {
        // 按评分和销量排序
        const scoreA = a.rating * 0.6 + (a.sales / 1000) * 0.4;
        const scoreB = b.rating * 0.6 + (b.sales / 1000) * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, 5); // 最多返回5个产品
  }

  /**
   * 批量分析多轮对话
   */
  analyzeConversation(messages, userId = 'default') {
    const results = [];
    let contextKeywords = [];

    for (const message of messages) {
      const intent = this.analyzeIntent(message, userId);
      
      // 累积上下文关键词
      if (intent.hasIntent) {
        contextKeywords = [...contextKeywords, ...intent.keywords];
      }
      
      // 使用上下文增强当前意图
      if (contextKeywords.length > 0 && !intent.hasIntent) {
        const contextIntent = this.analyzeWithContext(message, contextKeywords);
        if (contextIntent.hasIntent) {
          results.push(contextIntent);
          continue;
        }
      }
      
      results.push(intent);
    }

    return results;
  }

  /**
   * 基于上下文分析意图
   */
  analyzeWithContext(input, contextKeywords) {
    const result = {
      hasIntent: false,
      confidence: 0,
      category: null,
      keywords: contextKeywords,
      relatedProducts: [],
      intentType: 'contextual',
      timestamp: new Date().toISOString()
    };

    // 如果当前输入包含确认词汇，且有上下文关键词
    const confirmWords = ['好的', '可以', '行', '要', '买', '购买'];
    const hasConfirm = confirmWords.some(word => input.includes(word));

    if (hasConfirm && contextKeywords.length > 0) {
      // 基于上下文关键词推断类别
      for (const [keyword, intentData] of Object.entries(intentKeywords)) {
        if (contextKeywords.includes(keyword)) {
          result.hasIntent = true;
          result.confidence = 0.7;
          result.category = intentData.category;
          result.relatedProducts = this.findRelatedProducts(result.category, contextKeywords);
          break;
        }
      }
    }

    return result;
  }
}