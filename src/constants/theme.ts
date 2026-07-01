/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** StayLux app palette & helpers */
export const COLORS = {
  primary: '#43a08d',
  primaryDark: '#358a78',
  primaryLight: '#e8f4f1',
  background: '#f9fbfc',
  white: '#fff',
  text: '#111',
  textSecondary: '#888',
  textMuted: '#666',
  border: '#eaeaea',
  error: '#ff4d4f',
  warning: '#fbb03b',
  success: '#43a08d',
} as const;

export const CATEGORIES = ['Hotel', 'Resort', 'Villa', 'Apartment'] as const;

export const PAYMENT_METHODS = [
  { id: 'GoPay', name: 'GoPay', sub: 'Bayar via GoPay', icon: 'wallet' },
  { id: 'OVO', name: 'OVO', sub: 'Bayar via OVO', icon: 'phone-portrait' },
  { id: 'DANA', name: 'DANA', sub: 'Bayar via DANA', icon: 'cash' },
  { id: 'Bank Transfer', name: 'Bank Transfer', sub: 'Mandiri, BCA, BNI, BRI', icon: 'business' },
  { id: 'Credit Card', name: 'Credit Card', sub: 'Visa, Mastercard, Amex', icon: 'card' },
] as const;

export const mapBookingStatus = (status: string) => {
  if (status === 'Paid') return 'Completed';
  if (status === 'Cancelled') return 'Cancelled';
  return 'Pending';
};

export const getStatusColor = (status: string) => {
  const mapped = mapBookingStatus(status);
  if (mapped === 'Completed') return COLORS.primary;
  if (mapped === 'Cancelled') return COLORS.error;
  return COLORS.warning;
};
