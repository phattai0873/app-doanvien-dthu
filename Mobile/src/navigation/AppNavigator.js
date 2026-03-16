import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import CompleteProfileScreen from '../screens/Auth/CompleteProfileScreen';
import { MainNavigator } from './MainTabsNavigator';
import { AdminNavigator } from './AdminNavigator';
import { COLORS } from '../constants';
import { authService } from '../services/authService';
import { partyService } from '../services/partyService';

export const AppNavigator = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [hasProfile, setHasProfile] = useState(true); // Mặc định là có để tránh nháy màn hình
    const [userRole, setUserRole] = useState('user');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        setIsLoading(true);
        try {
            const user = await authService.getCurrentUser();
            if (user) {
                const realUser = user.data || user;
                
                let role = 'user';
                if (realUser.Roles && Array.isArray(realUser.Roles) && realUser.Roles.length > 0) {
                    role = realUser.Roles[0].code || realUser.Roles[0].name || 'user';
                } else if (realUser.role) {
                    role = realUser.role;
                }
                
                // Kiểm tra xem đã có hồ sơ đoàn viên chưa (GET /api/members/me)
                const profile = await partyService.getMyMemberProfile();
                
                setUserRole(role);
                setIsLoggedIn(true);
                setHasProfile(!!profile);
            } else {
                setIsLoggedIn(false);
                setUserRole('user');
                setHasProfile(false);
            }
        } catch (error) {
            console.log('Auth check error:', error);
            setIsLoggedIn(false);
            setHasProfile(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (userData) => {
        // Sau khi login, check lại toàn bộ thông tin
        await checkAuth();
    };

    const handleLogout = async () => {
        await authService.logout();
        setIsLoggedIn(false);
        setUserRole('user');
        setHasProfile(false);
    };

    const handleProfileComplete = () => {
        setHasProfile(true);
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

    // Nếu đã login nhưng chưa có hồ sơ
    if (!hasProfile) {
        return <CompleteProfileScreen onSuccess={handleProfileComplete} onLogout={handleLogout} />;
    }

    // Role-based routing
    if (userRole && ['SUPER_ADMIN', 'BRANCH_ADMIN', 'CELL_ADMIN'].includes(userRole)) {
        return <AdminNavigator onLogout={handleLogout} />;
    }

    return <MainNavigator onLogout={handleLogout} />;
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
