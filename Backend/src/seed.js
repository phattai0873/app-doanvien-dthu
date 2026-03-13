/**
 * SEED DATABASE - App Đoàn viên ĐHKT-ĐTHU
 * Chạy: node src/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');

// Load models (triggers sync)
const {
    User, Role, Permission,
    UnionBranch, UnionCell,
    UnionMember, UnionPosition, UnionMemberPosition,
    Activity, Attendance,
    CellMeeting,
    NewsCategory, News,
    DocumentCategory,
    Notification,
    QuizExam, QuizQuestion, QuizOption,
    UnionFeePayment
} = require('./models');
const { sequelize } = require('./configs/db');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');
        await sequelize.sync({ alter: true });
        console.log('✅ Sync bảng xong\n');

        // ─── 1. ROLES & PERMISSIONS ──────────────────────────────
        console.log('📌 Tạo Roles & Permissions...');

        const [adminRole] = await Role.findOrCreate({
            where: { code: 'ADMIN' },
            defaults: { code: 'ADMIN', name: 'Quản trị viên', description: 'Toàn quyền hệ thống', isSystem: true, isActive: true }
        });
        const [secretaryRole] = await Role.findOrCreate({
            where: { code: 'SECRETARY' },
            defaults: { code: 'SECRETARY', name: 'Bí thư', description: 'Quản lý chi bộ', isSystem: false, isActive: true }
        });
        const [memberRole] = await Role.findOrCreate({
            where: { code: 'MEMBER' },
            defaults: { code: 'MEMBER', name: 'Đoàn viên', description: 'Đoàn viên thường', isSystem: false, isActive: true }
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
        ];

        const perms = await Promise.all(
            permDefs.map(p => Permission.findOrCreate({ where: { code: p.code }, defaults: { ...p, isActive: true } }).then(([r]) => r))
        );

        await adminRole.setPermissions(perms);
        await secretaryRole.setPermissions(perms.filter(p => ['member:read', 'activity:manage', 'fee:manage'].includes(p.code)));

        console.log('  ✔ Đã tạo 3 role, 8 permission\n');

        // ─── 2. USERS ─────────────────────────────────────────────
        console.log('📌 Tạo Users...');
        const salt = await bcrypt.genSalt(10);

        const [adminUser] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                username: 'admin',
                passwordHash: await bcrypt.hash('Admin@123', salt),
                isActive: true, isLocked: false
            }
        });
        const [bithUser] = await User.findOrCreate({
            where: { username: 'bithu_nguyen' },
            defaults: {
                username: 'bithu_nguyen',
                passwordHash: await bcrypt.hash('Bithu@123', salt),
                isActive: true, isLocked: false
            }
        });
        const [memberUser1] = await User.findOrCreate({
            where: { username: 'tran_thi_b' },
            defaults: {
                username: 'tran_thi_b',
                passwordHash: await bcrypt.hash('Member@123', salt),
                isActive: true, isLocked: false
            }
        });

        await adminUser.setRoles([adminRole]);
        await bithUser.setRoles([secretaryRole]);
        await memberUser1.setRoles([memberRole]);
        console.log('  ✔ Đã tạo 3 user (admin / bithu_nguyen / tran_thi_b)\n');

        // ─── 3. TỔ CHỨC ───────────────────────────────────────────
        console.log('📌 Tạo Tổ chức...');

        const [branch1] = await UnionBranch.findOrCreate({
            where: { code: 'CB-KTCN' },
            defaults: {
                code: 'CB-KTCN', name: 'Chi bộ Khoa Kỹ thuật & Công nghệ',
                partyLevel: 'Chi bộ cơ sở',
                officeAddress: 'Tòa A, Tầng 3 - Trường ĐHKT ĐTHU',
                phoneNumber: '0901234567'
            }
        });
        const [branch2] = await UnionBranch.findOrCreate({
            where: { code: 'CB-QTKD' },
            defaults: {
                code: 'CB-QTKD', name: 'Chi bộ Khoa Quản trị Kinh doanh',
                partyLevel: 'Chi bộ cơ sở',
                officeAddress: 'Tòa B, Tầng 2 - Trường ĐHKT ĐTHU',
                phoneNumber: '0907654321'
            }
        });

        const [cell1] = await UnionCell.findOrCreate({
            where: { code: 'TO-CNTT' },
            defaults: { code: 'TO-CNTT', name: 'Tổ Công nghệ thông tin', unionBranchId: branch1.id, memberCount: 0 }
        });
        const [cell2] = await UnionCell.findOrCreate({
            where: { code: 'TO-DTVT' },
            defaults: { code: 'TO-DTVT', name: 'Tổ Điện tử - Viễn thông', unionBranchId: branch1.id, memberCount: 0 }
        });
        const [cell3] = await UnionCell.findOrCreate({
            where: { code: 'TO-QTKD' },
            defaults: { code: 'TO-QTKD', name: 'Tổ Quản trị Kinh doanh', unionBranchId: branch2.id, memberCount: 0 }
        });

        console.log('  ✔ 2 Chi bộ, 3 Tổ/Chi bộ con\n');

        // ─── 4. CHỨC VỤ ───────────────────────────────────────────
        const [posBithu] = await UnionPosition.findOrCreate({ where: { name: 'Bí thư' }, defaults: { name: 'Bí thư', scopeLevel: 'BRANCH' } });
        const [posPBithu] = await UnionPosition.findOrCreate({ where: { name: 'Phó Bí thư' }, defaults: { name: 'Phó Bí thư', scopeLevel: 'BRANCH' } });
        const [posUyVien] = await UnionPosition.findOrCreate({ where: { name: 'Ủy viên' }, defaults: { name: 'Ủy viên', scopeLevel: 'BRANCH' } });
        const [posDV] = await UnionPosition.findOrCreate({ where: { name: 'Đoàn viên' }, defaults: { name: 'Đoàn viên', scopeLevel: 'CELL' } });

        // ─── 5. ĐOÀN VIÊN ─────────────────────────────────────────
        console.log('📌 Tạo Đoàn viên...');

        const memberDefs = [
            { memberCode: 'DV001', fullName: 'Nguyễn Văn An', dateOfBirth: '2002-05-12', gender: 'Nam', email: 'nvan.an@dthu.edu.vn', phoneNumber: '0901111111', identityNumber: '001202001001', memberCardNumber: 'TN001', joinedDate: '2021-09-05', unionCellId: cell1.id, unionBranchId: branch1.id, userId: bithUser.id },
            { memberCode: 'DV002', fullName: 'Trần Thị Bình', dateOfBirth: '2002-08-20', gender: 'Nu', email: 'tthi.binh@dthu.edu.vn', phoneNumber: '0902222222', identityNumber: '001202001002', memberCardNumber: 'TN002', joinedDate: '2021-09-05', unionCellId: cell1.id, unionBranchId: branch1.id, userId: memberUser1.id },
            { memberCode: 'DV003', fullName: 'Lê Hoàng Cường', dateOfBirth: '2001-03-15', gender: 'Nam', email: 'lh.cuong@dthu.edu.vn', phoneNumber: '0903333333', identityNumber: '001202001003', memberCardNumber: 'TN003', joinedDate: '2020-09-10', unionCellId: cell1.id, unionBranchId: branch1.id },
            { memberCode: 'DV004', fullName: 'Phạm Thị Dung', dateOfBirth: '2003-11-02', gender: 'Nu', email: 'pth.dung@dthu.edu.vn', phoneNumber: '0904444444', identityNumber: '001202001004', memberCardNumber: 'TN004', joinedDate: '2022-09-01', unionCellId: cell2.id, unionBranchId: branch1.id },
            { memberCode: 'DV005', fullName: 'Hoàng Văn Em', dateOfBirth: '2002-07-18', gender: 'Nam', email: 'hv.em@dthu.edu.vn', phoneNumber: '0905555555', identityNumber: '001202001005', memberCardNumber: 'TN005', joinedDate: '2021-09-05', unionCellId: cell2.id, unionBranchId: branch1.id },
            { memberCode: 'DV006', fullName: 'Vũ Thị Phương', dateOfBirth: '2002-01-25', gender: 'Nu', email: 'vt.phuong@dthu.edu.vn', phoneNumber: '0906666666', identityNumber: '001202001006', memberCardNumber: 'TN006', joinedDate: '2021-09-05', unionCellId: cell3.id, unionBranchId: branch2.id },
            { memberCode: 'DV007', fullName: 'Đỗ Minh Quân', dateOfBirth: '2001-09-30', gender: 'Nam', email: 'dm.quan@dthu.edu.vn', phoneNumber: '0907777777', identityNumber: '001202001007', memberCardNumber: 'TN007', joinedDate: '2020-09-10', unionCellId: cell3.id, unionBranchId: branch2.id },
            { memberCode: 'DV008', fullName: 'Ngô Thị Hồng', dateOfBirth: '2003-04-11', gender: 'Nu', email: 'nth.hong@dthu.edu.vn', phoneNumber: '0908888888', identityNumber: '001202001008', memberCardNumber: 'TN008', joinedDate: '2022-09-01', unionCellId: cell3.id, unionBranchId: branch2.id },
            { memberCode: 'DV009', fullName: 'Bùi Thị Lan', dateOfBirth: '2002-12-05', gender: 'Nu', email: 'bth.lan@dthu.edu.vn', phoneNumber: '0909999999', identityNumber: '001202001009', memberCardNumber: 'TN009', joinedDate: '2021-09-05', unionCellId: cell1.id, unionBranchId: branch1.id },
            { memberCode: 'DV010', fullName: 'Trương Văn Minh', dateOfBirth: '2001-06-20', gender: 'Nam', email: 'tv.minh@dthu.edu.vn', phoneNumber: '0910010010', identityNumber: '001202001010', memberCardNumber: 'TN010', joinedDate: '2020-09-10', unionCellId: cell2.id, unionBranchId: branch1.id },
        ];

        const createdMembers = await Promise.all(
            memberDefs.map(m => UnionMember.findOrCreate({ where: { memberCode: m.memberCode }, defaults: m }).then(([r]) => r))
        );

        // Phân công chức vụ
        await UnionMemberPosition.findOrCreate({
            where: { unionMemberId: createdMembers[0].id, unionPositionId: posBithu.id },
            defaults: { unionMemberId: createdMembers[0].id, unionPositionId: posBithu.id, unionCellId: cell1.id, assignedDate: '2022-01-01', isActive: true }
        });
        await UnionMemberPosition.findOrCreate({
            where: { unionMemberId: createdMembers[1].id, unionPositionId: posPBithu.id },
            defaults: { unionMemberId: createdMembers[1].id, unionPositionId: posPBithu.id, unionCellId: cell1.id, assignedDate: '2022-01-01', isActive: true }
        });

        // Cập nhật bí thư cho chi bộ
        await branch1.update({ secretaryId: createdMembers[0].id });
        await cell1.update({ memberCount: 4 });
        await cell2.update({ memberCount: 3 });
        await cell3.update({ memberCount: 3 });

        console.log(`  ✔ ${createdMembers.length} đoàn viên\n`);

        // ─── 6. HOẠT ĐỘNG & ĐIỂM DANH ────────────────────────────
        console.log('📌 Tạo Hoạt động...');

        const [act1] = await Activity.findOrCreate({
            where: { title: 'Hiến máu nhân đạo Xuân 2026' },
            defaults: {
                title: 'Hiến máu nhân đạo Xuân 2026',
                description: 'Chương trình hiến máu tình nguyện nhân dịp Tết Nguyên Đán 2026',
                location: 'Hội trường A - Trường ĐHKT ĐTHU',
                startDate: '2026-01-15T07:30:00', endDate: '2026-01-15T11:30:00',
                point: 15, isMandatory: false
            }
        });
        const [act2] = await Activity.findOrCreate({
            where: { title: 'Đại hội Đoàn nhiệm kỳ 2026-2028' },
            defaults: {
                title: 'Đại hội Đoàn nhiệm kỳ 2026-2028',
                description: 'Đại hội tổng kết và bầu cử Ban chấp hành Đoàn mới',
                location: 'Hội trường lớn - Tòa A',
                startDate: '2026-03-20T08:00:00', endDate: '2026-03-20T17:00:00',
                point: 20, isMandatory: true
            }
        });
        const [act3] = await Activity.findOrCreate({
            where: { title: 'Tình nguyện Mùa hè xanh 2025' },
            defaults: {
                title: 'Tình nguyện Mùa hè xanh 2025',
                description: 'Chiến dịch tình nguyện tại huyện Châu Thành, tỉnh Đồng Tháp',
                location: 'Huyện Châu Thành, Đồng Tháp',
                startDate: '2025-07-01T06:00:00', endDate: '2025-07-14T18:00:00',
                point: 30, isMandatory: false
            }
        });

        // Điểm danh
        const attendanceDefs = [
            { activityId: act1.id, unionMemberId: createdMembers[0].id, status: 'Có mặt' },
            { activityId: act1.id, unionMemberId: createdMembers[1].id, status: 'Có mặt' },
            { activityId: act1.id, unionMemberId: createdMembers[2].id, status: 'Vắng' },
            { activityId: act1.id, unionMemberId: createdMembers[3].id, status: 'Có phép' },
            { activityId: act2.id, unionMemberId: createdMembers[0].id, status: 'Có mặt' },
            { activityId: act2.id, unionMemberId: createdMembers[1].id, status: 'Có mặt' },
            { activityId: act2.id, unionMemberId: createdMembers[2].id, status: 'Có mặt' },
            { activityId: act3.id, unionMemberId: createdMembers[0].id, status: 'Có mặt' },
            { activityId: act3.id, unionMemberId: createdMembers[4].id, status: 'Có mặt' },
        ];
        await Promise.all(
            attendanceDefs.map(a => Attendance.findOrCreate({
                where: { activityId: a.activityId, unionMemberId: a.unionMemberId },
                defaults: { ...a, attendanceTime: new Date() }
            }))
        );
        console.log('  ✔ 3 hoạt động, 9 lượt điểm danh\n');

        // ─── 7. CUỘC HỌP CHI BỘ ──────────────────────────────────
        console.log('📌 Tạo Cuộc họp...');
        await CellMeeting.findOrCreate({
            where: { title: 'Họp chi bộ tháng 2/2026' },
            defaults: {
                title: 'Họp chi bộ tháng 2/2026',
                content: 'Tổng kết công tác Đoàn tháng 1, triển khai kế hoạch tháng 2',
                meetingTime: '2026-02-10T14:00:00',
                unionCellId: cell1.id,
                chairpersonId: createdMembers[0].id,
                secretaryId: createdMembers[1].id,
                status: 'Hoàn thành',
                minutes: 'Cuộc họp diễn ra đúng giờ với sự tham dự của 4/4 đoàn viên...'
            }
        });
        await CellMeeting.findOrCreate({
            where: { title: 'Họp chi bộ tháng 3/2026' },
            defaults: {
                title: 'Họp chi bộ tháng 3/2026',
                content: 'Chuẩn bị Đại hội Đoàn, phân công nhiệm vụ',
                meetingTime: '2026-03-05T14:00:00',
                unionCellId: cell1.id,
                chairpersonId: createdMembers[0].id,
                secretaryId: createdMembers[1].id,
                status: 'Mới tạo'
            }
        });
        console.log('  ✔ 2 cuộc họp chi bộ\n');

        // ─── 8. TIN TỨC ───────────────────────────────────────────
        console.log('📌 Tạo Tin tức...');
        const [catHoatDong] = await NewsCategory.findOrCreate({ where: { name: 'Tin hoạt động' }, defaults: { name: 'Tin hoạt động' } });
        const [catThongBao] = await NewsCategory.findOrCreate({ where: { name: 'Thông báo' }, defaults: { name: 'Thông báo' } });
        const [catGuong] = await NewsCategory.findOrCreate({ where: { name: 'Gương điển hình' }, defaults: { name: 'Gương điển hình' } });

        await News.findOrCreate({
            where: { title: 'Thành công chiến dịch Hiến máu Xuân 2026' },
            defaults: {
                title: 'Thành công chiến dịch Hiến máu Xuân 2026',
                summary: 'Chiến dịch hiến máu tình nguyện thu hút hơn 200 đơn vị máu',
                content: 'Ngày 15/01/2026, Đoàn trường ĐHKT ĐTHU phối hợp tổ chức...',
                categoryId: catHoatDong.id, authorId: adminUser.id,
                status: 'Đã đăng', publishedAt: new Date('2026-01-16')
            }
        });
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
        await News.findOrCreate({
            where: { title: 'Gương điển hình: Nguyễn Văn An - Sinh viên 5 tốt 2025' },
            defaults: {
                title: 'Gương điển hình: Nguyễn Văn An - Sinh viên 5 tốt 2025',
                summary: 'Đoàn viên xuất sắc đạt danh hiệu Sinh viên 5 tốt cấp Trung ương',
                content: 'Đoàn viên Nguyễn Văn An, lớp CNTT2022...',
                categoryId: catGuong.id, authorId: adminUser.id,
                status: 'Đã đăng', publishedAt: new Date('2026-02-20')
            }
        });
        await News.findOrCreate({
            where: { title: 'Kế hoạch hoạt động Đoàn tháng 4/2026 (bản nháp)' },
            defaults: {
                title: 'Kế hoạch hoạt động Đoàn tháng 4/2026 (bản nháp)',
                summary: 'Dự thảo kế hoạch các hoạt động tháng 4',
                content: 'Nội dung đang được soạn thảo...',
                categoryId: catThongBao.id, authorId: adminUser.id,
                status: 'Nháp'
            }
        });
        console.log('  ✔ 3 danh mục, 4 bài viết\n');

        // ─── 9. THI & KHẢO SÁT ───────────────────────────────────
        console.log('📌 Tạo Kỳ thi...');
        const [exam1] = await QuizExam.findOrCreate({
            where: { title: 'Tìm hiểu Nghị quyết Đại hội Đoàn lần XIV' },
            defaults: {
                title: 'Tìm hiểu Nghị quyết Đại hội Đoàn lần XIV',
                description: 'Bài thi tìm hiểu về nội dung Nghị quyết Đại hội Đoàn TNCS HCM lần XIV',
                timeLimit: 30, satisfactoryScore: 7,
                startDate: '2026-03-01', endDate: '2026-03-31'
            }
        });

        const q1 = await QuizQuestion.findOrCreate({
            where: { examId: exam1.id, content: 'Chủ đề của Đại hội Đoàn TNCS HCM lần XIV là gì?' },
            defaults: {
                examId: exam1.id,
                content: 'Chủ đề của Đại hội Đoàn TNCS HCM lần XIV là gì?',
                questionType: 'SINGLE', score: 2, order: 1
            }
        }).then(([r]) => r);

        await Promise.all([
            QuizOption.findOrCreate({ where: { questionId: q1.id, content: 'Đoàn kết - Sáng tạo - Phát triển' }, defaults: { questionId: q1.id, content: 'Đoàn kết - Sáng tạo - Phát triển', isCorrect: false } }),
            QuizOption.findOrCreate({ where: { questionId: q1.id, content: 'Thanh niên với khát vọng phát triển đất nước phồn vinh, hạnh phúc' }, defaults: { questionId: q1.id, content: 'Thanh niên với khát vọng phát triển đất nước phồn vinh, hạnh phúc', isCorrect: true } }),
            QuizOption.findOrCreate({ where: { questionId: q1.id, content: 'Đoàn TNCS HCM - Xung kích, sáng tạo, tiên phong' }, defaults: { questionId: q1.id, content: 'Đoàn TNCS HCM - Xung kích, sáng tạo, tiên phong', isCorrect: false } }),
        ]);

        const q2 = await QuizQuestion.findOrCreate({
            where: { examId: exam1.id, content: 'Đoàn TNCS Hồ Chí Minh được thành lập vào ngày tháng năm nào?' },
            defaults: {
                examId: exam1.id,
                content: 'Đoàn TNCS Hồ Chí Minh được thành lập vào ngày tháng năm nào?',
                questionType: 'SINGLE', score: 2, order: 2
            }
        }).then(([r]) => r);

        await Promise.all([
            QuizOption.findOrCreate({ where: { questionId: q2.id, content: '26/03/1930' }, defaults: { questionId: q2.id, content: '26/03/1930', isCorrect: true } }),
            QuizOption.findOrCreate({ where: { questionId: q2.id, content: '19/05/1941' }, defaults: { questionId: q2.id, content: '19/05/1941', isCorrect: false } }),
            QuizOption.findOrCreate({ where: { questionId: q2.id, content: '02/09/1945' }, defaults: { questionId: q2.id, content: '02/09/1945', isCorrect: false } }),
        ]);

        // Lượt làm bài mẫu
        await Promise.all(
            createdMembers.slice(0, 5).map((m, i) =>
                require('./models').QuizAttempt.findOrCreate({
                    where: { examId: exam1.id, unionMemberId: m.id },
                    defaults: {
                        examId: exam1.id, unionMemberId: m.id,
                        score: [8, 6, 10, 4, 9][i],
                        correctAnswersCount: [4, 3, 5, 2, 4][i],
                        submitTime: new Date()
                    }
                })
            )
        );
        console.log('  ✔ 1 kỳ thi, 2 câu hỏi, 5 lượt làm bài\n');

        // ─── 10. ĐOÀN PHÍ ─────────────────────────────────────────
        console.log('📌 Tạo Đoàn phí...');
        const feeDefs = [
            { unionMemberId: createdMembers[0].id, period: 'Q4/2025', amount: 10000, paymentDate: '2025-10-05', note: 'Nộp đúng hạn' },
            { unionMemberId: createdMembers[1].id, period: 'Q4/2025', amount: 10000, paymentDate: '2025-10-08' },
            { unionMemberId: createdMembers[2].id, period: 'Q4/2025', amount: 10000, paymentDate: '2025-10-10' },
            { unionMemberId: createdMembers[3].id, period: 'Q4/2025', amount: 10000, paymentDate: '2025-10-12' },
            { unionMemberId: createdMembers[4].id, period: 'Q4/2025', amount: 10000, paymentDate: '2025-10-15' },
            { unionMemberId: createdMembers[0].id, period: 'Q1/2026', amount: 10000, paymentDate: '2026-01-06', note: 'Nộp đầu năm' },
            { unionMemberId: createdMembers[1].id, period: 'Q1/2026', amount: 10000, paymentDate: '2026-01-10' },
            // DV003..DV010 chưa nộp Q1/2026 (để test tính năng unpaid)
        ];
        await Promise.all(
            feeDefs.map(f => UnionFeePayment.findOrCreate({
                where: { unionMemberId: f.unionMemberId, period: f.period },
                defaults: f
            }))
        );
        console.log('  ✔ 7 bản ghi đoàn phí (8 người chưa nộp Q1/2026)\n');

        // ─── DONE ──────────────────────────────────────────────────
        console.log('🎉 SEED THÀNH CÔNG!\n');
        console.log('==========================================');
        console.log('Tài khoản mặc định:');
        console.log('  Admin   : admin / Admin@123');
        console.log('  Bí thư  : bithu_nguyen / Bithu@123');
        console.log('  Đoàn viên: tran_thi_b / Member@123');
        console.log('==========================================\n');

    } catch (err) {
        console.error('❌ Seed thất bại:', err.message);
        console.error(err);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

seed();
