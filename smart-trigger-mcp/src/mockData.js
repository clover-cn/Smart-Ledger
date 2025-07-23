// 模拟产品数据
export const mockProducts = [
  {
    id: 1,
    name: "小米电动自行车",
    brand: "小米",
    category: "自行车",
    price: 2999,
    description: "小米电动自行车，续航80公里，智能助力",
    image: "https://example.com/xiaomi-bike.jpg",
    keywords: ["自行车", "电动车", "小米", "出行"],
    rating: 4.5,
    sales: 1200,
    url: "https://shop.xiaomi.com/bike"
  },
  {
    id: 2,
    name: "永久经典自行车",
    brand: "永久",
    category: "自行车", 
    price: 899,
    description: "永久经典款自行车，复古设计，质量可靠",
    image: "https://example.com/yongjiu-bike.jpg",
    keywords: ["自行车", "永久", "经典", "复古"],
    rating: 4.2,
    sales: 800,
    url: "https://shop.yongjiu.com/classic"
  },
  {
    id: 3,
    name: "云南白药牙膏",
    brand: "云南白药",
    category: "口腔护理",
    price: 29.9,
    description: "云南白药牙膏，有效缓解牙龈出血，口腔护理专家",
    image: "https://example.com/yunnanbaiyao-toothpaste.jpg",
    keywords: ["牙膏", "云南白药", "牙龈出血", "口腔护理", "牙疼"],
    rating: 4.7,
    sales: 5000,
    url: "https://shop.yunnanbaiyao.com/toothpaste"
  },
  {
    id: 4,
    name: "舒适达抗敏牙膏",
    brand: "舒适达",
    category: "口腔护理",
    price: 35.8,
    description: "舒适达抗敏牙膏，专业抗敏感，保护牙齿健康",
    image: "https://example.com/sensodyne-toothpaste.jpg",
    keywords: ["牙膏", "舒适达", "抗敏感", "牙齿敏感", "牙疼"],
    rating: 4.6,
    sales: 3200,
    url: "https://shop.sensodyne.com/toothpaste"
  },
  {
    id: 5,
    name: "飞利浦电动牙刷",
    brand: "飞利浦",
    category: "口腔护理",
    price: 299,
    description: "飞利浦电动牙刷，深度清洁，呵护牙龈健康",
    image: "https://example.com/philips-toothbrush.jpg",
    keywords: ["电动牙刷", "飞利浦", "清洁", "牙龈", "口腔护理"],
    rating: 4.8,
    sales: 2100,
    url: "https://shop.philips.com/toothbrush"
  },
  {
    id: 6,
    name: "华为MateBook笔记本",
    brand: "华为",
    category: "电脑",
    price: 5999,
    description: "华为MateBook，轻薄便携，高性能办公笔记本",
    image: "https://example.com/huawei-matebook.jpg",
    keywords: ["笔记本", "华为", "电脑", "办公", "轻薄"],
    rating: 4.4,
    sales: 1500,
    url: "https://shop.huawei.com/matebook"
  },
  {
    id: 7,
    name: "联想ThinkPad笔记本",
    brand: "联想",
    category: "电脑",
    price: 6999,
    description: "联想ThinkPad，商务首选，稳定可靠",
    image: "https://example.com/lenovo-thinkpad.jpg",
    keywords: ["笔记本", "联想", "ThinkPad", "商务", "电脑"],
    rating: 4.6,
    sales: 2200,
    url: "https://shop.lenovo.com/thinkpad"
  }
];

// 模拟广告数据
export const mockAds = [
  {
    id: 1,
    productId: 1,
    advertiserId: "xiaomi_official",
    title: "小米电动自行车限时优惠",
    content: "小米电动自行车，原价3299，现价2999！续航80公里，智能助力系统，让出行更轻松。限时优惠，立即购买！",
    bidPrice: 2.5,
    targetKeywords: ["自行车", "电动车", "出行"],
    budget: 10000,
    status: "active",
    clickCount: 156,
    impressionCount: 2340,
    conversionCount: 12
  },
  {
    id: 2,
    productId: 3,
    advertiserId: "yunnanbaiyao_official",
    title: "云南白药牙膏，牙龈出血克星",
    content: "牙龈出血困扰？云南白药牙膏来帮忙！天然草本配方，有效缓解牙龈问题，让您重拾健康笑容。",
    bidPrice: 1.8,
    targetKeywords: ["牙膏", "牙龈出血", "牙疼", "口腔护理"],
    budget: 8000,
    status: "active",
    clickCount: 234,
    impressionCount: 3120,
    conversionCount: 28
  },
  {
    id: 3,
    productId: 6,
    advertiserId: "huawei_official",
    title: "华为MateBook，办公新选择",
    content: "华为MateBook笔记本，轻薄设计，强劲性能。无论是办公还是娱乐，都能满足您的需求。现在购买享受分期免息！",
    bidPrice: 3.2,
    targetKeywords: ["笔记本", "电脑", "办公", "华为"],
    budget: 15000,
    status: "active",
    clickCount: 89,
    impressionCount: 1560,
    conversionCount: 7
  }
];

// 意图识别关键词映射
export const intentKeywords = {
  "自行车": {
    category: "自行车",
    relatedKeywords: ["电动车", "出行", "代步", "骑行", "单车"],
    confidence: 0.9
  },
  "牙疼": {
    category: "口腔护理", 
    relatedKeywords: ["牙膏", "牙刷", "口腔", "牙龈", "牙齿"],
    confidence: 0.8
  },
  "牙龈出血": {
    category: "口腔护理",
    relatedKeywords: ["牙膏", "云南白药", "口腔护理"],
    confidence: 0.95
  },
  "笔记本": {
    category: "电脑",
    relatedKeywords: ["电脑", "办公", "学习", "游戏"],
    confidence: 0.9
  },
  "电脑": {
    category: "电脑", 
    relatedKeywords: ["笔记本", "台式机", "办公", "游戏"],
    confidence: 0.85
  }
};

// 用户画像模拟数据
export const mockUserProfiles = {
  "user_001": {
    age: 28,
    gender: "male",
    interests: ["科技", "数码", "运动"],
    purchaseHistory: ["电子产品", "运动用品"],
    location: "北京",
    income: "中等"
  },
  "user_002": {
    age: 35,
    gender: "female", 
    interests: ["健康", "美容", "家居"],
    purchaseHistory: ["护肤品", "保健品"],
    location: "上海",
    income: "高等"
  }
};