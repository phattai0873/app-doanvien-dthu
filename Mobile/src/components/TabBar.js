import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../constants';

/**
 * Component TabBar
 * @param {array} tabs - Danh sách tabs
 * @param {number} activeTab - Index của tab đang active
 * @param {function} onTabPress - Hàm xử lý khi nhấn tab
 */
const TabBar = ({ tabs, activeTab, onTabPress }) => {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            {tabs.map((tab, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.tab,
                        activeTab === index && styles.activeTab,
                    ]}
                    onPress={() => onTabPress(index)}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === index && styles.activeTabText,
                        ]}
                    >
                        {tab}
                    </Text>
                    {activeTab === index && <View style={styles.indicator} />}
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.primary,
        maxHeight: 44,
    },
    contentContainer: {
        paddingHorizontal: SIZES.sm,
        alignItems: 'center',
    },
    tab: {
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.xs,
        marginHorizontal: SIZES.xs,
        position: 'relative',
        height: 44,
        justifyContent: 'center',
    },
    activeTab: {
        // Active tab styling
    },
    tabText: {
        fontSize: SIZES.fontSm,
        color: COLORS.white,
        opacity: 0.7,
        fontWeight: '500',
    },
    activeTabText: {
        opacity: 1,
        fontWeight: '600',
    },
    indicator: {
        position: 'absolute',
        bottom: 0,
        left: SIZES.md,
        right: SIZES.md,
        height: 2,
        backgroundColor: COLORS.secondary,
        borderRadius: SIZES.radiusXs,
    },
});

export default TabBar;
