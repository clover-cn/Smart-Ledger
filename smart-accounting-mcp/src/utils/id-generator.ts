/**
 * ID生成器工具
 */

/**
 * 生成唯一的交易ID
 * @returns 唯一标识符
 */
export function generateTransactionId(): string {
  // 使用时间戳 + 随机数生成唯一ID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `tx_${timestamp}_${random}`;
}

/**
 * 验证金额是否有效
 * @param amount 金额
 * @returns 是否有效
 */
export function isValidAmount(amount: number): boolean {
  return typeof amount === 'number' && amount > 0 && isFinite(amount);
}

/**
 * 根据交易类型获取默认分类
 * @param type 交易类型
 * @returns 默认分类
 */
export function getDefaultCategory(type: 'income' | 'expense'): string {
  return type === 'expense' ? '未分类消费' : '其他收入';
}