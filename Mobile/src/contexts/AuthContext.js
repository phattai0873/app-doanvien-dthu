import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import { partyService } from '../services/partyService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasProfile, setHasProfile] = useState(false);

    const checkAuth = async () => {
        try {
            const userData = await authService.getCurrentUser();
            if (userData) {
                // userData đã được format từ authService.getCurrentUser()
                // { ...response.data, role }
                const profile = await partyService.getMyMemberProfile();
                
                setUser(userData);
                setIsLoggedIn(true);
                setHasProfile(!!profile);
            } else {
                setUser(null);
                setIsLoggedIn(false);
                setHasProfile(false);
            }
        } catch (error) {
            console.log('Auth check error:', error);
            setUser(null);
            setIsLoggedIn(false);
            setHasProfile(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (username, password) => {
        const result = await authService.login(username, password);
        await checkAuth();
        return result;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setIsLoggedIn(false);
        setHasProfile(false);
    };

    const refreshProfile = async () => {
        const profile = await partyService.getMyMemberProfile();
        setHasProfile(!!profile);
    };

    /**
     * @description Kiểm tra quyền hạn của người dùng (Permissions-based)
     * @param {string} permissionCode Mã code của quyền (ví dụ: 'member:read')
     */
    const hasPermission = (permissionCode) => {
        if (!user) return false;
        
        // Super Admin bypass
        if (user?.isSuperAdmin) return true;

        // Trích xuất list quyền từ Roles
        const permissions = [];
        if (user?.Roles && Array.isArray(user?.Roles)) {
            user?.Roles.forEach(role => {
                if (role?.Permissions && Array.isArray(role?.Permissions)) {
                    role?.Permissions.forEach(p => {
                        if (p?.code && !permissions.includes(p?.code)) {
                            permissions.push(p?.code);
                        }
                    });
                }
            });
        }

        return permissions.includes(permissionCode);
    };

    /**
     * @description Kiểm tra xem user có bất kỳ quyền nào trong list không
     */
    const hasAnyPermission = (permissionCodes) => {
        return permissionCodes.some(code => hasPermission(code));
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn,
            isLoading,
            hasProfile,
            login,
            logout,
            checkAuth,
            refreshProfile,
            hasPermission,
            hasAnyPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
