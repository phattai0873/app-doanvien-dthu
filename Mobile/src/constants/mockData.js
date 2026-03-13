// MOCK DATA - Aligned with SQL Schema (references_ui/database)

export const MOCK_DB = {
    // 3. Bảng Đảng viên (Party Members) & 4. Users combined for frontend display
    user: {
        id: 1,
        // party_members fields
        ho_ten: "Nguyễn Văn A",
        ma_dang_vien: "12345678",
        ngay_sinh: "01/01/1985",
        gioi_tinh: "Nam",
        cccd: "03809xxxxxxx",
        sdt: "0987654321",
        email: "nguyenvana@email.com",
        dia_chi: "TP. Cao Lãnh, Đồng Tháp",
        anh_dai_dien: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop",

        // Joining details
        ngay_vao_dang: "03/02/2015",
        ngay_chinh_thuc: "03/02/2016",

        // Position & Org (Joined data)
        // Positions
        chuc_vu_doan: "Bí thư Chi đoàn",
        chi_doan_id: 10,
        don_vi_ten: "Chi đoàn Khối Doanh nghiệp",

        // Qualification
        trinh_do_hoc_van: "Đại học",
        trinh_do_ly_luan: "Cơ bản",
        nghe_nghiep: "Kỹ sư CNTT",

        // Status
        trang_thai_doan: "Đoàn viên",
        is_verified: false
    },

    // 2. Bảng Chi đoàn
    party_cell: {
        id: 10,
        ma_chi_doan: "CD-DN01",
        ten_chi_doan: "Chi đoàn Khối Doanh nghiệp",
        dang_bo_id: 1,
        don_vi_truc_thuoc: "Công ty ABC",
        bi_thu_ten: "Lê Văn B",
        so_doan_vien: 24,
        ngay_thanh_lap: "19/05/2010"
    },

    // 1. Bảng Đảng bộ (Party Committees)
    party_committee: {
        id: 1,
        ma_dang_bo: "DB-HC",
        ten_dang_bo: "Đảng bộ Quận Hải Châu",
        cap_uy: "Cấp Huyện/Quận",
        bi_thu_ten: "Trần Văn C", // Joined info
        dia_chi_van_phong: "Số 10, Đường Phan Đăng Lưu",
        dien_thoai: "0236.3.xxx.xxx",
        tong_so_dang_vien: 5400,
        so_chi_bo_truc_thuoc: 120
    },

    // News Categories table
    news_categories: [
        { id: 'all', name: "Tất cả" },
        { id: 1, name: "Hoạt động Đảng" },
        { id: 2, name: "Gương điển hình" },
        { id: 3, name: "Tuyên truyền" },
        { id: 4, name: "Chỉ đạo điều hành" }
    ],

    // News table
    news: [
        {
            id: "uuid-1",
            title: "Đồng Tháp: Sôi nổi các hoạt động Tháng Thanh niên 2026",
            summary: "Tháng Thanh niên năm nay với chủ đề 'Tuổi trẻ Đồng Tháp xung kích, tình nguyện vì cộng đồng' đã thu hút hàng ngàn đoàn viên tham gia...",
            content: "Nội dung chi tiết về các công trình thanh niên, hoạt động tình nguyện tại các xã vùng sâu vùng xa của tỉnh Đồng Tháp...",
            thumbnailUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop",
            categoryId: 1,
            publishedAt: "24/02/2026",
            source_note: "news (status=published)"
        },
        {
            id: "uuid-2",
            title: "Gương sáng Thanh niên: Vượt khó vươn lên làm chủ kỹ thuật",
            summary: "Đồng chí Trần Văn Nam, đoàn viên chi đoàn Kỹ thuật đã có nhiều sáng kiến cải tiến quy trình sản xuất, tiết kiệm hàng trăm triệu đồng...",
            content: "Câu chuyện về hành trình không ngừng học hỏi và sáng tạo của người thợ trẻ trên mảnh đất Sen Hồng...",
            thumbnailUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop",
            categoryId: 2,
            publishedAt: "23/02/2026",
            source_note: "news (status=published)"
        },
        {
            id: "uuid-3",
            title: "Khai mạc Hội trại Tòng quân năm 2026",
            summary: "Những thanh niên ưu tú của quê hương đã sẵn sàng lên đường nhập ngũ, thực hiện nghĩa vụ thiêng liêng với Tổ quốc...",
            content: "Không khí hào hứng tại Hội trại tòng quân, những lời dặn dò ấm áp từ gia đình và người thân...",
            thumbnailUrl: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=800&auto=format&fit=crop",
            categoryId: 3,
            publishedAt: "22/02/2026",
            source_note: "news (status=published)"
        }
    ],

    // 11. Bảng Thông báo (Notifications)
    notifications: [
        {
            id: 501,
            title: "Triệu tập cuộc họp Chi bộ tháng 6",
            noi_dung: "Kính mời đồng chí tham dự họp...",
            thoi_gian_gui: "08:00 - 25/05/2025",
            loai_thong_bao: "meeting", // mapped to internal type
            uu_tien: "khan_cap",
            is_read: false,
            nguoi_gui_ten: "Chi bộ 3",
            category: "Lịch họp"
        },
        {
            id: 502,
            title: "Nhắc nhở đóng Đảng phí",
            noi_dung: "Đồng chí vui lòng đóng đảng phí tháng 5...",
            thoi_gian_gui: "10:30 - 24/05/2025",
            loai_thong_bao: "fee",
            uu_tien: "thuong",
            is_read: true,
            nguoi_gui_ten: "Ban Tài chính",
            category: "Tài chính"
        }
    ],

    // 3. Bảng Đoàn viên cho Admin Management
    members: [
        { id: 1, ho_ten: "Nguyễn Văn A", ma_dang_vien: "12345678", is_active: true },
        { id: 2, ho_ten: "Trần Thị B", ma_dang_vien: "23456789", is_active: true },
        { id: 3, ho_ten: "Lê Văn C", ma_dang_vien: "34567890", is_active: false },
        { id: 4, ho_ten: "Phạm Minh D", ma_dang_vien: "45678901", is_active: true },
        { id: 5, ho_ten: "Hoàng Thanh E", ma_dang_vien: "56789012", is_active: true },
    ],

    // Aggregated Summaries...
    work_summary: {
        next_meeting: "25/05 - 08:00", // From closest future 'cell_meetings'
        unpaid_fee: "Tháng 5" // From 'party_fees' where status='chua_dong'
    },

    // 5. Kho tri thức (Documents)
    document_categories: [
        { id: 1, name: "Văn kiện Đảng" },
        { id: 2, name: "Luật pháp" },
        { id: 3, name: "Học tập & Làm theo Bác" }
    ],
    documents: [
        {
            id: 101,
            title: "Nghị quyết Đại hội XIII của Đảng",
            description: "Toàn văn Nghị quyết Đại hội đại biểu toàn quốc lần thứ XIII...",
            file_url: "https://example.com/doc1.pdf",
            category_id: 1,
            created_at: "20/01/2026",
            file_type: "pdf"
        },
        {
            id: 102,
            title: "Luật Tổ chức chính quyền địa phương",
            description: "Sửa đổi, bổ sung một số điều...",
            file_url: "https://example.com/doc2.pdf",
            category_id: 2,
            created_at: "15/01/2026",
            file_type: "pdf"
        }
    ],

    // 6. Trắc nghiệm (Exams)
    exams: [
        {
            id: 201,
            title: "Cuộc thi tìm hiểu Điều lệ Đảng",
            description: "Dành cho toàn thể đảng viên",
            start_time: "01/02/2026",
            end_time: "28/02/2026",
            duration_minutes: 30,
            status: "open"
        },
        {
            id: 202,
            title: "Kiểm tra nhận thức chính trị định kỳ",
            description: "Tháng 3/2026",
            start_time: "01/03/2026",
            end_time: "05/03/2026",
            duration_minutes: 45,
            status: "upcoming"
        }
    ],

    // 8. Tình nguyện (Volunteer)
    volunteer_activities: [
        {
            id: 301,
            title: "Ra quân Ngày Chủ nhật Xanh",
            description: "Dọn dẹp vệ sinh khu vực đài tưởng niệm...",
            location: "Đài tưởng niệm Liệt sỹ Quận",
            start_time: "07:00 - 20/02/2026",
            status: "open",
            registered_count: 15,
            max_participants: 50
        }
    ],

    // 3. Sinh hoạt chi bộ (Cell Meetings)
    cell_meetings: [
        {
            id: 401,
            title: "Sinh hoạt chi bộ thường kỳ Tháng 2/2026",
            description: "Nội dung: Đánh giá công tác tháng 1, triển khai nhiệm vụ tháng 2",
            start_time: "14:00 - 03/02/2026",
            location: "Hội trường A",
            status: "scheduled", // scheduled, active, finished
            attendance_rate: 0 // calculated later
        }
    ],

    // 4. Đảng phí (Party Fees)
    party_fees: [
        { id: 1, month: 1, year: 2026, amount: 50000, status: 'paid', paid_at: '05/01/2026' },
        { id: 2, month: 2, year: 2026, amount: 50000, status: 'paid', paid_at: '02/02/2026' },
        { id: 3, month: 3, year: 2026, amount: 50000, status: 'unpaid', paid_at: null },
        { id: 4, month: 4, year: 2026, amount: 50000, status: 'unpaid', paid_at: null },
    ],

    // 5. Học tập Lý luận (Political Theory)
    political_studies: [
        { id: 1, title: 'Bồi dưỡng nhận thức về Đảng', teacher: 'GS.TS Nguyễn Văn B', duration: '6 buổi', progress: 100, thumbnail: 'https://cdn.dangcongsan.vn/data/0/2021/05/19/anh68-21-48-969.jpg' },
        { id: 2, title: 'Chủ nghĩa Mác-Lênin & Tư tưởng Hồ Chí Minh', teacher: 'PGS.TS Trần Thị C', duration: '12 buổi', progress: 45, thumbnail: 'https://ttbc-hcm.gov.vn/FileStorage/TTBC/GiaoDuc/2023/1/13/16-1705126838.jpg' },
        { id: 3, title: 'Nghị quyết đại hội XIII và vận dụng', teacher: 'Ban Tuyên giáo', duration: '4 buổi', progress: 0, thumbnail: 'https://baochinhphu.vn/Images/2021/3/27/1-16168538382101018671144.jpg' },
    ],

    activity_registrations: [
        { activity_id: 301, user_id: 1, status: 'registered', registered_at: '2026-01-20' }
    ]
};
