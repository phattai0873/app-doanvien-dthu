/**
 * SEED DATABASE - App Đoàn viên ĐHKT-ĐTHU
 * Chạy: node src/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');

// Load models
const {
    User, Role, Permission,
    UnionBranch, UnionCell,
    UnionMember, UnionMemberHistory,
    Activity, Attendance,
    CellMeeting,
    NewsCategory, News,
    DocumentCategory,
    Notification,
    QuizExam, QuizQuestion, QuizOption,
    UnionFeePayment, CellMeetingLocation,
    UnionPosition
} = require('./models');
const { sequelize } = require('./configs/db');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');
        await sequelize.sync({ alter: true });
        console.log('✅ Sync bảng xong\n');

        const salt = 10;

        // ─── 1. ROLES & PERMISSIONS ──────────────────────────────
        console.log('📌 Tạo Roles & Permissions...');

        const [superAdminRole] = await Role.findOrCreate({
            where: { code: 'SUPER_ADMIN' },
            defaults: { code: 'SUPER_ADMIN', name: 'Quản trị viên Đoàn trường', description: 'Toàn quyền hệ thống', isSystem: true, isActive: true }
        });
        const [branchAdminRole] = await Role.findOrCreate({
            where: { code: 'BRANCH_ADMIN' },
            defaults: { code: 'BRANCH_ADMIN', name: 'Bí thư Liên chi đoàn', description: 'Quản lý cấp Khoa', isSystem: false, isActive: true }
        });
        const [cellAdminRole] = await Role.findOrCreate({
            where: { code: 'CELL_ADMIN' },
            defaults: { code: 'CELL_ADMIN', name: 'Bí thư Chi đoàn', description: 'Quản lý cấp Lớp', isSystem: false, isActive: true }
        });
        const [memberRole] = await Role.findOrCreate({
            where: { code: 'MEMBER' },
            defaults: { code: 'MEMBER', name: 'Đoàn viên', description: 'Cấp đoàn viên thường', isSystem: false, isActive: true }
        });

        const permDefs = [
            { code: 'member:read', name: 'Xem đoàn viên', module: 'member' },
            { code: 'member:create', name: 'Thêm đoàn viên', module: 'member' },
            { code: 'member:update', name: 'Sửa đoàn viên', module: 'member' },
            { code: 'member:delete', name: 'Xóa đoàn viên', module: 'member' },
            { code: 'activity:manage', name: 'Quản lý hoạt động', module: 'activity' },
            { code: 'news:manage', name: 'Quản lý tin tức', module: 'news' },
            { code: 'fee:manage', name: 'Quản lý đoàn phí', module: 'fee' },
            { code: 'quiz:manage', name: 'Quản lý kỳ thi', module: 'quiz' },
            { code: 'branch:manage', name: 'Quản lý Liên chi đoàn', module: 'branch' },
            { code: 'cell:manage', name: 'Quản lý Chi đoàn', module: 'cell' },
            { code: 'user:manage', name: 'Quản lý Tài khoản', module: 'user' },
            { code: 'banner:manage', name: 'Quản lý Banner', module: 'banner' },
            { code: 'document:manage', name: 'Quản lý Văn bản', module: 'document' },
            { code: 'notification:manage', name: 'Quản lý Thông báo', module: 'notification' },
            { code: 'landing:manage', name: 'Quản lý Landing Page', module: 'landing' },
        ];

        const perms = await Promise.all(
            permDefs.map(p => Permission.findOrCreate({ where: { code: p.code }, defaults: { ...p, isActive: true } }).then(([r]) => r))
        );

        await superAdminRole.setPermissions(perms);
        await branchAdminRole.setPermissions(perms.filter(p => ['member:read', 'activity:manage', 'fee:manage'].includes(p.code)));
        await cellAdminRole.setPermissions(perms.filter(p => ['member:read', 'activity:manage'].includes(p.code)));

        console.log(`  ✔ Đã tạo 4 role, ${perms.length} permission\n`);

        // ─── 2. TỔ CHỨC ───────────────────────────────────────────
        console.log('📌 Tạo Tổ chức...');

        const [branch1] = await UnionBranch.findOrCreate({
            where: { code: 'LCD-KTCN' },
            defaults: {
                code: 'LCD-KTCN', name: 'Liên chi đoàn Khoa Kỹ thuật & Công nghệ',
                unionLevel: 'Liên chi đoàn cơ sở',
                officeAddress: 'Tòa A, Tầng 3 - Trường ĐHKT ĐTHU',
                phoneNumber: '0901234567',
                status: 'active',
                termStartYear: 2024, termEndYear: 2027
            }
        });
        const [branch2] = await UnionBranch.findOrCreate({
            where: { code: 'LCD-QTKD' },
            defaults: {
                code: 'LCD-QTKD', name: 'Liên chi đoàn Khoa Quản trị Kinh doanh',
                unionLevel: 'Liên chi đoàn cơ sở',
                officeAddress: 'Tòa B, Tầng 2 - Trường ĐHKT ĐTHU',
                phoneNumber: '0907654321',
                status: 'active',
                termStartYear: 2024, termEndYear: 2027
            }
        });

        const [cell1] = await UnionCell.findOrCreate({
            where: { code: 'CD-CNTT' },
            defaults: { 
                code: 'CD-CNTT', name: 'Chi đoàn Công nghệ thông tin', 
                unionBranchId: branch1.id, memberCount: 0,
                courseYear: 'K2022', academicYear: '2022-2026', status: 'active'
            }
        });
        const [cell2] = await UnionCell.findOrCreate({
            where: { code: 'CD-DTVT' },
            defaults: { 
                code: 'CD-DTVT', name: 'Chi đoàn Điện tử - Viễn thông', 
                unionBranchId: branch1.id, memberCount: 0,
                courseYear: 'K2022', academicYear: '2022-2026', status: 'active'
            }
        });
        const [cell3] = await UnionCell.findOrCreate({
            where: { code: 'CD-QTKD' },
            defaults: { 
                code: 'CD-QTKD', name: 'Chi đoàn Quản trị Kinh doanh', 
                unionBranchId: branch2.id, memberCount: 0,
                courseYear: 'K2021', academicYear: '2021-2025', status: 'active'
            }
        });

        console.log('  ✔ 2 Liên chi đoàn, 3 Chi đoàn con\n');

        // ─── 3. USERS ─────────────────────────────────────────────
        console.log('📌 Tạo Users...');
        
        const [adminUser] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                username: 'admin',
                passwordHash: await bcrypt.hash('Admin@123', salt),
                email: 'admin@dthu.edu.vn',
                isActive: true
            }
        });

        const [bithUser] = await User.findOrCreate({
            where: { username: 'bithu_nguyen' },
            defaults: {
                username: 'bithu_nguyen',
                passwordHash: await bcrypt.hash('Bithu@123', salt),
                email: 'nvan.an@dthu.edu.vn',
                isActive: true,
                unionBranchId: branch1.id,
                unionCellId: cell1.id
            }
        });

        const [memberUser1] = await User.findOrCreate({
            where: { username: 'tran_thi_b' },
            defaults: {
                username: 'tran_thi_b',
                passwordHash: await bcrypt.hash('Member@123', salt),
                email: 'tthi.binh@dthu.edu.vn',
                isActive: true
            }
        });

        await adminUser.setRoles([superAdminRole]);
        await bithUser.setRoles([cellAdminRole]);
        await memberUser1.setRoles([memberRole]);
        console.log('  ✔ Đã tạo 3 user (admin / bithu_nguyen / tran_thi_b)\n');

        // ─── 4. ĐOÀN VIÊN ─────────────────────────────────────────
        console.log('📌 Tạo Đoàn viên...');

        const memberDefs = [
            { memberCode: 'DV001', fullName: 'Nguyễn Văn An', dateOfBirth: '2002-05-12', gender: 'male', email: 'nvan.an@dthu.edu.vn', phoneNumber: '0901111111', identityNumber: '001202001001', memberCardNumber: 'TN001', joinedDate: '2021-09-05', unionCellId: cell1.id, userId: bithUser.id, roleInUnion: 'secretary', activityStatus: 'active', status: 'approved' },
            { memberCode: 'DV002', fullName: 'Trần Thị Bình', dateOfBirth: '2002-08-20', gender: 'female', email: 'tthi.binh@dthu.edu.vn', phoneNumber: '0902222222', identityNumber: '001202001002', memberCardNumber: 'TN002', joinedDate: '2021-09-05', unionCellId: cell1.id, userId: memberUser1.id, roleInUnion: 'member', activityStatus: 'active', status: 'approved' },
            { memberCode: 'DV003', fullName: 'Lê Hoàng Cường', dateOfBirth: '2001-03-15', gender: 'male', email: 'lh.cuong@dthu.edu.vn', phoneNumber: '0903333333', identityNumber: '001202001003', memberCardNumber: 'TN003', joinedDate: '2020-09-10', unionCellId: cell1.id, roleInUnion: 'member', activityStatus: 'active', status: 'approved' },
            { memberCode: 'DV004', fullName: 'Phạm Thị Dung', dateOfBirth: '2003-11-02', gender: 'female', email: 'pth.dung@dthu.edu.vn', phoneNumber: '0904444444', identityNumber: '001202001004', memberCardNumber: 'TN004', joinedDate: '2022-09-01', unionCellId: cell2.id },
            { memberCode: 'DV005', fullName: 'Hoàng Văn Em', dateOfBirth: '2002-07-18', gender: 'male', email: 'hv.em@dthu.edu.vn', phoneNumber: '0905555555', identityNumber: '001202001005', memberCardNumber: 'TN005', joinedDate: '2021-09-05', unionCellId: cell2.id },
            { memberCode: 'DV006', fullName: 'Vũ Thị Phương', dateOfBirth: '2002-01-25', gender: 'female', email: 'vt.phuong@dthu.edu.vn', phoneNumber: '0906666666', identityNumber: '001202001006', memberCardNumber: 'TN006', joinedDate: '2021-09-05', unionCellId: cell3.id },
            { memberCode: 'DV007', fullName: 'Đỗ Minh Quân', dateOfBirth: '2001-09-30', gender: 'male', email: 'dm.quan@dthu.edu.vn', phoneNumber: '0907777777', identityNumber: '001202001007', memberCardNumber: 'TN007', joinedDate: '2020-09-10', unionCellId: cell3.id },
            { memberCode: 'DV008', fullName: 'Ngô Thị Hồng', dateOfBirth: '2003-04-11', gender: 'female', email: 'nth.hong@dthu.edu.vn', phoneNumber: '0908888888', identityNumber: '001202001008', memberCardNumber: 'TN008', joinedDate: '2022-09-01', unionCellId: cell3.id },
            { memberCode: 'DV009', fullName: 'Bùi Thị Lan', dateOfBirth: '2002-12-05', gender: 'female', email: 'bth.lan@dthu.edu.vn', phoneNumber: '0909999999', identityNumber: '001202001009', memberCardNumber: 'TN009', joinedDate: '2021-09-05', unionCellId: cell1.id },
            { memberCode: 'DV010', fullName: 'Trương Văn Minh', dateOfBirth: '2001-06-20', gender: 'male', email: 'tv.minh@dthu.edu.vn', phoneNumber: '0910010010', identityNumber: '001202001010', memberCardNumber: 'TN010', joinedDate: '2020-09-10', unionCellId: cell2.id },
        ];

        const createdMembers = await Promise.all(
            memberDefs.map(m => UnionMember.findOrCreate({ where: { memberCode: m.memberCode }, defaults: m }).then(([r]) => r))
        );

        console.log(`  ✔ ${createdMembers.length} đoàn viên\n`);

        // ─── 5. LỊCH SỬ ĐOÀN VIÊN ───────────────────────────────
        console.log('📌 Tạo Lịch sử đoàn viên...');
        await UnionMemberHistory.create({
            unionMemberId: createdMembers[0].id,
            type: 'role_change',
            oldValue: 'member',
            newValue: 'secretary',
            note: 'Được bầu làm Bí thư chi đoàn nhiệm kỳ 2024-2025',
            actionDate: '2024-10-01'
        });

        // ─── 6. HOẠT ĐỘNG & ĐIỂM DANH ────────────────────────────
        console.log('📌 Tạo Hoạt động...');

        const [act1] = await Activity.findOrCreate({
            where: { title: 'Hiến máu nhân đạo Xuân 2026' },
            defaults: {
                title: 'Hiến máu nhân đạo Xuân 2026',
                description: 'Chương trình hiến máu tình nguyện nhân dịp Tết Nguyên Đán 2026',
                location: 'Hội trường A - Trường ĐHKT ĐTHU',
                startDate: '2026-01-15T07:30:00', endDate: '2026-01-15T11:30:00',
                point: 15, isMandatory: false, unionBranchId: branch1.id
            }
        });
        const [act2] = await Activity.findOrCreate({
            where: { title: 'Đại hội Đoàn nhiệm kỳ 2026-2028' },
            defaults: {
                title: 'Đại hội Đoàn nhiệm kỳ 2026-2028',
                description: 'Đại hội tổng kết và bầu cử Ban chấp hành Đoàn mới',
                location: 'Hội trường lớn - Tòa A',
                startDate: '2026-03-20T08:00:00', endDate: '2026-03-20T17:00:00',
                point: 20, isMandatory: true, unionBranchId: branch1.id
            }
        });

        // Điểm danh
        const attendanceDefs = [
            { activityId: act1.id, unionMemberId: createdMembers[0].id, status: 'Có mặt' },
            { activityId: act1.id, unionMemberId: createdMembers[1].id, status: 'Có mặt' },
            { activityId: act2.id, unionMemberId: createdMembers[0].id, status: 'Có mặt' },
        ];
        await Promise.all(
            attendanceDefs.map(a => Attendance.findOrCreate({
                where: { activityId: a.activityId, unionMemberId: a.unionMemberId },
                defaults: { ...a, attendanceTime: new Date() }
            }))
        );
        console.log('  ✔ Các hoạt động và điểm danh\n');

        // ─── 7. ĐỊA ĐIỂM & SINH HOẠT ─────────────────────────────
        console.log('📌 Tạo Sinh hoạt Chi đoàn...');
        const [locB] = await CellMeetingLocation.findOrCreate({ where: { name: 'Phòng họp 1' }, defaults: { name: 'Phòng họp 1', address: 'Tòa B, Tầng 2', capacity: 20 } });
        
        await CellMeeting.findOrCreate({
            where: { title: 'Sinh hoạt chi đoàn tháng 2/2026' },
            defaults: {
                title: 'Sinh hoạt chi đoàn tháng 2/2026',
                content: 'Tổng kết công tác Đoàn tháng 1, triển khai kế hoạch tháng 2',
                meetingTime: '2026-02-10T14:00:00',
                unionCellId: cell1.id,
                locationId: locB.id,
                chairpersonId: createdMembers[0].id,
                secretaryId: createdMembers[1].id,
                status: 'Hoàn thành',
                minutes: 'Cuộc họp diễn ra đúng giờ với sự tham dự của 4/4 đoàn viên...'
            }
        });

        // ─── 8. TIN TỨC ───────────────────────────────────────────
        console.log('📌 Tạo Tin tức...');
        const [catThongBao] = await NewsCategory.findOrCreate({ where: { name: 'Thông báo' }, defaults: { name: 'Thông báo' } });

        await News.findOrCreate({
            where: { title: 'Thông báo Đại hội Đoàn nhiệm kỳ 2026-2028' },
            defaults: {
                title: 'Thông báo Đại hội Đoàn nhiệm kỳ 2026-2028',
                summary: 'Đại hội Đoàn sẽ được tổ chức vào ngày 20/03/2026',
                content: 'Kính gửi toàn thể đoàn viên, Ban chấp hành Đoàn trường thông báo...',
                categoryId: catThongBao.id, authorId: adminUser.id,
                status: 'Đã đăng', publishedAt: new Date('2026-03-01')
            }
        });

        // ─── 9. THI & ĐOÀN PHÍ ───────────────────────────────────
        console.log('📌 Tạo Kỳ thi & Đoàn phí...');
        const [exam1] = await QuizExam.findOrCreate({
            where: { title: 'Tìm hiểu Nghị quyết Đại hội Đoàn lần XIV' },
            defaults: {
                title: 'Tìm hiểu Nghị quyết Đại hội Đoàn lần XIV',
                timeLimit: 30, satisfactoryScore: 7,
                startDate: '2026-03-01', endDate: '2026-03-31'
            }
        });

        await UnionFeePayment.findOrCreate({
            where: { unionMemberId: createdMembers[0].id, period: 'Q1/2026' },
            defaults: { unionMemberId: createdMembers[0].id, period: 'Q1/2026', amount: 10000, paymentDate: '2026-01-06', unionBranchId: branch1.id, unionCellId: cell1.id }
        });

        // ─── 10. THÔNG BÁO ──────────────────────────────────────────
        console.log('📌 Tạo Thông báo mẫu...');
        await Notification.findOrCreate({
            where: { title: 'Chào mừng bạn đến với ứng dụng Quản lý Đoàn viên ĐTHU' },
            defaults: {
                title: 'Chào mừng bạn đến với ứng dụng Quản lý Đoàn viên ĐTHU',
                content: 'Ứng dụng đã chính thức đi vào hoạt động. Hãy cập nhật hồ sơ của bạn ngay.',
                category: 'SYSTEM', targetType: 'ALL', createdByRole: 'SUPER_ADMIN', status: 'Sent'
            }
        });

        // ─── 11. CHỨC VỤ ──────────────────────────────────────────
        console.log('📌 Tạo Chức vụ (Positions)...');
        const positionDefs = [
            { name: 'Bí thư Chi đoàn', scopeLevel: 'CELL', description: 'Người đứng đầu Chi đoàn' },
            { name: 'Phó Bí thư Chi đoàn', scopeLevel: 'CELL', description: 'Phó người đứng đầu Chi đoàn' },
            { name: 'Ủy viên Ban chấp hành Chi đoàn', scopeLevel: 'CELL', description: 'Thành viên BCH Chi đoàn' },
            { name: 'Bí thư Liên chi đoàn', scopeLevel: 'BRANCH', description: 'Người đứng đầu Liên chi đoàn (Khoa)' },
            { name: 'Phó Bí thư Liên chi đoàn', scopeLevel: 'BRANCH', description: 'Phó người đứng đầu Liên chi đoàn (Khoa)' }
        ];
        await Promise.all(
            positionDefs.map(p => UnionPosition.findOrCreate({ 
                where: { name: p.name, scopeLevel: p.scopeLevel }, 
                defaults: p 
            }))
        );
        console.log('  ✔ Đã tạo các chức vụ mẫu\n');

        console.log('🎉 SEED THÀNH CÔNG!\n');
    } catch (err) {
        console.error('❌ Seed thất bại:', err.message);
        console.error(err);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

seed();
