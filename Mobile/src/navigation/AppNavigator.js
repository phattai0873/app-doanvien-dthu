import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import CompleteProfileScreen from '../screens/Auth/CompleteProfileScreen';
import { RootStackNavigator } from './RootStackNavigator';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
);

export const AppNavigator = () => {
    const { isLoggedIn, isLoading, hasProfile, logout, checkAuth } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isLoggedIn ? (
                    <Stack.Screen name="Auth" component={AuthStack} />
                ) : !hasProfile ? (
                    <Stack.Screen name="CompleteProfile">
                        {(props) => <CompleteProfileScreen {...props} onSuccess={checkAuth} onLogout={logout} />}
                    </Stack.Screen>
                ) : (
                    <Stack.Screen name="Root" component={RootStackNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
