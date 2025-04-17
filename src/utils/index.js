/**
 * 格式化日期时间
 * @param {string|number|Date} time 日期时间
 * @param {string} format 格式化模板，默认为 YYYY-MM-DD HH:mm:ss
 * @returns {string} 格式化后的日期字符串
 */
export function formatDateTime(time, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!time) return '';
  
  let date;
  if (typeof time === 'object') {
    date = time;
  } else {
    // 处理时间戳（数字）
    if (typeof time === 'number' && String(time).length === 10) {
      time = time * 1000;
    }
    // 处理ISO日期字符串或时间戳
    date = new Date(time);
  }
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const formatObj = {
    YYYY: date.getFullYear(),
    MM: padStart(date.getMonth() + 1, 2, '0'),
    DD: padStart(date.getDate(), 2, '0'),
    HH: padStart(date.getHours(), 2, '0'),
    mm: padStart(date.getMinutes(), 2, '0'),
    ss: padStart(date.getSeconds(), 2, '0')
  };
  
  return format.replace(/(YYYY|MM|DD|HH|mm|ss)/g, match => formatObj[match]);
}

/**
 * 字符串左侧填充
 * @param {number|string} value 原始值
 * @param {number} length 目标长度
 * @param {string} pad 填充字符
 * @returns {string} 填充后的字符串
 */
function padStart(value, length, pad) {
  const str = String(value);
  if (str.length >= length) return str;
  return Array(length - str.length + 1).join(pad) + str;
}

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
} 