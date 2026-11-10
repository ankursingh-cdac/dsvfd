import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { HeaderBar } from '../src/shared/components/HeaderBar';
import { Api } from '../src/core/network/api';
import { useAuthStore } from '../src/features/auth/store/authStore';

export default function ShopScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'theme' | 'avatar' | 'frame'>('theme');
  const [items, setItems] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchShop = async () => {
    setLoading(true);
    try {
      const res = await Api.getShopItems();
      if (res.success) {
        setItems(res.items);
        setInventory(res.inventory);
      }
    } catch (err: any) {
      console.warn('Error loading shop:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, []);

  const handleBuy = async (item: any) => {
    if ((profile?.coins || 0) < item.priceCoins) {
      Alert.alert('Not Enough Coins', `You need ${item.priceCoins} coins to unlock this!`);
      return;
    }

    try {
      const res = await Api.purchaseShopItem(item.itemId);
      if (res.success) {
        Alert.alert('Unlocked! 🎉', res.message);
        fetchShop();
        refreshProfile();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not complete purchase');
    }
  };

  const handleEquip = async (item: any) => {
    try {
      const res = await Api.equipShopItem(item.itemId, item.category);
      if (res.success) {
        Alert.alert('Equipped! ✨', `Equipped ${item.name}!`);
        fetchShop();
        refreshProfile();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not equip item');
    }
  };

  const filteredItems = items.filter((item) => item.category === activeTab);
  const ownedIds = inventory?.ownedItemIds || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar />

      <View style={styles.content}>
        <Text style={styles.title}>PAWDOKU SHOP 🛍️</Text>
        <Text style={styles.subtitle}>Customize your board themes, avatars, and frames!</Text>

        {/* Category Tabs */}
        <View style={styles.tabsRow}>
          {(['theme', 'avatar', 'frame'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'theme' ? '🎨 Themes' : tab === 'avatar' ? '🐱 Avatars' : '🖼️ Frames'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#E84393" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.itemList} showsVerticalScrollIndicator={false}>
            {filteredItems.map((item) => {
              const isOwned = ownedIds.includes(item.itemId);
              const isEquipped =
                (item.category === 'theme' && inventory?.equippedTheme === item.itemId) ||
                (item.category === 'avatar' && inventory?.equippedAvatar === item.itemId) ||
                (item.category === 'frame' && inventory?.equippedFrame === item.itemId);

              return (
                <View key={item.itemId} style={styles.itemCard}>
                  {/* Preview color swatch or icon */}
                  <View
                    style={[
                      styles.previewBox,
                      { backgroundColor: item.previewColor || '#FFF0E4' },
                    ]}
                  >
                    <Text style={styles.previewIcon}>
                      {item.category === 'avatar' ? '🐾' : item.category === 'theme' ? '🎨' : '🖼️'}
                    </Text>
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                  </View>

                  {/* Action button */}
                  {isEquipped ? (
                    <View style={styles.equippedBadge}>
                      <Text style={styles.equippedText}>EQUIPPED</Text>
                    </View>
                  ) : isOwned ? (
                    <TouchableOpacity
                      style={styles.equipButton}
                      onPress={() => handleEquip(item)}
                    >
                      <Text style={styles.equipButtonText}>EQUIP</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.buyButton}
                      onPress={() => handleBuy(item)}
                    >
                      <Text style={styles.buyButtonText}>{item.priceCoins} 🪙</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Return to Lobby</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#E84393',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#94786A',
    marginBottom: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    backgroundColor: '#FFF8EF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: '#E84393',
    borderColor: '#C2185B',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94786A',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  itemList: {
    width: '100%',
    maxWidth: 420,
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 2,
    borderColor: '#EEDCC8',
    marginBottom: 10,
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  previewBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
    marginRight: 12,
  },
  previewIcon: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#49352E',
  },
  itemDesc: {
    fontSize: 11,
    color: '#94786A',
  },
  buyButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D4AC0D',
  },
  buyButtonText: {
    color: '#49352E',
    fontSize: 13,
    fontWeight: '900',
  },
  equipButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#27AE60',
  },
  equipButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  equippedBadge: {
    backgroundColor: '#EEDCC8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  equippedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94786A',
  },
  backButton: {
    marginVertical: 10,
  },
  backButtonText: {
    color: '#94786A',
    fontSize: 14,
    fontWeight: '700',
  },
});
