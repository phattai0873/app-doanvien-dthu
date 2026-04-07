import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MainTabNavigator } from './MainTabNavigator';
import CustomDrawerContent from './CustomDrawerContent';
import { COLORS } from '../constants';

const Drawer = createDrawerNavigator();

export const DrawerNavigator = () => {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    width: '80%',
                    backgroundColor: COLORS.white,
                },
                drawerType: 'front',
                overlayColor: 'rgba(0,0,0,0.5)',
            }}
        >
            <Drawer.Screen 
                name="MainTabs" 
                component={MainTabNavigator} 
                options={{ title: 'Trang chủ' }}
            />
        </Drawer.Navigator>
    );
};
