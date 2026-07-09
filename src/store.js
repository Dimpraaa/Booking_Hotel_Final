import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@staylux_auth';

export const globalStore = {
  userName: 'Guest',
  userId: null,
  avatarUrl: null,
  token: null,
  isLoggedIn: false,

  setUser: (id, name, avatarUrl = null, token = null) => {
    globalStore.userId = id;
    globalStore.userName = name;
    globalStore.avatarUrl = avatarUrl;
    if (token) globalStore.token = token;
    globalStore.isLoggedIn = true;
    AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ id, name, avatarUrl, token: globalStore.token }));
  },

  setUsername: (name) => {
    globalStore.userName = name;
  },

  loadAuth: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_KEY);
      if (raw) {
        const { id, name, avatarUrl, token } = JSON.parse(raw);
        globalStore.userId = id;
        globalStore.userName = name;
        globalStore.avatarUrl = avatarUrl;
        globalStore.token = token;
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
    globalStore.avatarUrl = null;
    globalStore.token = null;
    globalStore.isLoggedIn = false;
    await AsyncStorage.removeItem(AUTH_KEY);
  },
};
