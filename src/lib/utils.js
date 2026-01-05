import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind CSS 类名 (解决冲突)
 * 示例: cn('px-2 py-1', condition && 'bg-blue-500')
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date
 * @returns {string} 例如 "2025-01-01"
 */
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 获取中文星期
 * @param {Date} date
 * @returns {string} 例如 "星期一"
 */
export function getWeekday(date) {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return days[date.getDay()];
}

/**
 * 验证字符串是否为正整数
 * @param {string} val 
 * @returns {boolean}
 */
export function isValidInteger(val) {
  return /^\d+$/.test(val);
}