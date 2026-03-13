import React, { useState } from 'react';
import { Home, Briefcase, Bell, User, Calendar, FileText, ChevronRight, Menu, Database, Users, Wallet, Award, BookOpen, Clock, Filter, CheckCircle, AlertCircle, Library, GraduationCap, QrCode, Settings, LogOut, Shield, Info, History, BadgeCheck, Camera, ChevronLeft, CreditCard, AlertTriangle, Save, Phone, MapPin, Mail, Building, Landmark } from 'lucide-react';

// --- MOCK DATA (DẠNG PLACEHOLDER MAPPING DB) ---
const DB = {
  user: {
    id: 1,
    // Thông tin cá nhân
    ho_ten: "Nguyễn Văn A", // party_members.ho_ten
    ma_so: "12345678", // party_members.ma_dang_vien
    ngay_sinh: "01/01/1985", // party_members.ngay_sinh
    gioi_tinh: "Nam", // party_members.gioi_tinh
    cccd: "03809xxxxxxx", // party_members.cmnd_cccd
    avatar: "https://ui-avatars.com/api/?name=Nguyen+Van+A&background=EE0033&color=fff&size=150",
    
    // Thông tin liên hệ
    sdt: "0987654321", // party_members.so_dien_thoai
    email: "nguyenvana@email.com", // party_members.email
    dia_chi: "P. Hòa Thuận Tây, Q. Hải Châu, TP. Đà Nẵng", // party_members.dia_chi
    
    // Thông tin Đảng
    chuc_vu: "Bí thư Chi bộ", // party_positions.ten_chuc_vu
    don_vi: "Chi bộ Khối Doanh nghiệp", // party_cells.ten_chi_bo
    ngay_vao: "03/02/2015", // party_members.ngay_vao_dang
    ngay_chinh_thuc: "03/02/2016", // party_members.ngay_chinh_thuc
    trang_thai: "Đảng viên chính thức",
    
    // Trình độ
    trinh_do_hv: "Đại học", // party_members.trinh_do_hoc_van
    trinh_do_llct: "Cao cấp", // party_members.trinh_do_ly_luan_chinh_tri
    nghe_nghiep: "Kỹ sư Công nghệ thông tin", // party_members.nghe_nghiep

    is_verified: false // Cờ giả lập chưa xác thực CCCD
  },

  // Dữ liệu Chi bộ (Table: party_cells)
  party_cell: {
    id: 10,
    ten_chi_bo: "Chi bộ Khối Doanh nghiệp",
    ma_chi_bo: "CB-DN01",
    bi_thu: "Lê Văn B", // Mapping từ bi_thu_id
    so_dang_vien: 24,
    ngay_thanh_lap: "19/05/2010",
    don_vi_truc_thuoc: "Công ty ABC"
  },

  // Dữ liệu Đảng bộ (Table: party_committees)
  party_committee: {
    id: 1,
    ten_dang_bo: "Đảng bộ Quận Hải Châu",
    ma_dang_bo: "DB-HC",
    cap_uy: "Cấp Huyện/Quận",
    bi_thu: "Trần Văn C", // Mapping từ bi_thu_id
    dia_chi: "Số 10, Đường Phan Đăng Lưu, TP. Đà Nẵng",
    sdt: "0236.3.xxx.xxx",
    email: "vanphong@haichau.danang.dcs.vn",
    tong_so_dang_vien: 5400,
    so_chi_bo: 120
  },
  
  // Dữ liệu khác giữ nguyên
  featured_news: [
    { id: 101, title: "[documents.tieu_de]", image: "https://dangcongsan.vn/DATA/0/2018/05/19/dangcongsan_vn/ho-chi-minh-10-15-56-786.jpg", date: "[documents.ngay_ban_hanh]", source_note: "Table: documents" },
    { id: 102, title: "[documents.tieu_de] (Tin 2)", image: "https://cdn.chinhphu.vn/334894974524682240/2022/10/3/photo-1664790861694-16647908617841525547926.jpg", date: "[documents.ngay_ban_hanh]", source_note: "Table: documents" }
  ],
  notifications: [
    { id: 501, title: "Triệu tập cuộc họp Chi bộ tháng 6", time: "08:00 - 25/05/2025", type: "meeting", is_urgent: true, is_read: false, sender: "Chi bộ 3", source_note: "notifications" },
    { id: 502, title: "Nhắc nhở đóng Đảng phí", time: "10:30 - 24/05/2025", type: "fee", is_urgent: false, is_read: true, sender: "Ban Tài chính", source_note: "notifications" }
  ],
  work_summary: { next_meeting: "25/05 - 08:00", unpaid_fee: "Tháng 5" }
};

const App = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentScreen, setCurrentScreen] = useState('main'); // main, member_info, org_info

  const navigateTo = (screen) => setCurrentScreen(screen);
  const goBack = () => setCurrentScreen('main');

  const getHeaderTitle = () => {
    if (currentScreen === 'member_info') return 'Thông tin Đảng viên';
    if (currentScreen === 'org_info') return 'Tổ chức Đảng';
    switch (activeTab) {
      case 'news': return 'Đảng Cộng sản Việt Nam';
      case 'work': return 'Nghiệp vụ Đảng viên';
      case 'notif': return 'Hộp thư Thông báo';
      case 'profile': return 'Cá nhân';
      default: return 'Đảng Cộng sản Việt Nam';
    }
  };

  const renderContent = () => {
    if (currentScreen === 'member_info') {
      return <MemberInfoScreen user={DB.user} onBack={goBack} />;
    }
    if (currentScreen === 'org_info') {
      return <OrgInfoScreen cell={DB.party_cell} committee={DB.party_committee} onBack={goBack} />;
    }

    switch (activeTab) {
      case 'news': return <NewsFeed user={DB.user} news={DB.featured_news} notifs={DB.notifications} />;
      case 'work': return <WorkDashboard summary={DB.work_summary} />;
      case 'notif': return <NotificationScreen notifications={DB.notifications} />;
      case 'profile': return <ProfileScreen user={DB.user} onNavigate={navigateTo} />;
      default: return <NewsFeed user={DB.user} news={DB.featured_news} notifs={DB.notifications} />;
    }
  };

  return (
    <div className="flex justify-center bg-gray-200 min-h-screen font-sans">
      <div className="w-full max-w-md h-screen bg-gray-50 flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* --- 1. HEADER --- */}
        <div className={`pt-10 pb-6 px-6 shadow-lg z-10 relative overflow-hidden shrink-0 transition-all duration-500 ${activeTab === 'profile' || currentScreen !== 'main' ? 'bg-[#EE0033] pb-6 rounded-b-[0px]' : 'bg-[#EE0033] rounded-b-[30px]'}`}>
          <div className="absolute top-[-10px] right-[-20px] opacity-10 rotate-12 pointer-events-none">
             <svg width="180" height="180" viewBox="0 0 24 24" fill="white">
               <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" />
             </svg>
          </div>

          <div className="flex justify-between items-center text-white relative z-20">
             {currentScreen !== 'main' ? (
                <div className="flex items-center w-full">
                  <button onClick={goBack} className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors">
                    <ChevronLeft size={24} />
                  </button>
                  <h1 className="text-xl font-bold uppercase tracking-wide flex-1 text-center pr-8">
                    {getHeaderTitle()}
                  </h1>
                </div>
             ) : activeTab === 'profile' ? (
                 <div className="w-full text-center py-4">
                    <h1 className="text-xl font-bold uppercase tracking-wide">Cá nhân</h1>
                 </div>
             ) : (
                <>
                  <div>
                    <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-1 opacity-90">
                      {getHeaderTitle()}
                    </p>
                    <h1 className="text-2xl font-bold leading-tight mt-1">
                      {activeTab === 'work' ? 'Công tác' : (activeTab === 'notif' ? 'Thông báo' : 'Xin chào,')} <br/>
                      <span className="text-2xl font-mono bg-red-800/30 px-1 rounded border border-red-400/30">
                        {activeTab === 'work' ? 'Đảng viên' : (activeTab === 'notif' ? 'Mới nhất' : DB.user.ho_ten)}
                      </span>
                    </h1>
                  </div>
                  <div className="flex flex-col items-center">
                     <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {activeTab === 'notif' ? <Bell size={24}/> : <User size={24}/>}
                     </div>
                  </div>
                </>
             )}
          </div>
        </div>

        {/* --- 2. MAIN CONTENT --- */}
        <div className="flex-1 overflow-y-auto pb-24 scroll-smooth bg-gray-50">
          {renderContent()}
        </div>

        {/* --- 3. BOTTOM NAV --- */}
        {currentScreen === 'main' && (
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

// --- COMPONENT TRANG TỔ CHỨC ĐẢNG (ORG INFO SCREEN) ---
const OrgInfoScreen = ({ cell, committee }) => {
  const [tab, setTab] = useState('cell'); // 'cell' (Chi bộ) | 'committee' (Đảng bộ)

  return (
    <div className="px-4 py-6 animate-in fade-in slide-in-from-right-8 duration-300 pb-24">
      
      {/* 1. Tab Switcher */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex mb-6">
        <button 
          onClick={() => setTab('cell')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'cell' ? 'bg-[#EE0033] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Chi bộ
        </button>
        <button 
           onClick={() => setTab('committee')}
           className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'committee' ? 'bg-[#EE0033] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Đảng bộ
        </button>
      </div>

      {/* 2. Content */}
      <div className="animate-in fade-in zoom-in duration-300">
        {tab === 'cell' ? (
          <>
            {/* Card Chi bộ */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 text-center mb-5 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-[#EE0033]"></div>
               <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 text-[#EE0033]">
                  <Users size={32} />
               </div>
               <h2 className="text-xl font-bold text-gray-800 mb-1">{cell.ten_chi_bo}</h2>
               <p className="text-sm text-gray-500 font-mono mb-4">{cell.ma_chi_bo}</p>
               
               <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div>
                     <p className="text-xs text-gray-400 uppercase font-bold">Thành lập</p>
                     <p className="font-semibold text-gray-700">{cell.ngay_thanh_lap}</p>
                  </div>
                  <div>
                     <p className="text-xs text-gray-400 uppercase font-bold">Số đảng viên</p>
                     <p className="font-semibold text-gray-700">{cell.so_dang_vien}</p>
                  </div>
               </div>
            </div>

            {/* Chi tiết Chi bộ */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
               <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                  <Info size={18} className="text-[#EE0033]" />
                  <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin chi tiết</h3>
               </div>
               <div className="space-y-4">
                  <InputReadOnly label="Bí thư Chi bộ" value={cell.bi_thu} note="party_cells.bi_thu_id" />
                  <InputReadOnly label="Đơn vị trực thuộc" value={cell.don_vi_truc_thuoc} note="party_cells.don_vi_truc_thuoc" />
               </div>
            </div>
          </>
        ) : (
          <>
            {/* Card Đảng bộ */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 text-center mb-5 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-[#EE0033]"></div>
               <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 text-[#EE0033]">
                  <Landmark size={32} />
               </div>
               <h2 className="text-xl font-bold text-gray-800 mb-1">{committee.ten_dang_bo}</h2>
               <p className="text-sm text-gray-500 font-mono mb-4">{committee.ma_dang_bo}</p>
               
               <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div>
                     <p className="text-xs text-gray-400 uppercase font-bold">Cấp ủy</p>
                     <p className="font-semibold text-gray-700">{committee.cap_uy}</p>
                  </div>
                  <div>
                     <p className="text-xs text-gray-400 uppercase font-bold">Tổng ĐV</p>
                     <p className="font-semibold text-gray-700">{committee.tong_so_dang_vien}</p>
                  </div>
               </div>
            </div>

             {/* Chi tiết Đảng bộ */}
             <div className="bg-white rounded-2xl p-5 shadow-sm">
               <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                  <Building size={18} className="text-[#EE0033]" />
                  <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin liên hệ</h3>
               </div>
               <div className="space-y-4">
                  <InputReadOnly label="Bí thư Đảng bộ" value={committee.bi_thu} note="party_committees.bi_thu_id" />
                  <InputReadOnly label="Địa chỉ văn phòng" value={committee.dia_chi} note="party_committees.dia_chi_van_phong" />
                  <div className="grid grid-cols-2 gap-4">
                     <InputReadOnly label="Điện thoại" value={committee.sdt} note="party_committees.dien_thoai" />
                     <InputReadOnly label="Số Chi bộ" value={committee.so_chi_bo} note="party_committees.so_chi_bo_truc_thuoc" />
                  </div>
               </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

// ... (MemberInfoScreen, ProfileScreen, etc. keep as is) ...

// --- REUSABLE INPUT COMPONENTS ---
const InputReadOnly = ({ label, value, note }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">{label}</label>
    <div className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-600 text-sm font-medium break-words">
       {value}
    </div>
    {note && <p className="text-[9px] text-gray-300 mt-1 font-mono">{note}</p>}
  </div>
);

const InputEdit = ({ label, value, icon, note }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
    <div className="relative group">
       <input 
         type="text" 
         defaultValue={value} 
         className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 pl-9 text-gray-800 text-sm focus:outline-none focus:border-[#EE0033] focus:ring-1 focus:ring-[#EE0033] transition-all"
       />
       <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#EE0033]">
          {icon || <FileText size={14}/>}
       </div>
    </div>
    {note && <p className="text-[9px] text-gray-300 mt-1 font-mono">{note}</p>}
  </div>
);

// --- COMPONENT TRANG CHI TIẾT (MEMBER INFO SCREEN) ---
const MemberInfoScreen = ({ user }) => {
  return (
    <div className="px-4 py-6 animate-in fade-in slide-in-from-right-8 duration-300 pb-24">
      {/* 1. KHỐI CẢNH BÁO XÁC THỰC */}
      {!user.is_verified && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 flex flex-col items-center text-center border border-orange-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-2">
             <AlertTriangle size={24} className="text-orange-500" />
          </div>
          <h3 className="font-bold text-gray-800 text-sm">Chưa xác thực CCCD</h3>
          <p className="text-xs text-gray-500 mt-1 mb-3 max-w-[250px]">
            Vui lòng xác thực căn cước công dân để chuẩn hóa dữ liệu Đảng viên.
          </p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm transition-colors">
            Xác thực ngay
          </button>
        </div>
      )}

      {/* 2. NHÓM 1: THÔNG TIN CÁ NHÂN */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
           <User size={18} className="text-[#EE0033]" />
           <h2 className="font-bold text-gray-800 text-sm uppercase">Thông tin cá nhân</h2>
        </div>
        
        {/* Avatar & Basic Info Header */}
        <div className="flex items-center gap-4 mb-6">
           <div className="w-16 h-16 rounded-full border-2 border-gray-100 overflow-hidden shrink-0 bg-gray-50">
              <img src={user.avatar} className="w-full h-full object-cover"/>
           </div>
           <div>
              <h3 className="font-bold text-lg text-gray-900">{user.ho_ten}</h3>
              <p className="text-xs text-gray-400 font-mono">ID: {user.ma_so}</p>
              <span className="inline-block bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded mt-1 border border-green-100">
                {user.trang_thai}
              </span>
           </div>
        </div>

        <div className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <InputReadOnly label="Ngày sinh" value={user.ngay_sinh} note="party_members.ngay_sinh" />
              <InputReadOnly label="Giới tính" value={user.gioi_tinh} note="party_members.gioi_tinh" />
           </div>
           <InputReadOnly label="Số CCCD/CMND" value={user.cccd} note="party_members.cmnd_cccd" />
        </div>
      </div>

      {/* 3. NHÓM 2: THÔNG TIN LIÊN HỆ */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
         <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
           <Phone size={18} className="text-[#EE0033]" />
           <h2 className="font-bold text-gray-800 text-sm uppercase">Thông tin liên hệ</h2>
        </div>
        <div className="space-y-4">
           <InputEdit label="Số điện thoại" value={user.sdt} icon={<Phone size={14}/>} note="party_members.so_dien_thoai" />
           <InputEdit label="Email" value={user.email} icon={<Mail size={14}/>} note="party_members.email" />
           <InputEdit label="Địa chỉ hiện tại" value={user.dia_chi} icon={<MapPin size={14}/>} note="party_members.dia_chi" />
        </div>
      </div>

      {/* 4. NHÓM 3: HỒ SƠ ĐẢNG */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
           <BadgeCheck size={18} className="text-[#EE0033]" />
           <h2 className="font-bold text-gray-800 text-sm uppercase">Hồ sơ Đảng</h2>
        </div>
        <div className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <InputReadOnly label="Ngày vào Đảng" value={user.ngay_vao} note="party_members.ngay_vao_dang" />
              <InputReadOnly label="Ngày chính thức" value={user.ngay_chinh_thuc} note="party_members.ngay_chinh_thuc" />
           </div>
           <InputReadOnly label="Sinh hoạt tại Chi bộ" value={user.don_vi} note="party_cells.ten_chi_bo" />
           <InputReadOnly label="Chức vụ hiện tại" value={user.chuc_vu} note="party_positions.ten_chuc_vu" />
        </div>
      </div>

       {/* 5. NHÓM 4: TRÌNH ĐỘ */}
       <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
           <GraduationCap size={18} className="text-[#EE0033]" />
           <h2 className="font-bold text-gray-800 text-sm uppercase">Trình độ & Chuyên môn</h2>
        </div>
        <div className="space-y-4">
           <InputEdit label="Trình độ học vấn" value={user.trinh_do_hv} note="party_members.trinh_do_hoc_van" />
           <InputEdit label="Lý luận chính trị" value={user.trinh_do_llct} note="party_members.trinh_do_ly_luan_chinh_tri" />
           <InputEdit label="Nghề nghiệp" value={user.nghe_nghiep} note="party_members.nghe_nghiep" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] max-w-md mx-auto z-50">
        <button className="w-full bg-[#EE0033] hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
           <Save size={20} />
           Lưu thay đổi
        </button>
      </div>

    </div>
  );
};

// --- ProfileScreen (Menu Update) ---
const ProfileScreen = ({ user, onNavigate }) => {
  return (
    <div className="px-4 pb-6 animate-in fade-in slide-in-from-bottom-8 duration-500 relative -top-6">
      <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 relative pt-12 mt-12">
        <div className="flex flex-col items-center absolute -top-12 left-0 right-0">
          <div className="relative">
             <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-gray-200 overflow-hidden bg-gray-50">
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
             </div>
             <button className="absolute bottom-0 right-0 bg-[#EE0033] text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                <Camera size={14} />
             </button>
          </div>
        </div>
        <div className="flex flex-col items-center mt-10">
          <h2 className="text-lg font-bold text-gray-800">{user.ho_ten}</h2>
          <div className="flex items-center gap-1 mt-1">
             <BadgeCheck size={14} className="text-[#EE0033]" />
             <p className="text-xs text-gray-500 font-mono">ĐV Chính thức</p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full mt-6">
             <div className="bg-red-50 p-3 rounded-xl flex flex-col items-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Mã số Đảng</span>
                <span className="text-sm font-bold text-[#EE0033] mt-1">{user.ma_so}</span>
             </div>
             <div className="bg-gray-50 p-3 rounded-xl flex flex-col items-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Tuổi Đảng</span>
                <span className="text-sm font-bold text-gray-700 mt-1">9 năm</span>
             </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
        <ProfileMenuItem icon={<User size={20} className="text-blue-500" />} label="Thông tin Đảng viên" subLabel="Hồ sơ lý lịch, Ngày vào Đảng..." onClick={() => onNavigate('member_info')} />
        <div className="h-[1px] bg-gray-100 mx-4"></div>
        {/* MỤC MỚI: THÔNG TIN TỔ CHỨC ĐẢNG */}
        <ProfileMenuItem icon={<Users size={20} className="text-red-500" />} label="Thông tin Tổ chức Đảng" subLabel="Chi bộ, Đảng bộ trực thuộc" onClick={() => onNavigate('org_info')} />
        <div className="h-[1px] bg-gray-100 mx-4"></div>
        <ProfileMenuItem icon={<Briefcase size={20} className="text-purple-500" />} label="Chức vụ & Nhiệm vụ" subLabel="Theo dõi quá trình công tác" />
        <div className="h-[1px] bg-gray-100 mx-4"></div>
        <ProfileMenuItem icon={<QrCode size={20} className="text-gray-700" />} label="Thẻ Đảng viên điện tử" subLabel="Mã QR định danh" />
        <div className="h-[1px] bg-gray-100 mx-4"></div>
        <ProfileMenuItem icon={<History size={20} className="text-green-500" />} label="Lịch sử Sinh hoạt Đảng" subLabel="Điểm danh & Đánh giá" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <ProfileMenuItem icon={<Settings size={20} className="text-gray-500" />} label="Cài đặt" />
        <div className="h-[1px] bg-gray-100 mx-4"></div>
        <ProfileMenuItem icon={<FileText size={20} className="text-gray-500" />} label="Điều khoản sử dụng" />
        <div className="h-[1px] bg-gray-100 mx-4"></div>
        <ProfileMenuItem icon={<Shield size={20} className="text-gray-500" />} label="Chính sách bảo mật" />
      </div>
      <button className="w-full bg-red-50 text-[#EE0033] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors mb-6">
         <LogOut size={18} />
         Đăng xuất
      </button>
    </div>
  );
};

// ... (Other Components: NewsFeed, WorkDashboard, NotificationScreen, NavItem, ProfileMenuItem) ...
// Các component này giữ nguyên từ phiên bản trước
const ProfileMenuItem = ({ icon, label, subLabel, onClick }) => (
  <div onClick={onClick} className="p-4 flex items-center justify-between active:bg-gray-50 transition-colors cursor-pointer group hover:bg-gray-50">
     <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
           {icon}
        </div>
        <div>
           <p className="text-sm font-semibold text-gray-700">{label}</p>
           {subLabel && <p className="text-[10px] text-gray-400 mt-0.5">{subLabel}</p>}
        </div>
     </div>
     <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
  </div>
);

const NewsFeed = ({ news, notifs }) => (
  <div className="pt-6 px-4 space-y-6 animate-in fade-in duration-500">
    <section>
      <div className="flex justify-between items-center mb-3 pl-1 border-l-4 border-[#EE0033]">
        <h2 className="text-gray-800 font-bold text-lg uppercase leading-none">Tin tức nổi bật</h2>
        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1 rounded">Table: documents</span>
      </div>
      <div className="flex space-x-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
        {news.map(item => (
          <div key={item.id} className="snap-center min-w-[200px] w-[200px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
            <div className="h-28 w-full relative overflow-hidden bg-gray-200">
              <img src={item.image} alt="news" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center"><span className="bg-black/50 text-white text-[10px] font-mono px-2 py-1 rounded">documents.duong_dan_file</span></div>
            </div>
            <div className="p-3">
              <h3 className="text-blue-600 font-mono text-xs font-bold leading-snug line-clamp-2 h-8 mb-1.5 bg-blue-50 p-0.5 rounded border border-blue-100 border-dashed">{item.title}</h3>
              <div className="flex flex-col text-[10px]"><div className="flex items-center text-gray-500 font-mono"><Calendar size={10} className="mr-1" />{item.date}</div></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const NotificationScreen = ({ notifications }) => {
  const [filter, setFilter] = useState('all'); 
  const filteredList = notifications.filter(item => {
    if (filter === 'unread') return !item.is_read;
    if (filter === 'urgent') return item.is_urgent;
    return true;
  });
  return (
    <div className="pt-4 px-4 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <FilterTab label="Tất cả" isActive={filter === 'all'} onClick={() => setFilter('all')} count={notifications.length} />
        <FilterTab label="Chưa đọc" isActive={filter === 'unread'} onClick={() => setFilter('unread')} count={notifications.filter(n => !n.is_read).length} />
        <FilterTab label="Quan trọng" isActive={filter === 'urgent'} onClick={() => setFilter('urgent')} count={notifications.filter(n => n.is_urgent).length} />
      </div>
       <div className="space-y-3">
        {filteredList.map(item => (
            <div key={item.id} className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden ${!item.is_read ? 'bg-red-50/30' : ''}`}>
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'meeting' ? 'bg-red-100 text-[#EE0033]' : 'bg-blue-100 text-blue-600'}`}>
                   {item.type === 'meeting' ? <Users size={20}/> : <Wallet size={20}/>}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 mb-2">Table: notifications</p>
                </div>
              </div>
            </div>
          ))}
       </div>
    </div>
  );
};

const WorkDashboard = ({ summary }) => (
    <div className="p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

const FilterTab = ({ label, isActive, onClick, count }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${isActive ? 'bg-[#EE0033] text-white border-[#EE0033] shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
    {label}{count > 0 && <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{count}</span>}
  </button>
);

const NavItem = ({ id, label, icon, isActive, onClick }) => (
  <button onClick={() => onClick(id)} className="flex-1 flex flex-col items-center justify-center relative group">
    <div className={`absolute -top-10 w-12 h-12 rounded-full border-4 border-gray-50 flex items-center justify-center transition-all duration-300 shadow-xl ${isActive ? 'bg-[#EE0033] scale-100 opacity-100' : 'bg-transparent scale-0 opacity-0'}`}>
      {isActive && React.cloneElement(icon, { size: 24, color: 'white' })}
    </div>
    <div className={`transition-all duration-300 mb-1 ${isActive ? 'opacity-0 translate-y-4' : 'opacity-100 text-gray-400 group-hover:text-gray-600'}`}>{icon}</div>
    <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'text-[#EE0033]' : 'text-gray-400'}`}>{label}</span>
  </button>
);

export default App;