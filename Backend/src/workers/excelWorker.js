const { Worker } = require('bullmq');
const { redisConnection } = require('../configs/queue');
const ExcelService = require('../services/excelService');
const { ImportPreview } = require('../models');

/**
 * Worker xử lý nhập liệu Excel trong nền
 */
const excelWorker = new Worker(
  'excel-import-queue',
  async (job) => {
    const { previewId, userId, strictMode } = job.data;
    
    console.log(`👷 [Worker] Bắt đầu xử lý Job ${job.id} (Preview: ${previewId})`);
    
    try {
      // Giả lập delay một chút để thấy progress (không bắt buộc trong prod)
      await job.updateProgress(10);
      
      const results = await ExcelService.executeImportSync(previewId, { strictMode }, { id: userId });
      
      await job.updateProgress(100);
      console.log(`✅ [Worker] Hoàn thành Job ${job.id}. Thành công: ${results.success}`);
      
      return results;
    } catch (error) {
      console.error(`❌ [Worker] Lỗi Job ${job.id}:`, error.message);
      throw error; // BullMQ sẽ tự động retry dựa trên cấu hình queue
    }
  },
  { connection: redisConnection }
);

excelWorker.on('completed', (job) => {
  // Có thể gửi thông báo cho user tại đây
});

excelWorker.on('failed', (job, err) => {
  console.error(`💥 Job ${job.id} thất bại hoàn toàn:`, err.message);
});

module.exports = excelWorker;
