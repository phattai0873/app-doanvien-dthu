import React, { useState } from 'react';
import { Home, Briefcase, Bell, User, Calendar, FileText, ChevronRight, Menu, Database, Users, Wallet, Award, BookOpen, Clock, Filter, CheckCircle, AlertCircle } from 'lucide-react';

// --- MOCK DATA (DẠNG PLACEHOLDER MAPPING DB) ---
const DB = {
    // Bảng party_members & party_positions
    user: {
        id: 1,
        ho_ten: "[party_members.ho_ten]",
        chuc_vu: "[party_positions.ten_chuc_vu]",
        don_vi: "[party_cells.ten_chi_bo]"
    },

    // Dữ liệu cho News Feed
    featured_news: [
        {
            id: 101,
            title: "[documents.tieu_de]",
            image: "https://dangcongsan.vn/DATA/0/2018/05/19/dangcongsan_vn/ho-chi-minh-10-15-56-786.jpg",
            date: "[documents.ngay_ban_hanh]",
            source_note: "Table: documents"
        },
        {
            id: 102,
            title: "[documents.tieu_de] (Tin 2)",
            image: "https://cdn.chinhphu.vn/334894974524682240/2022/10/3/photo-1664790861694-16647908617841525547926.jpg",
            date: "[documents.ngay_ban_hanh]",
            source_note: "Table: documents"
        },
        {
            id: 103,
            title: "[documents.tieu_de] (Tin 3)",
            image: "https://file1.dangcongsan.vn/data/0/images/2023/01/05/upload/hoi-nghi-truc-tuyen-toan-quoc-tong-ket-cong-tac-kiem-tra-giam-sat-nam-2022-trien-khai-nhiem-vu-nam-2023.jpg",
            date: "[documents.ngay_ban_hanh]",
            source_note: "Table: documents"
        }
    ],

    // Dữ liệu Thông báo đầy đủ hơn cho trang Thông báo
    notifications: [
        {
            id: 501,
            title: "Triệu tập cuộc họp Chi bộ tháng 6 mở rộng",
            content: "Kính mời các đồng chí tham dự cuộc họp định kỳ tháng 6. Nội dung: Đánh giá công tác 6 tháng đầu năm...",
            time: "08:00 - 25/05/2025",
            type: "meeting",
            is_urgent: true,
            is_read: false,
            sender: "Chi bộ 3",
            source_note: "notifications"
        },
        {
            id: 502,
            title: "Nhắc nhở đóng Đảng phí Quý II/2025",
            content: "Hệ thống ghi nhận đồng chí chưa hoàn thành nghĩa vụ đóng đảng phí. Vui lòng thực hiện trước ngày 30/05.",
            time: "10:30 - 24/05/2025",
            type: "fee",
            is_urgent: false,
            is_read: true,
            sender: "Ban Tài chính",
            source_note: "notifications"
        },
        {
            id: 503,
            title: "Phát động cuộc thi 'Học tập và làm theo Bác'",
            content: "Cuộc thi trực tuyến bắt đầu từ ngày 01/06. Đề nghị 100% đảng viên tham gia.",
            time: "09:00 - 22/05/2025",
            type: "quiz",
            is_urgent: false,
            is_read: false,
            sender: "Đảng ủy Khối",
            source_note: "notifications"
        },
        {
            id: 504,
            title: "Văn bản chỉ đạo về công tác phòng chống thiên tai",
            content: "Triển khai công văn số 123/CV-TW về việc chủ động ứng phó với mùa mưa bão sắp tới.",
            time: "14:00 - 20/05/2025",
            type: "doc",
            is_urgent: true,
            is_read: true,
            sender: "Văn phòng Đảng ủy",
            source_note: "notifications"
        }
    ],

    // Dữ liệu tóm tắt cho trang Công tác (Dashboard widgets)
    work_summary: {
        next_meeting: "25/05 - 08:00", // Lấy từ cell_meetings
        unpaid_fee: "Tháng 5", // Lấy từ party_fees
    }
};

const App = () => {
    const [activeTab, setActiveTab] = useState('notif'); // Chuyển sang tab Thông báo để xem ngay

    const getHeaderTitle = () => {
        switch (activeTab) {
            case 'news': return 'Đảng Cộng sản Việt Nam';
            case 'work': return 'Nghiệp vụ Đảng viên';
            case 'notif': return 'Hộp thư Thông báo';
            case 'profile': return 'Hồ sơ Đảng viên';
            default: return 'Đảng Cộng sản Việt Nam';
        }
    };

    const getGreeting = () => {
        switch (activeTab) {
            case 'news': return 'Xin chào,';
            case 'work': return 'Công tác';
            case 'notif': return 'Thông báo';
            case 'profile': return 'Hồ sơ';
            default: return 'Xin chào,';
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'news':
                return <NewsFeed user={DB.user} news={DB.featured_news} notifs={DB.notifications.slice(0, 2)} />;
            case 'work':
                return <WorkDashboard summary={DB.work_summary} />;
            case 'notif':
                return <NotificationScreen notifications={DB.notifications} />;
            case 'profile':
                return <Placeholder title="Hồ sơ" icon={<User size={48} />} />;
            default:
                return <NewsFeed user={DB.user} news={DB.featured_news} notifs={DB.notifications.slice(0, 2)} />;
        }
    };

    return (
        <div className="flex justify-center bg-gray-200 min-h-screen font-sans">
            <div className="w-full max-w-md h-screen bg-gray-50 flex flex-col shadow-2xl overflow-hidden relative">

                {/* --- 1. HEADER (Dùng chung) --- */}
                <div className="bg-[#EE0033] pt-10 pb-6 px-6 rounded-b-[30px] shadow-lg z-10 relative overflow-hidden shrink-0 transition-all duration-500">
                    <div className="absolute top-[-10px] right-[-20px] opacity-10 rotate-12 pointer-events-none">
                        <svg width="180" height="180" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" />
                        </svg>
                    </div>

                    <div className="flex justify-between items-start text-white relative z-20">
                        <div>
                            <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-1 opacity-90">
                                {getHeaderTitle()}
                            </p>

                            <h1 className="text-2xl font-bold leading-tight mt-1">
                                {getGreeting()} <br />
                                <span className="text-2xl font-mono bg-red-800/30 px-1 rounded border border-red-400/30">
                                    {activeTab === 'news' ? DB.user.ho_ten : (activeTab === 'profile' ? DB.user.ho_ten : (activeTab === 'work' ? 'Đảng viên' : 'Mới nhất'))}
                                </span>
                            </h1>
                            {activeTab === 'news' && (
                                <div className="text-[10px] text-red-200 mt-0.5 font-mono italic opacity-80">
                                    &lt;party_members.ho_ten&gt;
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {activeTab === 'notif' ? <Bell size={24} /> : <User size={24} />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 2. MAIN CONTENT --- */}
                <div className="flex-1 overflow-y-auto pb-24 scroll-smooth bg-gray-50">
                    {renderContent()}
                </div>

                {/* --- 3. BOTTOM NAV --- */}
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] px-4 py-2 z-50 rounded-t-2xl">
                    <div className="flex justify-between items-end">
                        <NavItem id="news" label="Tin tức" icon={<Home size={22} />} isActive={activeTab === 'news'} onClick={setActiveTab} />
                        <NavItem id="work" label="Công tác" icon={<Briefcase size={22} />} isActive={activeTab === 'work'} onClick={setActiveTab} />
                        <NavItem id="notif" label="Thông báo" icon={<Bell size={22} />} isActive={activeTab === 'notif'} onClick={setActiveTab} />
                        <NavItem id="profile" label="Cá nhân" icon={<User size={22} />} isActive={activeTab === 'profile'} onClick={setActiveTab} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- TRANG THÔNG BÁO (NOTIFICATION SCREEN) ---
const NotificationScreen = ({ notifications }) => {
    const [filter, setFilter] = useState('all'); // all, unread, urgent

    // Lọc thông báo dựa trên tab đang chọn
    const filteredList = notifications.filter(item => {
        if (filter === 'unread') return !item.is_read;
        if (filter === 'urgent') return item.is_urgent;
        return true;
    });

    return (
        <div className="pt-4 px-4 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                <FilterTab label="Tất cả" isActive={filter === 'all'} onClick={() => setFilter('all')} count={notifications.length} />
                <FilterTab label="Chưa đọc" isActive={filter === 'unread'} onClick={() => setFilter('unread')} count={notifications.filter(n => !n.is_read).length} />
                <FilterTab label="Quan trọng" isActive={filter === 'urgent'} onClick={() => setFilter('urgent')} count={notifications.filter(n => n.is_urgent).length} />
            </div>

            {/* List Notifications */}
            <div className="space-y-3">
                {filteredList.length > 0 ? (
                    filteredList.map(item => (
                        <div key={item.id} className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden transition-all active:scale-[0.98] ${!item.is_read ? 'bg-red-50/30' : ''}`}>
                            {/* Unread Indicator */}
                            {!item.is_read && (
                                <div className="absolute top-4 right-4 w-2 h-2 bg-[#EE0033] rounded-full shadow-sm animate-pulse"></div>
                            )}

                            <div className="flex gap-4">
                                {/* Icon Column */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'meeting' ? 'bg-red-100 text-[#EE0033]' :
                                            item.type === 'fee' ? 'bg-orange-100 text-orange-600' :
                                                item.type === 'quiz' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {item.type === 'meeting' && <Users size={20} />}
                                        {item.type === 'fee' && <Wallet size={20} />}
                                        {item.type === 'quiz' && <Award size={20} />}
                                        {item.type === 'doc' && <FileText size={20} />}
                                    </div>
                                    {/* Urgent Badge */}
                                    {item.is_urgent && (
                                        <span className="text-[9px] font-bold text-white bg-[#EE0033] px-1.5 py-0.5 rounded shadow-sm">
                                            GẤP
                                        </span>
                                    )}
                                </div>

                                {/* Content Column */}
                                <div className="flex-1">
                                    <h3 className={`text-sm font-bold leading-snug mb-1 ${!item.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                        {item.content}
                                    </p>

                                    {/* Footer Info */}
                                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <User size={10} />
                                            <span className="font-medium text-gray-500">{item.sender}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={10} />
                                            <span>{item.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Database Reference (Placeholder) */}
                            <div className="absolute bottom-1 right-2 opacity-20 text-[8px] font-mono">
                                {item.source_note}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <CheckCircle size={40} className="mb-2 opacity-50" />
                        <p className="text-sm">Không có thông báo nào</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const FilterTab = ({ label, isActive, onClick, count }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${isActive
                ? 'bg-[#EE0033] text-white border-[#EE0033] shadow-md'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
    >
        {label}
        {count > 0 && (
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {count}
            </span>
        )}
    </button>
);

// --- TRANG CÔNG TÁC (WORK DASHBOARD) ---
const WorkDashboard = ({ summary }) => {
    return (
        <div className="p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Quick Status Cards */}
            <div className="flex space-x-3 mb-6">
                <div className="flex-1 bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 text-white shadow-md relative overflow-hidden">
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-20"><Calendar size={60} /></div>
                    <p className="text-[10px] font-bold opacity-80 uppercase">Họp chi bộ tới</p>
                    <p className="text-lg font-bold mt-1">{summary.next_meeting}</p>
                    <p className="text-[8px] mt-1 font-mono bg-black/20 w-fit px-1 rounded">table: cell_meetings</p>
                </div>
                <div className="flex-1 bg-white border border-red-100 rounded-xl p-3 shadow-sm relative overflow-hidden">
                    <div className="absolute right-[-10px] bottom-[-10px] text-red-100 opacity-50"><Wallet size={60} /></div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Đảng phí</p>
                    <p className="text-lg font-bold text-red-600 mt-1">{summary.unpaid_fee}</p>
                    <p className="text-[8px] mt-1 text-gray-400 font-mono bg-gray-100 w-fit px-1 rounded">table: party_fees</p>
                </div>
            </div>

            {/* Grid Menu */}
            <h2 className="text-gray-800 font-bold text-lg mb-4 pl-1 border-l-4 border-[#EE0033] uppercase leading-none">
                Nhiệm vụ trọng tâm
            </h2>

            <div className="grid grid-cols-2 gap-4">
                <WorkCard icon={<Users size={32} className="text-blue-600" />} bgIcon="bg-blue-100" title="Sinh hoạt Chi bộ" desc="Điểm danh & Tài liệu họp" table="cell_meetings" />
                <WorkCard icon={<Wallet size={32} className="text-green-600" />} bgIcon="bg-green-100" title="Đóng Đảng phí" desc="Thanh toán trực tuyến" table="party_fees" />
                <WorkCard icon={<Award size={32} className="text-orange-600" />} bgIcon="bg-orange-100" title="Thi đua & Trắc nghiệm" desc="Các cuộc thi định kỳ" table="quiz_exams" />
                <WorkCard icon={<BookOpen size={32} className="text-purple-600" />} bgIcon="bg-purple-100" title="Học tập Nghị quyết" desc="Kho tri thức & Văn kiện" table="political_studies" />
            </div>
        </div>
    );
};

const WorkCard = ({ icon, bgIcon, title, desc, table }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:scale-95 transition-transform cursor-pointer hover:shadow-md h-full">
        <div className={`w-16 h-16 rounded-2xl ${bgIcon} flex items-center justify-center mb-3`}>
            {icon}
        </div>
        <h3 className="font-bold text-gray-800 text-sm mb-1">{title}</h3>
        <p className="text-[10px] text-gray-500 mb-2">{desc}</p>
        <span className="text-[9px] font-mono text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 mt-auto">
            {table}
        </span>
    </div>
);

// --- TRANG TIN TỨC (NEWS FEED) ---
const NewsFeed = ({ news, notifs }) => {
    return (
        <div className="pt-6 px-4 space-y-6 animate-in fade-in duration-500">

            {/* TIN TỨC NỔI BẬT */}
            <section>
                <div className="flex justify-between items-center mb-3 pl-1 border-l-4 border-[#EE0033]">
                    <h2 className="text-gray-800 font-bold text-lg uppercase leading-none">
                        Tin tức nổi bật
                    </h2>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1 rounded">
                        Table: documents
                    </span>
                </div>

                <div className="flex space-x-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
                    {news.map((item) => (
                        <div key={item.id} className="snap-center min-w-[200px] w-[200px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
                            <div className="h-28 w-full relative overflow-hidden bg-gray-200">
                                <img src={item.image} alt="news" className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-black/50 text-white text-[10px] font-mono px-2 py-1 rounded">
                                        documents.duong_dan_file
                                    </span>
                                </div>
                            </div>

                            <div className="p-3">
                                <h3 className="text-blue-600 font-mono text-xs font-bold leading-snug line-clamp-2 h-8 mb-1.5 bg-blue-50 p-0.5 rounded border border-blue-100 border-dashed">
                                    {item.title}
                                </h3>
                                <div className="flex flex-col text-[10px]">
                                    <div className="flex items-center text-gray-500 font-mono">
                                        <Calendar size={10} className="mr-1" />
                                        {item.date}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* THÔNG BÁO (Rút gọn) */}
            <section>
                <div className="flex justify-between items-center mb-3 pl-1 border-l-4 border-[#EE0033]">
                    <h2 className="text-gray-800 font-bold text-lg uppercase leading-none">
                        Thông báo mới
                    </h2>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1 rounded">
                        Table: notifications
                    </span>
                </div>

                <div className="space-y-2">
                    {notifs.map((item) => (
                        <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-100 flex gap-3 items-center shadow-sm relative overflow-hidden group">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'meeting' ? 'bg-red-50 text-[#EE0033]' : 'bg-orange-50 text-orange-600'
                                }`}>
                                {item.type === 'meeting' && <Users size={18} />}
                                {item.type === 'fee' && <Wallet size={18} />}
                            </div>

                            <div className="flex-1 min-w-0 pr-4">
                                <h4 className="text-xs font-mono font-bold text-blue-600 bg-blue-50 p-1 rounded border border-blue-100 border-dashed inline-block mb-1">
                                    {item.title}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1 rounded">
                                        {item.time}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="h-6"></div>
        </div>
    );
};

// Component Placeholder cho các tab chưa làm
const Placeholder = ({ title, icon }) => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-300">
        <div className="p-6 bg-gray-100 rounded-full mb-4">{icon}</div>
        <h3 className="text-lg font-bold text-gray-400">{title}</h3>
    </div>
);

// Navigation Item
const NavItem = ({ id, label, icon, isActive, onClick }) => {
    return (
        <button onClick={() => onClick(id)} className="flex-1 flex flex-col items-center justify-center relative group">
            <div className={`absolute -top-10 w-12 h-12 rounded-full border-4 border-gray-50 flex items-center justify-center transition-all duration-300 shadow-xl ${isActive ? 'bg-[#EE0033] scale-100 opacity-100' : 'bg-transparent scale-0 opacity-0'}`}>
                {isActive && React.cloneElement(icon, { size: 24, color: 'white' })}
            </div>
            <div className={`transition-all duration-300 mb-1 ${isActive ? 'opacity-0 translate-y-4' : 'opacity-100 text-gray-400 group-hover:text-gray-600'}`}>
                {icon}
            </div>
            <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'text-[#EE0033]' : 'text-gray-400'}`}>
                {label}
            </span>
        </button>
    );
};

export default App;