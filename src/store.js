import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@staylux_auth';

export const globalStore = {
  userName: 'Guest',
  userId: null,
  isLoggedIn: false,

  setUser: (id, name) => {
    globalStore.userId = id;
    globalStore.userName = name;
    globalStore.isLoggedIn = true;
    AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ id, name }));
  },

  setUsername: (name) => {
    globalStore.userName = name;
  },

  loadAuth: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_KEY);
      if (raw) {
        const { id, name } = JSON.parse(raw);
        globalStore.userId = id;
        globalStore.userName = name;
        globalStore.isLoggedIn = true;
        return true;
      }
    } catch {
      // ignore
    }
    globalStore.isLoggedIn = false;
    return false;
  },

  logout: async () => {
    globalStore.userId = null;
    globalStore.userName = 'Guest';
    globalStore.isLoggedIn = false;
    await AsyncStorage.removeItem(AUTH_KEY);
  },
};
