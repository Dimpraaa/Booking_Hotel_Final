import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/api/client';

export default function CreateNewPasswordScreen() {
  const { email } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Cast email to string just in case it's an array
      const userEmail = Array.isArray(email) ? email[0] : email;
      const response = await api.resetPassword(userEmail, password);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Your password has been successfully updated.',
          [{ text: 'Login Now', onPress: () => router.replace('/login') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#43a08d" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.eyebrow}>SECURE YOUR ACCOUNT</Text>
      <Text style={styles.title}>Create New{'\n'}Password</Text>
      <Text style={styles.subtitle}>
        Your new password must be different from previous used passwords.
      </Text>

      {/* Form */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>New Password</Text>
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

      <View style={styles.formGroup}>
        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.inputPassword}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.updateBtn} onPress={handleUpdatePassword} disabled={loading}>
        <Text style={styles.updateBtnText}>{loading ? 'Updating...' : 'Update Password'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fbfc',
    padding: 25,
  },
  header: {
    marginTop: 30,
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  backText: {
    color: '#43a08d',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  eyebrow: {
    color: '#43a08d',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 30,
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eaeaea',
    borderRadius: 12,
  },
  inputPassword: {
    flex: 1,
    padding: 15,
    fontSize: 15,
    color: '#333',
  },
  showBtn: {
    padding: 15,
  },
  showText: {
    color: '#43a08d',
    fontWeight: 'bold',
    fontSize: 13,
  },
  updateBtn: {
    backgroundColor: '#43a08d',
    borderRadius: 30,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#43a08d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  updateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
