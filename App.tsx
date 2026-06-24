import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Web polyfill for Alert.alert to make confirmation dialogs work on React Native Web
if (Platform.OS === 'web') {
  (Alert as any).alert = (title: string, message?: string, buttons?: any[]) => {
    if (buttons && buttons.length > 0) {
      const confirmMessage = message ? `${title}\n\n${message}` : title;
      const result = window.confirm(confirmMessage);
      if (result) {
        const positiveBtn = buttons.find(b => b.style !== 'cancel' && b.text !== 'No') || buttons[buttons.length - 1];
        if (positiveBtn && positiveBtn.onPress) {
          positiveBtn.onPress();
        }
      } else {
        const cancelBtn = buttons.find(b => b.style === 'cancel' || b.text === 'No');
        if (cancelBtn && cancelBtn.onPress) {
          cancelBtn.onPress();
        }
      }
    } else {
      window.alert(message ? `${title}: ${message}` : title);
    }
  };
}
import { Splash } from './src/screens/Splash';
import { SignIn } from './src/screens/SignIn';
import { RegisterKYC } from './src/screens/RegisterKYC';
import { Dashboard } from './src/screens/Dashboard';
import { theme } from './src/theme/theme';

interface RiderSession {
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  documents?: any;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'signin' | 'register' | 'dashboard'>('splash');
  const [rider, setRider] = useState<RiderSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Check stored login session on launch
  useEffect(() => {
    const checkSession = async () => {
      try {
        const stored = await AsyncStorage.getItem('vegdash_rider');
        if (stored) {
          setRider(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load rider session:', err);
      } finally {
        setSessionLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleSplashFinish = () => {
    if (rider) {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('signin');
    }
  };

  const handleLogin = async (newRider: RiderSession) => {
    try {
      await AsyncStorage.setItem('vegdash_rider', JSON.stringify(newRider));
      setRider(newRider);
      setCurrentScreen('dashboard');
    } catch (err) {
      console.error('Failed to save rider session:', err);
    }
  };

  const handleRegisterComplete = async (registeredRider: RiderSession) => {
    try {
      await AsyncStorage.setItem('vegdash_rider', JSON.stringify(registeredRider));
      setRider(registeredRider);
      setCurrentScreen('dashboard');
    } catch (err) {
      console.error('Failed to save registered rider details:', err);
    }
  };

  const handleUpdateRider = async (updatedRider: RiderSession) => {
    try {
      await AsyncStorage.setItem('vegdash_rider', JSON.stringify(updatedRider));
      setRider(updatedRider);
    } catch (err) {
      console.error('Failed to update rider session:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('vegdash_rider');
      setRider(null);
      setCurrentScreen('signin');
    } catch (err) {
      console.error('Failed to clear rider session:', err);
    }
  };

  if (sessionLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primaryGreen} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {currentScreen === 'splash' && (
          <Splash onFinish={handleSplashFinish} />
        )}
        {currentScreen === 'signin' && (
          <SignIn 
            onLogin={handleLogin} 
            onGoToRegister={() => setCurrentScreen('register')} 
          />
        )}
        {currentScreen === 'register' && (
          <RegisterKYC 
            onRegisterComplete={handleRegisterComplete} 
            onCancel={() => setCurrentScreen('signin')} 
          />
        )}
        {currentScreen === 'dashboard' && rider && (
          <Dashboard 
            rider={rider} 
            onLogout={handleLogout} 
            onUpdateRider={handleUpdateRider} 
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
