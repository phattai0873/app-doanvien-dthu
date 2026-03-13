import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar glass">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">🇻🇳</span>
                    <span className="logo-text">Đoàn Viên App</span>
                </Link>
                <ul className="navbar-links">
                    <li><Link to="/">Trang chủ</Link></li>
                    <li><Link to="/activities">Hoạt động</Link></li>
                    <li><Link to="/news">Tin tức</Link></li>
                    <li><Link to="/profile">Hồ sơ</Link></li>
                </ul>
                <div className="navbar-actions">
                    <button className="btn-primary">Đăng nhập</button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
