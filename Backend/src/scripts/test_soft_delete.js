const { News } = require('../models');

async function test() {
  console.log('🧪 Đang chạy thử nghiệm Soft Delete trên Model News...');
  
  try {
    // 1. Tạo bản ghi mới
    const news = await News.create({
      title: 'Bản tin thử nghiệm Soft Delete',
      content: 'Nội dung thử nghiệm cơ chế xóa mềm của Sequelize.',
      status: 'DRAFT'
    });
    console.log('✅ Đã tạo News. ID:', news.id);

    // 2. Chạy lệnh xóa
    await news.destroy();
    console.log('🗑️ Đã gọi news.destroy()...');

    // 3. Tìm kiếm bình thường
    const foundNormal = await News.findByPk(news.id);
    console.log('🔍 Tìm kiếm thông thường:', foundNormal ? '❌ Thấy (Lỗi: Đáng lẽ phải bị lọc)' : '✅ Không thấy (Đúng: Đã bị lọc)');

    // 4. Tìm kiếm bao gồm cả bản ghi đã xóa
    const foundParanoid = await News.findByPk(news.id, { paranoid: false });
    console.log('🔍 Tìm kiếm với { paranoid: false }:', foundParanoid ? '✅ Thấy (Đúng: Vẫn còn trong DB)' : '❌ Không thấy (Lỗi: Dữ liệu bị xóa thật)');
    
    if (foundParanoid) {
        console.log('⏰ Giá trị deletedAt:', foundParanoid.deletedAt);
        
        // 5. Thử khôi phục
        await foundParanoid.restore();
        console.log('♻️ Đã gọi foundParanoid.restore()...');
        
        const foundRestored = await News.findByPk(news.id);
        console.log('🔍 Tìm kiếm sau khi khôi phục:', foundRestored ? '✅ Thấy (Đúng: Đã quay lại)' : '❌ Không thấy (Lỗi: Chưa khôi phục được)');
    }

  } catch (err) {
    console.error('❌ Lỗi trong quá trình test:', err);
  } finally {
    process.exit();
  }
}

test();
