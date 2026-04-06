import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, ShieldCheck, Zap, Users, FileText,
  Smartphone, ChevronRight, Newspaper, Star,
  Bell, BookOpen, CreditCard, ArrowRight, Menu, X
} from 'lucide-react';
import { landingApi } from './services/api';
import NewsDetail from './NewsDetail';
import NewsListPage from './pages/NewsListPage';
import DocumentsPage from './pages/DocumentsPage';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');


// ─── Navbar ─────────────────────────────────────────────────────────────────
const Navbar = ({ onNewsClick }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#intro" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 premium-gradient rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md group-hover:shadow-lg transition">
            Đ
          </div>
          <span className="font-black text-xl tracking-tight text-gray-900">
            App <span className="text-gradient">Đoàn Viên</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-gray-600">
          {[
            { label: 'Giới thiệu', href: '#intro' },
            { label: 'Tính năng', href: '#features' },
            { label: 'Tin tức', href: '#news' },
            { label: 'Tài liệu', href: '#documents' },
          ].map(l => (
            <a key={l.href} href={l.href}
              className="relative hover:text-primary-600 transition after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary-600 after:transition-all hover:after:w-full">
              {l.label}
            </a>
          ))}
          <a href="#register"
            className="px-5 py-2.5 premium-gradient text-white rounded-full font-bold btn-glow transition shadow-md text-sm">
            Đăng ký ngay
          </a>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(o => !o)} className="md:hidden text-gray-700">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-4 text-sm font-semibold text-gray-700">
          {[
            { label: 'Giới thiệu', href: '#intro' },
            { label: 'Tính năng', href: '#features' },
            { label: 'Tin tức', href: '#news' },
            { label: 'Tài liệu', href: '#documents' },
          ].map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="hover:text-primary-600">{l.label}</a>
          ))}
          <a href="#register" onClick={() => setOpen(false)}
            className="w-fit px-5 py-2.5 premium-gradient text-white rounded-full font-bold">Đăng ký ngay</a>
        </div>
      )}
    </nav>
  );
};

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [config, setConfig] = React.useState(null);
  const [selectedNewsId, setSelectedNewsId] = React.useState(null);
  const [news, setNews] = React.useState([]);
  const [documents, setDocuments] = React.useState([]);

  const [loading, setLoading] = React.useState(true);
  const [regForm, setRegForm] = React.useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
  const [regStatus, setRegStatus] = React.useState({ type: '', msg: '' });
  // page: 'home' | 'news' | 'documents'
  const [currentPage, setCurrentPage] = React.useState('home');

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, docsRes, newsRes] = await Promise.all([
          landingApi.getConfig(),
          landingApi.getDocuments({ limit: 4 }),
          landingApi.getNews({ limit: 3, isPublished: true })
        ]);
        setConfig(configRes.data.data);
        setDocuments(docsRes.data.data || []);
        setNews(newsRes.data.data || []);
      } catch (err) {
        console.error('Error fetching landing data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword)
      return setRegStatus({ type: 'error', msg: 'Mật khẩu xác nhận không khớp!' });
    setRegStatus({ type: 'loading', msg: 'Đang xử lý...' });
    try {
      await landingApi.register({ fullName: regForm.fullName, username: regForm.username, email: regForm.email, password: regForm.password });
      setRegStatus({ type: 'success', msg: 'Đăng ký thành công! Vui lòng chờ phê duyệt.' });
      setRegForm({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setRegStatus({ type: 'error', msg: err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.' });
    }
  };

  const handleDownloadDoc = (fileUrl) => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 premium-gradient rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl animate-pulse">Đ</div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Đang tải...</p>
      </div>
    </div>
  );

  if (selectedNewsId) {
    return <NewsDetail newsId={selectedNewsId} onBack={() => setSelectedNewsId(null)} />;
  }
  if (currentPage === 'news') {
    return <NewsListPage
      onBack={() => setCurrentPage('home')}
      onSelectNews={(id) => setSelectedNewsId(id)}
    />;
  }
  if (currentPage === 'documents') {
    return <DocumentsPage onBack={() => setCurrentPage('home')} />;
  }

  const hero = config?.hero_section || {
    title: 'Kết nối Đoàn Viên\nTrong Tầm Tay Bạn',
    subtitle: 'Ứng dụng Quản lý Đoàn viên 4.0',
    description: 'Nền tảng số hiện đại giúp quản lý, tương tác và nắm bắt thông tin Đoàn một cách nhanh chóng, hiệu quả và minh bạch nhất.'
  };

  const features = [
    { icon: ShieldCheck, title: 'Bảo mật tuyệt đối', desc: 'Dữ liệu đoàn viên được mã hóa và bảo mật theo tiêu chuẩn cao nhất.', color: 'from-blue-500 to-primary-600' },
    { icon: Bell, title: 'Thông báo tức thì', desc: 'Nhận thông báo các hoạt động, sự kiện, cuộc họp và tin tức mới nhất theo thời gian thực.', color: 'from-violet-500 to-purple-600' },
    { icon: BookOpen, title: 'Kho tài liệu số', desc: 'Toàn bộ văn bản, tài liệu Đoàn được số hóa và dễ dàng tìm kiếm, tải về.', color: 'from-emerald-500 to-teal-600' },
    { icon: Zap, title: 'Xử lý thần tốc', desc: 'Tra cứu thông tin, nộp đoàn phí và đăng ký hoạt động chỉ với một chạm.', color: 'from-orange-500 to-amber-500' },
    { icon: Users, title: 'Gắn kết cộng đồng', desc: 'Hệ thống bảng tin và bình luận giúp kết nối mọi đoàn viên trên toàn hệ thống.', color: 'from-pink-500 to-rose-500' },
    { icon: CreditCard, title: 'Đoàn phí điện tử', desc: 'Nộp đoàn phí trực tuyến tiện lợi, minh bạch với lịch sử giao dịch đầy đủ.', color: 'from-cyan-500 to-blue-500' },
  ];

  const stats = [
    { label: 'Đoàn Viên', value: '10,000+', icon: Users },
    { label: 'Chi Đoàn', value: '500+', icon: Star },
    { label: 'Hoạt động', value: '1,200+', icon: Zap },
    { label: 'Tin tức/ngày', value: '20+', icon: Newspaper },
  ];

  return (
    <div className="min-h-screen font-sans selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden text-gray-900">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section id="intro" className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full premium-gradient opacity-[0.07] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full bg-violet-400 opacity-[0.06] blur-3xl pointer-events-none" />
        <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 text-primary-700 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
              {hero.subtitle}
            </div>

            <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight">
              Kết nối{' '}
              <span className="text-gradient glow-text">Đoàn Viên</span>
              <br />
              <span className="text-gray-800">Trong Tầm Tay</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-lg">
              {hero.description}
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="flex items-center gap-2.5 bg-gray-900 hover:bg-black text-white px-7 py-4 rounded-2xl font-bold shadow-xl transition active:scale-[0.97]">
                <Download size={20} /> Tải trên App Store
              </button>
              <button className="flex items-center gap-2.5 bg-white text-gray-800 px-7 py-4 rounded-2xl border-2 border-gray-200 hover:border-primary-300 hover:text-primary-700 font-bold shadow-sm transition active:scale-[0.97]">
                <Smartphone size={20} /> Google Play
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
              <div className="flex -space-x-2">
                {['#1c42fd', '#3b5bfe', '#5c35f0', '#7080fe'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
                ))}
              </div>
              <span>Hơn <strong className="text-gray-700">10.000+</strong> đoàn viên đang sử dụng</span>
            </div>
          </motion.div>

          {/* Right — phone mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center"
          >
            {/* Glow ring */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-80 rounded-full premium-gradient opacity-15 blur-[80px]" />
            </div>

            {/* Phone */}
            <div className="relative z-10 w-[260px] md:w-[300px] aspect-[9/19.5] bg-gray-900 rounded-[3.5rem] border-[7px] border-gray-800 shadow-2xl shadow-primary-900/20 overflow-hidden animate-float">
              {/* Screen */}
              <div className="w-full h-full bg-gradient-to-b from-primary-50 to-white rounded-[3rem] overflow-hidden flex flex-col">
                {/* Status bar */}
                <div className="px-5 pt-3 pb-1 flex justify-between text-[9px] text-gray-400 font-semibold">
                  <span>9:41</span>
                  <span>●●●</span>
                </div>
                {/* App header */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 premium-gradient rounded-lg flex items-center justify-center text-white text-xs font-black">Đ</div>
                    <span className="text-xs font-bold text-gray-800">Đoàn Viên App</span>
                  </div>
                </div>
                {/* Content items */}
                <div className="px-3 space-y-2 flex-1">
                  {['Thông báo họp chi đoàn T3', 'Nộp đoàn phí quý II/2026', 'Cuộc thi Olympic Tiếng Anh', 'Kết quả bầu cử BCH Đoàn'].map((item, i) => (
                    <div key={i} className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: ['#1c42fd','#10b981','#f59e0b','#ef4444'][i] }} />
                      <span className="text-[9px] text-gray-700 font-medium line-clamp-1">{item}</span>
                    </div>
                  ))}
                </div>
                {/* Bottom nav */}
                <div className="px-4 py-2.5 flex justify-around border-t border-gray-100 mt-2">
                  {[Bell, Users, FileText, Star].map((Icon, i) => (
                    <div key={i} className={`p-1.5 rounded-lg ${i === 0 ? 'premium-gradient' : ''}`}>
                      <Icon size={13} className={i === 0 ? 'text-white' : 'text-gray-400'} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -left-4 top-1/4 glass-card rounded-2xl px-3.5 py-2.5 shadow-xl animate-float-delay z-20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center"><ShieldCheck size={14} /></div>
                <div>
                  <div className="text-[10px] font-black text-gray-800">An toàn</div>
                  <div className="text-[9px] text-gray-400">Bảo mật cao</div>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-1/3 glass-card rounded-2xl px-3.5 py-2.5 shadow-xl animate-float z-20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center"><Bell size={14} /></div>
                <div>
                  <div className="text-[10px] font-black text-primary-700">Thông báo</div>
                  <div className="text-[9px] text-gray-400">Real-time</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 wave-divider">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 card-gradient hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-11 h-11 mx-auto mb-3 premium-gradient rounded-xl flex items-center justify-center shadow-md">
                  <s.icon size={20} className="text-white" />
                </div>
                <div className="text-3xl font-black text-gray-900 mb-1">{s.value}</div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full premium-gradient opacity-[0.04] blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-bold tracking-widest uppercase border border-primary-200">
              <Zap size={12} /> Tính năng
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900">
              Tính năng <span className="text-gradient">vượt trội</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Bộ công cụ toàn diện được thiết kế riêng cho hoạt động Đoàn – tiện ích, hiện đại và dễ sử dụng.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="feature-card bg-white rounded-3xl p-7 border border-gray-100 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={26} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto animate-gradient-bg rounded-3xl px-8 py-12 flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-primary-900/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />
          <div className="flex-1 text-white relative z-10">
            <p className="text-primary-200 text-sm font-bold uppercase tracking-widest mb-2">Tải ứng dụng ngay</p>
            <h3 className="text-3xl md:text-4xl font-black leading-tight mb-3">Trải nghiệm miễn phí<br />trên mọi thiết bị</h3>
            <p className="text-primary-100 opacity-80">Android & iOS — hoàn toàn miễn phí cho tất cả đoàn viên.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0">
            <button className="flex items-center gap-2 bg-white text-primary-700 px-6 py-3.5 rounded-2xl font-bold hover:bg-primary-50 transition shadow-lg">
              <Download size={18} /> App Store
            </button>
            <button className="flex items-center gap-2 bg-white/10 border border-white/30 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-white/20 transition">
              <Smartphone size={18} /> Google Play
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── NEWS ──────────────────────────────────────────────────── */}
      <section id="news" className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-300 opacity-[0.05] blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-bold tracking-widest uppercase border border-primary-200">
                <Newspaper size={12} /> Tin tức
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900">
                Tin tức & <span className="text-gradient">Sự kiện</span>
              </h2>
              <p className="text-gray-500 italic">Cập nhật những tin tức và hoạt động Đoàn mới nhất.</p>
            </motion.div>
            <button onClick={() => setCurrentPage('news')} className="flex items-center gap-1.5 text-primary-600 font-bold hover:gap-2.5 transition-all group text-sm">
              Xem tất cả <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {news.length > 0 ? news.map((item, i) => (
              <motion.div
                key={item._id || item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedNewsId(item._id || item.id)}
                className="news-card bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-primary-100/60 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col"
              >
                 <div className="aspect-[16/9] overflow-hidden bg-primary-50 relative">
                  {(item.bannerUrl || item.thumbnailUrl) ? (
                    <img
                      src={`${BASE_URL}${item.bannerUrl || item.thumbnailUrl}`}
                      alt={item.title}
                      className="news-img w-full h-full object-cover transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-200">
                      <Newspaper size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">{item.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-5 flex-1 leading-relaxed">{item.summary}</p>
                  <div className="flex items-center gap-1.5 text-primary-600 text-sm font-bold group-hover:gap-2.5 transition-all mt-auto w-fit">
                    Xem chi tiết <ChevronRight size={15} />
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-16 text-center text-gray-400 flex flex-col items-center gap-4">
                <Newspaper size={40} className="text-gray-200" />
                <p>Đang cập nhật tin tức...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── DOCUMENTS ─────────────────────────────────────────────── */}
      <section id="documents" className="py-24 px-6 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary-300 opacity-[0.05] blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-bold tracking-widest uppercase border border-primary-200">
                <FileText size={12} /> Tài liệu
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900">
                Tài liệu & <span className="text-gradient">Văn bản</span>
              </h2>
              <p className="text-gray-500 italic">Cập nhật các văn bản hướng dẫn và tài liệu mới nhất từ Liên chi đoàn.</p>
            </motion.div>
            <button onClick={() => setCurrentPage('documents')} className="flex items-center gap-1.5 text-primary-600 font-bold hover:gap-2.5 transition-all group text-sm">
              Xem tất cả <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {documents.length > 0 ? documents.map((doc, i) => (
              <motion.div
                key={doc._id || doc.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden flex flex-col"
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 premium-gradient" />
                <div className="w-12 h-12 premium-gradient rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <FileText size={22} className="text-white" />
                </div>
                <h4 className="font-bold text-gray-900 line-clamp-2 mb-1.5 text-sm leading-snug flex-1">{doc.title}</h4>
                <p className="text-xs text-gray-400 mb-4">{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</p>
                <a
                  href={`${BASE_URL}${doc.filePath || doc.fileUrl || ''}`}
                  onClick={(e) => { e.preventDefault(); handleDownloadDoc(`${BASE_URL}${doc.filePath || doc.fileUrl || ''}`); }}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors mt-auto w-fit group-hover:gap-2.5"
                >
                  <Download size={14} /> Tải tài liệu
                </a>
              </motion.div>
            )) : (
              <div className="col-span-full py-16 text-center text-gray-400 flex flex-col items-center gap-4">
                <FileText size={40} className="text-gray-200" />
                <p>Đang cập nhật tài liệu...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── REGISTER ──────────────────────────────────────────────── */}
      <section id="register" className="py-24 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 animate-gradient-bg" />
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="text-white space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 text-white rounded-full text-xs font-bold tracking-widest uppercase border border-white/20">
              <Star size={12} /> Tham gia ngay
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight">
              Gia nhập cộng đồng<br />Đoàn Viên ngay hôm nay!
            </h2>
            <p className="text-primary-100 text-lg opacity-90 leading-relaxed">
              Đăng ký tài khoản để trải nghiệm toàn bộ tiện ích. Thông tin sẽ được Liên chi đoàn phê duyệt trong 24h.
            </p>
            <div className="space-y-3.5 pt-2">
              {[
                'Tham gia các cuộc thi trực tuyến cực hấp dẫn',
                'Nắm bắt tin tức Đoàn mới nhất 24/7',
                'Thanh toán đoàn phí tiện lợi qua ví điện tử',
                'Quản lý hồ sơ đoàn viên thông minh',
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 shrink-0 bg-white/20 rounded-full flex items-center justify-center">
                    <ShieldCheck size={13} className="text-white" />
                  </div>
                  <span className="font-medium text-white/90">{t}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl shadow-primary-900/25 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 premium-gradient" />
              <h3 className="text-2xl font-black text-gray-900 mb-2">Đăng ký tài khoản</h3>
              <p className="text-sm text-gray-400 mb-7">Điền đầy đủ thông tin để bắt đầu!</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Họ và tên *</label>
                    <input required value={regForm.fullName} onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl outline-none transition text-sm"
                      placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tên đăng nhập *</label>
                    <input required value={regForm.username} onChange={e => setRegForm({ ...regForm, username: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl outline-none transition text-sm"
                      placeholder="nguyenvana" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Địa chỉ Email *</label>
                  <input required type="email" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl outline-none transition text-sm"
                    placeholder="a.nguyen@example.com" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mật khẩu *</label>
                    <input required type="password" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl outline-none transition text-sm"
                      placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Xác nhận MK *</label>
                    <input required type="password" value={regForm.confirmPassword} onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl outline-none transition text-sm"
                      placeholder="••••••••" />
                  </div>
                </div>

                {regStatus.msg && (
                  <div className={`p-3.5 rounded-xl text-sm font-medium flex items-center gap-2 ${regStatus.type === 'error' ? 'bg-red-50 text-red-600' : regStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-primary-50 text-primary-700'}`}>
                    {regStatus.msg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regStatus.type === 'loading'}
                  className="w-full py-4 premium-gradient text-white rounded-2xl font-black text-base btn-glow transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-primary-600/20"
                >
                  {regStatus.type === 'loading' ? 'Đang gửi...' : 'Xác nhận Đăng ký →'}
                </button>
                <p className="text-center text-xs text-gray-400">
                  Bằng việc đăng ký, bạn đồng ý với <span className="text-primary-600 font-semibold cursor-pointer hover:underline">điều khoản</span> của chúng tôi.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 text-gray-400 px-6 pt-14 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-gray-800">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 premium-gradient rounded-xl flex items-center justify-center text-white font-black text-lg">Đ</div>
                <span className="font-black text-xl text-white">App Đoàn Viên</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                Nền tảng số kết nối và quản lý đoàn viên thế hệ 4.0 — tiện ích, hiện đại và minh bạch.
              </p>
              <div className="flex gap-3">
                {['#1c42fd', '#3b5bfe', '#5c35f0'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition" style={{ background: c }} />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-white font-bold text-sm uppercase tracking-wider mb-4">Liên kết</p>
              {['Giới thiệu', 'Tính năng', 'Tin tức', 'Tài liệu', 'Đăng ký'].map(l => (
                <a key={l} href={`#${l === 'Giới thiệu' ? 'intro' : l.toLowerCase().replace(' ', '-')}`}
                  className="block text-sm hover:text-primary-400 transition">{l}</a>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-white font-bold text-sm uppercase tracking-wider mb-4">Liên hệ</p>
              <p className="text-sm">📧 doanvien@truong.edu.vn</p>
              <p className="text-sm">📞 (028) 1234 5678</p>
              <p className="text-sm">📍 TP. Hồ Chí Minh</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <span>© 2026 App Đoàn Viên. Tất cả quyền được bảo lưu.</span>
            <div className="flex items-center gap-1.5 text-primary-500 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Hệ thống đang hoạt động
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
