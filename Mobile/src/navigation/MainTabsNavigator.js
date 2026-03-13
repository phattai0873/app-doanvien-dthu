import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

// Screens
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { NewsFeedScreen } from '../screens/News/NewsFeedScreen';
import { WorkDashboardScreen } from '../screens/Work/WorkDashboardScreen';
import { CongTacDoanScreen } from '../screens/CongTacDoan/CongTacDoanScreen';
import { NotificationScreen } from '../screens/Notification/NotificationScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { MemberInfoScreen } from '../screens/Profile/MemberInfoScreen';
import { OrgInfoScreen } from '../screens/Profile/OrgInfoScreen';

// New Module Screens
import { MeetingListScreen } from '../screens/Meeting/MeetingListScreen';
import { MeetingDetailScreen } from '../screens/Meeting/MeetingDetailScreen';
import { PartyFeeScreen } from '../screens/Finance/PartyFeeScreen';
import { ExamListScreen } from '../screens/Exam/ExamListScreen';
import { ExamDetailScreen } from '../screens/Exam/ExamDetailScreen';
import { DocumentListScreen } from '../screens/Document/DocumentListScreen';
import { PoliticalTheoryScreen } from '../screens/Theory/PoliticalTheoryScreen';
import { VolunteerListScreen } from '../screens/Volunteer/VolunteerListScreen';

// Navigation Components
import { CustomHeader } from '../components/navigation/CustomHeader';
import { SideDrawer } from '../components/navigation/SideDrawer';
import { HomeFAB } from '../components/common/HomeFAB';

export const MainNavigator = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [currentScreen, setCurrentScreen] = useState('main');
    const [routeParams, setRouteParams] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const navigateTo = (screen, params = null) => {
        setRouteParams(params);

        // If the screen is one of the main drawer categories, update activeTab
        const mainTabs = [
            'dashboard', 'news', 'work', 'notif', 'profile',
            'meeting_list', 'exam_list', 'document_list',
            'theory_study', 'fee_payment', 'volunteer_list'
        ];
        if (mainTabs.includes(screen)) {
            setActiveTab(screen);
            setCurrentScreen('main');
        } else {
            setCurrentScreen(screen);
        }
    };

    const goBack = () => {
        setRouteParams(null);
        setCurrentScreen('main');
    };

    const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

    const getTitle = () => {
        if (currentScreen === 'member_info') return 'Thông tin Đoàn viên';
        if (currentScreen === 'org_info') return 'Tổ chức Đoàn';
        if (currentScreen === 'meeting_list') return 'Sinh hoạt Chi đoàn';
        if (currentScreen === 'meeting_detail') return 'Chi tiết cuộc họp';
        if (currentScreen === 'fee_payment') return 'Đóng Đoàn phí';
        if (currentScreen === 'exam_list') return 'Thi đua & Trắc nghiệm';
        if (currentScreen === 'exam_detail') return 'Làm bài thi';
        if (currentScreen === 'document_list') return 'Kho Văn bản';
        if (currentScreen === 'theory_study') return 'Học tập Lý luận';
        if (currentScreen === 'volunteer_list') return 'Hoạt động Tình nguyện';

        if (activeTab === 'dashboard') return 'Bảng điều khiển';
        if (activeTab === 'news') return 'Bản tin Thanh niên';
        if (activeTab === 'work') return 'Công tác Đoàn';
        if (activeTab === 'notif') return 'Thông báo';
        if (activeTab === 'profile') return 'Cá nhân';
        if (activeTab === 'meeting_list') return 'Sinh hoạt Chi đoàn';
        if (activeTab === 'exam_list') return 'Thi đua & Trắc nghiệm';
        if (activeTab === 'document_list') return 'Kho Văn bản';
        if (activeTab === 'theory_study') return 'Học tập Lý luận';
        if (activeTab === 'fee_payment') return 'Đóng Đoàn phí';
        if (activeTab === 'volunteer_list') return 'Hoạt động Tình nguyện';

        return 'App';
    };

    const renderContent = () => {
        const route = { params: routeParams };

        switch (currentScreen) {
            case 'member_info': return <MemberInfoScreen />;
            case 'org_info': return <OrgInfoScreen />;
            case 'meeting_list': return <MeetingListScreen onNavigate={navigateTo} />;
            case 'meeting_detail': return <MeetingDetailScreen route={route} onNavigate={navigateTo} />;
            case 'fee_payment': return <PartyFeeScreen />;
            case 'exam_list': return <ExamListScreen onNavigate={navigateTo} />;
            case 'exam_detail': return <ExamDetailScreen route={route} goBack={goBack} />;
            case 'document_list': return <DocumentListScreen onNavigate={navigateTo} />;
            case 'theory_study': return <PoliticalTheoryScreen />;
            case 'volunteer_list': return <VolunteerListScreen />;
            case 'main':
            default:
                switch (activeTab) {
                    case 'dashboard': return <DashboardScreen onNavigate={navigateTo} />;
                    case 'news': return <NewsFeedScreen />;
                    case 'work': return <CongTacDoanScreen onNavigate={navigateTo} />;
                    case 'notif': return <NotificationScreen />;
                    case 'profile': return <ProfileScreen onNavigate={navigateTo} onLogout={onLogout} />;
                    case 'meeting_list': return <MeetingListScreen onNavigate={navigateTo} />;
                    case 'exam_list': return <ExamListScreen onNavigate={navigateTo} />;
                    case 'document_list': return <DocumentListScreen onNavigate={navigateTo} />;
                    default: return <DashboardScreen onNavigate={navigateTo} />;
                }
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <CustomHeader
                title={getTitle()}
                showBack={currentScreen !== 'main'}
                onBack={goBack}
                leftIcon={currentScreen === 'main' ? 'Menu' : null}
                onLeftPress={toggleDrawer}
                rightIcon={activeTab === 'profile' ? 'Settings' : null}
                roundedBottom={true}
            />

            <View style={styles.content}>
                {renderContent()}
            </View>

            {(activeTab !== 'dashboard' || currentScreen !== 'main') && (
                <HomeFAB onPress={() => navigateTo('dashboard')} />
            )}

            <SideDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onNavigate={navigateTo}
                activeTab={activeTab}
                onLogout={onLogout}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { flex: 1 },
});
