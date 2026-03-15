import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    SafeAreaView,
    Image,
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES, IMAGES } from '../../constants';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

export const SideDrawer = ({ isOpen, onClose, onNavigate, activeTab, onLogout }) => {
    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -DRAWER_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [isOpen]);

    const DrawerItem = ({ icon, label, id, isSub = false }) => {
        const isActive = activeTab === id;
        return (
            <TouchableOpacity
                style={[
                    styles.drawerItem,
                    isActive && styles.drawerItemActive,
                    isSub && { paddingLeft: 48 }
                ]}
                onPress={() => {
                    onNavigate(id);
                    onClose();
                }}
            >
                <Icon
                    name={icon}
                    size={22}
                    color={isActive ? COLORS.primary : COLORS.gray600}
                />
                <Text style={[
                    styles.drawerLabel,
                    isActive && styles.drawerLabelActive
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    if (!isOpen && slideAnim._value === -DRAWER_WIDTH) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
            </TouchableWithoutFeedback>

            {/* Content */}
            <Animated.View style={[styles.drawerContent, { transform: [{ translateX: slideAnim }] }]}>
                <SafeAreaView style={styles.safeArea}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.avatar}>
                            <Image 
                                source={IMAGES.logo} 
                                style={styles.logoInDrawer}
                                resizeMode="contain"
                            />
                        </View>
                        <View>
                            <Text style={styles.name}>Đoàn viên DThU</Text>
                            <Text style={styles.role}>Chi đoàn CNTT</Text>
                        </View>
                    </View>

                    {/* Nav Items */}
                    <View style={styles.navSection}>
                        <DrawerItem icon="Grid" label="Bảng điều khiển" id="dashboard" />
                        <DrawerItem icon="Newspaper" label="Bản tin" id="news" />
                        <DrawerItem icon="Briefcase" label="Công tác Đoàn" id="work" />
                        <DrawerItem icon="List" label="Sinh hoạt" id="meeting_list" />
                        <DrawerItem icon="Award" label="Cuộc thi" id="exam_list" />
                        <DrawerItem icon="FileText" label="Văn bản" id="document_list" />
                        <DrawerItem icon="Bell" label="Thông báo" id="notif" />
                        <DrawerItem icon="User" label="Cá nhân" id="profile" />
                    </View>

                    {/* Footer */}
                    <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                        <Icon name="LogOut" size={20} color={COLORS.error} />
                        <Text style={styles.logoutText}>Đăng xuất</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawerContent: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: DRAWER_WIDTH,
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    safeArea: { flex: 1 },
    header: {
        padding: 24,
        paddingTop: 40,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray100
    },
    logoInDrawer: {
        width: 40,
        height: 40,
    },
    name: { fontSize: 18, fontWeight: '700', color: COLORS.gray900 },
    role: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
    navSection: { flex: 1, padding: 12, paddingTop: 20 },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        gap: 14,
        marginBottom: 4
    },
    drawerItemActive: {
        backgroundColor: COLORS.primary + '10',
    },
    drawerLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.gray700
    },
    drawerLabelActive: {
        color: COLORS.primary,
        fontWeight: '700'
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.error
    }
});
