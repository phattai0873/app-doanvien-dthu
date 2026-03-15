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
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { authService } from '../../services/authService';
import { workService } from '../../services/workService';

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
        id: 'volunteer_list', 
        label: 'Hoạt động tình nguyện', 
        desc: 'Hoạt động xã hội',
        pngIcon: ICON_SET.tinhnguyen, 
        color: '#F43F5E', 
        bg: '#FFF1F2' 
    },
    { 
        id: 'exam_list', 
        label: 'Thi đua & Trắc nghiệm', 
        desc: 'Cuộc thi định kỳ',
        pngIcon: ICON_SET.thidua, 
        color: '#F59E0B', 
        bg: '#FFFBEB' 
    },
    { 
        id: 'document_list', 
        label: 'Kho Tài liệu', 
        desc: 'Văn kiện, Nghị quyết',
        pngIcon: ICON_SET.vanban, 
        color: '#0EA5E9', 
        bg: '#F0F9FF' 
    },
];

const MissionCard = ({ item, onPress }) => (
    <TouchableOpacity style={styles.missionCard} onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
            <Image source={item.pngIcon} style={styles.pngIcon} resizeMode="contain" />
        </View>
        <View style={styles.missionContent}>
            <Text style={styles.missionLabel}>{item.label}</Text>
            <Text style={styles.missionDesc}>{item.desc}</Text>
        </View>
    </TouchableOpacity>
);

export const CongTacDoanScreen = ({ onNavigate }) => {
    return (
        <ScrollView 
            style={styles.container} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.missionGrid}>
                {MODULES.map(m => (
                    <MissionCard 
                        key={m.id} 
                        item={m} 
                        onPress={() => onNavigate && onNavigate(m.id)} 
                    />
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // Summary Cards
    summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    summaryCard: {
        flex: 1,
        height: 140,
        borderRadius: 16,
        padding: 16,
        overflow: 'hidden',
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryCardBlue: { backgroundColor: '#4F46E5' },
    summaryCardWhite: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#F1F5F9' },
    summaryInfo: { zIndex: 1 },
    summaryTitle: { fontSize: 10, fontWeight: '800', marginBottom: 4 },
    summaryValue: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
    summarySub: { fontSize: 9, fontWeight: '500' },
    textWhite: { color: COLORS.white },
    textWhiteSoft: { color: 'rgba(255,255,255,0.6)' },
    textGray: { color: '#64748B' },
    textBlue: { color: '#4F46E5' },
    textGrayMuted: { color: '#94A3B8' },
    summaryIconContainer: {
        position: 'absolute',
        bottom: -10,
        right: -10,
    },

    // Section Title
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    blueBar: { width: 4, height: 24, backgroundColor: '#4F46E5', borderRadius: 2, marginRight: 12 },
    sectionTitleHeading: { fontSize: 18, fontWeight: '900', color: '#1E293B' },

    // Mission Grid
    missionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    missionCard: {
        width: (width - 32 - 12) / 2,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        marginBottom: 4
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    pngIcon: { width: 40, height: 40 },
    missionContent: { alignItems: 'center', marginBottom: 8 },
    missionLabel: { fontSize: 14, fontWeight: '800', color: '#1E293B', textAlign: 'center', marginBottom: 4 },
    missionDesc: { fontSize: 11, color: '#64748B', textAlign: 'center' },
    missionTable: { fontSize: 8, color: '#CBD5E1', fontStyle: 'italic', marginTop: 4 }
});
