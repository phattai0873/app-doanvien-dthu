const { createClient } = require('redis');
const dotenv = require('dotenv');

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
  // Không làm sập app nếu Redis die, chỉ log lỗi
});

redisClient.on('connect', () => {
  console.log('🚀 Redis Connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis Client Ready');
});

// Tự động kết nối với cơ chế retry mặc định của thư viện
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.warn('⚠️  Redis không thể kết nối ngay lập tức. Hệ thống sẽ chạy ở chế độ [Fail-safe] (bypass cache).');
    console.error(`❌ Connection detail: ${err.message}`);
  }
})();

module.exports = redisClient;
