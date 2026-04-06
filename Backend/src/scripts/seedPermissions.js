const { Permission, Role, sequelize } = require('../models');

const permissions = [
    // Tin tức
    { code: 'news:read', name: 'Xem tin tức', module: 'news' },
    { code: 'news:create', name: 'Tạo bài viết', module: 'news' },
    { code: 'news:edit', name: 'Sửa bài viết', module: 'news' },
    { code: 'news:delete', name: 'Xóa bài viết', module: 'news' },
    { code: 'news:publish', name: 'Xuất bản bài viết', module: 'news' },

    // Chuyên mục tin tức
    { code: 'category:read', name: 'Xem chuyên mục', module: 'category' },
    { code: 'category:write', name: 'Thêm/Sửa chuyên mục', module: 'category' },
    { code: 'category:delete', name: 'Xóa chuyên mục', module: 'category' },

    // Đoàn viên
    { code: 'member:read', name: 'Xem danh sách đoàn viên', module: 'member' },
    { code: 'member:create', name: 'Thêm đoàn viên mới', module: 'member' },
    { code: 'member:edit', name: 'Sửa thông tin đoàn viên', module: 'member' },
    { code: 'member:delete', name: 'Xóa đoàn viên', module: 'member' },
    { code: 'member:approve', name: 'Duyệt hồ sơ đoàn viên', module: 'member' },

    // Hoạt động / Sinh hoạt
    { code: 'activity:read', name: 'Xem hoạt động', module: 'activity' },
    { code: 'activity:create', name: 'Tạo hoạt động mới', module: 'activity' },
    { code: 'activity:edit', name: 'Sửa hoạt động', module: 'activity' },
    { code: 'activity:delete', name: 'Xóa hoạt động', module: 'activity' },
    { code: 'activity:attendance', name: 'Điểm danh hoạt động', module: 'activity' },

    // Văn bản / Tài liệu
    { code: 'document:read', name: 'Xem tài liệu', module: 'document' },
    { code: 'document:create', name: 'Tải lên tài liệu', module: 'document' },
    { code: 'document:edit', name: 'Sửa tài liệu', module: 'document' },
    { code: 'document:delete', name: 'Xóa tài liệu', module: 'document' },

    // Hệ thống & Phân quyền
    { code: 'role:read', name: 'Xem vai trò', module: 'system' },
    { code: 'role:write', name: 'Quản lý vai trò & quyền', module: 'system' },
    { code: 'system:config', name: 'Cấu hình hệ thống', module: 'system' }
];

async function seedPermissions() {
    const t = await sequelize.transaction();
    try {
        console.log('--- Đang khởi tạo bộ mã quyền (Permissions) ---');

        // 1. Tạo hoặc cập nhật Permissions
        for (const p of permissions) {
            await Permission.findOrCreate({
                where: { code: p.code },
                defaults: p,
                transaction: t
            });
        }
        console.log('✅ Đã khởi tạo danh sách Permissions.');

        // 2. Lấy Role SUPER_ADMIN
        const superAdminRole = await Role.findOne({ where: { code: 'SUPER_ADMIN' }, transaction: t });
        if (superAdminRole) {
            const allPermissions = await Permission.findAll({ transaction: t });
            await superAdminRole.setPermissions(allPermissions, { transaction: t });
            console.log('✅ Đã gán TOÀN BỘ quyền cho SUPER_ADMIN.');
        } else {
            console.log('⚠️ Không tìm thấy Role SUPER_ADMIN, bỏ qua bước gán quyền.');
        }

        await t.commit();
        console.log('--- Hoàn tất Seeding Permissions ---');
    } catch (error) {
        await t.rollback();
        console.error('❌ Lỗi Seeding Permissions:', error);
    }
}

// Nếu chạy trực tiếp script này
if (require.main === module) {
    seedPermissions().then(() => process.exit());
}

module.exports = seedPermissions;
    