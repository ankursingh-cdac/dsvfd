import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Api } from '../../../core/network/api';

interface User {
  id: string;
  username: string;
  email?: string;
  isGuest: boolean;
}

interface PlayerProfile {
  userId?: string;
  username?: string;
  level: number;
  xp: number;
  coins: number;
  mmr: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  streakDays: number;
  avatar: string;
}

interface AuthState {
  user: User | null;
  profile: PlayerProfile | null;
  inventory: any | null;
  isLoading: boolean;
  token: string | null;

  unlockedLevel: number;
  userId?: string;
  unlockedLevelNumber?: number;

  // Actions
  initAuth: () => Promise<void>;
  loginGuest: () => Promise<void>;
  loginUser: (email: string, pass: string) => Promise<void>;
  registerUser: (username: string, email: string, pass: string) => Promise<void>;
  updateCoins: (coins: number) => void;
  updateXpAndLevel: (xp: number, level: number) => void;
  unlockLevel: (level: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  inventory: null,
  isLoading: true,
  token: null,
  unlockedLevel: 1,

  initAuth: async () => {
    set({ isLoading: true });
    try {
      // Load local campaign progress
      const storedLvl = await AsyncStorage.getItem('@pawdoku_unlocked_level');
      const initialUnlocked = storedLvl ? parseInt(storedLvl, 10) : 1;
      set({ unlockedLevel: initialUnlocked || 1 });

      const storedToken = await AsyncStorage.getItem('pawdoku_token');
      if (storedToken) {
        set({ token: storedToken });
        const data = await Api.getMe();
        if (data.success) {
          const profileUnlocked = data.profile?.unlockedLevel || 1;
          const maxUnlocked = Math.max(initialUnlocked, profileUnlocked);
          if (maxUnlocked > initialUnlocked) {
            await AsyncStorage.setItem('@pawdoku_unlocked_level', String(maxUnlocked));
          }
          set({
            user: data.user,
            profile: data.profile,
            inventory: data.inventory,
            unlockedLevel: maxUnlocked,
            isLoading: false,
          });
          return;
        }
      }

      // No token or expired: auto-login as guest
      await get().loginGuest();
    } catch (err) {
      console.warn('Auth init failed, creating guest:', err);
      await get().loginGuest();
    } finally {
      set({ isLoading: false });
    }
  },

  loginGuest: async () => {
    try {
      const res = await Api.guestLogin();
      if (res.success) {
        set({
          token: res.token,
          user: res.user,
          profile: res.profile,
          isLoading: false,
        });
      }
    } catch (err) {
      console.error('Guest login failed:', err);
      set({ isLoading: false });
    }
  },

  loginUser: async (emailOrUsername, password) => {
    set({ isLoading: true });
    const res = await Api.login({ emailOrUsername, password });
    if (res.success) {
      set({
        token: res.token,
        user: res.user,
        profile: res.profile,
        isLoading: false,
      });
    }
  },

  registerUser: async (username, email, password) => {
    set({ isLoading: true });
    const res = await Api.register({ username, email, password });
    if (res.success) {
      set({
        token: res.token,
        user: res.user,
        profile: res.profile,
        isLoading: false,
      });
    }
  },

  updateCoins: (coins) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, coins } : null,
    }));
  },

  updateXpAndLevel: (xp, level) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, xp, level } : null,
    }));
  },

  unlockLevel: async (nextLevel: number) => {
    const current = get().unlockedLevel || 1;
    if (nextLevel > current) {
      await AsyncStorage.setItem('@pawdoku_unlocked_level', String(nextLevel));
      set({ unlockedLevel: nextLevel });
    }
  },

  refreshProfile: async () => {
    try {
      const res = await Api.getMe();
      if (res.success) {
        set({
          profile: res.profile,
          inventory: res.inventory,
        });
      }
    } catch (err) {
      console.warn('Profile refresh error:', err);
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('pawdoku_token');
    set({ user: null, profile: null, inventory: null, token: null });
    await get().loginGuest();
  },
}));
