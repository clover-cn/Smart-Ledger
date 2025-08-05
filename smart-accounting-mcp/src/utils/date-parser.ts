/**
 * 相对时间解析工具
 * 用于解析用户输入中的相对时间词汇，如"昨天"、"明天"、"前天"、"大前天"等
 */

/**
 * 相对时间关键词映射
 * 注意：长关键词要放在前面，避免被短关键词匹配
 */
const RELATIVE_TIME_KEYWORDS = {
  // 大前天相关 - 必须放在前天之前
  '大前天': -3,
  '三天前': -3,
  
  // 大后天相关 - 必须放在后天之前
  '大后天': 3,
  '三天后': 3,
  
  // 前天相关
  '前天': -2,
  '前日': -2,
  
  // 后天相关
  '后天': 2,
  '后日': 2,
  
  // 今天相关
  '今天': 0,
  '今日': 0,
  '当天': 0,
  
  // 昨天相关
  '昨天': -1,
  '昨日': -1,
  '前一天': -1,
  
  // 明天相关
  '明天': 1,
  '明日': 1,
  '后一天': 1,
  
  // 更多天数
  '四天前': -4,
  '五天前': -5,
  '六天前': -6,
  '一周前': -7,
  '四天后': 4,
  '五天后': 5,
  '六天后': 6,
  '一周后': 7
};

/**
 * 数字词汇映射
 */
const NUMBER_KEYWORDS: { [key: string]: number } = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9, '10': 10
};

/**
 * 解析结果接口
 */
export interface DateParseResult {
  /** 是否找到相对时间 */
  found: boolean;
  /** 解析出的日期 */
  date?: Date;
  /** 相对天数（负数表示过去，正数表示未来） */
  dayOffset?: number;
  /** 匹配到的关键词 */
  keyword?: string;
  /** 格式化的时间戳字符串 */
  timestamp?: string;
}

/**
 * 从用户输入中解析相对时间
 * @param input 用户输入的文本
 * @param baseDate 基准日期，默认为当前日期
 * @returns 解析结果
 */
export function parseRelativeDate(input: string, baseDate?: Date): DateParseResult {
  const base = baseDate || new Date();
  
  // 直接匹配关键词
  for (const [keyword, dayOffset] of Object.entries(RELATIVE_TIME_KEYWORDS)) {
    if (input.includes(keyword)) {
      const targetDate = new Date(base);
      targetDate.setDate(base.getDate() + dayOffset);
      
      return {
        found: true,
        date: targetDate,
        dayOffset,
        keyword,
        timestamp: formatDateToTimestamp(targetDate)
      };
    }
  }
  
  // 匹配 "X天前" 或 "X天后" 的模式
  const dayPattern = /([一二三四五六七八九十\d]+)天(前|后)/;
  const match = input.match(dayPattern);
  
  if (match) {
    const numberStr = match[1];
    const direction = match[2];
    
    // 解析数字
    let days = 0;
    if (NUMBER_KEYWORDS[numberStr]) {
      days = NUMBER_KEYWORDS[numberStr];
    } else if (/^\d+$/.test(numberStr)) {
      days = parseInt(numberStr, 10);
    }
    
    if (days > 0) {
      const dayOffset = direction === '前' ? -days : days;
      const targetDate = new Date(base);
      targetDate.setDate(base.getDate() + dayOffset);
      
      return {
        found: true,
        date: targetDate,
        dayOffset,
        keyword: match[0],
        timestamp: formatDateToTimestamp(targetDate)
      };
    }
  }
  
  return { found: false };
}

/**
 * 将日期格式化为时间戳字符串
 * @param date 日期对象
 * @param time 可选的时间字符串，格式为 "HH:mm:ss"，默认使用当前时间
 * @returns 格式化的时间戳字符串，格式：YYYY-MM-DD HH:mm:ss
 */
export function formatDateToTimestamp(date: Date, time?: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  let timeStr = time;
  if (!timeStr) {
    // 如果没有指定时间，使用当前时间
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    timeStr = `${hours}:${minutes}:${seconds}`;
  }
  
  return `${year}-${month}-${day} ${timeStr}`;
}

/**
 * 获取相对日期的中文描述
 * @param dayOffset 相对天数
 * @returns 中文描述
 */
export function getRelativeDateDescription(dayOffset: number): string {
  const descriptions: { [key: number]: string } = {
    0: '今天',
    1: '明天',
    2: '后天',
    3: '大后天',
    [-1]: '昨天',
    [-2]: '前天',
    [-3]: '大前天'
  };
  
  if (descriptions[dayOffset]) {
    return descriptions[dayOffset];
  }
  
  if (dayOffset > 0) {
    return `${dayOffset}天后`;
  } else {
    return `${Math.abs(dayOffset)}天前`;
  }
}

/**
 * 检查输入是否包含相对时间关键词
 * @param input 用户输入
 * @returns 是否包含相对时间关键词
 */
export function hasRelativeTimeKeyword(input: string): boolean {
  // 检查直接关键词
  for (const keyword of Object.keys(RELATIVE_TIME_KEYWORDS)) {
    if (input.includes(keyword)) {
      return true;
    }
  }
  
  // 检查 "X天前/后" 模式
  const dayPattern = /([一二三四五六七八九十\d]+)天(前|后)/;
  return dayPattern.test(input);
}

/**
 * 示例用法和测试函数
 */
export function testDateParser(): void {
  const testCases = [
    '我昨天买了一个雪糕5块钱',
    '明天要去超市买菜',
    '前天的晚餐花了50元',
    '大前天看电影花了35块',
    '三天前买的书',
    '一周后要还钱',
    '今天吃早餐7块钱'
  ];
  
  console.log('=== 相对时间解析测试 ===');
  testCases.forEach(testCase => {
    const result = parseRelativeDate(testCase);
    console.log(`输入: "${testCase}"`);
    console.log(`结果:`, result);
    console.log('---');
  });
}