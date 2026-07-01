import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Modal, SafeAreaView, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';
import { formatCurrency, api } from '../src/api/client';
import { globalStore } from '../src/store';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  minDate?: Date;
}

function CalendarModal({ visible, onClose, onSelectDate, selectedDate, minDate }: CalendarModalProps) {
  const initial = selectedDate || new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else { setViewMonth(viewMonth - 1); }
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else { setViewMonth(viewMonth + 1); }
  };

  const today = new Date(); today.setHours(0,0,0,0);
  const minD = minDate ? new Date(minDate) : today;
  minD.setHours(0,0,0,0);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (day: number | null) => {
    if (!day || !selectedDate) return false;
    return selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth && selectedDate.getDate() === day;
  };

  const isDisabled = (day: number | null) => {
    if (!day) return true;
    const date = new Date(viewYear, viewMonth, day);
    return date < minD;
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={calStyles.overlay} onPress={onClose}>
        <Pressable style={calStyles.container} onPress={(e) => e.stopPropagation()}>
          <View style={calStyles.header}>
            <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
              <Ionicons name="chevron-back" size={18} color="#43a08d" />
            </TouchableOpacity>
            <Text style={calStyles.monthTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
              <Ionicons name="chevron-forward" size={18} color="#43a08d" />
            </TouchableOpacity>
          </View>

          <View style={calStyles.dayLabels}>
            {DAYS.map((d) => (<Text key={d} style={calStyles.dayLabel}>{d}</Text>))}
          </View>

          <View style={calStyles.grid}>
            {cells.map((day, idx) => (
              <TouchableOpacity
                key={idx}
                disabled={isDisabled(day)}
                onPress={() => { if (day) { onSelectDate(new Date(viewYear, viewMonth, day)); onClose(); } }}
                style={[
                  calStyles.cell,
                  isSelected(day) && calStyles.cellSelected,
                  isToday(day) && !isSelected(day) && calStyles.cellToday,
                ]}
              >
                <Text style={[
                  calStyles.cellText,
                  isDisabled(day) && calStyles.cellTextDisabled,
                  isSelected(day) && calStyles.cellTextSelected,
                ]}>{day || ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function CheckoutScreen() {
  const {
    roomId, hotelId, hotelName, roomName, price, checkIn, checkOut, guests, hotelImage,
  } = useLocalSearchParams();

  const [name, setName] = useState(globalStore.userName || '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roomCount, setRoomCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [currentBookingRes, setCurrentBookingRes] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (globalStore.userId) {
        try {
          const profile = await api.getUserProfile(globalStore.userId);
          setName(profile.name || globalStore.userName);
          setEmail(profile.email || '');
          setPhone(profile.phone || '');
        } catch {
          // use defaults
        }
      }
    };
    loadProfile();
  }, []);

  const initialCheckIn = Array.isArray(checkIn) ? checkIn[0] : (checkIn || new Date().toISOString());
  const initialCheckOut = Array.isArray(checkOut) ? checkOut[0] : (checkOut || new Date(Date.now() + 86400000).toISOString());

  const [checkInDate, setCheckInDate] = useState(new Date(initialCheckIn));
  const [checkOutDate, setCheckOutDate] = useState(new Date(initialCheckOut));
  const [showCheckInCal, setShowCheckInCal] = useState(false);
  const [showCheckOutCal, setShowCheckOutCal] = useState(false);

  const numPrice = Number(Array.isArray(price) ? price[0] : price) || 0;

  const handleCheckInSelect = (date: Date) => {
    setCheckInDate(date);
    if (checkOutDate <= date) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOutDate(nextDay);
    }
  };

  const nights = Math.max(1, Math.ceil(Math.abs(checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

  const roomTotal = numPrice * nights * roomCount;
  const resortFee = 50000 * roomCount;
  const taxes = (roomTotal + resortFee) * 0.11;
  const total = roomTotal + resortFee + taxes;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const handlePayment = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in all guest details.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (phone.length < 10) {
      Alert.alert('Error', 'Phone number must be at least 10 digits');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        user_id: globalStore.userId,
        hotel_id: Number(String(hotelId)),
        room_id: Number(String(roomId)),
        check_in: checkInDate.toISOString().split('T')[0],
        check_out: checkOutDate.toISOString().split('T')[0],
        total_price: total,
        room_count: roomCount,
        guest_name: name.trim(),
        guest_email: email.trim(),
        guest_phone: phone.trim(),
      };

      const bookingRes = await api.addBooking(bookingData);

      if (bookingRes.success) {
        if (bookingRes.redirect_url) {
          setLoading(false);
          setCurrentBookingRes(bookingRes);
          setPaymentUrl(bookingRes.redirect_url);
        } else {
          // Fallback simulation (Midtrans misconfigured)
          await new Promise((r) => setTimeout(r, 1500));
          const payRes = await api.createPayment({
            booking_id: bookingRes.booking_id,
            method: 'Midtrans Simulation',
            amount: total,
          });

          if (payRes.success) {
            setLoading(false);
            router.replace({
              pathname: '/ticket',
              params: {
                bookingId: String(bookingRes.booking_id),
                hotelName: String(hotelName || ''),
                guestName: name.trim(),
                checkIn: checkInDate.toISOString().split('T')[0],
                checkOut: checkOutDate.toISOString().split('T')[0],
                totalPrice: String(total),
                paymentMethod: 'Midtrans Simulation',
              },
            });
          }
        }
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Booking Failed', error.message || 'Room might not be available.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={18} color="#43a08d" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Booking Form</Text>
          <Text style={styles.headerSubtitle}>Review your booking</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.guestSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={16} color="#43a08d" />
            <Text style={styles.sectionTitle}>Guest Details</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Guest name" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PHONE NUMBER</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="081234567890" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CHECK-IN DATE</Text>
            <TouchableOpacity style={styles.dateBox} onPress={() => setShowCheckInCal(true)}>
              <Ionicons name="calendar-outline" size={16} color="#43a08d" />
              <Text style={styles.dateText}>{formatDate(checkInDate.toISOString())}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CHECK-OUT DATE</Text>
            <TouchableOpacity style={styles.dateBox} onPress={() => setShowCheckOutCal(true)}>
              <Ionicons name="calendar-outline" size={16} color="#43a08d" />
              <Text style={styles.dateText}>{formatDate(checkOutDate.toISOString())}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NUMBER OF ROOMS</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setRoomCount(Math.max(1, roomCount - 1))}>
                <Ionicons name="remove" size={16} color="#43a08d" />
              </TouchableOpacity>
              <Text style={styles.stepValue}>{roomCount} Room{roomCount > 1 ? 's' : ''}</Text>
              <TouchableOpacity style={[styles.stepBtn, styles.stepBtnDark]} onPress={() => setRoomCount(roomCount + 1)}>
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.hotelPreview}>
            <Image
              source={{ uri: String(hotelImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200') }}
              style={styles.previewImg}
            />
            <View style={styles.previewContent}>
              <Text style={styles.previewName}>{hotelName}</Text>
              <Text style={styles.previewRoom}>{roomName}</Text>
              <Text style={styles.previewIconText}>{nights} nights · {guests || 2} guests</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Room ({nights} nights × {roomCount} × {formatCurrency(numPrice)})</Text>
            <Text style={styles.priceValue}>{formatCurrency(roomTotal)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Resort fee</Text>
            <Text style={styles.priceValue}>{formatCurrency(resortFee)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Taxes & fees (11%)</Text>
            <Text style={styles.priceValue}>{formatCurrency(taxes)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRowTotal}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>
        <View style={{ height: 180 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.bottomLabel}>Total to pay</Text>
            <Text style={styles.bottomTotal}>{formatCurrency(total)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.continueBtn} onPress={handlePayment} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.continueText}>Bayar Sekarang</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Midtrans Popup Modal */}
      <Modal visible={!!paymentUrl || isProcessingPayment} animationType="slide" onRequestClose={() => {
        setPaymentUrl(null);
        setIsProcessingPayment(false);
        if (currentBookingRes) {
          router.replace('/(tabs)/bookings');
        }
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
                      Selesaikan Pembayaran Anda
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 30, textAlign: 'center', lineHeight: 20 }}>
                      Karena keterbatasan platform Web, silakan selesaikan pembayaran di tab baru. Setelah selesai, kembali ke halaman ini dan cek status Anda.
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
                        if (currentBookingRes) {
                          router.replace('/(tabs)/bookings');
                        }
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
                        // Trigger logic directly to guarantee execution before native load
                        if (url.includes('transaction_status=settlement') || url.includes('transaction_status=capture') || url.includes('status_code=200')) {
                          setIsProcessingPayment(true);
                          setPaymentUrl(null);
                          if (currentBookingRes) {
                            setTimeout(() => {
                              api.payBooking(currentBookingRes.booking_id).then(() => {
                                setIsProcessingPayment(false);
                                router.replace({
                                  pathname: '/ticket',
                                  params: {
                                    bookingId: String(currentBookingRes.booking_id),
                                    hotelName: String(hotelName || ''),
                                    guestName: name.trim(),
                                    checkIn: checkInDate.toISOString().split('T')[0],
                                    checkOut: checkOutDate.toISOString().split('T')[0],
                                    totalPrice: String(total),
                                    paymentMethod: 'Midtrans',
                                  },
                                });
                              }).catch(() => {
                                setIsProcessingPayment(false);
                                router.replace({
                                  pathname: '/ticket',
                                  params: {
                                    bookingId: String(currentBookingRes.booking_id),
                                    hotelName: String(hotelName || ''),
                                    guestName: name.trim(),
                                    checkIn: checkInDate.toISOString().split('T')[0],
                                    checkOut: checkOutDate.toISOString().split('T')[0],
                                    totalPrice: String(total),
                                    paymentMethod: 'Midtrans',
                                  },
                                });
                              });
                            }, 1500);
                          } else {
                            setIsProcessingPayment(false);
                          }
                        } else if (url.includes('transaction_status=pending') || url.includes('status_code=201')) {
                          setPaymentUrl(null);
                          if (currentBookingRes) {
                            Alert.alert('Menunggu Pembayaran', 'Silakan selesaikan instruksi pembayaran. Anda bisa mengecek statusnya di menu Pesanan.');
                            router.replace('/(tabs)/bookings');
                          }
                        } else if (url.includes('transaction_status=') || url.includes('status_code=')) {
                          setPaymentUrl(null);
                          if (currentBookingRes) {
                            Alert.alert('Pembayaran Gagal/Dibatalkan', 'Silakan coba lagi atau cek status di menu Pesanan.');
                            router.replace('/(tabs)/bookings');
                          }
                        }
                        return false; // Secara native MENGHENTIKAN browser memuat URL ini
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
                  if (currentBookingRes) {
                    Alert.alert('Info', 'Anda menutup halaman pembayaran. Cek status di menu Pesanan.');
                    router.replace('/(tabs)/bookings');
                  }
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              </>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Date Pickers */}
      <CalendarModal
        visible={showCheckInCal}
        onClose={() => setShowCheckInCal(false)}
        selectedDate={checkInDate}
        onSelectDate={handleCheckInSelect}
      />
      <CalendarModal
        visible={showCheckOutCal}
        onClose={() => setShowCheckOutCal(false)}
        selectedDate={checkOutDate}
        onSelectDate={setCheckOutDate}
        minDate={new Date(checkInDate.getTime() + 86400000)} // Minimum checkout is 1 day after checkin
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fbfc' },
  header: { paddingTop: 50, paddingHorizontal: 25, paddingBottom: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#e8f4f1', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  headerSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  scrollContent: { padding: 20 },
  guestSection: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', marginLeft: 8 },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#111', marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eaeaea', borderRadius: 12, padding: 15, fontSize: 14, color: '#333' },
  dateBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#eaeaea', borderRadius: 12, padding: 15, gap: 8 },
  dateText: { fontSize: 14, fontWeight: '600', color: '#111' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#eaeaea', borderRadius: 12, padding: 12 },
  stepBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#e8f4f1', justifyContent: 'center', alignItems: 'center' },
  stepBtnDark: { backgroundColor: '#43a08d' },
  stepValue: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: '#111' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 15 },
  hotelPreview: { flexDirection: 'row', backgroundColor: '#f9fbfc', padding: 10, borderRadius: 16, marginBottom: 20 },
  previewImg: { width: 60, height: 60, borderRadius: 10 },
  previewContent: { flex: 1, paddingLeft: 12, justifyContent: 'center' },
  previewName: { fontSize: 14, fontWeight: 'bold', color: '#111', marginBottom: 2 },
  previewRoom: { fontSize: 11, color: '#666', marginBottom: 4 },
  previewIconText: { fontSize: 10, color: '#888' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceLabel: { fontSize: 13, color: '#666', flex: 1, marginRight: 8 },
  priceValue: { fontSize: 13, fontWeight: 'bold', color: '#111' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 15 },
  priceRowTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#43a08d' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 35, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  bottomLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  bottomTotal: { fontSize: 20, fontWeight: '900', color: '#111' },
  continueBtn: { flexDirection: 'row', backgroundColor: '#43a08d', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  continueText: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginRight: 8 },
  floatingCloseBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: '#fff', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
});

const calStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#e8f4f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  dayLabels: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#888',
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  cellSelected: {
    backgroundColor: '#43a08d',
  },
  cellToday: {
    backgroundColor: '#e8f4f1',
  },
  cellText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  cellTextDisabled: {
    color: '#ddd',
  },
  cellTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
