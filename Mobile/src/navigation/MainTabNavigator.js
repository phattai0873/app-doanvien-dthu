import React from 'react';
import { View, Platform, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { NewsFeedScreen } from '../screens/News/NewsFeedScreen';
import { WorkDashboardScreen } from '../screens/Work/WorkDashboardScreen';
import { NotificationScreen } from '../screens/Notification/NotificationScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = {
    Dashboard: { icon: 'home',              label: 'Trang chủ' },
    News:      { icon: 'newspaper',         label: 'Tin tức'   },
    Work:      { icon: 'briefcase',         label: 'Công tác'  },
    Notification: { icon: 'notifications', label: 'Thông báo' },
    Profile:   { icon: 'person',            label: 'Cá nhân'  },
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
    return (
        <View style={styles.tabBarContainer}>
            <View style={styles.tabBar}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label = options.tabBarLabel || options.title || route.name;
                    const isFocused = state.index === index;
                    const cfg = TAB_CONFIG[route.name];

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={onPress}
                            style={styles.tabItem}
                            activeOpacity={0.8}
                        >
                            {isFocused ? (
                                <LinearGradient
                                    colors={COLORS.gradientPrimary}
                                    style={styles.activeIconContainer}
                                >
                                    <Ionicons name={cfg.icon} size={24} color={COLORS.white} />
                                </LinearGradient>
                            ) : (
                                <View style={styles.inactiveIconContainer}>
                                    <Ionicons name={`${cfg.icon}-outline`} size={24} color={COLORS.gray400} />
                                </View>
                            )}
                            {isFocused && (
                                <Text style={styles.activeLabel}>{cfg.label}</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

export const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
            }}
        >
            <Tab.Screen name="Dashboard"    component={DashboardScreen} />
            <Tab.Screen name="News"         component={NewsFeedScreen} />
            <Tab.Screen name="Work"         component={WorkDashboardScreen} />
            <Tab.Screen name="Notification" component={NotificationScreen} />
            <Tab.Screen name="Profile"      component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 24 : 16,
        left: 16,
        right: 16,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.white,
        ...COLORS.shadowDark,
        zIndex: 1000,
    },
    tabBar: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
    },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 24,
        paddingHorizontal: 12,
    },
    activeIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    inactiveIconContainer: {
        padding: 4,
    },
    activeLabel: {
        marginLeft: 8,
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '900',
    },
});

