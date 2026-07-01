import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, formatCurrency } from '../src/api/client';
import { globalStore } from '../src/store';

export default function DetailScreen() {
  const { id, checkIn, checkOut, guests } = useLocalSearchParams();
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0]);
    }
  }, [rooms]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hotelDetails = await api.getHotelDetails(id, globalStore.userId);
        setHotel(hotelDetails);
        setIsFavorited(hotelDetails.is_favorited);
        setReviews(hotelDetails.reviews || []);

        const cIn = checkIn || new Date().toISOString().split('T')[0];
        const cOut = checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const roomsData = await api.getHotelRooms(id, cIn, cOut);
        setRooms(roomsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, checkIn, checkOut]);

  const handleToggleFavorite = async () => {
    try {
      const response = await api.toggleFavorite(id, globalStore.userId);
      setIsFavorited(response.is_favorited);
      Alert.alert('Favorite', response.message);
    } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to toggle favorite');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#43a08d" />
      </View>
    );
  }

  if (!hotel) return <Text>Hotel not found</Text>;

  const defaultPrice = selectedRoom ? selectedRoom.price : (rooms.length > 0 ? rooms[0].price : 0);

  const handleSelectRoom = () => {
    const room = selectedRoom || (rooms.length > 0 ? rooms[0] : null);
    if (room) {
      router.push({
        pathname: '/checkout',
        params: {
          roomId: room.id,
          hotelId: id,
          hotelName: hotel.name,
          roomName: room.room_name,
          price: room.price,
          checkIn,
          checkOut,
          guests,
          hotelImage: hotel.image_url,
        },
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      Alert.alert('Error', 'Please write a comment');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.addReview(id, { user_id: globalStore.userId, rating: reviewRating, comment: reviewComment });
      Alert.alert('Success', 'Review submitted successfully!');
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
      // Refresh hotel details to get updated reviews
      const hotelDetails = await api.getHotelDetails(id, globalStore.userId);
      setHotel(hotelDetails);
      setReviews(hotelDetails.reviews || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: hotel.image_url }} style={styles.heroImage} />
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color="#111" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} onPress={handleToggleFavorite}>
              <Ionicons name={isFavorited ? "heart" : "heart-outline"} size={20} color={isFavorited ? "#ff4d4f" : "#111"} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.imageOverlayBottom}>
            <View style={styles.pagination}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
            <View style={styles.photoCountBadge}>
              <Ionicons name="images-outline" size={10} color="#fff" style={{marginRight: 4}} />
              <Text style={styles.photoCountText}>1/3</Text>
            </View>
          </View>
        </View>

        {/* Content Sheet */}
        <View style={styles.contentSheet}>
          
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="#43a08d" />
            <Text style={styles.featuredText}>Featured Hotel</Text>
          </View>

          <Text style={styles.hotelName}>{hotel.name}</Text>
          
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#fbb03b" />
            <Ionicons name="star" size={14} color="#fbb03b" />
            <Ionicons name="star" size={14} color="#fbb03b" />
            <Ionicons name="star" size={14} color="#fbb03b" />
            <Ionicons name="star" size={14} color="#fbb03b" />
            <Text style={styles.ratingScore}>{hotel.rating}</Text>
            <Text style={styles.ratingReviews}>({reviews.length} reviews)</Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#43a08d" />
            <Text style={styles.locationText}>{hotel.location}</Text>
          </View>

          {/* Map Preview */}
          <View style={styles.mapContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' }} 
              style={styles.mapImage} 
            />
            <View style={styles.mapOverlay}>
              <View style={styles.mapPin}>
                <Ionicons name="location" size={18} color="#fff" />
              </View>
            </View>
            <TouchableOpacity style={styles.mapBtn}>
              <Text style={styles.mapBtnText}>View on Maps</Text>
              <Ionicons name="arrow-forward" size={12} color="#111" />
            </TouchableOpacity>
          </View>

          {/* Facilities */}
          <Text style={styles.sectionTitle}>Fasilitas</Text>
          <View style={styles.amenitiesRow}>
            {[
              { icon: 'wifi-outline', label: 'WiFi' },
              { icon: 'cafe-outline', label: 'Breakfast' },
              { icon: 'car-outline', label: 'Parking' },
              { icon: 'water-outline', label: 'Swimming Pool' },
            ].map((item) => (
              <View key={item.label} style={styles.amenityItem}>
                <View style={styles.amenityIconBox}>
                  <Ionicons name={item.icon as any} size={24} color="#43a08d" />
                </View>
                <Text style={styles.amenityText}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* About */}
          <Text style={styles.sectionTitle}>About this property</Text>
          <Text style={styles.descriptionText}>
            {hotel.description || `${hotel.name} is an ultra-luxury resort perched on pristine white sands. Offering magnificent suites and villas, each space is appointed with breathtaking views.`}
          </Text>

          {/* Available Rooms */}
          <Text style={styles.sectionTitle}>Available Rooms</Text>
          {rooms.length === 0 ? (
            <View style={styles.noRoomsBox}>
              <Ionicons name="bed-outline" size={32} color="#ccc" />
              <Text style={styles.noRoomsText}>No rooms available for the selected dates.</Text>
            </View>
          ) : (
            rooms.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              const roomIcons: { [key: string]: string } = {
                'Deluxe Room': 'bed-outline',
                'Executive Suite': 'diamond-outline',
                'Ocean View Suite': 'water-outline',
                'Cliff Villa with Pool': 'home-outline',
                'Premier Room': 'star-outline',
                'Family Suite': 'people-outline',
              };
              return (
                <TouchableOpacity
                  key={room.id}
                  style={[styles.roomCard, isSelected && styles.roomCardSelected]}
                  onPress={() => setSelectedRoom(room)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roomIconBox, isSelected && styles.roomIconBoxSelected]}>
                    <Ionicons name={roomIcons[room.room_name] || 'bed-outline'} size={22} color={isSelected ? '#fff' : '#43a08d'} />
                  </View>
                  <View style={styles.roomInfo}>
                    <Text style={[styles.roomName, isSelected && styles.roomNameSelected]}>{room.room_name}</Text>
                    <View style={styles.roomMeta}>
                      <Ionicons name="people-outline" size={12} color="#888" />
                      <Text style={styles.roomCapacity}>{room.capacity} Guests</Text>
                    </View>
                  </View>
                  <View style={styles.roomPriceBox}>
                    <Text style={[styles.roomPrice, isSelected && styles.roomPriceSelected]}>{formatCurrency(room.price)}</Text>
                    <Text style={styles.roomNight}>/night</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Reviews Section */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25 }}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <TouchableOpacity onPress={() => setShowReviewModal(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f4f1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 }}>
              <Ionicons name="create-outline" size={14} color="#43a08d" />
              <Text style={{ color: '#43a08d', fontWeight: 'bold', fontSize: 12, marginLeft: 4 }}>Write Review</Text>
            </TouchableOpacity>
          </View>
          {reviews.length === 0 ? (
            <Text style={{ color: '#888', fontSize: 13, marginTop: 10 }}>No reviews yet. Be the first to review!</Text>
          ) : (
            reviews.slice(0, 5).map((review: any) => (
              <View key={review.id} style={{ backgroundColor: '#f9fbfc', borderRadius: 16, padding: 15, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#111' }}>{review.user_name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {[1,2,3,4,5].map(s => (
                      <Ionicons key={s} name={s <= review.rating ? 'star' : 'star-outline'} size={12} color="#fbb03b" />
                    ))}
                  </View>
                </View>
                <Text style={{ color: '#666', fontSize: 12, lineHeight: 18 }}>{review.comment}</Text>
              </View>
            ))
          )}

        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={showReviewModal} animationType="slide" transparent onRequestClose={() => setShowReviewModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingBottom: 35 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Write a Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>Rating</Text>
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              {[1,2,3,4,5].map(s => (
                <TouchableOpacity key={s} onPress={() => setReviewRating(s)} style={{ marginRight: 8 }}>
                  <Ionicons name={s <= reviewRating ? 'star' : 'star-outline'} size={32} color="#fbb03b" />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>Comment</Text>
            <TextInput
              style={{ borderWidth: 1.5, borderColor: '#eaeaea', borderRadius: 12, padding: 15, fontSize: 14, height: 100, textAlignVertical: 'top' }}
              placeholder="Share your experience..."
              placeholderTextColor="#aaa"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
            />

            <TouchableOpacity
              style={{ backgroundColor: '#43a08d', borderRadius: 14, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}
              onPress={handleSubmitReview}
              disabled={submittingReview}
            >
              {submittingReview ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Submit Review</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price starts at</Text>
          <Text style={styles.priceValue}>{formatCurrency(defaultPrice)}<Text style={styles.priceNight}>/night</Text></Text>
        </View>
        <TouchableOpacity style={styles.selectBtn} onPress={handleSelectRoom}>
          <Text style={styles.selectBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    height: 320,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  headerBtns: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  imageOverlayBottom: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  dotActive: {
    width: 16,
    backgroundColor: '#fff',
  },
  photoCountBadge: {
    position: 'absolute',
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentSheet: {
    marginTop: -25,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4f1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  featuredText: {
    color: '#43a08d',
    fontWeight: 'bold',
    fontSize: 11,
    marginLeft: 5,
  },
  hotelName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111',
    marginLeft: 6,
  },
  ratingReviews: {
    fontSize: 13,
    color: '#888',
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 6,
  },
  mapContainer: {
    width: '100%',
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 25,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 244, 241, 0.3)',
  },
  mapPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#43a08d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(67, 160, 141, 0.3)',
  },
  mapBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  mapBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111',
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 15,
  },
  amenitiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  amenityItem: {
    alignItems: 'center',
  },
  amenityIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#e8f4f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 10,
    color: '#111',
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 10,
  },
  readMoreText: {
    fontSize: 14,
    color: '#43a08d',
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceContainer: {
    justifyContent: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#43a08d',
  },
  priceNight: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#888',
  },
  selectBtn: {
    backgroundColor: '#43a08d',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#43a08d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  selectBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  noRoomsBox: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#f9fbfc',
    borderRadius: 16,
    marginBottom: 20,
  },
  noRoomsText: {
    color: '#999',
    fontSize: 13,
    marginTop: 10,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fbfc',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  roomCardSelected: {
    backgroundColor: '#e8f4f1',
    borderColor: '#43a08d',
  },
  roomIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#e8f4f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roomIconBoxSelected: {
    backgroundColor: '#43a08d',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  roomNameSelected: {
    color: '#2a7d6b',
  },
  roomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomCapacity: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
  roomPriceBox: {
    alignItems: 'flex-end',
  },
  roomPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#43a08d',
  },
  roomPriceSelected: {
    color: '#2a7d6b',
  },
  roomNight: {
    fontSize: 10,
    color: '#888',
  },
});
