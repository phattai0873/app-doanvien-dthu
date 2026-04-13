const cacheService = require('../services/cacheService');

/**
 * Cache Middleware (Enterprise Version)
 * Tự động tạo key an toàn dựa trên route, scope người dùng và quyền hạn
 * Tránh rò rỉ dữ liệu (leaks) giữa các cấp bậc (Admin != Admin Khoa)
 * 
 * @param {object} options 
 * @param {number} options.ttl - Giây (Mặc định 300s)
 * @param {boolean} options.isUserSpecific - Nếu true, chỉ cache cho user đó (dùng cho Profile/Private)
 * @param {boolean} options.useScope - Nếu true, cache theo phạm vi (Admin Khoa A, Khoa B)
 */
const cacheMiddleware = (options = {}) => {
  const { ttl = 300, isUserSpecific = false, useScope = true } = options;

  return async (req, res, next) => {
    // 💡 Chỉ cache các request thành công (GET)
    if (req.method !== 'GET') return next();

    // 💡 Tạo Cache Key an toàn để tránh Data Leakage giữa các vai trò (Roles)
    let keyPrefix = '__cache__:';
    
    if (req.user) {
      if (req.user.isSuperAdmin) {
        keyPrefix += 'superadmin:';
      } else {
        // Nếu user thuộc một Chi đoàn hoặc Đoàn cơ sở cụ thể, cache phải tách biệt
        const branchId = req.user.unionBranchId || 'all';
        const cellId = req.user.unionCellId || 'all';
        keyPrefix += `b${branchId}:c${cellId}:`;
      }

      // Nếu cache riêng cho từng cá nhân (Trang cá nhân, Lịch sử riêng)
      if (isUserSpecific) {
        keyPrefix += `u${req.user.id}:`;
      }
    } else {
      keyPrefix += 'guest:';
    }

    const key = `${keyPrefix}${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await cacheService.get(key);
      if (cachedResponse) {
        // Gán Header để nhận diện data từ cache
        res.set('X-Cache-Status', 'HIT');
        return res.status(200).json(cachedResponse);
      }

      // Ghi đè phương thức json để tự động lưu cache khi controller trả về data thành công
      const originalJson = res.json;
      res.json = function (data) {
        // Chỉ lưu nếu API trả về trạng thái success (hoặc không bị lỗi)
        // Lưu ý: Cấu trúc trả về thống nhất của dự án là { success: true, data: ... }
        if (data && (data.success !== false)) {
            cacheService.set(key, data, ttl);
        }
        return originalJson.call(this, data);
      };

      res.set('X-Cache-Status', 'MISS');
      next();
    } catch (err) {
      console.error('❌ Middleware Cache Error:', err.message);
      next(); // Fail-safe: Redis lỗi thì vẫn cho chạy tiếp vào DB
    }
  };
};

module.exports = cacheMiddleware;
