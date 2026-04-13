import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { registerRootComponent } from 'expo';

/**
 * Main Application Component
 * Restored with full navigation and authentication logic
 * after the React 19 / RN 0.81 stabilization.
 */
function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;

// Ensure manual registration for stable entry point on Windows
registerRootComponent(App);
