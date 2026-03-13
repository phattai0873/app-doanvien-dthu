import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { authService } from '../../services/authService';
import { API_BASE_URL } from '../../services/api';
import { Image } from 'react-native';
import { meetingService } from '../../services/meetingService';
import { workService } from '../../services/workService';

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

const MODULES = [
    { id: 'meeting', label: 'Sinh hoạt', isPng: true, pngIcon: ICON_SET.sinhhoat, color: '#4F46E5', bg: '#EEF2FF', count: 12, desc: 'Buổi họp Chi đoàn' },
    { id: 'fee', label: 'Đoàn phí', isPng: true, pngIcon: ICON_SET.doanphi, color: '#10B981', bg: '#ECFDF5', count: '95%', desc: 'Tỉ lệ đóng phí' },
    { id: 'volunteer', label: 'Tình nguyện', isPng: true, pngIcon: ICON_SET.tinhnguyen, color: '#F43F5E', bg: '#FFF1F2', count: 5, desc: 'Chiến dịch tháng này' },
    { id: 'theory', label: 'Lý luận chính trị', isPng: true, pngIcon: ICON_SET.hoctap, color: '#F59E0B', bg: '#FFFBEB', count: '72%', desc: 'Hoàn thành học' },
    { id: 'exam', label: 'Thi & Khảo sát', isPng: true, pngIcon: ICON_SET.thidua, color: '#8B5CF6', bg: '#F5F3FF', count: 3, desc: 'Kỳ thi trong kỳ' },
    { id: 'document', label: 'Văn bản', isPng: true, pngIcon: ICON_SET.vanban, color: '#0EA5E9', bg: '#F0F9FF', count: 48, desc: 'Tài liệu lưu hành' },
];

const STATUS_MAP = {
    ongoing: { label: 'Đang diễn ra', bg: '#DCFCE7', color: '#16A34A' },
    upcoming: { label: 'Sắp diễn ra', bg: '#EEF2FF', color: '#4F46E5' },
    done: { label: 'Đã kết thúc', bg: '#F1F5F9', color: '#64748B' },
};

function ModuleCard({ item, onPress }) {
    return (
        <TouchableOpacity style={[styles.moduleCard, { borderTopColor: item.color }]} onPress={onPress} activeOpacity={0.8}>
            <View style={[styles.moduleIcon, { backgroundColor: item.isPng ? 'transparent' : item.bg }]}>
                {item.isPng ? (
                    <Image source={item.pngIcon} style={styles.pngIcon} resizeMode="contain" />
                ) : (
                    <Ionicons name={item.icon} size={22} color={item.color} />
                )}
            </View>
            <Text style={styles.moduleCount}>{item.count}</Text>
            <Text style={styles.moduleLabel}>{item.label}</Text>
            <Text style={styles.moduleDesc} numberOfLines={1}>{item.desc}</Text>
        </TouchableOpacity>
    );
}

export const CongTacDoanScreen = ({ onNavigate }) => {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);

    const filters = [
        { id: 'all', label: 'Tất cả' },
        { id: 'meeting', label: 'Sinh hoạt' },
        { id: 'fee', label: 'Đoàn phí' },
        { id: 'volunteer', label: 'Tình nguyện' },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [meetings, workSum] = await Promise.all([
                meetingService.getMeetings(),
                workService.getWorkSummary()
            ]);
            // Map meeting data to Activity format
            const mappedMeetings = (meetings || []).map(m => ({
                id: m.id,
                type: 'meeting',
                title: m.tieu_de,
                time: m.thoi_gian,
                status: 'upcoming', // Simplified
                icon: 'calendar',
                color: '#4F46E5'
            }));
            setActivities(mappedMeetings);
            setSummary(workSum);
        } catch (error) {
            console.error('Fetch work data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredActivities = selectedFilter === 'all'
        ? activities
        : activities.filter(a => a.type === selectedFilter);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {/* Modules Grid */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Chức năng công tác Đoàn</Text>
            </View>
            <View style={styles.modulesGrid}>
                {MODULES.map(m => (
                    <ModuleCard key={m.id} item={m} onPress={() => onNavigate && onNavigate(m.id)} />
                ))}
            </View>

            {/* Action Chips */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {[
                    { label: 'Tạo cuộc họp', icon: 'add-circle', color: '#4F46E5', screen: 'meeting_create' },
                    { label: 'Thu Đoàn phí', icon: 'cash', color: '#10B981', screen: 'fee_collect' },
                    { label: 'Đăng hoạt động', icon: 'megaphone', color: '#F43F5E', screen: 'volunteer_create' },
                    { label: 'Điểm danh', icon: 'checkmark-circle', color: '#F59E0B', screen: 'attendance' },
                ].map(a => (
                    <TouchableOpacity key={a.label} style={[styles.chip, { borderColor: a.color + '40' }]} onPress={() => onNavigate && onNavigate(a.screen)} activeOpacity={0.8}>
                        <View style={[styles.chipIcon, { backgroundColor: a.color + '15' }]}>
                            <Ionicons name={a.icon} size={16} color={a.color} />
                        </View>
                        <Text style={[styles.chipLabel, { color: a.color }]}>{a.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Recent activities */}
            <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                <Text style={styles.sectionTitle}>Hoạt động mới nhất</Text>
                <TouchableOpacity onPress={fetchData}><Text style={styles.seeAll}>Làm mới</Text></TouchableOpacity>
            </View>

            {/* Filter tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {filters.map(f => (
                    <TouchableOpacity
                        key={f.id}
                        style={[styles.filterTab, selectedFilter === f.id && styles.filterTabActive]}
                        onPress={() => setSelectedFilter(f.id)}
                    >
                        <Text style={[styles.filterTabText, selectedFilter === f.id && styles.filterTabTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Activity list */}
            <View style={{ paddingHorizontal: SIZES.md }}>
                {filteredActivities.map(act => {
                    const st = STATUS_MAP[act.status] || STATUS_MAP.upcoming;
                    return (
                        <TouchableOpacity key={act.id} style={styles.actCard} activeOpacity={0.9}>
                            <View style={[styles.actIcon, { backgroundColor: act.color + '15' }]}>
                                <Ionicons name={act.icon} size={20} color={act.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.actTitle} numberOfLines={2}>{act.title}</Text>
                                <View style={styles.actMeta}>
                                    <Ionicons name="time-outline" size={12} color={COLORS.gray400} />
                                    <Text style={styles.actTime}>{act.time}</Text>
                                </View>
                            </View>
                            <View style={[styles.actStatus, { backgroundColor: st.bg }]}>
                                <Text style={[styles.actStatusText, { color: st.color }]}>{st.label}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {filteredActivities.length === 0 && (
                    <View style={styles.empty}><Ionicons name="calendar-outline" size={36} color={COLORS.gray300} /><Text style={styles.emptyText}>Chưa có hoạt động</Text></View>
                )}
            </View>
        </ScrollView>
    );
};

const CARD_W = (width - SIZES.md * 2 - SIZES.xs * 2) / 3; // Reduced spacing in calculation
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    sectionHeader: { paddingHorizontal: SIZES.md, paddingTop: SIZES.md, paddingBottom: SIZES.xs },
    sectionTitle: { fontSize: SIZES.fontLg, fontWeight: '800', color: COLORS.textPrimary },
    seeAll: { fontSize: SIZES.fontSm, color: COLORS.primary, fontWeight: '700', paddingTop: 2 },
    modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SIZES.md, gap: SIZES.xs }, // Reduced gap from sm to xs
    moduleCard: { width: CARD_W, backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, padding: SIZES.xs, borderTopWidth: 3, borderWidth: 1, borderColor: COLORS.gray200, alignItems: 'center', elevation: 1 }, // Reduced padding sm to xs
    moduleIcon: { width: 48, height: 48, borderRadius: SIZES.radiusSm, justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.xs }, // Reduced width/height from 56 to 48
    pngIcon: { width: 36, height: 36 }, // Reduced from 44
    moduleCount: { fontSize: SIZES.fontLg, fontWeight: '900', color: COLORS.textPrimary }, // Reduced from fontXl
    moduleLabel: { fontSize: SIZES.fontXs, fontWeight: '800', color: COLORS.gray700, marginTop: 2 },
    moduleDesc: { fontSize: 10, color: COLORS.gray400, marginTop: 2, textAlign: 'center' },
    chipRow: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs, gap: SIZES.sm },
    chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1.5, borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.sm, paddingVertical: 8, gap: SIZES.xs },
    chipIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    chipLabel: { fontSize: SIZES.fontSm, fontWeight: '700' },
    filterRow: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs, gap: SIZES.xs },
    filterTab: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.gray200 },
    filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterTabText: { fontSize: SIZES.fontSm, fontWeight: '600', color: COLORS.gray500 },
    filterTabTextActive: { color: COLORS.white },
    actCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.sm, gap: SIZES.sm, borderWidth: 1, borderColor: COLORS.gray200, elevation: 1 },
    actIcon: { width: 44, height: 44, borderRadius: SIZES.radiusSm, justifyContent: 'center', alignItems: 'center' },
    actTitle: { fontSize: SIZES.fontMd, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
    actMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actTime: { fontSize: SIZES.fontXs, color: COLORS.gray400 },
    actStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: SIZES.radiusFull, flexShrink: 0 },
    actStatusText: { fontSize: 10, fontWeight: '800' },
    empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { color: COLORS.gray400, fontSize: SIZES.fontMd },
});
