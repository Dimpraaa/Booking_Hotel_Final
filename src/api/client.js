import axios from "axios";
import Constants from "expo-constants";

// Mendapatkan IP Host secara dinamis dari Metro server agar kompatibel di HP fisik (Expo Go)
const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri; // Contoh: "192.168.0.20:8081"
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    return `http://${ip}:3000/api`;
  }
  // Fallback ke IP aktif saat ini jika tidak menggunakan Metro bundler/debugger
  return "http://192.168.0.9:3000/api";
};

const BASE_URL = getBaseUrl();

import { io } from 'socket.io-client';

// Inisialisasi Socket.IO
// Kita butuh base URL tanpa `/api` untuk socket server
const SOCKET_URL = BASE_URL.replace('/api', '');
export const socket = io(SOCKET_URL, {
  autoConnect: false, // Hubungkan manual nanti saat user masuk
});

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

import { globalStore } from "../store";

client.interceptors.request.use(
  (config) => {
    if (globalStore.token) {
      config.headers.Authorization = `Bearer ${globalStore.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const formatCurrency = (value) => {
  if (value === undefined || value === null) return "";
  const num = Math.floor(Number(value));
  return "Rp " + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const api = {
  login: async (email, password) => {
    try {
      const response = await client.post("/login", { email, password });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      throw new Error(message);
    }
  },

  register: async (name, email, phone, password) => {
    try {
      const response = await client.post("/register", {
        name,
        email,
        phone,
        password,
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      throw new Error(message);
    }
  },

  resetPassword: async (email, newPassword) => {
    try {
      const response = await client.post("/reset-password", {
        email,
        newPassword,
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      throw new Error(message);
    }
  },

  getHotels: async (filters = {}) => {
    try {
      const { location, name, category, min_price, max_price, rating } =
        filters;
      const queryParams = [];
      if (location)
        queryParams.push(`location=${encodeURIComponent(location)}`);
      if (name) queryParams.push(`name=${encodeURIComponent(name)}`);
      if (category)
        queryParams.push(`category=${encodeURIComponent(category)}`);
      if (min_price) queryParams.push(`min_price=${min_price}`);
      if (max_price) queryParams.push(`max_price=${max_price}`);
      if (rating) queryParams.push(`rating=${rating}`);

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await client.get(`/hotels${queryString}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  getHotelRooms: async (hotelId, checkIn, checkOut) => {
    try {
      const response = await client.get(
        `/hotels/${hotelId}/rooms?check_in=${checkIn}&check_out=${checkOut}`,
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  getBookings: async (userId) => {
    try {
      const response = await client.get(`/users/${userId}/bookings`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  addBooking: async (bookingData) => {
    try {
      const response = await client.post("/bookings", bookingData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  deleteBooking: async (id) => {
    try {
      const response = await client.delete(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  payBooking: async (id) => {
    try {
      const response = await client.put(`/bookings/${id}/pay`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  getUserProfile: async (id) => {
    try {
      const response = await client.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  updateUserProfile: async (id, profileData) => {
    try {
      const response = await client.put(`/users/${id}`, profileData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  toggleFavorite: async (hotelId, userId) => {
    try {
      const response = await client.post(`/hotels/${hotelId}/favorite`, {
        user_id: userId,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  getUserFavorites: async (userId) => {
    try {
      const response = await client.get(`/users/${userId}/favorites`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  getHotelDetails: async (id, userId) => {
    try {
      const url = userId ? `/hotels/${id}?userId=${userId}` : `/hotels/${id}`;
      const response = await client.get(url);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  addReview: async (hotelId, reviewData) => {
    try {
      const response = await client.post(
        `/hotels/${hotelId}/reviews`,
        reviewData,
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  createPayment: async (paymentData) => {
    try {
      const response = await client.post("/payments", paymentData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  payBooking: async (id, orderId) => {
    try {
      const response = await client.put(`/bookings/${id}/pay`, { order_id: orderId });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  uploadAvatar: async (formData) => {
    try {
      const response = await client.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { ...response.data, fullUrl: BASE_URL.replace('/api', '') + response.data.url };
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },
};

export default client;
