import { format, formatDistance, parseISO } from 'date-fns';

// 金額を日本円でフォーマットする
// 注意：Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }) を最初使ったら
// 全角の「￥」(U+FFE5) が出力されて、テストの「¥」(U+00A5 半角) と一致しなかった
// 見た目は同じなのに文字コードが違う……ここで1時間くらい詰まった
// テンプレートリテラルで手動で「¥」をつけることで解決した
export const formatCurrency = (amount: number): string => {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
};

/**
 * Format date to localized string
 */
export const formatDate = (date: string | Date, formatStr = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Truncate text to specified length
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Format file size in bytes to human-readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
