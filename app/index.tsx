import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { globalStore } from '../src/store';

export default function SplashScreen() {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const init = async () => {
      const loggedIn = await globalStore.loadAuth();
      setTimeout(() => {
        if (loggedIn) {
          router.replace('/(tabs)');
        }
      }, 1500);
    };
    init();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.iconWrapper}>
          <View style={styles.iconBox}>
            <Ionicons name="bed-outline" size={45} color="#fff" />
          </View>
          <View style={styles.starBadge}>
            <Ionicons name="star" size={12} color="#fff" />
          </View>
        </View>

        <Text style={styles.eyebrow}>DISCOVER · BOOK · STAY</Text>
        <Text style={styles.title}>StayLux</Text>
        <Text style={styles.subtitle}>
          Your premium gateway to world-class hotels and unforgettable stays.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
          <Ionicons name="chevron-forward" size={16} color="#43a08d" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#43a08d',
    justifyContent: 'space-between',
    padding: 30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 40,
  },
  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  starBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fbb03b',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#43a08d',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 3,
    marginBottom: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    opacity: 0.9,
  },
  bottomSection: {
    width: '100%',
    paddingBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnText: {
    color: '#43a08d',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
