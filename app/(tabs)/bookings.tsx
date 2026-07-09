import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, SafeAreaView } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';
import { api, formatCurrency } from '../../src/api/client';
import { globalStore } from '../../src/store';
import { mapBookingStatus, getStatusColor } from '../../src/constants/theme';
import { Picker } from '@react-native-picker/picker';
import EmptyState from '../../src/components/EmptyState';

const formatPaymentMethod = (typeStr: string) => {
  if (!typeStr || typeStr === 'midtrans' || typeStr === 'Midtrans') return 'Paid via Midtrans';
  
  let type = typeStr.toLowerCase();
  
  const map: Record<string, string> = {
    'credit_card': 'Kartu Kredit',
    'bca_va': 'BCA VA',
    'bni_va': 'BNI VA',
    'bri_va': 'BRI VA',
    'permata_va': 'Permata VA',
    'cimb_va': 'CIMB VA',
    'other_va': 'Other VA',
    'bank_transfer': 'Bank Transfer (VA)',
    'echannel': 'Mandiri VA',
    'gopay': 'GoPay',
    'shopeepay': 'ShopeePay',
    'qris': 'QRIS',
    'cstore': 'Minimarket',
    'akulaku': 'Akulaku Paylater',
    'alfamart': 'Alfamart',
    'indomaret': 'Indomaret'
  };
  
  return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const userId = globalStore.userId;

  const fetchBookings = async () => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getBookings(userId);
      setBookings(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchBookings();
  }, [userId]));

  const handleDelete = (id: number) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await api.deleteBooking(id);
            if (response.success) {
              Alert.alert('Success', 'Booking cancelled');
              fetchBookings();
            }
          } catch {
            Alert.alert('Error', 'Failed to cancel booking');
          }
        },
      },
    ]);
  };

  const openTicket = (item: any) => {
    if (item.status === 'Cancelled') return;
    router.push({
      pathname: '/ticket',
      params: {
        bookingId: String(item.id),
        hotelName: item.hotel_name,
        guestName: item.guest_name || globalStore.userName,
        checkIn: item.check_in_date,
        checkOut: item.check_out_date,
        totalPrice: String(item.total_price),
        paymentMethod: item.status === 'Paid' ? formatPaymentMethod(item.payment_method || 'Midtrans') : 'Pending',
      },
    });
  };

  const renderTicket = ({ item }: { item: any }) => {
    const formatDate = (dateStr: string) =>
      new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const isCancelled = item.status === 'Cancelled';
    const isPending = item.status === 'Pending';
    const displayStatus = mapBookingStatus(item.status);
    const statusColor = getStatusColor(item.status);
    const bookingCode = `SL-${item.id.toString().padStart(5, '0')}`;
    const qrValue = JSON.stringify({ bookingId: item.id, hotel: item.hotel_name, guest: item.guest_name });

    const handleContinuePayment = () => {
      if (item.payment_url) {
        setSelectedBookingId(item.id);
        setPaymentUrl(item.payment_url);
      } else {
        Alert.alert('Error', 'Link pembayaran tidak ditemukan.');
      }
    };

    return (
      <TouchableOpacity style={styles.ticketWrapper} onPress={() => openTicket(item)} activeOpacity={0.9}>
        <View style={[styles.ticketTop, isCancelled && { backgroundColor: '#666' }]}>
          <View style={styles.ticketTopContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>E-TICKET</Text>
              <Text style={styles.hotelName} numberOfLines={1}>{item.hotel_name}</Text>
              <Text style={styles.hotelLoc} numberOfLines={1}>{item.room_type || item.room_name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{displayStatus}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cutoutRow}>
          <View style={styles.cutoutLeft} />
          <View style={styles.cutoutLine} />
          <View style={styles.cutoutRight} />
        </View>

        <View style={styles.ticketBottom}>
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>BOOKING ID</Text>
              <Text style={styles.infoValue}>{bookingCode}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>TOTAL</Text>
              <Text style={[styles.infoValue, { color: '#43a08d' }]}>{formatCurrency(item.total_price)}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>CHECK-IN</Text>
              <Text style={styles.infoValue}>{formatDate(item.check_in_date)}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>CHECK-OUT</Text>
              <Text style={styles.infoValue}>{formatDate(item.check_out_date)}</Text>
            </View>
          </View>

          {!isCancelled && item.status === 'Paid' && (
            <View style={styles.qrSection}>
              <View style={styles.qrFrame}>
                <QRCode value={qrValue} size={80} color="#111" backgroundColor="#fff" />
              </View>
              <Text style={styles.scanText}>Tap to view full ticket</Text>
            </View>
          )}
        </View>

        {!isCancelled ? (
          <View style={styles.actionsRow}>
            {isPending ? (
              <TouchableOpacity style={[styles.downloadBtn, { borderColor: '#f39c12', backgroundColor: '#fdf3e6' }]} onPress={handleContinuePayment}>
                <Ionicons name="card-outline" size={16} color="#e67e22" />
                <Text style={[styles.downloadText, { color: '#e67e22' }]}>Bayar Sekarang</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.downloadBtn} onPress={() => openTicket(item)}>
                <Ionicons name="ticket-outline" size={16} color="#43a08d" />
                <Text style={styles.downloadText}>View Ticket</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleDelete(item.id)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cancelledBadge}>
            <Text style={styles.cancelledText}>This booking has been cancelled.</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#43a08d" />
        </View>
      ) : bookings.length === 0 ? (
        <EmptyState icon="ticket-outline" title="No bookings yet" subtitle="Book a hotel to see your history here" light />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTicket}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Midtrans Popup Modal */}
      <Modal visible={!!paymentUrl || isProcessingPayment} animationType="slide" onRequestClose={() => {
        setPaymentUrl(null);
        setIsProcessingPayment(false);
        fetchBookings(); // refresh status
      }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flex: 1 }}>
            {isProcessingPayment ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#43a08d" />
                <Text style={{ marginTop: 15, fontSize: 16, fontWeight: 'bold', color: '#333' }}>Memverifikasi Pembayaran...</Text>
              </View>
            ) : paymentUrl ? (
              <>
                {Platform.OS === 'web' ? (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
                    <Ionicons name="card-outline" size={60} color="#43a08d" style={{ marginBottom: 20 }} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' }}>
                      Lanjutkan Pembayaran
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 30, textAlign: 'center', lineHeight: 20 }}>
                      Silakan selesaikan pembayaran di tab baru. Setelah selesai, tutup tab tersebut dan klik tombol Cek Status di bawah.
                    </Text>
                    <TouchableOpacity 
                      style={{ backgroundColor: '#43a08d', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, marginBottom: 15, width: '100%', alignItems: 'center' }}
                      onPress={() => window.open(paymentUrl, '_blank')}
                    >
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Buka Tab Pembayaran</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{ backgroundColor: '#f5f5f5', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center' }}
                      onPress={() => {
                        setPaymentUrl(null);
                        fetchBookings();
                      }}
                    >
                      <Text style={{ color: '#333', fontSize: 16, fontWeight: '600' }}>Tutup & Cek Status Pesanan</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <WebView 
                    source={{ uri: paymentUrl }} 
                    style={{ flex: 1 }} 
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    injectedJavaScript={`
                      if (window.location.href.includes('example.com')) {
                        document.documentElement.style.display = 'none';
                      }
                      true;
                    `}
                    onShouldStartLoadWithRequest={(request) => {
                      const url = request.url;
                      if (url.includes('example.com') || url.includes('transaction_status=') || url.includes('status_code=')) {
                        if (url.includes('transaction_status=settlement') || url.includes('transaction_status=capture') || url.includes('status_code=200')) {
                          setIsProcessingPayment(true);
                          setPaymentUrl(null);
                          
                          const orderIdMatch = url.match(/[?&]order_id=([^&]+)/);
                          const orderId = orderIdMatch ? orderIdMatch[1] : undefined;

                          if (selectedBookingId) {
                            setTimeout(() => {
                              api.payBooking(selectedBookingId, orderId).then((res) => {
                                setIsProcessingPayment(false);
                                const bk = bookings.find(b => b.id === selectedBookingId);
                                if (bk) {
                                  router.replace({
                                    pathname: '/ticket',
                                    params: {
                                      bookingId: String(bk.id),
                                      hotelName: String(bk.hotel_name || ''),
                                      guestName: bk.guest_name || globalStore.userName,
                                      checkIn: bk.check_in_date,
                                      checkOut: bk.check_out_date,
                                      totalPrice: String(bk.total_price),
                                      paymentMethod: formatPaymentMethod(res.paymentMethod || 'Midtrans'),
                                    }
                                  });
                                } else {
                                  fetchBookings();
                                }
                              }).catch(() => {
                                setIsProcessingPayment(false);
                                const bk = bookings.find(b => b.id === selectedBookingId);
                                if (bk) {
                                  router.replace({
                                    pathname: '/ticket',
                                    params: {
                                      bookingId: String(bk.id),
                                      hotelName: String(bk.hotel_name || ''),
                                      guestName: bk.guest_name || globalStore.userName,
                                      checkIn: bk.check_in_date,
                                      checkOut: bk.check_out_date,
                                      totalPrice: String(bk.total_price),
                                      paymentMethod: 'Paid via Midtrans',
                                    }
                                  });
                                } else {
                                  fetchBookings();
                                }
                              });
                            }, 1500);
                          } else {
                            setIsProcessingPayment(false);
                            fetchBookings();
                          }
                        } else if (url.includes('transaction_status=pending') || url.includes('status_code=201')) {
                          setPaymentUrl(null);
                          if (selectedBookingId) {
                            Alert.alert('Menunggu Pembayaran', 'Silakan selesaikan instruksi pembayaran.');
                            fetchBookings();
                          }
                        } else if (url.includes('transaction_status=') || url.includes('status_code=')) {
                          setPaymentUrl(null);
                          fetchBookings();
                        }
                        return false;
                      }
                      return true;
                    }}
                    onNavigationStateChange={(navState) => {
                      const url = navState.url;
                      if (url.includes('example.com') || url.includes('transaction_status=')) {
                        setPaymentUrl(null);
                      }
                    }}
                  />
                )}
                <TouchableOpacity 
                  style={styles.floatingCloseBtn} 
                  onPress={() => {
                    setPaymentUrl(null);
                    fetchBookings();
                  }}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#43a08d' },
  header: { paddingTop: 60, paddingBottom: 20, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  listContainer: { padding: 25, paddingBottom: 100 },
  ticketWrapper: { marginBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  ticketTop: { backgroundColor: '#358a78', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25 },
  ticketTopContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  hotelName: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 4 },
  hotelLoc: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  cutoutRow: { flexDirection: 'row', alignItems: 'center', height: 30, backgroundColor: '#fff', position: 'relative' },
  cutoutLeft: { position: 'absolute', left: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: '#43a08d' },
  cutoutRight: { position: 'absolute', right: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: '#43a08d' },
  cutoutLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#eaeaea', marginHorizontal: 30 },
  ticketBottom: { backgroundColor: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, padding: 25, paddingTop: 10 },
  infoGrid: { flexDirection: 'row', marginBottom: 20 },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 10, color: '#888', fontWeight: 'bold', marginBottom: 4 },
  infoValue: { fontSize: 13, color: '#111', fontWeight: 'bold' },
  qrSection: { alignItems: 'center', marginTop: 5 },
  qrFrame: { padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#43a08d', marginBottom: 8 },
  scanText: { fontSize: 11, color: '#666' },
  actionsRow: { flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' },
  downloadBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#43a08d', borderRadius: 30, height: 50, marginRight: 10 },
  downloadText: { color: '#43a08d', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
  cancelBtn: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ff4d4f', borderRadius: 30, height: 50, paddingHorizontal: 20 },
  cancelText: { color: '#ff4d4f', fontWeight: 'bold', fontSize: 13 },
  cancelledBadge: { marginTop: 20, backgroundColor: '#ffebeb', padding: 15, borderRadius: 15, alignItems: 'center' },
  cancelledText: { color: '#ff4d4f', fontWeight: 'bold', fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  floatingCloseBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: '#fff', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
});
