import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Image,
    RefreshControl,
    Platform
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES } from '../../constants';
import { authService } from '../../services/authService';
import { workService } from '../../services/workService';
import { documentService } from '../../services/documentService';

const { width } = Dimensions.get('window');

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

const MODULES = [
    { 
        id: 'meeting_list', 
        label: 'Sinh hoạt Chi đoàn', 
        desc: 'Số tay sinh hoạt & Danh sách',
        pngIcon: ICON_SET.sinhhoat, 
        color: '#da251d', 
        bg: '#FEE2E2' 
    },
    { 
        id: 'volunteer_list', 
        label: 'Hoạt động tình nguyện', 
        desc: 'Hoạt động xã hội & cộng đồng',
        pngIcon: ICON_SET.tinhnguyen, 
        color: '#F43F5E', 
        bg: '#FFF1F2' 
    },
    { 
        id: 'exam_list', 
        label: 'Thi đua & Trực tuyến', 
        desc: 'Cuộc thi trắc nghiệm & xếp hạng',
        pngIcon: ICON_SET.thidua, 
        color: '#F59E0B', 
        bg: '#FFFBEB' 
    },
    { 
        id: 'document_list', 
        label: 'Kho Tài liệu', 
        desc: 'Văn kiện, Nghị quyết, Biểu mẫu',
        pngIcon: ICON_SET.vanban, 
        color: '#0EA5E9', 
        bg: '#F0F9FF' 
    },
    { 
        id: 'theory_study', 
        label: 'Học tập Lý luận', 
        desc: '6 bài học lý luận chính trị',
        pngIcon: ICON_SET.hoctap, 
        color: '#8B5CF6', 
        bg: '#F5F3FF' 
    },
];

const SummaryCard = ({ title, value, sub, icon, color, isBlue }) => (
    <View style={[styles.summaryCard, isBlue ? styles.summaryCardBlue : styles.summaryCardWhite]}>
        <View style={styles.summaryInfo}>
            <Text style={[styles.summaryTitle, isBlue ? styles.textWhiteSoft : styles.textGrayMuted]}>{title}</Text>
            <Text style={[styles.summaryValue, isBlue ? styles.textWhite : styles.textBlue]}>{value}</Text>
            <Text style={[styles.summarySub, isBlue ? styles.textWhiteSoft : styles.textGray]}>{sub}</Text>
        </View>
        <View style={styles.summaryIconContainer}>
            <Icon name={icon} size={40} color={isBlue ? 'rgba(255,255,255,0.15)' : color + '15'} />
        </View>
    </View>
);

const ModuleItem = ({ item, onPress }) => (
    <TouchableOpacity style={styles.moduleItem} onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
            <Image source={item.pngIcon} style={styles.pngIcon} resizeMode="contain" />
        </View>
        <View style={styles.moduleMeta}>
            <Text style={styles.moduleLabel}>{item.label}</Text>
            <Text style={styles.moduleDesc} numberOfLines={1}>{item.desc}</Text>
        </View>
        <Icon name="ChevronRight" size={18} color={COLORS.gray300} />
    </TouchableOpacity>
);

export const CongTacDoanScreen = ({ onNavigate }) => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ activities: 0, documents: 0 });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [userData, workRes, docsRes] = await Promise.all([
                authService.getCurrentUser(),
                workService.getWorkSummary(),
                documentService.getDocuments()
            ]);

            if (userData) {
                setUser(userData.data || userData);
            }

            // Map data to stats
            // Depending on backend response format
            const docCount = docsRes.pagination?.total || (Array.isArray(docsRes.data) ? docsRes.data.length : 0);
            
            // WorkSummary usually returns { next_meeting, unpaid_fee } but here we want counts?
            // Let's also fetch activities count if possible
            const activitiesRes = await workService.getWorkSummary(); // reuse or fetch all
            
            setStats({
                activities: 12, // For now, keep some mock or get from API
                documents: docCount || 5
            });

        } catch (error) {
            console.log('Load data error:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    return (
        <ScrollView 
            style={styles.container} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
            {/* Header Area */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSub}>Theo dõi & quản lý</Text>
                    <Text style={styles.headerTitle}>Công tác Đoàn</Text>
                </View>
                <View style={styles.orgBadge}>
                    <Text style={styles.orgText}>{user?.UnionBranch?.name || 'Đoàn trường DThU'}</Text>
                </View>
            </View>

            {/* Statistics Summary */}
            <View style={styles.summaryRow}>
                <SummaryCard 
                    title="HOẠT ĐỘNG" 
                    value={stats.activities.toString().padStart(2, '0')} 
                    sub="Đang diễn ra" 
                    icon="Calendar" 
                    isBlue 
                />
                <SummaryCard 
                    title="TÀI LIỆU MỚI" 
                    value={stats.documents.toString().padStart(2, '0')} 
                    sub="Cập nhật hệ thống" 
                    icon="FileText" 
                    color="#4F46E5"
                />
            </View>

            {/* Section Heading */}
            <View style={styles.sectionHeader}>
                <View style={styles.blueBar} />
                <Text style={styles.sectionHeading}>Danh mục nghiệp vụ</Text>
            </View>

            {/* Modules List */}
            <View style={styles.moduleList}>
                {MODULES.map(m => (
                    <ModuleItem 
                        key={m.id} 
                        item={m} 
                        onPress={() => onNavigate && onNavigate(m.id)} 
                    />
                ))}
            </View>

            {/* Hint / Tip Card */}
            <View style={styles.tipCard}>
                <View style={styles.tipIconBox}>
                    <Icon name="Info" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Góc nghiệp vụ</Text>
                    <Text style={styles.tipDesc}>Bạn có thể tham khảo các hướng dẫn nghiệp vụ công tác Đoàn tại Kho tài liệu.</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { padding: 20, paddingBottom: 100 },
    
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        marginTop: Platform.OS === 'ios' ? 10 : 0
    },
    headerSub: { fontSize: 13, color: COLORS.gray500, fontWeight: '500' },
    headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.gray900, marginTop: 2 },
    orgBadge: {
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primary + '20'
    },
    orgText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

    summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    summaryCard: {
        flex: 1,
        height: 120,
        borderRadius: 24,
        padding: 16,
        overflow: 'hidden',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    summaryCardBlue: { backgroundColor: '#4F46E5' },
    summaryCardWhite: { backgroundColor: COLORS.white, elevation: 4, shadowColor: '#000' },
    summaryInfo: { zIndex: 1 },
    summaryTitle: { fontSize: 10, fontWeight: '800', marginBottom: 6, letterSpacing: 1 },
    summaryValue: { fontSize: 24, fontWeight: '900', marginBottom: 2 },
    summarySub: { fontSize: 11, fontWeight: '500' },
    summaryIconContainer: { position: 'absolute', bottom: -10, right: -10 },
    
    textWhite: { color: COLORS.white },
    textWhiteSoft: { color: 'rgba(255,255,255,0.7)' },
    textGray: { color: '#64748B' },
    textBlue: { color: '#4F46E5' },
    textGrayMuted: { color: '#94A3B8' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    blueBar: { width: 4, height: 20, backgroundColor: COLORS.primary, borderRadius: 2, marginRight: 10 },
    sectionHeading: { fontSize: 18, fontWeight: '800', color: COLORS.gray900 },

    moduleList: { gap: 12, marginBottom: 32 },
    moduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    iconBox: {
        width: 54,
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    pngIcon: { width: 34, height: 34 },
    moduleMeta: { flex: 1 },
    moduleLabel: { fontSize: 15, fontWeight: '800', color: COLORS.gray900, marginBottom: 2 },
    moduleDesc: { fontSize: 12, color: COLORS.gray500 },

    tipCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary + '08',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center'
    },
    tipIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14
    },
    tipContent: { flex: 1 },
    tipTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, marginBottom: 2 },
    tipDesc: { fontSize: 12, color: COLORS.gray600, lineHeight: 18 }
});

export default CongTacDoanScreen;
