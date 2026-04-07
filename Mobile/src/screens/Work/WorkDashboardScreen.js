import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    ActivityIndicator, 
    TouchableOpacity, 
    Dimensions,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkCard } from '../../components/cards/WorkCard';
import { COLORS, SIZES } from '../../constants';
import { workService } from '../../services/workService';
import CommonHeader from '../../components/CommonHeader';

// Load old PNG icons
const ICON_SET = {
    tintuc: require('../../../assets/iconset/tintuc.png'),
    hoctap: require('../../../assets/iconset/hoctap.png'),
    sinhhoat: require('../../../assets/iconset/sinhhoat.png'),
    doanphi: require('../../../assets/iconset/doanphi.png'),
    thidua: require('../../../assets/iconset/thidua.png'),
    vanban: require('../../../assets/iconset/vanban.png'),
    tinhnguyen: require('../../../assets/iconset/tinhnguyen.png'),
    canhan: require('../../../assets/iconset/canhan.png'),
};

const { width } = Dimensions.get('window');

export const WorkDashboardScreen = ({ navigation }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const data = await workService.getWorkSummary();
            setSummary(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const navigateTo = (screen) => {
        const routeMap = {
            'meeting_list': 'MeetingList',
            'fee_payment': 'FeePayment',
            'exam_list': 'ExamList',
            'document_list': 'DocumentList',
            'theory_study': 'TheoryStudy',
            'volunteer_list': 'VolunteerList'
        };
        const targetRoute = routeMap[screen] || screen;
        navigation.navigate(targetRoute);
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CommonHeader title="Công tác đoàn" />
            
            <ScrollView 
                style={styles.scrollContainer} 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary Section */}
                <View style={styles.summaryRow}>
                    <TouchableOpacity
                        style={styles.summaryCard}
                        onPress={() => navigateTo('meeting_list')}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={COLORS.gradientPrimary}
                            style={styles.summaryGradient}
                        >
                            <Ionicons name="calendar-outline" size={32} color={COLORS.white} />
                            <View style={styles.summaryTextContent}>
                                <Text style={styles.summaryLabelLight}>Họp Chi đoàn</Text>
                                <Text style={styles.summaryValueLight}>{summary?.next_meeting || 'Chưa lịch'}</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.summaryCard}
                        onPress={() => navigateTo('fee_payment')}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#FFFFFF', '#F8FAFC']}
                            style={styles.summaryGradientWhite}
                        >
                            <Ionicons name="wallet-outline" size={32} color={COLORS.primary} />
                            <View style={styles.summaryTextContent}>
                                <Text style={styles.summaryLabelDark}>Đoàn phí</Text>
                                <Text style={styles.summaryValueBlue}>{summary?.unpaid_fee || '0đ'}</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Main Tasks Section */}
                <Text style={styles.sectionHeader}>Nhiệm vụ trọng tâm</Text>

                <View style={styles.gridContainer}>
                    <View style={styles.gridRow}>
                        <WorkCard
                            isPng={true}
                            pngIcon={ICON_SET.sinhhoat}
                            title="Sinh hoạt Chi đoàn"
                            desc="Điểm danh & Tài liệu"
                            onPress={() => navigateTo('meeting_list')}
                        />
                        <WorkCard
                            isPng={true}
                            pngIcon={ICON_SET.doanphi}
                            title="Đóng Đoàn phí"
                            desc="Thanh toán trực tuyến"
                            onPress={() => navigateTo('fee_payment')}
                        />
                    </View>
                    <View style={styles.gridRow}>
                        <WorkCard
                            isPng={true}
                            pngIcon={ICON_SET.thidua}
                            title="Thi đua trắc nghiệm"
                            desc="Cuộc thi định kỳ"
                            onPress={() => navigateTo('exam_list')}
                        />
                        <WorkCard
                            isPng={true}
                            pngIcon={ICON_SET.vanban}
                            title="Kho tài liệu"
                            desc="Văn kiện & Nghị quyết"
                            onPress={() => navigateTo('document_list')}
                        />
                    </View>
                    <View style={styles.gridRow}>
                        <WorkCard
                            isPng={true}
                            pngIcon={ICON_SET.hoctap}
                            title="Học tập lý luận"
                            desc="Lớp bồi dưỡng chính trị"
                            onPress={() => navigateTo('theory_study')}
                        />
                        <WorkCard
                            isPng={true}
                            pngIcon={ICON_SET.tinhnguyen}
                            title="Hoạt động tình nguyện"
                            desc="Cộng đồng & Xã hội"
                            onPress={() => navigateTo('volunteer_list')}
                        />
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContainer: { flex: 1 },
    scrollContent: { padding: SIZES.md },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    summaryRow: { 
        flexDirection: 'row', 
        gap: 12, 
        marginBottom: SIZES.lg 
    },
    summaryCard: { 
        flex: 1, 
        height: 120,
        borderRadius: 24,
        overflow: 'hidden',
        ...COLORS.shadowDark,
    },
    summaryGradient: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    summaryGradientWhite: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    summaryTextContent: {
        marginTop: 8,
    },
    summaryLabelLight: { 
        color: 'rgba(255,255,255,0.7)', 
        fontSize: 12, 
        fontWeight: '700' 
    },
    summaryValueLight: { 
        color: COLORS.white, 
        fontSize: 18, 
        fontWeight: '900',
        marginTop: 2 
    },
    summaryLabelDark: { 
        color: COLORS.gray500, 
        fontSize: 12, 
        fontWeight: '700' 
    },
    summaryValueBlue: { 
        color: COLORS.primary, 
        fontSize: 18, 
        fontWeight: '900',
        marginTop: 2 
    },
    
    sectionHeader: {
        fontSize: 18, 
        fontWeight: '900', 
        color: COLORS.gray900, 
        marginBottom: 16,
        paddingLeft: 4
    },
    gridContainer: { 
        gap: 12 
    },
    gridRow: { 
        flexDirection: 'row', 
        gap: 12 
    },
});
