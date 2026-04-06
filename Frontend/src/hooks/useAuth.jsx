import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        // Không có cả 2 token → chưa đăng nhập
        if (!accessToken && !refreshToken) {
            setLoading(false);
            return;
        }

        authApi.getMe()
            .then(res => setUser(res.data.data))
            .catch(() => {
                localStorage.clear();
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async (username, password) => {
        const res = await authApi.login({ username, password });
        const { accessToken, refreshToken, ...userData } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(userData);
        return userData;
    };

    const logout = async () => {
        try { await authApi.logout(); } catch { }
        localStorage.clear();
        setUser(null);
    };

    const hasPermission = (permission) => {
        if (!user) return false;
        if (user.isSuperAdmin) return true;
        return user.permissions?.includes(permission);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            setUser, 
            login, 
            logout, 
            loading, 
            isAuthenticated: !!user,
            hasPermission,
            isSuperAdmin: user?.isSuperAdmin || false,
            scope: user?.scope || {}
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
