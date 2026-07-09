import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Modal, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { globalStore } from '../../src/store';
import { api } from '../../src/api/client';
import HotelCard from '../../src/components/HotelCard';
import CategoryChip from '../../src/components/CategoryChip';
import LoadingState from '../../src/components/LoadingState';

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
          {/* Header */}
          <View style={calStyles.header}>
            <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
              <Ionicons name="chevron-back" size={18} color="#43a08d" />
            </TouchableOpacity>
            <Text style={calStyles.monthTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
              <Ionicons name="chevron-forward" size={18} color="#43a08d" />
            </TouchableOpacity>
          </View>

          {/* Day labels */}
          <View style={calStyles.dayLabels}>
            {DAYS.map((d) => (<Text key={d} style={calStyles.dayLabel}>{d}</Text>))}
          </View>

          {/* Day grid */}
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

export default function SearchEngineScreen() {
  const [location, setLocation] = useState('Bali, Indonesia');
  const [recommendedHotels, setRecommendedHotels] = useState<any[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const formatShortDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const [checkInDate, setCheckInDate] = useState(today);
  const [checkOutDate, setCheckOutDate] = useState(tomorrow);
  const [guests, setGuests] = useState(2);
  const [showCheckInCal, setShowCheckInCal] = useState(false);
  const [showCheckOutCal, setShowCheckOutCal] = useState(false);

  const fetchRecommended = useCallback(async () => {
    setLoadingHotels(true);
    try {
      const data = await api.getHotels({});
      setRecommendedHotels(data.slice(0, 6));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHotels(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchRecommended();
  }, [fetchRecommended]));

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    router.push({
      pathname: '/search',
      params: {
        location,
        category,
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0],
        guests: guests.toString(),
      },
    });
  };

  const handleSearch = () => {
    router.push({
      pathname: '/search',
      params: { 
        location, 
        checkIn: checkInDate.toISOString().split('T')[0], 
        checkOut: checkOutDate.toISOString().split('T')[0], 
        guests: guests.toString() 
      }
    });
  };

  const handleDestinationPress = (dest: string) => {
    router.push({
      pathname: '/search',
      params: { 
        location: dest, 
        checkIn: checkInDate.toISOString().split('T')[0], 
        checkOut: checkOutDate.toISOString().split('T')[0], 
        guests: guests.toString() 
      }
    });
  };

  const handleCheckInSelect = (date: Date) => {
    setCheckInDate(date);
    // Auto-adjust checkout if it's before or equal to new checkin
    if (checkOutDate <= date) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOutDate(nextDay);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning ☀️</Text>
            <Text style={styles.userName}>{globalStore.userName}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={20} color="#43a08d" />
            </TouchableOpacity>
            <Image 
              source={{ uri: globalStore.avatarUrl || 'https://i.pravatar.cc/100?img=5' }} 
              style={styles.avatar}
            />
          </View>
        </View>

        {/* Search Card */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Where to next?</Text>

          <View style={styles.inputBox}>
            <Ionicons name="location-outline" size={20} color="#43a08d" style={styles.inputIcon} />
            <View>
              <Text style={styles.inputLabel}>DESTINATION</Text>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={[styles.inputBox, { flex: 1, marginRight: 10 }]} onPress={() => setShowCheckInCal(true)}>
              <Ionicons name="calendar-outline" size={20} color="#43a08d" style={styles.inputIcon} />
              <View>
                <Text style={styles.inputLabel}>CHECK-IN</Text>
                <Text style={styles.textInput}>{formatShortDate(checkInDate)}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.inputBox, { flex: 1 }]} onPress={() => setShowCheckOutCal(true)}>
              <Ionicons name="calendar-outline" size={20} color="#43a08d" style={styles.inputIcon} />
              <View>
                <Text style={styles.inputLabel}>CHECK-OUT</Text>
                <Text style={styles.textInput}>{formatShortDate(checkOutDate)}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="people-outline" size={20} color="#43a08d" style={styles.inputIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>GUESTS</Text>
              <Text style={styles.textInput}>{guests} Guests</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtnLight} onPress={() => setGuests(Math.max(1, guests-1))}>
                <Ionicons name="remove" size={16} color="#43a08d" />
              </TouchableOpacity>
              <Text style={styles.stepValue}>{guests}</Text>
              <TouchableOpacity style={styles.stepBtnDark} onPress={() => setGuests(guests+1)}>
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Ionicons name="search" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.searchBtnText}>Search Hotels</Text>
          </TouchableOpacity>
        </View>

        {/* Category Hotel */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 5 }}>
          <CategoryChip label="Hotel" icon="business-outline" active={selectedCategory === 'Hotel'} onPress={() => handleCategoryPress('Hotel')} />
          <CategoryChip label="Resort" icon="sunny-outline" active={selectedCategory === 'Resort'} onPress={() => handleCategoryPress('Resort')} />
          <CategoryChip label="Villa" icon="home-outline" active={selectedCategory === 'Villa'} onPress={() => handleCategoryPress('Villa')} />
          <CategoryChip label="Apartment" icon="layers-outline" active={selectedCategory === 'Apartment'} onPress={() => handleCategoryPress('Apartment')} />
        </ScrollView>

        {/* Recommended Hotels */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
          <TouchableOpacity onPress={handleSearch}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {loadingHotels ? (
          <LoadingState message="Loading hotels..." />
        ) : (
          <View style={{ paddingHorizontal: 20, paddingBottom: 15, paddingTop: 5 }}>
            {recommendedHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                variant="horizontal"
                onPress={() => router.push({
                  pathname: '/detail',
                  params: {
                    id: hotel.id,
                    checkIn: checkInDate.toISOString().split('T')[0],
                    checkOut: checkOutDate.toISOString().split('T')[0],
                    guests: guests.toString(),
                  },
                })}
              />
            ))}
          </View>
        )}

        <View style={{height: 100}} />
      </ScrollView>

      {/* Floating Chat Button */}
      <TouchableOpacity 
        style={styles.floatingChatBtn}
        onPress={() => router.push('/chat')}
      >
        <Ionicons name="chatbubbles" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Calendar Modals */}
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
        onSelectDate={(date: Date) => setCheckOutDate(date)}
        minDate={new Date(checkInDate.getTime() + 86400000)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fbfc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f4f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  searchCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 15,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  inputIcon: {
    marginRight: 10,
  },
  inputLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  textInput: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
    padding: 0,
  },
  row: {
    flexDirection: 'row',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtnLight: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#e8f4f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 12,
    color: '#111',
  },
  stepBtnDark: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#43a08d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtn: {
    backgroundColor: '#43a08d',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    marginTop: 5,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  seeAll: {
    fontSize: 13,
    color: '#43a08d',
    fontWeight: 'bold',
  },
  carousel: {
    marginBottom: 10,
  },

  headerSubtitle: {
    color: '#888',
    fontSize: 14,
  },
  floatingChatBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#43a08d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  }
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
