import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';

// Screens
import { NewsDetailScreen } from '../screens/News/NewsDetailScreen';
import { EditProfileScreen } from '../screens/Profile/EditProfileScreen';
import { QRCardScreen } from '../screens/Profile/QRCardScreen';
import { SettingsScreen } from '../screens/Profile/SettingsScreen';
import { MemberInfoScreen } from '../screens/Profile/MemberInfoScreen';
import { OrgInfoScreen } from '../screens/Profile/OrgInfoScreen';
import { MeetingListScreen } from '../screens/Meeting/MeetingListScreen';
import { MeetingDetailScreen } from '../screens/Meeting/MeetingDetailScreen';
import { PartyFeeScreen } from '../screens/Finance/PartyFeeScreen';
import { ExamListScreen } from '../screens/Exam/ExamListScreen';
import { ExamDetailScreen } from '../screens/Exam/ExamDetailScreen';
import { DocumentListScreen } from '../screens/Document/DocumentListScreen';
import { DocumentDetailScreen } from '../screens/Document/DocumentDetailScreen';
import { VolunteerListScreen } from '../screens/Volunteer/VolunteerListScreen';
import { ActivityHistoryScreen } from '../screens/Volunteer/ActivityHistoryScreen';

// Admin screens
import { AdminDashboardScreen } from '../screens/Admin/AdminDashboardScreen';
import { MemberManagementScreen } from '../screens/Admin/MemberManagementScreen';
import { CellManagementScreen } from '../screens/Admin/CellManagementScreen';
import { MeetingCreatorScreen } from '../screens/Admin/MeetingCreatorScreen';
import { AdminAttendanceScreen } from '../screens/Admin/AdminAttendanceScreen';
import { AdminFeeManagementScreen } from '../screens/Admin/AdminFeeManagementScreen';
import { AdminNewsScreen } from '../screens/Admin/AdminNewsScreen';
import { AdminStatisticsScreen } from '../screens/Admin/AdminStatisticsScreen';
import { UpdateApprovalScreen } from '../screens/Admin/UpdateApprovalScreen';

const Stack = createNativeStackNavigator();

export const RootStackNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true, // Chuyển sang dùng Default Header như user yêu cầu
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen 
                name="MainTabs" 
                component={MainTabNavigator} 
                options={{ headerShown: false }} 
            />
            
            {/* News Module */}
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ title: 'Chi tiết tin tức' }} />
            
            {/* Profile Module */}
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Chỉnh sửa hồ sơ' }} />
            <Stack.Screen name="QRCard" component={QRCardScreen} options={{ title: 'Thẻ Đoàn viên điện tử' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Cài đặt' }} />
            <Stack.Screen name="MemberInfo" component={MemberInfoScreen} options={{ title: 'Thông tin Đoàn viên' }} />
            <Stack.Screen name="OrgInfo" component={OrgInfoScreen} options={{ title: 'Tổ chức Đoàn' }} />
            
            {/* Meeting Module */}
            <Stack.Screen name="MeetingList" component={MeetingListScreen} options={{ title: 'Sinh hoạt Chi đoàn' }} />
            <Stack.Screen name="MeetingDetail" component={MeetingDetailScreen} options={{ title: 'Chi tiết cuộc họp' }} />
            
            {/* Finance Module */}
            <Stack.Screen name="FeePayment" component={PartyFeeScreen} options={{ title: 'Đóng Đoàn phí' }} />
            
            {/* Exam Module */}
            <Stack.Screen name="ExamList" component={ExamListScreen} options={{ title: 'Thi đua & Trắc nghiệm' }} />
            <Stack.Screen name="ExamDetail" component={ExamDetailScreen} options={{ title: 'Làm bài thi' }} />
            
            {/* Document Module */}
            <Stack.Screen name="DocumentList" component={DocumentListScreen} options={{ title: 'Kho Văn bản' }} />
            <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} options={{ title: 'Chi tiết văn bản' }} />
            
            {/* Other Modules */}
            <Stack.Screen name="VolunteerList" component={VolunteerListScreen} options={{ title: 'Hoạt động Tình nguyện' }} />
            <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} options={{ title: 'Lịch sử hoạt động' }} />
            
            {/* Admin Screens */}
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Bảng Quản trị' }} />
            <Stack.Screen name="MemberMgmt" component={MemberManagementScreen} options={{ title: 'Quản lý Đoàn viên' }} />
            <Stack.Screen name="CellMgmt" component={CellManagementScreen} options={{ title: 'Quản lý Chi đoàn' }} />
            <Stack.Screen name="MeetingCreate" component={MeetingCreatorScreen} options={{ title: 'Tạo lịch sinh hoạt' }} />
            <Stack.Screen name="AttendanceMgmt" component={AdminAttendanceScreen} options={{ title: 'Quản lý điểm danh' }} />
            <Stack.Screen name="FeeMgmt" component={AdminFeeManagementScreen} options={{ title: 'Quản lý Đoàn phí' }} />
            <Stack.Screen name="NewsMgmt" component={AdminNewsScreen} options={{ title: 'Quản lý Tin tức' }} />
            <Stack.Screen name="StatisticsMgmt" component={AdminStatisticsScreen} options={{ title: 'Thống kê & Báo cáo' }} />
            <Stack.Screen name="UpdateApproval" component={UpdateApprovalScreen} options={{ title: 'Duyệt cập nhật hồ sơ' }} />
        </Stack.Navigator>
    );
};
