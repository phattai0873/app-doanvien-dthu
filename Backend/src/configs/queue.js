const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

// BullMQ hoạt động tốt nhất với ioredis
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Bắt buộc cho BullMQ
  lazyConnect: true // Không bắt buộc kết nối ngay khi app khởi động để tránh lỗi
});

// Quan trọng: Tránh app bị sập khi Redis die
redisConnection.on('error', (err) => {
  console.error('❌ BullMQ ioredis Error:', err.message);
});

/**
 * Định nghĩa các Queue trọng tâm của hệ thống
 */
const excelQueue = new Queue('excel-import-queue', { connection: redisConnection });
const notificationQueue = new Queue('notification-queue', { connection: redisConnection });
const statsQueue = new Queue('stats-update-queue', { connection: redisConnection });

module.exports = {
  excelQueue,
  notificationQueue,
  statsQueue,
  redisConnection
};
