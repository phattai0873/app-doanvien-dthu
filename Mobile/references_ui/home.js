import React, { useState } from 'react';
import { Home, Briefcase, Bell, User, Calendar, FileText, ChevronRight, Menu, Database, Users, Wallet, Award, BookOpen, Clock, Filter, CheckCircle, AlertCircle, Library, GraduationCap, QrCode, Settings, LogOut, Shield, Info, History, BadgeCheck, Camera, ChevronLeft, CreditCard, AlertTriangle, Save, Phone, MapPin, Mail, Building, Landmark, Star, ArrowRight, UserCheck, CalendarDays, Share2, MessageSquare, Heart } from 'lucide-react';

// --- MOCK DATA (DẠNG PLACEHOLDER MAPPING DB) ---
const DB = {
  user: {
    id: 1,
    ho_ten: "Nguyễn Văn A",
    ma_so: "12345678",
    avatar: "https://ui-avatars.com/api/?name=Nguyen+Van+A&background=EE0033&color=fff&size=150",
    chuc_vu: "Bí thư Chi bộ",
    don_vi: "Chi bộ Khối Doanh nghiệp",
    ngay_vao: "03/02/2015",
    ngay_chinh_thuc: "03/02/2016",
    trang_thai: "Đảng viên chính thức",
    cccd: "03809xxxxxxx",
    ngay_sinh: "01/01/1985",
    gioi_tinh: "Nam",
    sdt: "0987654321",
    email: "nguyenvana@email.com",
    dia_chi: "P. Hòa Thuận Tây, Q. Hải Châu, TP. Đà Nẵng",
    trinh_do_hv: "Đại học",
    trinh_do_llct: "Cao cấp",
    nghe_nghiep: "Kỹ sư CNTT",
    is_verified: false
  },

  // DANH MỤC TIN TỨC (Table: news_categories)
  news_categories: [
    { id: 1, name: "Hoạt động Đảng" }, // news_categories.ten_danh_muc
    { id: 2, name: "Gương điển hình" },
    { id: 3, name: "Tuyên truyền" },
    { id: 4, name: "Chỉ đạo điều hành" }
  ],

  // BẢNG TIN TỨC (Table: news) - Placeholder Mapping
  news: [
    {
      id: "uuid-1",
      title: "[news.title] - Tiêu đề bài viết chính",
      summary: "[news.summary] - Tóm tắt ngắn gọn nội dung bài viết để hiển thị trên danh sách...",
      content: "[news.content]",
      thumbnailUrl: "https://cdn.chinhphu.vn/334894974524682240/2024/5/16/photo-1-17158229871321727776569.jpg",
      categoryId: 1, // news.category_id
      status: 1, // news.status = 1 (Đã xuất bản)
      publishedAt: "[news.published_at]",
      source_note: "Table: news"
    },
    {
      id: "uuid-2",
      title: "[news.title] - Bài viết số 2",
      summary: "[news.summary] - Nội dung tóm tắt của bài viết số 2...",
      content: "[news.content]",
      thumbnailUrl: "https://dangcongsan.vn/DATA/0/2018/05/19/dangcongsan_vn/ho-chi-minh-10-15-56-786.jpg",
      categoryId: 3,
      status: 1,
      publishedAt: "[news.published_at]",
      source_note: "Table: news"
    },
    {
      id: "uuid-3",
      title: "[news.title] - Bài viết số 3",
      summary: "[news.summary] - Nội dung tóm tắt của bài viết số 3...",
      content: "[news.content]",
      thumbnailUrl: "https://file3.qdnd.vn/data/images/0/2023/06/20/vuhuyen/khanh%20thanh%20nha.jpg",
      categoryId: 2,
      status: 1,
      publishedAt: "[news.published_at]",
      source_note: "Table: news"
    }
  ],

  // Dữ liệu Chi bộ & Đảng bộ
  party_cell: { id: 10, ten_chi_bo: "Chi bộ Khối Doanh nghiệp", ma_chi_bo: "CB-DN01", ngay_thanh_lap: "19/05/2010", don_vi_truc_thuoc: "Công ty ABC", so_dang_vien: 24, so_dang_vien_du_bi: 2, dang_bo_cap_tren: "Đảng bộ Quận Hải Châu", dia_chi_sinh_hoat: "Tầng 3, Tòa nhà ABC", lich_sinh_hoat: "Ngày 03 hàng tháng", ban_chi_uy: [{ chuc_vu: "Bí thư", ho_ten: "Lê Văn B", avatar: "https://ui-avatars.com/api/?name=Le+Van+B&background=random" }] },
  party_committee: { id: 1, ten_dang_bo: "Đảng bộ Quận Hải Châu", ma_dang_bo: "DB-HC", cap_uy: "Cấp Huyện/Quận", bi_thu: "Trần Văn C", dia_chi: "Số 10, Đường Phan Đăng Lưu", sdt: "0236.3.xxx.xxx", email: "vanphong@haichau.danang.dcs.vn", tong_so_dang_vien: 5400, so_chi_bo_truc_thuoc: 120 },
  notifications: [{ id: 501, title: "Triệu tập cuộc họp Chi bộ tháng 6", time: "08:00 - 25/05/2025", type: "meeting", is_urgent: true, is_read: false, sender: "Chi bộ 3" }, { id: 502, title: "Nhắc nhở đóng Đảng phí", time: "10:30 - 24/05/2025", type: "fee", is_urgent: false, is_read: true, sender: "Ban Tài chính" }],
  work_summary: { next_meeting: "25/05 - 08:00", unpaid_fee: "Tháng 5" }
};

// --- APP NAVIGATOR ---
const App = () => {
  const [activeTab, setActiveTab] = useState('news');
  const [currentScreen, setCurrentScreen] = useState('main');

  const navigateTo = (screen) => setCurrentScreen(screen);
  const goBack = () => setCurrentScreen('main');
  const showBottomNav = currentScreen === 'main';

  const renderContent = () => {
    if (currentScreen === 'member_info') return <MemberInfoScreen user={DB.user} onBack={goBack} />;
    if (currentScreen === 'org_info') return <OrgInfoScreen cell={DB.party_cell} committee={DB.party_committee} onBack={goBack} />;

    switch (activeTab) {
      case 'news': return <NewsFeed categories={DB.news_categories} news={DB.news} />;
      case 'work': return <WorkDashboard summary={DB.work_summary} />;
      case 'notif': return <NotificationScreen notifications={DB.notifications} />;
      case 'profile': return <ProfileScreen user={DB.user} onNavigate={navigateTo} />;
      default: return <NewsFeed categories={DB.news_categories} news={DB.news} />;
    }
  };

  const getTitle = () => {
    if (currentScreen === 'member_info') return 'Thông tin Đảng viên';
    if (currentScreen === 'org_info') return 'Tổ chức Đảng';
    if (activeTab === 'news') return 'Bản tin Nội bộ';
    return activeTab === 'profile' ? 'Cá nhân' : (activeTab === 'work' ? 'Công tác' : 'Thông báo');
  };

  return (
    <div className="flex justify-center bg-gray-200 min-h-screen font-sans">
      <div className="w-full max-w-md h-screen bg-gray-50 flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* HEADER */}
        <div className={`pt-10 pb-4 px-4 bg-[#EE0033] shadow-md z-20 relative transition-all ${!showBottomNav ? 'rounded-b-none' : 'rounded-b-[24px]'}`}>
           <div className="flex items-center text-white">
              {currentScreen !== 'main' ? (
                <button onClick={goBack} className="p-2 -ml-2 mr-2 hover:bg-white/20 rounded-full transition-colors"><ChevronLeft size={24} /></button>
              ) : <div className="w-8"></div>}
              <h1 className="text-lg font-bold uppercase tracking-wide flex-1 text-center truncate px-2">{getTitle()}</h1>
              <div className="w-8 flex justify-end">
                 {activeTab === 'profile' && <Settings size={24}/>}
                 {activeTab === 'news' && <Database size={20} className="opacity-50"/>}
              </div>
           </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto bg-gray-50 pb-20 scroll-smooth">
          {renderContent()}
        </div>

        {/* BOTTOM NAVIGATION */}
        {showBottomNav && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] px-4 py-2 z-50 rounded-t-2xl">
            <div className="flex justify-between items-end">
              <NavItem id="news" label="Tin tức" icon={<Home size={22} />} isActive={activeTab === 'news'} onClick={setActiveTab} />
              <NavItem id="work" label="Công tác" icon={<Briefcase size={22} />} isActive={activeTab === 'work'} onClick={setActiveTab} />
              <NavItem id="notif" label="Thông báo" icon={<Bell size={22} />} isActive={activeTab === 'notif'} onClick={setActiveTab} />
              <NavItem id="profile" label="Cá nhân" icon={<User size={22} />} isActive={activeTab === 'profile'} onClick={setActiveTab} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PAGE: NEWS FEED (CẬP NHẬT PLACEHOLDER MAPPING)
// ============================================================================
const NewsFeed = ({ categories, news }) => {
  const [activeCat, setActiveCat] = useState('all');

  // Filter Logic
  const filteredNews = activeCat === 'all' 
    ? news 
    : news.filter(item => item.categoryId === activeCat);

  const heroNews = filteredNews.length > 0 ? filteredNews[0] : null;
  const listNews = filteredNews.length > 1 ? filteredNews.slice(1) : [];

  return (
    <div className="animate-in fade-in duration-500 pb-24">
      
      {/* 1. Category Tabs (news_categories) */}
      <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 pt-4 pb-2 px-4 shadow-sm">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
          <CategoryPill label="Tất cả" isActive={activeCat === 'all'} onClick={() => setActiveCat('all')} />
          {categories.map(cat => (
            <CategoryPill key={cat.id} label={cat.name} isActive={activeCat === cat.id} onClick={() => setActiveCat(cat.id)} />
          ))}
        </div>
        <p className="text-[9px] text-gray-400 text-right px-2 mt-1 font-mono italic">Source: news_categories.ten_danh_muc</p>
      </div>

      <div className="px-4 mt-2">
        {/* 2. Hero News (Bài nổi bật) */}
        {heroNews && (
          <div className="mb-6 group cursor-pointer relative">
            {/* Tag Source Table */}
            <div className="absolute top-[-10px] right-0 bg-gray-100 text-gray-400 text-[9px] px-2 py-0.5 rounded-b font-mono border border-gray-200 z-0">
               Table: news
            </div>

            <div className="relative h-48 rounded-2xl overflow-hidden shadow-md mb-3 z-10">
              <img src={heroNews.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="news" />
              <div className="absolute top-3 left-3 bg-[#EE0033] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                NỔI BẬT
              </div>
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[8px] font-mono px-1 rounded">
                 news.thumbnail_url
              </div>
            </div>
            
            <h2 className="text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#EE0033] transition-colors font-mono">
              {heroNews.title}
            </h2>
            <p className="text-sm text-gray-500 line-clamp-2 mb-3 font-mono">
              {heroNews.summary}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
               <div className="flex items-center gap-1 font-mono bg-gray-50 px-2 py-1 rounded">
                  <Clock size={12} />
                  <span>{heroNews.publishedAt}</span>
               </div>
               <div className="flex items-center gap-1 text-[9px] text-gray-300 italic">
                  news.published_at
               </div>
            </div>
          </div>
        )}

        <div className="h-[1px] bg-gray-200 mb-6"></div>

        {/* 3. News List */}
        <div className="space-y-4">
          {listNews.map(item => (
            <div key={item.id} className="flex gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden">
               {/* Watermark source */}
               <div className="absolute top-1 right-2 text-[8px] text-gray-200 font-mono pointer-events-none">Table: news</div>

               <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-gray-200 relative">
                  <img src={item.thumbnailUrl} className="w-full h-full object-cover" alt="thumbnail" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                     <span className="text-[7px] text-white font-mono break-all px-1 text-center">news.thumbnail_url</span>
                  </div>
               </div>
               
               <div className="flex flex-col justify-between flex-1 py-0.5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 leading-snug line-clamp-2 mb-1 font-mono">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-mono bg-gray-50 p-1 rounded">
                      {item.summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                     <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                        {/* Mock Join */}
                        [news_categories.ten_danh_muc]
                     </span>
                     <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                        <Clock size={10} />
                        {item.publishedAt}
                     </span>
                  </div>
               </div>
            </div>
          ))}
        </div>

        {listNews.length === 0 && heroNews === null && (
           <div className="text-center py-10 text-gray-400">
              <Database size={40} className="mx-auto mb-2 opacity-20"/>
              <p>Chưa có bài viết nào trong bảng news.</p>
           </div>
        )}
      </div>
    </div>
  );
};

const CategoryPill = ({ label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
      isActive 
      ? 'bg-[#EE0033] text-white border-[#EE0033] shadow-md' 
      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);

// ============================================================================
// CÁC TRANG KHÁC (GIỮ NGUYÊN)
// ============================================================================

const NotificationScreen = ({ notifications }) => {
  return (
    <div className="pt-4 px-4 pb-6 animate-in slide-in-from-bottom-4 duration-500">
       <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 flex items-start gap-3">
          <Info size={20} className="text-blue-500 mt-0.5"/>
          <div>
             <h3 className="text-sm font-bold text-blue-700">Lưu ý</h3>
             <p className="text-xs text-blue-600 mt-1">Đây là các thông báo hành chính, nhắc việc (Table: notifications). Các tin tức hoạt động vui lòng xem tại mục "Bản tin" (Table: news).</p>
          </div>
       </div>
       <div className="space-y-3">
        {notifications.map(item => (
            <div key={item.id} className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden ${!item.is_read ? 'bg-red-50/30' : ''}`}>
              {!item.is_read && <div className="absolute top-4 right-4 w-2 h-2 bg-[#EE0033] rounded-full animate-pulse"></div>}
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'meeting' ? 'bg-red-100 text-[#EE0033]' : 'bg-blue-100 text-blue-600'}`}>
                   {item.type === 'meeting' ? <Users size={20}/> : <Wallet size={20}/>}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold mb-1 leading-snug">{item.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                     <span className="font-medium">{item.sender}</span>
                     <span>•</span>
                     <span>{item.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
       </div>
    </div>
  );
};

const WorkDashboard = ({ summary }) => (
    <div className="p-5 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex space-x-3 mb-6">
            <div className="flex-1 bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-20"><Calendar size={60}/></div>
            <p className="text-[10px] font-bold opacity-80 uppercase">Họp chi bộ tới</p>
            <p className="text-lg font-bold mt-1">{summary.next_meeting}</p>
            </div>
            <div className="flex-1 bg-white border border-red-100 rounded-xl p-3 shadow-sm relative overflow-hidden">
            <div className="absolute right-[-10px] bottom-[-10px] text-red-100 opacity-50"><Wallet size={60}/></div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Đảng phí</p>
            <p className="text-lg font-bold text-red-600 mt-1">{summary.unpaid_fee}</p>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <WorkCard icon={<Users size={32} className="text-blue-600" />} bgIcon="bg-blue-100" title="Sinh hoạt Chi bộ" desc="Điểm danh & Tài liệu họp" table="cell_meetings" />
            <WorkCard icon={<Wallet size={32} className="text-green-600" />} bgIcon="bg-green-100" title="Đóng Đảng phí" desc="Thanh toán trực tuyến" table="party_fees" />
            <WorkCard icon={<Award size={32} className="text-orange-600" />} bgIcon="bg-orange-100" title="Thi đua & Trắc nghiệm" desc="Các cuộc thi định kỳ" table="quiz_exams" />
            <WorkCard icon={<Library size={32} className="text-teal-600" />} bgIcon="bg-teal-100" title="Kho Tài liệu" desc="Văn kiện, Nghị quyết" table="documents" />
            <WorkCard icon={<GraduationCap size={32} className="text-purple-600" />} bgIcon="bg-purple-100" title="Học tập Lý luận" desc="Lớp bồi dưỡng" table="political_studies" />
        </div>
    </div>
);

const WorkCard = ({ icon, bgIcon, title, desc, table }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center active:scale-95 transition-transform cursor-pointer hover:shadow-md h-full">
    <div className={`w-16 h-16 rounded-2xl ${bgIcon} flex items-center justify-center mb-3`}>{icon}</div>
    <h3 className="font-bold text-gray-800 text-sm mb-1">{title}</h3>
    <p className="text-[10px] text-gray-500 mb-2">{desc}</p>
    <span className="text-[9px] font-mono text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 mt-auto">{table}</span>
  </div>
);

// --- PROFILE & MEMBER INFO ---
const ProfileScreen = ({ user, onNavigate }) => (
  <div className="px-4 pb-6 pt-12 relative">
     <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center relative mt-8">
        <div className="absolute -top-10 left-0 right-0 flex justify-center">
           <img src={user.avatar} className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-gray-200" />
        </div>
        <div className="mt-8">
           <h2 className="text-xl font-bold text-gray-800">{user.ho_ten}</h2>
           <p className="text-sm text-gray-500">{user.chuc_vu}</p>
           <div className="flex justify-center gap-2 mt-4">
              <span className="bg-red-50 text-[#EE0033] text-xs font-bold px-3 py-1 rounded-full">{user.trang_thai}</span>
           </div>
        </div>
     </div>
     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <MenuRow icon={<User size={20} className="text-blue-500"/>} label="Thông tin Đảng viên" onClick={() => onNavigate('member_info')} />
        <div className="h-[1px] bg-gray-50 mx-4"></div>
        <MenuRow icon={<Users size={20} className="text-red-500"/>} label="Thông tin Tổ chức Đảng" onClick={() => onNavigate('org_info')} />
        <div className="h-[1px] bg-gray-50 mx-4"></div>
        <MenuRow icon={<QrCode size={20} className="text-gray-700"/>} label="Thẻ Đảng viên điện tử" />
     </div>
     <button className="w-full bg-red-50 text-[#EE0033] font-bold py-3 rounded-xl flex items-center justify-center gap-2">
        <LogOut size={18} /> Đăng xuất
     </button>
  </div>
);

const MemberInfoScreen = ({ user, onBack }) => (
    <div className="px-4 py-6 animate-in slide-in-from-right duration-300">
      {!user.is_verified && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3 mb-6">
           <AlertTriangle size={20} className="text-orange-500 shrink-0 mt-0.5" />
           <div>
              <h3 className="text-sm font-bold text-orange-700">Chưa xác thực CCCD</h3>
              <button className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm mt-2">Xác thực ngay</button>
           </div>
        </div>
      )}
      <div className="space-y-5">
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm uppercase mb-3 flex gap-2"><User size={18} className="text-red-500"/> Thông tin cá nhân</h3>
            <InputReadOnly label="Họ tên" value={user.ho_ten} />
            <div className="h-2"></div>
            <InputReadOnly label="Ngày sinh" value={user.ngay_sinh} />
         </div>
      </div>
    </div>
);

const OrgInfoScreen = ({ cell, committee, onBack }) => (
    <div className="px-4 py-6 animate-in slide-in-from-right duration-300 text-center">
       <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <Users size={40} className="mx-auto text-red-500 mb-2"/>
          <h2 className="text-xl font-bold">{cell.ten_chi_bo}</h2>
          <p className="text-gray-500 text-sm mt-1">{cell.ma_chi_bo}</p>
       </div>
    </div>
);

// --- HELPERS ---
const InputReadOnly = ({ label, value }) => (
  <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</label><div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-medium text-gray-700">{value}</div></div>
);
const MenuRow = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"><div className="flex items-center gap-4"><div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">{icon}</div><span className="text-sm font-bold text-gray-700">{label}</span></div><ChevronRight size={16} className="text-gray-300"/></button>
);
const NavItem = ({ id, label, icon, isActive, onClick }) => (
  <button onClick={() => onClick(id)} className="flex-1 flex flex-col items-center justify-center relative group"><div className={`absolute -top-10 w-12 h-12 rounded-full border-4 border-gray-50 flex items-center justify-center transition-all duration-300 shadow-xl ${isActive ? 'bg-[#EE0033] scale-100 opacity-100' : 'bg-transparent scale-0 opacity-0'}`}>{isActive && React.cloneElement(icon, { size: 24, color: 'white' })}</div><div className={`transition-all duration-300 mb-1 ${isActive ? 'opacity-0 translate-y-4' : 'opacity-100 text-gray-400 group-hover:text-gray-600'}`}>{icon}</div><span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'text-[#EE0033]' : 'text-gray-400'}`}>{label}</span></button>
);

export default App;