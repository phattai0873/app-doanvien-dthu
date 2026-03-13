import React from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  ShieldCheck, 
  Zap, 
  Users, 
  FileText, 
  Smartphone,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { landingApi } from './services/api';

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 my-4 rounded-2xl border border-white/20">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 premium-gradient rounded-lg flex items-center justify-center text-white font-bold">D</div>
        <span className="font-bold text-xl tracking-tight text-gray-800">App Đoàn Viên</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
        <a href="#intro" className="hover:text-primary-600 transition">Giới thiệu</a>
        <a href="#features" className="hover:text-primary-600 transition">Tính năng</a>
        <a href="#documents" className="hover:text-primary-600 transition">Tài liệu</a>
        <a href="#register" className="bg-primary-700 text-white px-5 py-2.5 rounded-full hover:bg-primary-800 transition shadow-lg shadow-primary-200">Đăng ký ngay</a>
      </div>
      <button className="md:hidden text-gray-600 transition-transform active:scale-95"><Menu size={24} /></button>
    </div>
  </nav>
);

function App() {
  const [config, setConfig] = React.useState(null);
  const [documents, setDocuments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  // Registration form state
  const [regForm, setRegForm] = React.useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [regStatus, setRegStatus] = React.useState({ type: '', msg: '' });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, docsRes] = await Promise.all([
          landingApi.getConfig(),
          landingApi.getDocuments({ limit: 4 })
        ]);
        setConfig(configRes.data.data);
        setDocuments(docsRes.data.data || []);
      } catch (error) {
        console.error("Error fetching landing data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) {
      return setRegStatus({ type: 'error', msg: 'Mật khẩu xác nhận không khớp!' });
    }
    setRegStatus({ type: 'loading', msg: 'Đang xử lý...' });
    try {
      await landingApi.register({
        fullName: regForm.fullName,
        username: regForm.username,
        email: regForm.email,
        password: regForm.password
      });
      setRegStatus({ type: 'success', msg: 'Đăng ký thành công! Vui lòng chờ phê duyệt.' });
      setRegForm({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      setRegStatus({ type: 'error', msg: error.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.' });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Đang tải...</p>
      </div>
    </div>
  );

  const hero = config?.hero_section || {
    title: 'Kết nối Đoàn Viên Trong tầm tay bạn',
    subtitle: 'Ứng dụng Quản lý Đoàn viên 4.0',
    description: 'Nền tảng hiện đại giúp quản lý, tương tác và nắm bắt các thông tin Đoàn một cách nhanh chóng, hiệu quả và minh bạch nhất.'
  };

  return (
    <div className="min-h-screen font-sans selection:bg-primary-100 selection:text-primary-900 leading-normal tracking-normal overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section id="intro" className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-xs font-bold tracking-wide uppercase">
              <Zap size={14} /> {hero.subtitle}
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1]">
              {hero.title.split(' ').map((word, i) => 
                (word === 'Đoàn' || word === 'Viên') ? <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-primary-700 to-primary-500">{word} </span> : word + ' '
              )}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              {hero.description}
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl hover:bg-black transition shadow-xl font-bold">
                <Download size={20} /> Tải trên App Store
              </button>
              <button className="flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-2xl border-2 border-gray-100 hover:border-primary-200 transition shadow-sm font-bold">
                <Smartphone size={20} /> Google Play
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 w-full max-w-[320px] mx-auto aspect-[9/19] bg-gray-900 rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden p-2">
              <div className="w-full h-full bg-primary-50 rounded-[2.2rem] flex items-center justify-center p-6 text-center">
                <div className="space-y-4">
                    <div className="w-20 h-20 premium-gradient rounded-3xl mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-xl">D</div>
                    <div className="space-y-2">
                        <div className="h-2 w-24 bg-gray-200 rounded-full mx-auto"></div>
                        <div className="h-2 w-16 bg-gray-100 rounded-full mx-auto"></div>
                    </div>
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary-400 rounded-full blur-[100px] opacity-20 -z-0"></div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white border-y border-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
                { label: 'Đoàn Viên', value: '10,000+' },
                { label: 'Chi Đoàn', value: '500+' },
                { label: 'Hoạt động', value: '1,200+' },
                { label: 'Tin tức/ngày', value: '20+' },
            ].map((stat, i) => (
                <div key={i} className="text-center">
                    <div className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</div>
                </div>
            ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Tính năng vượt trội</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Chúng tôi cung cấp các công cụ hiện đại nhất để phục vụ công tác Đoàn.</p>
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { icon: ShieldCheck, title: 'Bảo mật tuyệt đối', desc: 'Dữ liệu đoàn viên được mã hóa và bảo mật theo tiêu chuẩn cao nhất.' },
                { icon: Zap, title: 'Xử lý thần tốc', desc: 'Tra cứu thông tin, nộp đoàn phí và đăng ký hoạt động chỉ với 1 chạm.' },
                { icon: Users, title: 'Gắn kết cộng đồng', desc: 'Hệ thống chat, bảng tin và bình luận giúp kết nối mọi đoàn viên.' },
            ].map((feat, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-xl hover:shadow-primary-50/50 transition-all duration-300 group">
                    <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                        <feat.icon size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feat.title}</h3>
                    <p className="text-gray-500 leading-relaxed text-sm">{feat.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Documents Section */}
      <section id="documents" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Tài liệu & Văn bản</h2>
                    <p className="text-gray-500 italic">Cập nhật các văn bản hướng dẫn và tài liệu mới nhất.</p>
                </div>
                <button className="text-primary-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    Xem tất cả <ChevronRight size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {documents.length > 0 ? documents.map((doc) => (
                    <div key={doc.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all border-l-4 border-l-primary-500">
                        <FileText className="text-primary-600 mb-4" size={32} />
                        <h4 className="font-bold text-gray-900 line-clamp-2 mb-2 min-h-[3rem] italic">{doc.title}</h4>
                        <p className="text-xs text-gray-400 mb-4">{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</p>
                        <a 
                            href={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}${doc.fileUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block text-sm font-bold text-primary-700 hover:underline"
                        >
                            Tải tài liệu
                        </a>
                    </div>
                )) : (
                    <div className="col-span-full py-10 text-center text-gray-400">Đang cập nhật tài liệu...</div>
                )}
            </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="register" className="py-24 px-6 premium-gradient relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="text-white space-y-6">
                <h2 className="text-4xl font-extrabold leading-tight">Gia nhập cộng đồng <br /> Đoàn Viên ngay hôm nay!</h2>
                <p className="text-primary-50 text-lg opacity-90 leading-relaxed">
                    Đăng ký tài khoản để trải nghiệm toàn bộ tiện ích của ứng dụng. Thông tin của bạn sẽ được Liên chi đoàn phê duyệt trong vòng 24h.
                </p>
                <div className="space-y-4">
                    {[
                        'Tham gia các cuộc thi trực tuyến cực hấp dẫn',
                        'Nắm bắt tin tức Đoàn mới nhất 24/7',
                        'Thanh toán đoàn phí tiện lợi qua ví điện tử',
                        'Quản lý hồ sơ đoàn viên thông minh'
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                <ShieldCheck size={14} className="text-white" />
                            </div>
                            <span className="font-medium text-white">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl relative">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Form đăng ký nhanh</h3>
                <form onSubmit={handleRegister} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase">Họ và tên</label>
                            <input 
                                required
                                value={regForm.fullName}
                                onChange={e => setRegForm({...regForm, fullName: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-500 rounded-xl outline-none transition" 
                                placeholder="VD: Nguyễn Văn A"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase">Tên đăng nhập</label>
                            <input 
                                required
                                value={regForm.username}
                                onChange={e => setRegForm({...regForm, username: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-500 rounded-xl outline-none transition" 
                                placeholder="VD: nguyenvana"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase">Địa chỉ Email</label>
                        <input 
                            required
                            type="email"
                            value={regForm.email}
                            onChange={e => setRegForm({...regForm, email: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-500 rounded-xl outline-none transition" 
                            placeholder="VD: a.nguyen@example.com"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase">Mật khẩu</label>
                            <input 
                                required
                                type="password"
                                value={regForm.password}
                                onChange={e => setRegForm({...regForm, password: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-500 rounded-xl outline-none transition" 
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase">Xác nhận mật khẩu</label>
                            <input 
                                required
                                type="password"
                                value={regForm.confirmPassword}
                                onChange={e => setRegForm({...regForm, confirmPassword: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-500 rounded-xl outline-none transition" 
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {regStatus.msg && (
                        <div className={`p-4 rounded-xl text-sm font-medium ${regStatus.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {regStatus.msg}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={regStatus.type === 'loading'}
                        className="w-full py-4 bg-primary-700 hover:bg-primary-800 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-700/20 transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                        {regStatus.type === 'loading' ? 'Đang gửi...' : 'Xác nhận Đăng ký'}
                    </button>
                    <p className="text-center text-xs text-gray-400">Bằng việc đăng ký, bạn đồng ý với các điều khoản của chúng tôi.</p>
                </form>
            </div>
        </div>
      </section>

      <footer className="py-12 bg-gray-900 text-gray-400 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 premium-gradient rounded-lg flex items-center justify-center text-white font-bold text-sm">D</div>
                <span className="font-bold text-white tracking-tight uppercase text-sm">App Đoàn Viên</span>
            </div>
            <div className="text-sm">© 2026 App Đoàn Viên. Tất cả quyền được bảo lưu.</div>
        </div>
      </footer>
    </div>
  );
}

export default App;
