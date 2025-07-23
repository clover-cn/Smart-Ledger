import { mockAds, mockProducts } from './mockData.js';

/**
 * 广告管理服务
 */
export class AdService {
  constructor() {
    this.ads = [...mockAds]; // 广告数据副本
    this.adStats = new Map(); // 广告统计数据
    this.revenueData = new Map(); // 收益数据
  }

  /**
   * 获取所有广告
   */
  getAllAds() {
    return {
      success: true,
      ads: this.ads.map(ad => ({
        ...ad,
        product: mockProducts.find(p => p.id === ad.productId),
        stats: this.getAdStats(ad.id)
      }))
    };
  }

  /**
   * 根据ID获取广告
   */
  getAdById(adId) {
    const ad = this.ads.find(a => a.id === adId);
    if (!ad) {
      return {
        success: false,
        error: '广告不存在'
      };
    }

    return {
      success: true,
      ad: {
        ...ad,
        product: mockProducts.find(p => p.id === ad.productId),
        stats: this.getAdStats(adId)
      }
    };
  }

  /**
   * 创建新广告
   */
  createAd(adData) {
    try {
      // 验证必需字段
      const requiredFields = ['productId', 'advertiserId', 'title', 'content', 'bidPrice', 'targetKeywords', 'budget'];
      for (const field of requiredFields) {
        if (!adData[field]) {
          return {
            success: false,
            error: `缺少必需字段: ${field}`
          };
        }
      }

      // 验证产品是否存在
      const product = mockProducts.find(p => p.id === adData.productId);
      if (!product) {
        return {
          success: false,
          error: '产品不存在'
        };
      }

      // 生成新广告ID
      const newId = Math.max(...this.ads.map(a => a.id)) + 1;

      const newAd = {
        id: newId,
        productId: adData.productId,
        advertiserId: adData.advertiserId,
        title: adData.title,
        content: adData.content,
        bidPrice: parseFloat(adData.bidPrice),
        targetKeywords: Array.isArray(adData.targetKeywords) ? adData.targetKeywords : [adData.targetKeywords],
        budget: parseFloat(adData.budget),
        status: adData.status || 'active',
        clickCount: 0,
        impressionCount: 0,
        conversionCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.ads.push(newAd);

      return {
        success: true,
        ad: {
          ...newAd,
          product: product
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `创建广告失败: ${error.message}`
      };
    }
  }

  /**
   * 更新广告
   */
  updateAd(adId, updateData) {
    try {
      const adIndex = this.ads.findIndex(a => a.id === adId);
      if (adIndex === -1) {
        return {
          success: false,
          error: '广告不存在'
        };
      }

      // 更新广告数据
      const updatedAd = {
        ...this.ads[adIndex],
        ...updateData,
        id: adId, // 确保ID不被修改
        updatedAt: new Date().toISOString()
      };

      this.ads[adIndex] = updatedAd;

      return {
        success: true,
        ad: {
          ...updatedAd,
          product: mockProducts.find(p => p.id === updatedAd.productId)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `更新广告失败: ${error.message}`
      };
    }
  }

  /**
   * 删除广告
   */
  deleteAd(adId) {
    const adIndex = this.ads.findIndex(a => a.id === adId);
    if (adIndex === -1) {
      return {
        success: false,
        error: '广告不存在'
      };
    }

    const deletedAd = this.ads.splice(adIndex, 1)[0];

    return {
      success: true,
      message: '广告删除成功',
      deletedAd: deletedAd
    };
  }

  /**
   * 记录广告展示
   */
  recordImpression(adId, userId = 'default') {
    const ad = this.ads.find(a => a.id === adId);
    if (!ad) {
      return { success: false, error: '广告不存在' };
    }

    // 更新展示次数
    ad.impressionCount++;

    // 记录统计数据
    this.updateAdStats(adId, 'impression', userId);

    return {
      success: true,
      message: '展示记录成功',
      impressionCount: ad.impressionCount
    };
  }

  /**
   * 记录广告点击
   */
  recordClick(adId, userId = 'default') {
    const ad = this.ads.find(a => a.id === adId);
    if (!ad) {
      return { success: false, error: '广告不存在' };
    }

    // 更新点击次数
    ad.clickCount++;

    // 记录统计数据
    this.updateAdStats(adId, 'click', userId);

    // 计算点击费用
    const clickCost = ad.bidPrice;
    this.recordRevenue(ad.advertiserId, 'click', clickCost, adId);

    return {
      success: true,
      message: '点击记录成功',
      clickCount: ad.clickCount,
      cost: clickCost
    };
  }

  /**
   * 记录广告转化
   */
  recordConversion(adId, userId = 'default', orderAmount = 0) {
    const ad = this.ads.find(a => a.id === adId);
    if (!ad) {
      return { success: false, error: '广告不存在' };
    }

    // 更新转化次数
    ad.conversionCount++;

    // 记录统计数据
    this.updateAdStats(adId, 'conversion', userId, { orderAmount });

    // 计算转化分成（假设5%分成）
    const conversionRevenue = orderAmount * 0.05;
    this.recordRevenue(ad.advertiserId, 'conversion', conversionRevenue, adId);

    return {
      success: true,
      message: '转化记录成功',
      conversionCount: ad.conversionCount,
      revenue: conversionRevenue
    };
  }

  /**
   * 获取广告统计数据
   */
  getAdStats(adId) {
    const ad = this.ads.find(a => a.id === adId);
    if (!ad) return null;

    const ctr = ad.impressionCount > 0 ? (ad.clickCount / ad.impressionCount * 100).toFixed(2) : 0;
    const conversionRate = ad.clickCount > 0 ? (ad.conversionCount / ad.clickCount * 100).toFixed(2) : 0;

    return {
      impressions: ad.impressionCount,
      clicks: ad.clickCount,
      conversions: ad.conversionCount,
      ctr: `${ctr}%`,
      conversionRate: `${conversionRate}%`,
      totalCost: ad.clickCount * ad.bidPrice,
      avgCpc: ad.bidPrice
    };
  }

  /**
   * 获取广告主的所有广告
   */
  getAdsByAdvertiser(advertiserId) {
    const advertiserAds = this.ads.filter(ad => ad.advertiserId === advertiserId);
    
    return {
      success: true,
      ads: advertiserAds.map(ad => ({
        ...ad,
        product: mockProducts.find(p => p.id === ad.productId),
        stats: this.getAdStats(ad.id)
      }))
    };
  }

  /**
   * 获取收益报告
   */
  getRevenueReport(advertiserId, startDate = null, endDate = null) {
    const advertiserAds = this.ads.filter(ad => ad.advertiserId === advertiserId);
    
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalCost = 0;
    let totalRevenue = 0;

    advertiserAds.forEach(ad => {
      totalImpressions += ad.impressionCount;
      totalClicks += ad.clickCount;
      totalConversions += ad.conversionCount;
      totalCost += ad.clickCount * ad.bidPrice;
    });

    // 模拟转化收益（实际应该从订单数据计算）
    totalRevenue = totalConversions * 150; // 假设平均订单150元，5%分成

    return {
      success: true,
      report: {
        advertiserId,
        period: {
          startDate: startDate || '2024-01-01',
          endDate: endDate || new Date().toISOString().split('T')[0]
        },
        summary: {
          totalImpressions,
          totalClicks,
          totalConversions,
          totalCost: totalCost.toFixed(2),
          totalRevenue: (totalRevenue * 0.05).toFixed(2), // 平台分成
          ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0%',
          conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) + '%' : '0%'
        },
        adDetails: advertiserAds.map(ad => ({
          adId: ad.id,
          title: ad.title,
          stats: this.getAdStats(ad.id)
        }))
      }
    };
  }

  /**
   * 更新广告统计数据
   */
  updateAdStats(adId, action, userId, extra = {}) {
    const key = `${adId}_${action}`;
    if (!this.adStats.has(key)) {
      this.adStats.set(key, []);
    }
    
    const stats = this.adStats.get(key);
    stats.push({
      timestamp: new Date().toISOString(),
      userId,
      ...extra
    });
  }

  /**
   * 记录收益数据
   */
  recordRevenue(advertiserId, type, amount, adId) {
    if (!this.revenueData.has(advertiserId)) {
      this.revenueData.set(advertiserId, []);
    }
    
    const revenue = this.revenueData.get(advertiserId);
    revenue.push({
      timestamp: new Date().toISOString(),
      type, // 'click' | 'conversion'
      amount,
      adId
    });
  }

  /**
   * 搜索广告
   */
  searchAds(query, filters = {}) {
    let results = [...this.ads];

    // 文本搜索
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(ad => 
        ad.title.toLowerCase().includes(searchTerm) ||
        ad.content.toLowerCase().includes(searchTerm) ||
        ad.targetKeywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      );
    }

    // 状态过滤
    if (filters.status) {
      results = results.filter(ad => ad.status === filters.status);
    }

    // 广告主过滤
    if (filters.advertiserId) {
      results = results.filter(ad => ad.advertiserId === filters.advertiserId);
    }

    // 价格范围过滤
    if (filters.minBid) {
      results = results.filter(ad => ad.bidPrice >= parseFloat(filters.minBid));
    }
    if (filters.maxBid) {
      results = results.filter(ad => ad.bidPrice <= parseFloat(filters.maxBid));
    }

    return {
      success: true,
      ads: results.map(ad => ({
        ...ad,
        product: mockProducts.find(p => p.id === ad.productId),
        stats: this.getAdStats(ad.id)
      })),
      total: results.length
    };
  }
}