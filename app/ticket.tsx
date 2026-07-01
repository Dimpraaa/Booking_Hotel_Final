import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { formatCurrency } from '../src/api/client';
import { globalStore } from '../src/store';

export default function TicketScreen() {
  const params = useLocalSearchParams();
  const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';

  const bookingId = str(params.bookingId as string);
  const hotelName = str(params.hotelName as string);
  const guestName = str(params.guestName as string) || globalStore.userName;
  const checkIn = str(params.checkIn as string);
  const checkOut = str(params.checkOut as string);
  const totalPrice = Number(str(params.totalPrice as string)) || 0;
  const paymentMethod = str(params.paymentMethod as string);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const bookingCode = `SL-${bookingId.padStart(5, '0')}`;
  const qrValue = JSON.stringify({
    bookingId,
    hotel: hotelName,
    guest: guestName,
    checkIn,
    checkOut,
    total: totalPrice,
  });

  const isPending = paymentMethod === 'Pending';

  return (
    <View style={[styles.container, isPending && { backgroundColor: '#f39c12' }]}>
      <View style={styles.header}>
        <View style={styles.successIcon}>
          <Ionicons name={isPending ? "time-outline" : "checkmark-circle"} size={64} color={isPending ? "#fff" : "#43a08d"} />
        </View>
        <Text style={styles.successTitle}>{isPending ? 'Menunggu Pembayaran' : 'Pembayaran Berhasil!'}</Text>
        <Text style={styles.successSub}>{isPending ? 'Selesaikan pembayaran untuk tiket ini' : 'E-Ticket Anda siap digunakan'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.ticket}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketEyebrow}>E-TICKET / VOUCHER</Text>
            <Text style={styles.hotelName}>{hotelName}</Text>
          </View>

          <View style={styles.cutoutRow}>
            <View style={styles.cutoutLeft} />
            <View style={styles.cutoutLine} />
            <View style={styles.cutoutRight} />
          </View>

          <View style={styles.ticketBody}>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>NOMOR BOOKING</Text>
                <Text style={styles.infoValue}>{bookingCode}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>NAMA TAMU</Text>
                <Text style={styles.infoValue}>{guestName}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>CHECK-IN</Text>
                <Text style={styles.infoValue}>{formatDate(checkIn)}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>CHECK-OUT</Text>
                <Text style={styles.infoValue}>{formatDate(checkOut)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>TOTAL PEMBAYARAN</Text>
                <Text style={[styles.infoValue, { color: '#43a08d' }]}>{formatCurrency(totalPrice)}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>METODE</Text>
                <Text style={styles.infoValue}>{paymentMethod}</Text>
              </View>
            </View>

            <View style={styles.qrSection}>
              <View style={styles.qrFrame}>
                <QRCode value={qrValue} size={140} color="#111" backgroundColor="#fff" />
              </View>
              <Text style={styles.scanText}>Scan QR Code saat check-in</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/bookings')}>
          <Text style={styles.primaryBtnText}>Lihat Riwayat Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.secondaryBtnText}>Kembali ke Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#43a08d' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  successIcon: { marginBottom: 10 },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 6 },
  successSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  scroll: { padding: 25, paddingBottom: 50 },
  ticket: { marginBottom: 20 },
  ticketHeader: { backgroundColor: '#358a78', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25 },
  ticketEyebrow: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  hotelName: { color: '#fff', fontSize: 20, fontWeight: '900' },
  cutoutRow: { flexDirection: 'row', alignItems: 'center', height: 30, backgroundColor: '#fff', position: 'relative' },
  cutoutLeft: { position: 'absolute', left: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: '#43a08d' },
  cutoutRight: { position: 'absolute', right: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: '#43a08d' },
  cutoutLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#eaeaea', marginHorizontal: 30 },
  ticketBody: { backgroundColor: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, padding: 25, paddingTop: 10 },
  infoRow: { flexDirection: 'row', marginBottom: 18 },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 10, color: '#888', fontWeight: 'bold', marginBottom: 4 },
  infoValue: { fontSize: 13, fontWeight: 'bold', color: '#111' },
  qrSection: { alignItems: 'center', marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', borderStyle: 'dashed' },
  qrFrame: { padding: 12, borderRadius: 16, borderWidth: 2, borderColor: '#43a08d', marginBottom: 12 },
  scanText: { fontSize: 12, color: '#666' },
  primaryBtn: { backgroundColor: '#fff', borderRadius: 30, height: 52, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#333', fontSize: 15, fontWeight: 'bold' },
  secondaryBtn: { borderRadius: 30, height: 52, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  secondaryBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
