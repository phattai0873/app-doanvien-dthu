import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, Newspaper, User } from 'lucide-react-native';
import { COLORS } from '../styles/theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: COLORS.border,
                    height: 60,
                    paddingBottom: 10,
                    paddingTop: 8,
                    backgroundColor: COLORS.surface,
                },
                tabBarIcon: ({ color, size }) => {
                    if (route.name === 'Home') return <Home color={color} size={size} />;
                    if (route.name === 'Activities') return <Calendar color={color} size={size} />;
                    if (route.name === 'News') return <Newspaper color={color} size={size} />;
                    if (route.name === 'Profile') return <User color={color} size={size} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chủ' }} />
            <Tab.Screen name="Activities" options={{ title: 'Hoạt động' }}>
                {() => <PlaceholderScreen name="Hoạt động" />}
            </Tab.Screen>
            <Tab.Screen name="News" options={{ title: 'Tin tức' }}>
                {() => <PlaceholderScreen name="Tin tức" />}
            </Tab.Screen>
            <Tab.Screen name="Profile" options={{ title: 'Hồ sơ' }}>
                {() => <PlaceholderScreen name="Hồ sơ" />}
            </Tab.Screen>
        </Tab.Navigator>
    );
};

export default MainNavigator;
