import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform, StyleSheet } from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';

export const CustomHeader = ({
    title,
    showBack = false,
    onBack,
    rightIcon,
    onRightPress,
    leftIcon, // New
    onLeftPress, // New
    roundedBottom = true
}) => {
    return (
        <View style={[styles.header, !roundedBottom && styles.headerRoundedNone]}>
            <View style={styles.headerTopRow}>
                {/* LEFT BUTTON */}
                <View style={styles.headerLeft}>
                    {showBack ? (
                        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                            <Icon name="ArrowLeft" size={24} color={COLORS.gray900} />
                        </TouchableOpacity>
                    ) : leftIcon ? (
                        <TouchableOpacity onPress={onLeftPress} style={styles.iconButton}>
                            <Icon name={leftIcon} size={24} color={COLORS.gray900} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}
                </View>

                {/* TITLE */}
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {title}
                </Text>

                {/* RIGHT BUTTON */}
                <View style={styles.headerRight}>
                    {rightIcon && (
                        <TouchableOpacity style={styles.iconButton} onPress={onRightPress}>
                            <Icon name={rightIcon} size={22} color={COLORS.gray900} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: COLORS.white, // White header for premium look
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 55,
        paddingBottom: 20,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        zIndex: 50,
        elevation: 4,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    headerRoundedNone: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        paddingBottom: 16
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        flex: 1,
        color: COLORS.gray900,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        paddingHorizontal: 8,
    },
    headerLeft: {
        width: 44,
        alignItems: 'flex-start',
    },
    headerRight: {
        width: 44,
        alignItems: 'flex-end',
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
    },
});
