import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-container';
import MainNavigator from './src/navigation/MainNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <MainNavigator />
    </NavigationContainer>
  );
}
