const redisClient = require('../configs/redis');

/**
 * Cache Service Abstraction Layer
 * Mục tiêu: Tập trung quản lý, log metrics, dễ dàng bảo trì và đổi thư viện nếu cần.
 */
class CacheService {
  /**
    * Lấy dữ liệu từ Cache
    * @param {string} key - Key của cache
    * @returns {any|null} - Parse về JSON hoặc null
    */
  async get(key) {
    try {
      const data = await redisClient.get(key);
      if (data) {
        // console.log(`🔍 [CACHE HIT] Key: ${key}`);
        return JSON.parse(data);
      }
      // console.log(`🌑 [CACHE MISS] Key: ${key}`);
      return null;
    } catch (err) {
      console.error(`❌ Cache Get Error [${key}]:`, err.message);
      return null;
    }
  }

  /**
    * Lưu dữ liệu vào Cache
    * @param {string} key - Key của cache 
    * @param {any} value - Dữ liệu cần lưu (Object/Array...)
    * @param {number} ttl - Time-to-Live (giây)
    */
  async set(key, value, ttl = 300) {
    try {
      if (!value) return;
      const jsonStr = JSON.stringify(value);
      await redisClient.setEx(key, ttl, jsonStr);
    } catch (err) {
      console.error(`❌ Cache Set Error [${key}]:`, err.message);
    }
  }

  /**
    * Xóa 1 key cụ thể
    * @param {string} key 
    */
  async del(key) {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error(`❌ Cache Del Error [${key}]:`, err.message);
    }
  }

  /**
    * Xóa nhiều key theo pattern (ví dụ: stats:*)
    * @param {string} pattern 
    */
  async delPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        // console.log(`🔥 [CACHE PURGE] Pattern: ${pattern}, Count: ${keys.length}`);
      }
    } catch (err) {
      console.error(`❌ Cache Purge Error [${pattern}]:`, err.message);
    }
  }
}

module.exports = new CacheService();
