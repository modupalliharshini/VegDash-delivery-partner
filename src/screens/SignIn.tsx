import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Modal, Alert } from 'react-native';
import supabase from '../services/api';
import { theme } from '../theme/theme';

interface SignInProps {
  onLogin: (rider: { name: string; email: string; avatar: string }) => void;
  onGoToRegister: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onLogin, onGoToRegister }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleRequestOtp = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    // Simulate SMS gateway sending OTP
    setTimeout(() => {
      setLoading(false);
      setShowOtpModal(true);
    }, 800);
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit code sent to your phone.');
      return;
    }
    setVerifying(true);
    try {
      const email = `rider_${phone.slice(-4)}@vegdash.com`;
      const name = `Rider ${phone.slice(-4)}`;
      let { data: signInData, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123',
      });

      let userUuid = signInData?.user?.id;

      if (error) {
        if (error.message.includes('Email not confirmed') || error.message.includes('confirmed')) {
          const { data: existingUser } = await supabase
            .from('users')
            .select('_id')
            .eq('email', email)
            .single();
          if (existingUser?._id) {
            userUuid = existingUser._id;
          } else {
            userUuid = 'f0000000-0000-0000-0000-' + phone.padStart(12, '0').slice(-12);
          }
        } else if (error.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: 'password123',
            options: { data: { name, role: 'rider' } }
          });
          if (signUpError) {
            if (signUpError.message.includes('Email not confirmed') || signUpError.message.includes('confirmed')) {
              userUuid = 'f0000000-0000-0000-0000-' + phone.padStart(12, '0').slice(-12);
            } else {
              throw signUpError;
            }
          } else {
            userUuid = signUpData?.user?.id;
          }
        } else {
          throw error;
        }
      }

      // Upsert the user in public.users to ensure role is rider
      if (userUuid) {
        const { error: upsertError } = await supabase.from('users').upsert({
          _id: userUuid,
          email,
          name,
          role: 'rider',
          phone: phone,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'
        }, { onConflict: '_id' });
        if (upsertError) console.error('Rider profile sync error:', upsertError);
      }

      setShowOtpModal(false);
      onLogin({
        name,
        email,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'
      });
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message || 'OTP verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDemoLogin = async (name: string, email: string) => {
    setLoading(true);
    try {
      let { data: signInData, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123',
      });

      let userUuid = signInData?.user?.id;

      if (error) {
        if (error.message.includes('Email not confirmed') || error.message.includes('confirmed')) {
          const { data: existingUser } = await supabase
            .from('users')
            .select('_id')
            .eq('email', email)
            .single();
          if (existingUser?._id) {
            userUuid = existingUser._id;
          } else {
            userUuid = 'd0000000-0000-0000-0000-' + (email === 'rohan@vegdash.com' ? '000000000001' : '000000000002');
          }
        } else if (error.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: 'password123',
            options: { data: { name, role: 'rider' } }
          });
          if (signUpError) {
            if (signUpError.message.includes('Email not confirmed') || signUpError.message.includes('confirmed')) {
              userUuid = 'd0000000-0000-0000-0000-' + (email === 'rohan@vegdash.com' ? '000000000001' : '000000000002');
            } else {
              throw signUpError;
            }
          } else {
            userUuid = signUpData?.user?.id;
          }
        } else {
          throw error;
        }
      }

      // Upsert rider in public.users
      if (userUuid) {
        const { error: upsertError } = await supabase.from('users').upsert({
          _id: userUuid,
          email,
          name,
          role: 'rider',
          phone: email === 'rohan@vegdash.com' ? '9876543210' : '9876543211',
          avatar: email === 'rohan@vegdash.com' 
            ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'
        }, { onConflict: '_id' });
        if (upsertError) console.error('Rider demo profile sync error:', upsertError);
      }

      onLogin({
        name,
        email,
        avatar: email === 'rohan@vegdash.com' 
          ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'
      });
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message || 'Demo Quick Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoSubtext}>Rider Portal</Text>
        </View>

        <Text style={styles.title}>Welcome, Delivery Partner!</Text>
        <Text style={styles.subtitle}>Enter your phone number to proceed</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCodeBox}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRequestOtp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Get OTP & Verify</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerPromptRow}>
          <Text style={styles.promptText}>New delivery partner?</Text>
          <TouchableOpacity onPress={onGoToRegister}>
            <Text style={styles.registerLink}>Register & Apply KYC</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Demo Quick Access Accounts</Text>
          
          <TouchableOpacity 
            style={styles.demoBtn} 
            onPress={() => handleDemoLogin('Rohan Sharma', 'rohan@vegdash.com')}
          >
            <View style={styles.demoBtnContent}>
              <Text style={styles.demoBtnText}>Rohan Sharma (Rider 1)</Text>
              <Text style={styles.demoBadge}>Quick Login</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.demoBtn} 
            onPress={() => handleDemoLogin('Amit Singh', 'amit@vegdash.com')}
          >
            <View style={styles.demoBtnContent}>
              <Text style={styles.demoBtnText}>Amit Singh (Rider 2)</Text>
              <Text style={styles.demoBadge}>Quick Login</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* OTP Modal Sheet */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />
            <Text style={styles.modalTitle}>Confirm Verification Code</Text>
            <Text style={styles.modalSubtitle}>Enter the 4-digit code sent to +91 {phone}</Text>

            <TextInput
              style={styles.otpInput}
              placeholder="0 0 0 0"
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              maxLength={4}
              value={otpCode}
              onChangeText={setOtpCode}
              autoFocus
            />

            <TouchableOpacity 
              style={[styles.modalBtn, otpCode.length < 4 && styles.modalBtnDisabled]} 
              onPress={handleVerifyOtp} 
              disabled={verifying || otpCode.length < 4}
            >
              {verifying ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.modalBtnText}>Verify & Proceed</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendBtn} onPress={() => Alert.alert('Sent', 'OTP code sent again.')}>
              <Text style={styles.resendText}>Resend Code in 30s</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowOtpModal(false)}>
              <Text style={styles.closeText}>Change Number</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, backgroundColor: theme.colors.card, padding: 28, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border, shadowColor: theme.colors.primaryGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 4 },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 90, height: 90 },
  logoSubtext: { fontSize: 11, fontWeight: '700', color: theme.colors.primaryGreen, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  title: { fontSize: 19, fontWeight: '800', color: theme.colors.primaryText, textAlign: 'center', marginBottom: 6, fontFamily: 'Outfit' },
  subtitle: { fontSize: 13, color: theme.colors.secondaryText, textAlign: 'center', marginBottom: 20, fontFamily: 'Outfit' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.primaryText, marginBottom: 8, fontFamily: 'Outfit' },
  phoneInputRow: { flexDirection: 'row', gap: 10 },
  countryCodeBox: { backgroundColor: theme.colors.warmWhite, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, width: 55, justifyContent: 'center', alignItems: 'center' },
  countryCodeText: { fontSize: 14, fontWeight: '700', color: theme.colors.primaryText },
  input: { flex: 1, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, color: theme.colors.primaryText, fontSize: 15, fontFamily: 'Outfit', fontWeight: '600' },
  button: { backgroundColor: theme.colors.primaryGreen, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 15, fontFamily: 'Outfit' },
  registerPromptRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 },
  promptText: { fontSize: 13, color: theme.colors.secondaryText },
  registerLink: { fontSize: 13, color: theme.colors.primaryGreen, fontWeight: '700' },
  demoSection: { marginTop: 20, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 16 },
  demoTitle: { fontSize: 10, fontWeight: '700', color: theme.colors.lightText, textTransform: 'uppercase', textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 },
  demoBtn: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  demoBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  demoBtnText: { fontSize: 12, color: theme.colors.primaryText, fontWeight: '600' },
  demoBadge: { fontSize: 9, fontWeight: '700', color: theme.colors.primaryGreen, backgroundColor: 'rgba(11, 77, 58, 0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, alignItems: 'center' },
  modalDragHandle: { width: 36, height: 4, backgroundColor: theme.colors.border, borderRadius: 2, marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.primaryText, marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: theme.colors.secondaryText, textAlign: 'center', marginBottom: 24 },
  otpInput: { fontSize: 26, fontWeight: '800', color: theme.colors.primaryGreen, backgroundColor: theme.colors.warmWhite, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, width: 150, paddingVertical: 10, textAlign: 'center', letterSpacing: 12, marginBottom: 24 },
  modalBtn: { backgroundColor: theme.colors.primaryGreen, height: 48, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center' },
  modalBtnDisabled: { backgroundColor: '#CBD5E1' },
  modalBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  resendBtn: { marginTop: 16 },
  resendText: { fontSize: 12, color: theme.colors.secondaryText, fontWeight: '600' },
  closeBtn: { marginTop: 14 },
  closeText: { fontSize: 13, color: '#EF4444', fontWeight: '700' }
});
