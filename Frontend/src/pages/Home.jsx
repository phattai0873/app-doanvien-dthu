import React from 'react';

const Home = () => {
    return (
        <main className="content">
            <section id="home" className="hero-section">
                <div className="hero-content">
                    <span className="badge">Giai đoạn 2024 - 2029</span>
                    <h1>Kết nối thanh niên <br /> <span className="text-highlight">Xây dựng tương lai</span></h1>
                    <p className="hero-desc">
                        Hệ thống quản lý và chăm sóc đoàn viên tinh giản.
                        Môi trường giao lưu, học tập và rèn luyện cho thanh niên thời đại số.
                    </p>
                    <div className="hero-btns">
                        <button className="btn-primary btn-lg">Tham gia ngay</button>
                        <button className="btn-secondary">Tìm hiểu thêm</button>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="circle-bg"></div>
                    <div className="mockup-card card glass fadeIn">
                        <h3>Hoạt động sắp tới</h3>
                        <p>Chiến dịch mùa hè xanh 2025</p>
                        <div className="progress-bar">
                            <div className="progress" style={{ width: '75%' }}></div>
                        </div>
                        <span className="status">Còn 5 ngày</span>
                    </div>
                </div>
            </section>

            <section id="features" className="features-grid">
                <div className="card">
                    <span className="icon">📂</span>
                    <h3>Quản lý hồ sơ</h3>
                    <p>Xử lý hồ sơ đoàn trực tuyến, nhanh chóng và bảo mật.</p>
                </div>
                <div className="card">
                    <span className="icon">🗞️</span>
                    <h3>Tin tức 24/7</h3>
                    <p>Cập nhật tin tức hoạt động đoàn ảnh hưởng nhất toàn quốc.</p>
                </div>
                <div className="card">
                    <span className="icon">💬</span>
                    <h3>Kết nối </h3>
                    <p>Tương tác, trao đổi ý tưởng cùng các CLB và nhóm tình nguyện.</p>
                </div>
            </section>
        </main>
    );
};

export default Home;
