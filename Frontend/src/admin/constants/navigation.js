import {
    LayoutDashboard, Users, Building2, Network,
    Calendar, Newspaper, BookOpen, Wallet, Shield,
    CalendarClock, FileText, Bell, UserCog, Image as ImageIcon, MousePointer2,
    Plus, Trash2, FileOutput, Settings, BarChart3
} from 'lucide-react';

/**
 * NAV là danh sách các lệnh hệ thống (Điều hướng và Hành động)
 * Phẳng hóa để tối ưu tìm kiếm và Command Palette
 */
export const NAV = [
    // --- TỔNG QUAN ---
    { id: 'dashboard', type: 'navigation', label: 'Tổng quan', section: 'Điều hướng', icon: LayoutDashboard, to: '/admin', keywords: ['dashboard', 'home', 'trang chu'] },
    { id: 'statistics', type: 'navigation', label: 'Thống kê & Báo cáo', section: 'Điều hướng', icon: BarChart3, to: '/admin/stats', permission: 'system:read', keywords: ['stat', 'report', 'analytics', 'insight', 'chart'] },

    // --- TỔ CHỨC ---
    { id: 'members', type: 'navigation', label: 'Quản lý Đoàn viên', section: 'Tổ chức', icon: Users, to: '/admin/members', permission: 'member:read', keywords: ['dv', 'member', 'ho so', 'profile'] },
    { id: 'members.create', type: 'action', label: 'Thêm đoàn viên mới', section: 'Hành động', icon: Plus, to: '/admin/members', action: 'CREATE_MEMBER', permission: 'member:create', keywords: ['them', 'create', 'tao moi'] },
    { id: 'members.trash', type: 'action', label: 'Thùng rác Đoàn viên', section: 'Hành động', icon: Trash2, to: '/admin/members', action: 'OPEN_TRASH', permission: 'member:read', keywords: ['xoa', 'trash', 'khoi phuc'] },
    { id: 'members.export', type: 'action', label: 'Xuất danh sách Excel', section: 'Hành động', icon: FileOutput, to: '/admin/members', action: 'EXPORT_EXCEL', permission: 'member:read', keywords: ['download', 'excel', 'xuat file'] },

    { id: 'branches', type: 'navigation', label: 'Liên chi đoàn', section: 'Tổ chức', icon: Building2, to: '/admin/branches', permission: 'branch:read', keywords: ['khoa', 'don vi', 'branch'] },
    { id: 'cells', type: 'navigation', label: 'Chi đoàn', section: 'Tổ chức', icon: Network, to: '/admin/cells', permission: 'cell:read', keywords: ['lop', 'cell', 'chi doan'] },

    // --- NGHIỆP VỤ ---
    { id: 'activities', type: 'navigation', label: 'Hoạt động', section: 'Nghiệp vụ', icon: Calendar, to: '/admin/activities', permission: 'activity:read', keywords: ['event', 'su kien'] },
    { id: 'activities.create', type: 'action', label: 'Tạo hoạt động mới', section: 'Hành động', icon: Plus, to: '/admin/activities', action: 'CREATE_ACTIVITY', permission: 'activity:create', keywords: ['tao', 'create'] },

    { id: 'meetings', type: 'navigation', label: 'Sinh hoạt Chi đoàn', section: 'Nghiệp vụ', icon: CalendarClock, to: '/admin/meetings', permission: 'meeting:read', keywords: ['hop', 'meeting'] },
    { id: 'news', type: 'navigation', label: 'Tin tức', section: 'Nghiệp vụ', icon: Newspaper, to: '/admin/news', permission: 'news:read', keywords: ['bai viet', 'article', 'post'] },
    { id: 'news.create', type: 'action', label: 'Tạo bài viết mới', section: 'Hành động', icon: Plus, to: '/admin/news', action: 'CREATE_NEWS', permission: 'news:create', keywords: ['viet bai', 'new post'] },

    { id: 'quiz', type: 'navigation', label: 'Thi & Khảo sát', section: 'Nghiệp vụ', icon: BookOpen, to: '/admin/quiz', permission: 'quiz:read', keywords: ['exam', 'test'] },
    { id: 'documents', type: 'navigation', label: 'Kho Văn bản', section: 'Nghiệp vụ', icon: FileText, to: '/admin/documents', permission: 'document:read', keywords: ['cong van', 'file'] },

    { id: 'fees', type: 'navigation', label: 'Đoàn phí', section: 'Nghiệp vụ', icon: Wallet, to: '/admin/fees', permission: 'fee:read', keywords: ['tien', 'money', 'dong phi'] },
    { id: 'fees.config', type: 'action', label: 'Cấu hình Ngân hàng', section: 'Hành động', icon: Settings, to: '/admin/fees', action: 'CONFIG_BANK', permission: 'fee:write', keywords: ['vietqr', 'ngan hang', 'bank'] },

    { id: 'notifications', type: 'navigation', label: 'Thông báo', section: 'Nghiệp vụ', icon: Bell, to: '/admin/notifications', permission: 'notification:read', keywords: ['notify', 'nhac nho'] },

    // --- HỆ THỐNG ---
    { id: 'users', type: 'navigation', label: 'Tài khoản', section: 'Hệ thống', icon: UserCog, to: '/admin/users', permission: 'user:read', keywords: ['account', 'login'] },
    { id: 'roles', type: 'navigation', label: 'Phân quyền', section: 'Hệ thống', icon: Shield, to: '/admin/roles', permission: 'system:config', keywords: ['rbac', 'permission'] },
    { id: 'banners', type: 'navigation', label: 'Banner Trang chủ', section: 'Hệ thống', icon: ImageIcon, to: '/admin/banners', permission: 'banner:read', keywords: ['image', 'slide'] },
    { id: 'landing', type: 'navigation', label: 'Trang Landing Page', section: 'Hệ thống', icon: MousePointer2, to: '/admin/landing', permission: 'landing:read', keywords: ['web', 'homepage'] },
];

/**
 * COMMANDS alias để tương thích với Command Palette mới
 */
export const COMMANDS = NAV;

/**
 * PAGE_TITLES giữ nguyên để phục vụ hiển thị header
 */
export const PAGE_TITLES = {
    '/admin': 'Tổng quan',
    '/admin/stats': 'Thống kê & Báo cáo',
    '/admin/members': 'Quản lý Đoàn viên',
    '/admin/branches': 'Quản lý Liên chi đoàn',
    '/admin/cells': 'Quản lý Chi đoàn',
    '/admin/activities': 'Quản lý Hoạt động',
    '/admin/meetings': 'Sinh hoạt Chi đoàn',
    '/admin/news': 'Quản lý Tin tức',
    '/admin/quiz': 'Thi & Khảo sát',
    '/admin/documents': 'Kho Văn bản',
    '/admin/fees': 'Quản lý Đoàn phí',
    '/admin/notifications': 'Quản lý Thông báo',
    '/admin/users': 'Quản lý Tài khoản',
    '/admin/roles': 'Quản lý Phân quyền',
    '/admin/banners': 'Quản lý Banner',
    '/admin/landing': 'Quản lý Trang Landing',
    '/admin/locations': 'Quản lý Địa điểm',
};

/**
 * Chuyển đổi từ danh sách phẳng sang cấu trúc Sidebar
 */
export const getSidebarNav = () => {
    const sidebar = [];
    let currentSection = null;

    NAV.forEach(cmd => {
        if (cmd.type !== 'navigation') return;
        if (cmd.section && cmd.section !== currentSection) {
            sidebar.push({ section: cmd.section, isHeader: true });
            currentSection = cmd.section;
        }
        sidebar.push(cmd);
    });

    return sidebar;
};



