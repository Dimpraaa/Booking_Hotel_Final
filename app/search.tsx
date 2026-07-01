import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, formatCurrency } from '../src/api/client';

export default function SearchResultsScreen() {
  const { location, checkIn, checkOut, guests, category } = useLocalSearchParams();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const initialCategory = Array.isArray(category) ? category[0] : (category || 'All');
  const [appliedCategory, setAppliedCategory] = useState(initialCategory);
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | null>(null);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(null);
  const [appliedMinRating, setAppliedMinRating] = useState<number | null>(null);
  const [appliedSort, setAppliedSort] = useState<string>('');

  // Temporary filter states for the modal
  const [tempCategory, setTempCategory] = useState('All');
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const [tempMinRating, setTempMinRating] = useState<number | null>(null);
  const [tempSort, setTempSort] = useState<string>('');

  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
        const locStr = Array.isArray(location) ? location[0] : (location || '');
        const filters: any = {};
        if (locStr) filters.location = locStr;
        if (appliedCategory && appliedCategory !== 'All') filters.category = appliedCategory;
        if (appliedMinPrice !== null) filters.min_price = appliedMinPrice;
        if (appliedMaxPrice !== null) filters.max_price = appliedMaxPrice;
        if (appliedMinRating !== null) filters.rating = appliedMinRating;
        if (appliedSort) filters.sort = appliedSort;

        const data = await api.getHotels(filters);
        setHotels(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, [location, appliedCategory, appliedMinPrice, appliedMaxPrice, appliedMinRating, appliedSort]);

  const handleOpenFilter = () => {
    setTempCategory(appliedCategory);
    setTempMinPrice(appliedMinPrice ? appliedMinPrice.toString() : '');
    setTempMaxPrice(appliedMaxPrice ? appliedMaxPrice.toString() : '');
    setTempMinRating(appliedMinRating);
    setTempSort(appliedSort);
    setShowFilterModal(true);
  };

  const handleApplyFilter = () => {
    setAppliedCategory(tempCategory);
    setAppliedMinPrice(tempMinPrice ? Number(tempMinPrice) : null);
    setAppliedMaxPrice(tempMaxPrice ? Number(tempMaxPrice) : null);
    setAppliedMinRating(tempMinRating);
    setAppliedSort(tempSort);
    setShowFilterModal(false);
  };

  const handleResetFilter = () => {
    setTempCategory('All');
    setTempMinPrice('');
    setTempMaxPrice('');
    setTempMinRating(null);
    setTempSort('');
  };

  const renderHotelCard = ({ item, index }: { item: any; index: number }) => {
    const badges = ['Bestseller', 'Top Rated', 'Eco Award', 'Popular'];
    const badge = badges[index % badges.length];

    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image_url }} style={styles.cardImage} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.hotelName} numberOfLines={1}>{item.name}</Text>
          
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#fbb03b" />
            <Text style={styles.ratingText}>{item.rating} <Text style={styles.reviewText}>(1.2k)</Text></Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#888" />
            <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatCurrency(item.price_starts_at)}<Text style={styles.nightText}>/night</Text></Text>
            <TouchableOpacity 
              style={styles.bookBtn}
              onPress={() => router.push({
                pathname: '/detail',
                params: { id: item.id, checkIn, checkOut, guests }
              })}
            >
              <Text style={styles.bookBtnText}>Book</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const locText = Array.isArray(location) ? location[0] : (location || 'Anywhere');
  const guestsNum = Array.isArray(guests) ? guests[0] : (guests || '2');

  return (
    <View style={styles.container}>
      
      {/* Header Area */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={18} color="#43a08d" />
          </TouchableOpacity>
          <View style={styles.headerInfoBox}>
            <Text style={styles.headerTitle}>{locText}</Text>
            <Text style={styles.headerSubtitle}>{guestsNum} Guests</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterBtn, (appliedCategory !== 'All' || appliedMinPrice !== null || appliedMaxPrice !== null || appliedMinRating !== null) && styles.filterBtnActiveBorder]} 
            onPress={handleOpenFilter}
          >
            <Ionicons name="options-outline" size={16} color="#43a08d" />
            <Text style={styles.filterBtnTextActive}>Filters</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <View style={styles.foundBadge}>
            <Text style={styles.foundText}>{hotels.length} found</Text>
          </View>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#43a08d" />
        </View>
      ) : (
        <FlatList
          data={hotels}
          keyExtractor={item => item.id.toString()}
          renderItem={renderHotelCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No Hotels Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your filters or search location</Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.capsuleRow}>
                {['All', 'Hotel', 'Resort', 'Villa', 'Apartment'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.capsule, tempCategory === cat && styles.capsuleActive]}
                    onPress={() => setTempCategory(cat)}
                  >
                    <Text style={[styles.capsuleText, tempCategory === cat && styles.capsuleTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
              <View style={styles.capsuleRow}>
                {[(null), 4.0, 4.5, 4.8].map((rate) => {
                  const label = rate === null ? 'Any' : `${rate}★ & up`;
                  return (
                    <TouchableOpacity
                      key={rate === null ? 'any' : rate}
                      style={[styles.capsule, tempMinRating === rate && styles.capsuleActive]}
                      onPress={() => setTempMinRating(rate)}
                    >
                      <Text style={[styles.capsuleText, tempMinRating === rate && styles.capsuleTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.filterSectionTitle}>Price Range per Night</Text>
              <View style={styles.priceInputRow}>
                <View style={styles.priceInputBox}>
                  <Text style={styles.priceInputLabel}>Min Price (Rp)</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="e.g. 1000000"
                    keyboardType="numeric"
                    value={tempMinPrice}
                    onChangeText={setTempMinPrice}
                  />
                </View>
                <View style={styles.priceInputBox}>
                  <Text style={styles.priceInputLabel}>Max Price (Rp)</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="e.g. 5000000"
                    keyboardType="numeric"
                    value={tempMaxPrice}
                    onChangeText={setTempMaxPrice}
                  />
                </View>
              </View>

              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.capsuleRow}>
                {[
                  { value: '', label: 'Recommended' },
                  { value: 'price_asc', label: 'Lowest Price' },
                  { value: 'price_desc', label: 'Highest Price' },
                  { value: 'rating_desc', label: 'Top Rated' }
                ].map((sortOption) => (
                  <TouchableOpacity
                    key={sortOption.value}
                    style={[styles.capsule, tempSort === sortOption.value && styles.capsuleActive]}
                    onPress={() => setTempSort(sortOption.value)}
                  >
                    <Text style={[styles.capsuleText, tempSort === sortOption.value && styles.capsuleTextActive]}>{sortOption.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilter}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyFilter}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fbfc',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#e8f4f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerInfoBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eaeaea',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#43a08d',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  filterBtnTextActive: {
    color: '#43a08d',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaeaea',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  filterBtnActiveBorder: {
    borderColor: '#43a08d',
    backgroundColor: '#e8f4f1',
  },
  filterBtnText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
  foundBadge: {
    borderWidth: 1,
    borderColor: '#eaeaea',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  foundText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#43a08d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  hotelName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111',
    marginLeft: 4,
  },
  reviewText: {
    color: '#888',
    fontWeight: 'normal',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: '#43a08d',
  },
  nightText: {
    fontSize: 10,
    color: '#888',
    fontWeight: 'normal',
  },
  bookBtn: {
    backgroundColor: '#43a08d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 35,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  modalBody: {
    paddingBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 15,
    marginBottom: 10,
  },
  capsuleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  capsule: {
    borderWidth: 1.5,
    borderColor: '#eaeaea',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  capsuleActive: {
    borderColor: '#43a08d',
    backgroundColor: '#e8f4f1',
  },
  capsuleText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  capsuleTextActive: {
    color: '#43a08d',
    fontWeight: 'bold',
  },
  priceInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceInputBox: {
    width: '48%',
  },
  priceInputLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 5,
  },
  priceInput: {
    borderWidth: 1.5,
    borderColor: '#eaeaea',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
    marginTop: 15,
  },
  resetBtn: {
    width: '30%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#eaeaea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  applyBtn: {
    width: '65%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#43a08d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
