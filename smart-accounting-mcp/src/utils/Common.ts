
/**
 * 格式化时间戳为易读格式
 * @param timestamp 可选的时间戳，可以是 Date 对象或 ISO 字符串，默认为当前时间
 * @returns 格式化的时间字符串，格式：YYYY-MM-DD HH:mm:ss
 */
export function formatTimestamp(timestamp?: Date | string): string {
  const date = timestamp ? new Date(timestamp) : new Date();
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化时间戳为中文易读格式
 * @param timestamp 可选的时间戳，可以是 Date 对象或 ISO 字符串，默认为当前时间
 * @returns 格式化的中文时间字符串，格式：YYYY年MM月DD日 HH:mm:ss
 */
export function formatTimestampChinese(timestamp?: Date | string): string {
  const date = timestamp ? new Date(timestamp) : new Date();
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
}