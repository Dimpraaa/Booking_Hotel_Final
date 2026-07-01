import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  light?: boolean;
}

export default function EmptyState({
  icon = 'alert-circle-outline',
  title,
  subtitle,
  light = false,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={light ? 'rgba(255,255,255,0.6)' : '#ccc'} />
      <Text style={[styles.title, light && styles.titleLight]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, light && styles.subtitleLight]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  titleLight: {
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  subtitleLight: {
    color: 'rgba(255,255,255,0.8)',
  },
});
