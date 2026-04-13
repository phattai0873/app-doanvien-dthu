import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants';

export const MenuRow = ({ icon, color, label, onPress, badge }) => (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.menuIconBox, { backgroundColor: color ? color + '15' : COLORS.gray100 }]}>
            <Icon name={icon} size={20} color={color || COLORS.gray500} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        {badge && (
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
            </View>
        )}
        <Icon name="ChevronRight" size={20} color="#D1D5DB" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.gray800,
    },
    badge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginRight: 8,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
});

