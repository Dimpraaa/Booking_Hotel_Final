import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, TextInput, FlatList } from 'react-native';
import { formatCurrency } from '../../src/api/client';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { globalStore } from '../../src/store';
import { api } from '../../src/api/client';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit Profile States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);

  // Favorites States
  const [favoritesList, setFavoritesList] = useState<any[]>([]);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const fetchFavorites = async () => {
    setLoadingFavorites(true);
    try {
      const data = await api.getUserFavorites(globalStore.userId);
      setFavoritesList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleOpenFavorites = () => {
    fetchFavorites();
    setShowFavoritesModal(true);
  };

  const fetchProfile = async () => {
    try {
      const data = await api.getUserProfile(globalStore.userId);
      setUser(data);
      // Sync names with global store
      globalStore.setUser(data.id, data.name);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleOpenEdit = () => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditPhone(user.phone || '');
      setEditAvatar(user.avatar_url || '');
      setEditGender(user.gender || '');
      setEditDob(user.dob ? user.dob.split('T')[0] : '');
      setEditAddress(user.address || '');
      setShowEditModal(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName || !editEmail) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    setSaving(true);
    try {
      const response = await api.updateUserProfile(globalStore.userId, {
        name: editName,
        email: editEmail,
        phone: editPhone,
        avatar_url: editAvatar,
        gender: editGender,
        dob: editDob,
        address: editAddress
      });
      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setUser({ 
          ...user, 
          name: editName, 
          email: editEmail, 
          phone: editPhone,
          avatar_url: editAvatar,
          gender: editGender,
          dob: editDob,
          address: editAddress
        });
        globalStore.setUser(globalStore.userId, editName);
        setShowEditModal(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          await globalStore.logout();
          router.replace('/login');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#43a08d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image 
            source={{ uri: user?.avatar_url || 'https://i.pravatar.cc/150?img=5' }} 
            style={styles.avatar} 
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userPhone}>{user?.phone || 'No phone number'}</Text>
            {user?.address ? <Text style={styles.userExtraInfo}><Ionicons name="location-outline" size={12}/> {user.address}</Text> : null}
            {(user?.gender || user?.dob) ? (
              <Text style={styles.userExtraInfo}>
                {user.gender || '-'} • {user.dob ? user.dob.split('T')[0] : '-'}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={handleOpenEdit}>
            <Ionicons name="pencil" size={16} color="#43a08d" />
          </TouchableOpacity>
        </View>

        {/* Menu Options */}
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={handleOpenEdit}>
            <View style={styles.menuIconBox}>
              <Ionicons name="person-outline" size={20} color="#43a08d" />
            </View>
            <Text style={styles.menuText}>Personal Information</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/bookings')}>
            <View style={styles.menuIconBox}>
              <Ionicons name="calendar-outline" size={20} color="#43a08d" />
            </View>
            <Text style={styles.menuText}>My Bookings</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleOpenFavorites}>
            <View style={styles.menuIconBox}>
              <Ionicons name="heart-outline" size={20} color="#43a08d" />
            </View>
            <Text style={styles.menuText}>Favorite Hotels</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Settings', 'StayLux v1.0\nBooking Hotel App Demo')}>
            <View style={styles.menuIconBox}>
              <Ionicons name="settings-outline" size={20} color="#43a08d" />
            </View>
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Support & About</Text>
        
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}>
              <Ionicons name="help-circle-outline" size={20} color="#43a08d" />
            </View>
            <Text style={styles.menuText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}>
              <Ionicons name="document-text-outline" size={20} color="#43a08d" />
            </View>
            <Text style={styles.menuText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#aaa"
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#aaa"
                  value={editEmail}
                  onChangeText={setEditEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#aaa"
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Avatar Image URL (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com/photo.jpg"
                  placeholderTextColor="#aaa"
                  value={editAvatar}
                  onChangeText={setEditAvatar}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Gender</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Male / Female"
                    placeholderTextColor="#aaa"
                    value={editGender}
                    onChangeText={setEditGender}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Date of Birth</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#aaa"
                    value={editDob}
                    onChangeText={setEditDob}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Full Address"
                  placeholderTextColor="#aaa"
                  value={editAddress}
                  onChangeText={setEditAddress}
                  multiline={true}
                />
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Favorites Modal */}
      <Modal
        visible={showFavoritesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFavoritesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Favorite Hotels</Text>
              <TouchableOpacity onPress={() => setShowFavoritesModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            {loadingFavorites ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#43a08d" />
              </View>
            ) : favoritesList.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="heart-outline" size={48} color="#ccc" />
                <Text style={{ color: '#888', marginTop: 10, fontSize: 14 }}>No favorite hotels yet</Text>
              </View>
            ) : (
              <FlatList
                data={favoritesList}
                keyExtractor={(item: any) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity
                    style={styles.favCard}
                    onPress={() => {
                      setShowFavoritesModal(false);
                      router.push({ pathname: '/detail', params: { id: item.id } });
                    }}
                  >
                    <Image source={{ uri: item.image_url }} style={styles.favImage} />
                    <View style={styles.favInfo}>
                      <Text style={styles.favName} numberOfLines={1}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Ionicons name="location-outline" size={11} color="#888" />
                        <Text style={{ fontSize: 11, color: '#888', marginLeft: 3 }} numberOfLines={1}>{item.location}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="star" size={12} color="#fbb03b" />
                          <Text style={{ fontSize: 12, fontWeight: 'bold', marginLeft: 3 }}>{item.rating}</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#43a08d' }}>{formatCurrency(item.price_starts_at)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
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
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  userExtraInfo: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f4f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 15,
    marginLeft: 5,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 5,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 65,
    marginRight: 15,
  },
  logoutBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff4d4f',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: '#ff4d4f',
    fontSize: 16,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fbfc',
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
  formGroup: {
    marginBottom: 15,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  label: {
    fontSize: 13,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#eaeaea',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
    fontWeight: 'bold',
    backgroundColor: '#fafafa',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
    marginTop: 15,
  },
  cancelBtn: {
    width: '30%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#eaeaea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveBtn: {
    width: '65%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#43a08d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  favCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fbfc',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  favImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  favInfo: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  favName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
});
