/**
 * Entry point cho các background workers
 * Khởi tạo toàn bộ workers khi server start
 */
const excelWorker = require('./excelWorker');

console.log('🤖 Background Workers đã sẵn sàng');

module.exports = {
  excelWorker,
};
