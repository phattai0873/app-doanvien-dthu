import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants';

export const MenuRow = ({ icon, color, label, onPress }) => (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
        <View style={styles.menuIconBox}>
            <Icon name={icon} size={20} color={color} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        <Icon name="ChevronRight" size={20} color="#D1D5DB" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        justifyContent: 'space-between'
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.gray100,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.gray800
    },
});
