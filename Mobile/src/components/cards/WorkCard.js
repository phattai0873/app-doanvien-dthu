import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

/**
 * WorkCard – Module card dùng trong WorkDashboardScreen.
 * Props:
 *   iconName  – tên Ionicons
 *   title     – tiêu đề (string)
 *   desc      – mô tả ngắn (string)
 *   color     – màu icon (default: COLORS.primary)
 *   bg        – màu nền icon box (default: COLORS.primaryLight)
 *   onPress   – callback
 *   badge     – text badge (optional)
 */
export const WorkCard = ({ iconName, title, desc, color, bg, onPress, badge }) => {
    const iconColor = color || COLORS.primary;
    const iconBg = bg || COLORS.primaryLight || '#EBF0FE';

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            {badge && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                <Ionicons name={iconName} size={26} color={iconColor} />
            </View>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            {desc ? <Text style={styles.desc} numberOfLines={2}>{desc}</Text> : null}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        minHeight: 140,
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    iconBox: {
        width: 54,
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1E293B',
        textAlign: 'center',
        lineHeight: 18,
    },
    desc: {
        fontSize: 11,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 15,
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
    },
});
