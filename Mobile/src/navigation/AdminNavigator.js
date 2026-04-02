import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { COLORS } from '../constants/colors';

// Admin Screens
import { AdminDashboardScreen } from '../screens/Admin/AdminDashboardScreen';
import { AdminAccountScreen } from '../screens/Admin/AdminAccountScreen';
import { MemberManagementScreen } from '../screens/Admin/MemberManagementScreen';
import { MeetingCreatorScreen } from '../screens/Admin/MeetingCreatorScreen';
import { AdminNewsScreen } from '../screens/Admin/AdminNewsScreen';
import { AdminStatisticsScreen } from '../screens/Admin/AdminStatisticsScreen';
import { AdminProfileScreen } from '../screens/Admin/AdminProfileScreen';
import { AdminAttendanceScreen } from '../screens/Admin/AdminAttendanceScreen';
import { AdminFeeManagementScreen } from '../screens/Admin/AdminFeeManagementScreen';

// Navigation Components
import { CustomHeader } from '../components/navigation/CustomHeader';
import { TabBar } from '../components/navigation/TabBar';

import { CellManagementScreen } from '../screens/Admin/CellManagementScreen';

export const AdminNavigator = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('admin_home');
    const [currentScreen, setCurrentScreen] = useState('main');
    const [routeParams, setRouteParams] = useState(null);

    const navigateTo = (screen, params = null) => {
        setRouteParams(params);
        setCurrentScreen(screen);
    };

    const goBack = () => {
        setRouteParams(null);
        setCurrentScreen('main');
    };

    const showBottomNav = currentScreen === 'main';

    const getTitle = () => {
        if (currentScreen === 'member_mgmt') return 'Quản lý Đoàn viên';
        if (currentScreen === 'cell_mgmt') return 'Quản lý Chi đoàn';
        if (currentScreen === 'meeting_create') return 'Tạo lịch sinh hoạt';
        if (currentScreen === 'attendance_mgmt') return 'Quản lý điểm danh';
        if (currentScreen === 'fee_mgmt') return 'Quản lý Đoàn phí';
        if (activeTab === 'admin_home') return 'Bảng điều khiển';
        if (activeTab === 'members') return 'Đoàn viên';
        if (activeTab === 'news_mgmt') return 'Quản lý Tin tức';
        if (activeTab === 'statistics') return 'Thống kê & Báo cáo';
        if (activeTab === 'admin_profile') return 'Hồ sơ Admin';
        return 'Quản trị';
    };

    const renderContent = () => {
        switch (currentScreen) {
            case 'member_mgmt': return <MemberManagementScreen />;
            case 'cell_mgmt': return <CellManagementScreen />;
            case 'meeting_create': return <MeetingCreatorScreen onBack={goBack} />;
            case 'attendance_mgmt': return <AdminAttendanceScreen onBack={goBack} />;
            case 'fee_mgmt': return <AdminFeeManagementScreen />;
            case 'main':
            default:
                switch (activeTab) {
                    case 'admin_home': return <AdminDashboardScreen onNavigate={navigateTo} />;
                    case 'members': return <MemberManagementScreen />;
                    case 'news_mgmt': return <AdminNewsScreen onNavigate={navigateTo} />;
                    case 'statistics': return <AdminStatisticsScreen />;
                    case 'admin_profile': return <AdminProfileScreen onLogout={onLogout} />;
                    default: return <AdminDashboardScreen onNavigate={navigateTo} />;
                }
        }
    };

    const adminTabs = [
        { id: 'admin_home', label: 'Tổng quan', icon: 'grid-outline' },
        { id: 'members', label: 'Đoàn viên', icon: 'people-outline' },
        { id: 'news_mgmt', label: 'Tin tức', icon: 'newspaper-outline' },
        { id: 'statistics', label: 'Thống kê', icon: 'bar-chart-outline' },
        { id: 'admin_profile', label: 'Cá nhân', icon: 'person-outline' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            <CustomHeader
                title={getTitle()}
                showBack={currentScreen !== 'main'}
                onBack={goBack}
                rightIcon={currentScreen === 'main' ? 'LogOut' : null}
                onRightPress={onLogout}
                roundedBottom={showBottomNav}
            />

            <View style={styles.content}>
                {renderContent()}
            </View>

            {showBottomNav && (
                <TabBar
                    tabs={adminTabs}
                    activeTab={activeTab}
                    onTabPress={setActiveTab}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    content: { flex: 1 },
});
