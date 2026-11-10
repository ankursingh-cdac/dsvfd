import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { HeaderBar } from '../src/shared/components/HeaderBar';
import { Api } from '../src/core/network/api';
import { CatIcon } from '../src/shared/assets/animals/AnimalIcons';

export default function LeaderboardScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'global' | 'weekly' | 'monthly'>('global');
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRankings = async (tab: 'global' | 'weekly' | 'monthly') => {
    setLoading(true);
    try {
      const res = await Api.getLeaderboard(tab);
      if (res.success) {
        setRankings(res.rankings || []);
      }
    } catch (err: any) {
      console.warn('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings(activeTab);
  }, [activeTab]);

  const top3 = rankings.slice(0, 3);
  const remaining = rankings.slice(3);

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar />

      <View style={styles.content}>
        <Text style={styles.title}>CHAMPIONS LEADERBOARD 🏆</Text>
        <Text style={styles.subtitle}>Compete with players worldwide and rise to the top!</Text>

        {/* Tab Buttons */}
        <View style={styles.tabsRow}>
          {(['global', 'weekly', 'monthly'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#E84393" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* Top 3 Podium Cards */}
            {top3.length > 0 && (
              <View style={styles.podiumContainer}>
                {/* 2nd Place */}
                {top3[1] && (
                  <View style={[styles.podiumCard, styles.podiumSecond]}>
                    <Text style={styles.podiumTrophy}>🥈</Text>
                    <CatIcon size={38} />
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {top3[1].username}
                    </Text>
                    <Text style={styles.podiumScore}>
                      {activeTab === 'global'
                        ? `${top3[1].mmr} MMR`
                        : activeTab === 'weekly'
                        ? `${top3[1].wins} Wins`
                        : `${top3[1].xp} XP`}
                    </Text>
                  </View>
                )}

                {/* 1st Place (Crown in Center) */}
                {top3[0] && (
                  <View style={[styles.podiumCard, styles.podiumFirst]}>
                    <Text style={styles.podiumCrown}>👑</Text>
                    <Text style={styles.podiumTrophy}>🥇</Text>
                    <CatIcon size={46} />
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {top3[0].username}
                    </Text>
                    <Text style={styles.podiumScoreFirst}>
                      {activeTab === 'global'
                        ? `${top3[0].mmr} MMR`
                        : activeTab === 'weekly'
                        ? `${top3[0].wins} Wins`
                        : `${top3[0].xp} XP`}
                    </Text>
                  </View>
                )}

                {/* 3rd Place */}
                {top3[2] && (
                  <View style={[styles.podiumCard, styles.podiumThird]}>
                    <Text style={styles.podiumTrophy}>🥉</Text>
                    <CatIcon size={38} />
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {top3[2].username}
                    </Text>
                    <Text style={styles.podiumScore}>
                      {activeTab === 'global'
                        ? `${top3[2].mmr} MMR`
                        : activeTab === 'weekly'
                        ? `${top3[2].wins} Wins`
                        : `${top3[2].xp} XP`}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Remaining Ranked Players */}
            {remaining.map((player) => (
              <View key={player.id} style={styles.rankCard}>
                <Text style={styles.rankNumber}>#{player.rank}</Text>
                <CatIcon size={32} />
                <View style={styles.playerDetails}>
                  <Text style={styles.rankUsername}>{player.username}</Text>
                  <Text style={styles.rankSubtext}>Level {player.level || 1} • {player.winRate || 0}% Win Rate</Text>
                </View>
                <Text style={styles.rankScore}>
                  {activeTab === 'global'
                    ? `${player.mmr} 🏆`
                    : activeTab === 'weekly'
                    ? `${player.wins} ⚔️`
                    : `${player.xp} ✨`}
                </Text>
              </View>
            ))}
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
    fontSize: 22,
    fontWeight: '900',
    color: '#E84393',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#94786A',
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  tabButton: {
    backgroundColor: '#FFF8EF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: '#E84393',
    borderColor: '#C2185B',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94786A',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollList: {
    width: '100%',
    maxWidth: 420,
    paddingBottom: 20,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: 8,
  },
  podiumCard: {
    backgroundColor: '#FFF8EF',
    borderRadius: 18,
    borderWidth: 2,
    padding: 10,
    alignItems: 'center',
    width: 96,
    marginHorizontal: 4,
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  podiumFirst: {
    borderColor: '#FFD700',
    height: 150,
    backgroundColor: '#FFFDF0',
    transform: [{ scale: 1.05 }],
  },
  podiumSecond: {
    borderColor: '#BDC3C7',
    height: 130,
  },
  podiumThird: {
    borderColor: '#E67E22',
    height: 120,
  },
  podiumCrown: {
    fontSize: 18,
    marginBottom: -4,
  },
  podiumTrophy: {
    fontSize: 20,
    marginBottom: 2,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#49352E',
    marginTop: 4,
  },
  podiumScore: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2B6CB0',
  },
  podiumScoreFirst: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D4AC0D',
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
    marginBottom: 8,
  },
  rankNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#94786A',
    width: 32,
    textAlign: 'center',
  },
  playerDetails: {
    flex: 1,
    marginLeft: 10,
  },
  rankUsername: {
    fontSize: 13,
    fontWeight: '800',
    color: '#49352E',
  },
  rankSubtext: {
    fontSize: 10,
    color: '#94786A',
  },
  rankScore: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2B6CB0',
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
