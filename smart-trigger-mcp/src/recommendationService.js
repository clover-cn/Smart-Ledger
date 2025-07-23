import { mockProducts, mockAds, mockUserProfiles } from './mockData.js';

/**
 * 产品推荐引擎服务
 */
export class RecommendationService {
  constructor() {
    this.userInteractionHistory = new Map(); // 用户交互历史
  }

  /**
   * 根据意图生成产品推荐
   * @param {Object} intent - 意图识别结果
   * @param {string} userId - 用户ID
   * @param {Object} options - 推荐选项
   * @returns {Object} 推荐结果
   */
  generateRecommendations(intent, userId = 'default', options = {}) {
    const {
      maxResults = 3,
      includeAds = true,
      personalizeResults = true
    } = options;

    const result = {
      success: true,
      recommendations: [],
      ads: [],
      reasoning: '',
      timestamp: new Date().toISOString()
    };

    if (!intent.hasIntent) {
      result.success = false;
      result.reasoning = '未检测到购买意图';
      return result;
    }

    try {
      // 获取基础产品推荐
      let products = this.getBaseRecommendations(intent);
      
      // 个性化调整
      if (personalizeResults) {
        products = this.personalizeRecommendations(products, userId);
      }
      
      // 限制结果数量
      products = products.slice(0, maxResults);
      
      // 生成推荐内容
      result.recommendations = products.map(product => this.formatRecommendation(product, intent));
      
      // 获取相关广告
      if (includeAds) {
        result.ads = this.getRelevantAds(intent, userId);
      }
      
      // 生成推荐理由
      result.reasoning = this.generateReasoning(intent, products);
      
      // 记录用户交互
      this.recordUserInteraction(userId, intent, products);
      
    } catch (error) {
      result.success = false;
      result.reasoning = `推荐生成失败: ${error.message}`;
    }

    return result;
  }

  /**
   * 获取基础推荐（基于意图匹配）
   */
  getBaseRecommendations(intent) {
    let products = [];

    if (intent.relatedProducts && intent.relatedProducts.length > 0) {
      products = [...intent.relatedProducts];
    } else {
      // 基于类别和关键词查找
      products = mockProducts.filter(product => {
        if (intent.category && product.category !== intent.category) {
          return false;
        }
        
        return intent.keywords.some(keyword =>
          product.keywords.some(productKeyword =>
            productKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(productKeyword.toLowerCase())
          )
        );
      });
    }

    // 基础排序：评分 * 0.4 + 销量权重 * 0.3 + 价格权重 * 0.3
    return products.sort((a, b) => {
      const scoreA = this.calculateProductScore(a);
      const scoreB = this.calculateProductScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * 计算产品基础评分
   */
  calculateProductScore(product) {
    const ratingScore = product.rating / 5; // 评分权重
    const salesScore = Math.min(product.sales / 5000, 1); // 销量权重，最高5000
    const priceScore = 1 - Math.min(product.price / 10000, 1); // 价格权重，价格越低分数越高
    
    return ratingScore * 0.4 + salesScore * 0.3 + priceScore * 0.3;
  }

  /**
   * 个性化推荐调整
   */
  personalizeRecommendations(products, userId) {
    const userProfile = mockUserProfiles[userId];
    if (!userProfile) {
      return products;
    }

    return products.map(product => {
      let personalizedScore = this.calculateProductScore(product);
      
      // 基于用户兴趣调整
      if (userProfile.interests) {
        const interestMatch = userProfile.interests.some(interest =>
          product.keywords.some(keyword =>
            keyword.toLowerCase().includes(interest.toLowerCase())
          )
        );
        if (interestMatch) {
          personalizedScore += 0.2;
        }
      }
      
      // 基于购买历史调整
      if (userProfile.purchaseHistory) {
        const historyMatch = userProfile.purchaseHistory.some(category =>
          product.category.toLowerCase().includes(category.toLowerCase())
        );
        if (historyMatch) {
          personalizedScore += 0.15;
        }
      }
      
      // 基于收入水平调整价格偏好
      if (userProfile.income === '高等' && product.price > 1000) {
        personalizedScore += 0.1;
      } else if (userProfile.income === '中等' && product.price <= 3000) {
        personalizedScore += 0.1;
      }
      
      return { ...product, personalizedScore };
    }).sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0));
  }

  /**
   * 格式化推荐内容
   */
  formatRecommendation(product, intent) {
    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      description: product.description,
      image: product.image,
      rating: product.rating,
      sales: product.sales,
      url: product.url,
      matchReason: this.generateMatchReason(product, intent),
      confidence: this.calculateMatchConfidence(product, intent)
    };
  }

  /**
   * 生成匹配理由
   */
  generateMatchReason(product, intent) {
    const reasons = [];
    
    if (intent.category === product.category) {
      reasons.push(`符合${intent.category}类别需求`);
    }
    
    const matchedKeywords = intent.keywords.filter(keyword =>
      product.keywords.some(pk => 
        pk.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(pk.toLowerCase())
      )
    );
    
    if (matchedKeywords.length > 0) {
      reasons.push(`匹配关键词: ${matchedKeywords.join(', ')}`);
    }
    
    if (product.rating >= 4.5) {
      reasons.push('高评分产品');
    }
    
    if (product.sales > 2000) {
      reasons.push('热销产品');
    }
    
    return reasons.join('; ');
  }

  /**
   * 计算匹配置信度
   */
  calculateMatchConfidence(product, intent) {
    let confidence = 0;
    
    // 类别匹配
    if (intent.category === product.category) {
      confidence += 0.4;
    }
    
    // 关键词匹配
    const matchedKeywords = intent.keywords.filter(keyword =>
      product.keywords.some(pk => 
        pk.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(pk.toLowerCase())
      )
    );
    confidence += (matchedKeywords.length / intent.keywords.length) * 0.4;
    
    // 产品质量
    confidence += (product.rating / 5) * 0.2;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * 获取相关广告
   */
  getRelevantAds(intent, userId) {
    return mockAds
      .filter(ad => {
        const product = mockProducts.find(p => p.id === ad.productId);
        if (!product) return false;
        
        // 类别匹配
        if (intent.category && product.category !== intent.category) {
          return false;
        }
        
        // 关键词匹配
        return intent.keywords.some(keyword =>
          ad.targetKeywords.some(targetKeyword =>
            targetKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(targetKeyword.toLowerCase())
          )
        );
      })
      .sort((a, b) => b.bidPrice - a.bidPrice) // 按出价排序
      .slice(0, 2) // 最多2个广告
      .map(ad => ({
        ...ad,
        product: mockProducts.find(p => p.id === ad.productId)
      }));
  }

  /**
   * 生成推荐理由
   */
  generateReasoning(intent, products) {
    const reasons = [];
    
    if (intent.intentType === 'explicit') {
      reasons.push('基于您的明确询问');
    } else if (intent.intentType === 'implicit') {
      reasons.push('基于您提到的问题推断需求');
    }
    
    if (intent.category) {
      reasons.push(`为您推荐${intent.category}类产品`);
    }
    
    if (products.length > 0) {
      reasons.push(`共找到${products.length}个相关产品`);
    }
    
    return reasons.join('，');
  }

  /**
   * 记录用户交互历史
   */
  recordUserInteraction(userId, intent, products) {
    if (!this.userInteractionHistory.has(userId)) {
      this.userInteractionHistory.set(userId, []);
    }
    
    const history = this.userInteractionHistory.get(userId);
    history.push({
      timestamp: new Date().toISOString(),
      intent: intent,
      recommendedProducts: products.map(p => p.id),
      category: intent.category
    });
    
    // 保持最近50条记录
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  /**
   * 获取用户交互历史
   */
  getUserHistory(userId) {
    return this.userInteractionHistory.get(userId) || [];
  }

  /**
   * 基于品牌偏好推荐
   */
  recommendByBrand(brandName, category = null, maxResults = 5) {
    let products = mockProducts.filter(product => 
      product.brand.toLowerCase().includes(brandName.toLowerCase())
    );
    
    if (category) {
      products = products.filter(product => product.category === category);
    }
    
    return products
      .sort((a, b) => this.calculateProductScore(b) - this.calculateProductScore(a))
      .slice(0, maxResults)
      .map(product => this.formatRecommendation(product, { 
        category, 
        keywords: [brandName],
        intentType: 'brand_preference'
      }));
  }

  /**
   * 价格区间推荐
   */
  recommendByPriceRange(minPrice, maxPrice, category = null, maxResults = 5) {
    let products = mockProducts.filter(product => 
      product.price >= minPrice && product.price <= maxPrice
    );
    
    if (category) {
      products = products.filter(product => product.category === category);
    }
    
    return products
      .sort((a, b) => this.calculateProductScore(b) - this.calculateProductScore(a))
      .slice(0, maxResults)
      .map(product => this.formatRecommendation(product, {
        category,
        keywords: ['价格区间'],
        intentType: 'price_range'
      }));
  }
}