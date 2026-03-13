import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import LoginScreen from '../screens/Auth/LoginScreen';
import { MainNavigator } from './MainTabsNavigator';
import { AdminNavigator } from './AdminNavigator'; // Assuming AdminNavigator exists
import { COLORS } from '../constants';
import { authService } from '../services/authService';

export const AppNavigator = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState('user'); // Default to member role
    const [isLoading, setIsLoading] = useState(true); // Changed to true to show loading on initial check

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        setIsLoading(true);
        try {
            const user = await authService.getCurrentUser();
            if (user) {
                // Backend /me trả về { id, username, Roles: [{code:'admin'}], ... }
                // Hoặc có thể bọc thêm một lầy nữa trong data
                const realUser = user.data || user;
                
                // Trích xuất role từ mảng Roles của Sequelize (Many-to-Many)
                let role = 'user';
                if (realUser.Roles && Array.isArray(realUser.Roles) && realUser.Roles.length > 0) {
                    // Role code có thể là 'admin', 'secretary', 'member', 'user' ...
                    role = realUser.Roles[0].code || realUser.Roles[0].name || 'user';
                } else if (realUser.role) {
                    role = realUser.role;
                }
                
                setUserRole(role);
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
                setUserRole('user');
            }
        } catch (error) {
            console.log('Auth check error:', error);
            setIsLoggedIn(false);
            setUserRole('user');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (userData) => {
        if (userData) {
            // Dùng dữ liệu trực tiếp từ lún API đăng nhập
            // userData = { token, user: { id, username }, role }
            const role = userData.role || 'user';
            setUserRole(role);
            setIsLoggedIn(true);
        } else {
            await checkAuth();
        }
    };

    const handleLogout = async () => {
        await authService.logout(); // This function needs to be implemented in authService
        setIsLoggedIn(false);
        setUserRole('user'); // Reset role on logout
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!isLoggedIn) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    // Role-based routing (code trong DB là chữ hoa: ADMIN, SECRETARY, MEMBER)
    if (userRole && ['admin', 'ADMIN', 'secretary', 'SECRETARY'].includes(userRole)) {
        return <AdminNavigator onLogout={handleLogout} />;
    }

    return <MainNavigator onLogout={handleLogout} />;
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
