/**
 * 智能分类器 - 基于描述文本自动判断交易分类
 */

// 定义分类规则映射
interface CategoryRule {
  category: string;
  keywords: string[];
  patterns: RegExp[];
}

// 支出分类规则
const EXPENSE_CATEGORIES: CategoryRule[] = [
  {
    category: '餐饮美食',
    keywords: ['吃饭', '午餐', '晚餐', '早餐', '饭店', '餐厅', '外卖', '点餐', '食物', '零食', '咖啡', '奶茶', '饮料', '酒', '聚餐', '火锅', '烧烤', '快餐'],
    patterns: [/吃了?.*/, /买了?.*吃/, /.*餐厅.*/, /.*饭店.*/, /.*外卖.*/]
  },
  {
    category: '交通出行',
    keywords: ['打车', '出租车', '地铁', '公交', '滴滴', 'uber', '高铁', '火车', '飞机', '机票', '车票', '油费', '停车', '加油', '汽车', '摩托', '电动车'],
    patterns: [/.*打车.*/, /.*地铁.*/, /.*公交.*/, /.*机票.*/, /.*车票.*/]
  },
  {
    category: '购物消费',
    keywords: ['买', '购买', '购物', '商场', '超市', '淘宝', '京东', '拼多多', '网购', '商品', '东西'],
    patterns: [/买了?.*/, /购买.*/, /购物.*/, /.*商场.*/, /.*超市.*/]
  },
  {
    category: '服装鞋帽',
    keywords: ['衣服', '裤子', '鞋子', '帽子', '袜子', '内衣', '外套', '毛衣', 'T恤', '裙子', '包包', '手表', '首饰', '化妆品'],
    patterns: [/.*衣服.*/, /.*鞋子.*/, /.*裤子.*/, /.*包包.*/, /.*化妆品.*/]
  },
  {
    category: '电子产品',
    keywords: ['手机', '电脑', '笔记本', '平板', '耳机', '音响', '相机', '电视', '空调', '冰箱', '洗衣机', '充电器', '数据线', '键盘', '鼠标'],
    patterns: [/.*手机.*/, /.*电脑.*/, /.*平板.*/, /.*耳机.*/, /.*电视.*/]
  },
  {
    category: '医疗健康',
    keywords: ['医院', '看病', '药品', '药物', '体检', '医疗', '诊所', '牙医', '眼科', '感冒', '发烧', '治疗'],
    patterns: [/.*医院.*/, /.*看病.*/, /.*药.*/, /.*体检.*/, /.*医疗.*/]
  },
  {
    category: '教育培训',
    keywords: ['学费', '培训', '课程', '书籍', '教材', '学习', '补习', '家教', '驾校', '考试', '证书'],
    patterns: [/.*学费.*/, /.*培训.*/, /.*课程.*/, /.*书籍.*/, /.*学习.*/]
  },
  {
    category: '娱乐休闲',
    keywords: ['电影', '游戏', 'ktv', '酒吧', '旅游', '景点', '门票', '娱乐', '运动', '健身', '游泳', '球类'],
    patterns: [/.*电影.*/, /.*游戏.*/, /.*ktv.*/, /.*旅游.*/, /.*门票.*/, /.*健身.*/]
  },
  {
    category: '生活服务',
    keywords: ['理发', '美容', '洗衣', '维修', '快递', '水电费', '物业费', '网费', '话费', '房租', '水费', '电费', '燃气费'],
    patterns: [/.*理发.*/, /.*美容.*/, /.*维修.*/, /.*水电费.*/, /.*房租.*/, /.*话费.*/]
  },
  {
    category: '日用百货',
    keywords: ['洗发水', '沐浴露', '牙膏', '牙刷', '毛巾', '纸巾', '洗衣液', '清洁用品', '生活用品', '日用品'],
    patterns: [/.*洗发水.*/, /.*沐浴露.*/, /.*牙膏.*/, /.*纸巾.*/, /.*生活用品.*/]
  }
];

// 收入分类规则
const INCOME_CATEGORIES: CategoryRule[] = [
  {
    category: '工资收入',
    keywords: ['工资', '薪水', '薪资', '月薪', '年薪', '奖金', '津贴', '补贴', '绩效'],
    patterns: [/.*工资.*/, /.*薪水.*/, /.*奖金.*/, /.*津贴.*/, /.*补贴.*/]
  },
  {
    category: '投资收益',
    keywords: ['股票', '基金', '理财', '分红', '利息', '收益', '投资', '债券'],
    patterns: [/.*股票.*/, /.*基金.*/, /.*理财.*/, /.*分红.*/, /.*利息.*/, /.*投资.*/]
  },
  {
    category: '兼职收入',
    keywords: ['兼职', '外快', '副业', '接单', '代驾', '外卖', '快递', '临时工'],
    patterns: [/.*兼职.*/, /.*外快.*/, /.*副业.*/, /.*接单.*/, /.*代驾.*/]
  },
  {
    category: '转账收入',
    keywords: ['转账', '红包', '借款', '还款', '报销', '退款', '返现', '返利'],
    patterns: [/.*转账.*/, /.*红包.*/, /.*报销.*/, /.*退款.*/, /.*返现.*/]
  }
];

/**
 * 基于描述文本智能判断交易分类
 * @param description 用户输入的描述信息
 * @param type 交易类型 (income 或 expense)
 * @returns 推荐的分类名称
 */
export function getSmartCategory(description: string, type: 'income' | 'expense'): string {
  const normalizedDescription = description.toLowerCase().trim();
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  
  // 计算每个分类的匹配分数
  const categoryScores: { [key: string]: number } = {};
  
  for (const rule of categories) {
    let score = 0;
    
    // 关键词匹配（每个关键词1分）
    for (const keyword of rule.keywords) {
      if (normalizedDescription.includes(keyword)) {
        score += 1;
      }
    }
    
    // 正则模式匹配（每个模式2分，权重更高）
    for (const pattern of rule.patterns) {
      if (pattern.test(normalizedDescription)) {
        score += 2;
      }
    }
    
    if (score > 0) {
      categoryScores[rule.category] = score;
    }
  }
  
  // 找到得分最高的分类
  const bestCategory = Object.keys(categoryScores).reduce((best, current) => {
    return categoryScores[current] > categoryScores[best] ? current : best;
  }, Object.keys(categoryScores)[0]);
  
  // 如果没有匹配到任何分类，使用默认分类
  if (!bestCategory) {
    return type === 'expense' ? '未分类消费' : '其他收入';
  }
  
  return bestCategory;
}

/**
 * 获取所有支持的分类列表
 * @param type 交易类型
 * @returns 分类列表
 */
export function getSupportedCategories(type: 'income' | 'expense'): string[] {
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return categories.map(rule => rule.category);
}

/**
 * 获取分类的关键词提示
 * @param category 分类名称
 * @param type 交易类型
 * @returns 关键词列表
 */
export function getCategoryKeywords(category: string, type: 'income' | 'expense'): string[] {
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const rule = categories.find(r => r.category === category);
  return rule ? rule.keywords : [];
}