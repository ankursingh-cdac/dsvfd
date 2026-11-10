import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getBackendHost = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return window.location.hostname;
    }
    return 'localhost';
  }
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost') return ip;
  }
  return '10.228.13.175';
};

export const BACKEND_HOST = getBackendHost();
export const API_BASE_URL = `http://${BACKEND_HOST}:4000/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('pawdoku_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const Api = {
  // Auth
  guestLogin: async () => {
    const res = await apiClient.post('/auth/guest');
    if (res.data.token) {
      await AsyncStorage.setItem('pawdoku_token', res.data.token);
    }
    return res.data;
  },
  register: async (data: { username: string; email: string; password: string }) => {
    const res = await apiClient.post('/auth/register', data);
    if (res.data.token) {
      await AsyncStorage.setItem('pawdoku_token', res.data.token);
    }
    return res.data;
  },
  login: async (data: { emailOrUsername: string; password: string }) => {
    const res = await apiClient.post('/auth/login', data);
    if (res.data.token) {
      await AsyncStorage.setItem('pawdoku_token', res.data.token);
    }
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  // Puzzles & Hints
  getRandomPuzzle: async (difficulty = 'easy') => {
    const res = await apiClient.get(`/puzzles/random?difficulty=${difficulty}`);
    return res.data;
  },
  getHint: async (puzzleId: string, type: 'cell' | 'elimination', currentGrid: number[][]) => {
    const res = await apiClient.post(`/puzzles/${puzzleId}/hint`, { type, currentGrid });
    return res.data;
  },

  // Single-player Game Sessions
  startGame: async (puzzleId: string, difficulty: string) => {
    const res = await apiClient.post('/games/start', { puzzleId, difficulty });
    return res.data;
  },
  completeGame: async (
    sessionId: string,
    data: { submittedGrid: number[][]; durationMs: number; hintsUsed: number; mistakes: number }
  ) => {
    const res = await apiClient.post(`/games/${sessionId}/complete`, data);
    return res.data;
  },

  // Leaderboard
  getLeaderboard: async (tab: 'global' | 'weekly' | 'monthly' = 'global') => {
    const res = await apiClient.get(`/leaderboard/${tab}`);
    return res.data;
  },

  // Daily Challenge
  getDailyChallenge: async () => {
    const res = await apiClient.get('/daily-challenge');
    return res.data;
  },
  completeDailyChallenge: async (data: { submittedGrid: number[][]; durationMs: number }) => {
    const res = await apiClient.post('/daily-challenge/complete', data);
    return res.data;
  },

  // Shop & Spin Wheel
  getShopItems: async () => {
    const res = await apiClient.get('/shop/items');
    return res.data;
  },
  purchaseShopItem: async (itemId: string) => {
    const res = await apiClient.post('/shop/purchase', { itemId });
    return res.data;
  },
  equipShopItem: async (itemId: string, category: string) => {
    const res = await apiClient.post('/shop/equip', { itemId, category });
    return res.data;
  },
  spinWheel: async () => {
    const res = await apiClient.post('/shop/spin-wheel');
    return res.data;
  },
};
