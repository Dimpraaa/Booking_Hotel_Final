import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/api/client';
import { globalStore } from '../src/store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const response = await api.login(email.trim(), password);
      if (response.success) {
        globalStore.setUser(response.user.id, response.user.name, response.user.avatar_url);
        router.replace('/(tabs)');
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Ionicons name="chevron-back" size={16} color="#43a08d" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.eyebrow}>WELCOME BACK</Text>
      <Text style={styles.title}>Sign in to{'\n'}StayLux</Text>
      <Text style={styles.subtitle}>Access your bookings and exclusive deals</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.inputPassword}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showBtn}>
            <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/forgot-password')}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Sign In</Text>}
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.registerLink}>Sign up free</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fbfc', padding: 25 },
  header: { marginTop: 30, marginBottom: 30, alignItems: 'flex-start' },
  backBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f4f1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  backText: { color: '#43a08d', fontWeight: 'bold', marginLeft: 4, fontSize: 14 },
  eyebrow: { color: '#43a08d', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#000', lineHeight: 40, marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#777', marginBottom: 30 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eaeaea', borderRadius: 12, padding: 15, fontSize: 15, color: '#333' },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#eaeaea', borderRadius: 12 },
  inputPassword: { flex: 1, padding: 15, fontSize: 15, color: '#333' },
  showBtn: { padding: 15 },
  showText: { color: '#43a08d', fontWeight: 'bold', fontSize: 13 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 25 },
  forgotText: { color: '#43a08d', fontWeight: 'bold', fontSize: 13 },
  loginBtn: { backgroundColor: '#43a08d', borderRadius: 30, height: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  registerText: { color: '#777', fontSize: 13 },
  registerLink: { color: '#43a08d', fontSize: 13, fontWeight: 'bold' },
});
