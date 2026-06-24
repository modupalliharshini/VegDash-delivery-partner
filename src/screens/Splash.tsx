import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { theme } from '../theme/theme';

interface SplashProps {
  onFinish: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.pillContainer}>
          <Text style={styles.pillText}>RIDER PORTAL</Text>
        </View>
      </View>
      
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primaryGreen} />
        <Text style={styles.loadingText}>Initializing secure connection...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 180,
    height: 180,
  },
  pillContainer: {
    backgroundColor: 'rgba(11, 77, 58, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(11, 77, 58, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 30,
  },
  pillText: {
    color: theme.colors.primaryGreen,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  loaderContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.colors.secondaryText,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
});
