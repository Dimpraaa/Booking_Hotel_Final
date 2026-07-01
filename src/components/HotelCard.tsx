import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../api/client';
import { COLORS } from '../constants/theme';

interface HotelCardProps {
  hotel: {
    id: number;
    name: string;
    location: string;
    rating: number;
    image_url: string;
    price_starts_at?: number;
    price?: number;
  };
  onPress?: () => void;
  variant?: 'horizontal' | 'vertical';
}

export default function HotelCard({ hotel, onPress, variant = 'vertical' }: HotelCardProps) {
  const price = hotel.price_starts_at ?? hotel.price ?? 0;

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity style={styles.horizontalCard} onPress={onPress} activeOpacity={0.85}>
        <Image source={{ uri: hotel.image_url }} style={styles.horizontalImage} />
        <View style={styles.horizontalContent}>
          <Text style={styles.name} numberOfLines={1}>{hotel.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={COLORS.warning} />
            <Text style={styles.ratingText}>{hotel.rating}</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>{hotel.location}</Text>
          </View>
          <Text style={styles.price}>
            {formatCurrency(price)}<Text style={styles.nightText}>/night</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.verticalCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: hotel.image_url }} style={styles.verticalImage} />
      <View style={styles.verticalOverlay}>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={10} color={COLORS.warning} />
          <Text style={styles.ratingBadgeText}>{hotel.rating}</Text>
        </View>
      </View>
      <View style={styles.verticalContent}>
        <Text style={styles.name} numberOfLines={1}>{hotel.name}</Text>
        <Text style={styles.locationText} numberOfLines={1}>{hotel.location}</Text>
        <Text style={styles.price}>
          {formatCurrency(price)}<Text style={styles.nightText}>/night</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  verticalCard: {
    width: 220,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  verticalImage: {
    width: '100%',
    height: 130,
  },
  verticalOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  verticalContent: {
    padding: 12,
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  horizontalImage: {
    width: 90,
    height: 90,
    borderRadius: 14,
  },
  horizontalContent: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
  nightText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: 'normal',
  },
});
