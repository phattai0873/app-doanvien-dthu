import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';

const NavItem = ({ id, label, icon, isActive, onPress }) => (
    <TouchableOpacity
        style={styles.navItem}
        onPress={() => onPress(id)}
        activeOpacity={0.7}
    >
        <View style={[styles.navIconContainer, isActive && styles.navIconActive]}>
            <Icon name={icon} size={24} color={isActive ? '#FFF' : '#9CA3AF'} />
        </View>
        {!isActive && <Text style={styles.navLabel}>{label}</Text>}
        {isActive && <Text style={styles.navLabelActive}>{label}</Text>}
    </TouchableOpacity>
);

export const TabBar = ({ activeTab, onTabPress }) => {
    return (
        <View style={styles.bottomNav}>
            <NavItem id="news" label="Tin tức" icon="Home" isActive={activeTab === 'news'} onPress={onTabPress} />
            <NavItem id="work" label="Công tác" icon="Briefcase" isActive={activeTab === 'work'} onPress={onTabPress} />
            <NavItem id="notif" label="Thông báo" icon="Bell" isActive={activeTab === 'notif'} onPress={onTabPress} />
            <NavItem id="profile" label="Cá nhân" icon="User" isActive={activeTab === 'profile'} onPress={onTabPress} />
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNav: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        paddingVertical: 8, paddingHorizontal: 16,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 20,
    },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    navIconContainer: {
        width: 48, height: 32, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center', marginBottom: 2
    },
    navIconActive: {
        backgroundColor: COLORS.primary,
        marginTop: -20,
        height: 48,
        width: 48,
        borderRadius: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        elevation: 5
    },
    navLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold' },
    navLabelActive: { fontSize: 10, color: COLORS.primary, fontWeight: 'bold' },
});
