import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { HeaderBar } from '../src/shared/components/HeaderBar';
import { PuzzleGrid } from '../src/features/puzzle/components/PuzzleGrid';
import { socketService } from '../src/core/socket/socketClient';
import { useAuthStore } from '../src/features/auth/store/authStore';

const CAT_3D_IMG = require('../assets/images/cat_3d.png');

const DEFAULT_REGIONS = [
  [0, 0, 0, 1, 1, 1],
  [0, 0, 1, 1, 1, 2],
  [3, 0, 2, 2, 2, 2],
  [3, 3, 2, 4, 4, 2],
  [3, 3, 4, 4, 5, 5],
  [3, 5, 5, 5, 5, 5],
];

export default function MultiplayerScreen() {
  const router = useRouter();
  const { profile, user, refreshProfile } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const myUsername = user?.username || profile?.username || 'You';
  const myId = user?.id || profile?.userId;

  const [matchState, setMatchState] = useState<'idle' | 'searching' | 'countdown' | 'in_game' | 'finished'>('idle');
  const [matchId, setMatchId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);
  const [initialGrid, setInitialGrid] = useState<number[][]>([]);
  const [grid, setGrid] = useState<number[][]>([]);
  const [regions, setRegions] = useState<number[][]>(DEFAULT_REGIONS);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [inputMode, setInputMode] = useState<'cat' | 'cross'>('cat');
  const [history, setHistory] = useState<number[][][]>([]);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [matchTime, setMatchTime] = useState(0);
  const [myFinished, setMyFinished] = useState(false);
  const [myFinishTime, setMyFinishTime] = useState<number | null>(null);
  const [opponentFinished, setOpponentFinished] = useState(false);
  const [opponentFinishTime, setOpponentFinishTime] = useState<number | null>(null);
  const [opponentFinishName, setOpponentFinishName] = useState<string | null>(null);

  const socketRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    let socket: any = null;

    const setupSocket = async () => {
      socket = await socketService.connect();
      socketRef.current = socket;

      socket.on('matchmaking:searching', () => {
        setMatchState('searching');
      });

      socket.on('matchmaking:found', (data: any) => {
        setMatchId(data.matchId);
        setOpponent(data.opponent);
        setInitialGrid(data.initialGrid || []);
        setGrid((data.initialGrid || []).map((row: number[]) => [...row]));
        if (data.regions && data.regions.length === 6) {
          setRegions(data.regions);
        }
        setHistory([]);
        setMatchTime(0);
        setMyFinished(false);
        setMyFinishTime(null);
        setOpponentFinished(false);
        setOpponentFinishTime(null);
        setOpponentFinishName(null);
        setMatchResult(null);
        setMatchState('countdown');

        // Start 3-second countdown
        let count = data.countdownSeconds || 3;
        setCountdown(count);
        const cdInterval = setInterval(() => {
          count--;
          if (count > 0) {
            setCountdown(count);
          } else {
            clearInterval(cdInterval);
            setMatchState('in_game');
          }
        }, 1000);
      });

      socket.on('match:opponent_progress', (data: { cellsFilled: number }) => {
        setOpponentProgress(data.cellsFilled);
      });

      // Two-Phase Finish: A player finished their puzzle
      socket.on('match:player_completed', (data: {
        userId: string;
        username: string;
        elapsedMs: number;
        isFirst: boolean;
      }) => {
        const secs = Math.floor(data.elapsedMs / 1000);
        if (data.userId === myId || data.username === myUsername) {
          setMyFinished(true);
          setMyFinishTime(secs);
        } else {
          setOpponentFinished(true);
          setOpponentFinishTime(secs);
          setOpponentFinishName(data.username);
          setOpponentProgress(6);
        }
      });

      socket.on('match:submit_result', (data: { isCorrect: boolean; message: string }) => {
        if (data.isCorrect) {
          setMyFinished(true);
          setMyFinishTime((t) => t ?? matchTime);
        } else {
          Alert.alert('Keep Going!', data.message);
        }
      });

      socket.on('match:finished', (data: any) => {
        setMatchResult(data);
        setMatchState('finished');
        refreshProfile();
      });
    };

    setupSocket();

    return () => {
      if (socket) {
        socket.emit('matchmaking:cancel');
        socket.off('matchmaking:searching');
        socket.off('matchmaking:found');
        socket.off('match:opponent_progress');
        socket.off('match:player_completed');
        socket.off('match:submit_result');
        socket.off('match:finished');
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [myUsername, myId]);

  // Timer in game: stops for this player once they finish
  useEffect(() => {
    if (matchState === 'in_game' && !myFinished) {
      timerRef.current = setInterval(() => {
        setMatchTime((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [matchState, myFinished]);

  // 1 Tap Gesture: Mark Cross (✕)
  const handleSingleTap = (row: number, col: number) => {
    if (myFinished) return;
    setSelectedCell({ row, col });
    if (initialGrid[row] && initialGrid[row][col] !== 0) return;

    const currentVal = grid[row][col];
    const nextVal = currentVal === 0 ? -1 : 0;

    setHistory((prev) => [...prev, grid.map((r) => [...r])]);
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = nextVal;
    setGrid(newGrid);

    let catsPlaced = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (newGrid[r][c] === 1) catsPlaced++;
      }
    }
    if (socketRef.current && matchId) {
      socketRef.current.emit('match:progress', { matchId, cellsFilled: catsPlaced });
    }
  };

  // 2 Taps (Double Tap) Gesture: Place Cat (🐱)
  const handleDoubleTap = (row: number, col: number) => {
    if (myFinished) return;
    setSelectedCell({ row, col });
    if (initialGrid[row] && initialGrid[row][col] !== 0) return;

    const currentVal = grid[row][col];
    const nextVal = currentVal === 1 ? 0 : 1;

    setHistory((prev) => [...prev, grid.map((r) => [...r])]);
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = nextVal;
    setGrid(newGrid);

    let catsPlaced = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (newGrid[r][c] === 1) catsPlaced++;
      }
    }
    if (socketRef.current && matchId) {
      socketRef.current.emit('match:progress', { matchId, cellsFilled: catsPlaced });
      if (catsPlaced === 6) {
        socketRef.current.emit('match:submit', { matchId, submittedGrid: newGrid });
      }
    }
  };

  // Handle cell placement & broadcast progress
  const handleCellPress = (row: number, col: number) => {
    if (myFinished) return;
    setSelectedCell({ row, col });
    if (initialGrid[row] && initialGrid[row][col] !== 0) return;

    const currentVal = grid[row][col];
    const nextVal = inputMode === 'cat' ? (currentVal === 1 ? 0 : 1) : (currentVal === -1 ? 0 : -1);

    setHistory((prev) => [...prev, grid.map((r) => [...r])]);
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = nextVal;
    setGrid(newGrid);

    let catsPlaced = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (newGrid[r][c] === 1) catsPlaced++;
      }
    }

    if (socketRef.current && matchId) {
      socketRef.current.emit('match:progress', {
        matchId,
        cellsFilled: catsPlaced,
      });

      if (catsPlaced === 6) {
        socketRef.current.emit('match:submit', {
          matchId,
          submittedGrid: newGrid,
        });
      }
    }
  };

  const handleUndo = () => {
    if (myFinished) return;
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setGrid(last);

    let catsPlaced = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (last[r][c] === 1) catsPlaced++;
      }
    }
    if (socketRef.current && matchId) {
      socketRef.current.emit('match:progress', {
        matchId,
        cellsFilled: catsPlaced,
      });
    }
  };

  const handleErase = () => {
    if (myFinished) return;
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (initialGrid[row] && initialGrid[row][col] !== 0) return;

    if (grid[row][col] !== 0) {
      setHistory((prev) => [...prev, grid.map((r) => [...r])]);
      const newGrid = grid.map((r) => [...r]);
      newGrid[row][col] = 0;
      setGrid(newGrid);

      let catsPlaced = 0;
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          if (newGrid[r][c] === 1) catsPlaced++;
        }
      }
      if (socketRef.current && matchId) {
        socketRef.current.emit('match:progress', {
          matchId,
          cellsFilled: catsPlaced,
        });
      }
    }
  };

  const startSearching = () => {
    setMatchResult(null);
    setOpponentProgress(0);
    setMatchTime(0);
    if (socketRef.current) {
      socketRef.current.emit('matchmaking:join', { difficulty: 'medium' });
    }
  };

  const cancelSearching = () => {
    if (socketRef.current) {
      socketRef.current.emit('matchmaking:cancel');
    }
    setMatchState('idle');
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Count player's cats
  let myCats = 0;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (grid[r] && grid[r][c] === 1) myCats++;
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar onPressLeaderboard={() => router.push('/leaderboard')} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* State: Idle / Start Matchmaking */}
        {matchState === 'idle' && (
          <View style={styles.centerCard}>
            <Image source={CAT_3D_IMG} style={styles.mascotImg} resizeMode="contain" />
            <Text style={styles.title}>1v1 Real-Time Battle</Text>
            <Text style={styles.subtitle}>
              Race head-to-head on the exact same Queens puzzle! 1 cat per row, col & region. No touching!
            </Text>

            <View style={styles.playerInfoRow}>
              <Text style={styles.playerInfoText}>
                Your Elo Rating: <Text style={{ color: '#2B6CB0', fontWeight: '900' }}>{profile?.mmr || 1000} 🏆</Text>
              </Text>
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={startSearching}>
              <Text style={styles.actionButtonText}>FIND OPPONENT ⚔️</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Back to Lobby</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* State: Searching for Opponent */}
        {matchState === 'searching' && (
          <View style={styles.centerCard}>
            <ActivityIndicator size="large" color="#E84393" />
            <Text style={styles.title}>Finding Worthy Opponent...</Text>
            <Text style={styles.subtitle}>Matching with similar rating skills</Text>

            <TouchableOpacity style={styles.cancelButton} onPress={cancelSearching}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* State: Countdown */}
        {matchState === 'countdown' && (
          <View style={styles.centerCard}>
            <Text style={styles.vsTitle}>MATCH FOUND!</Text>

            <View style={styles.versusContainer}>
              <View style={styles.playerBox}>
                <Image source={CAT_3D_IMG} style={styles.playerImg} resizeMode="contain" />
                <Text style={styles.playerName}>{myUsername}</Text>
                <Text style={styles.playerMmr}>{profile?.mmr || 1000} MMR</Text>
              </View>

              <Text style={styles.vsBadge}>VS</Text>

              <View style={styles.playerBox}>
                <Image source={CAT_3D_IMG} style={styles.playerImg} resizeMode="contain" />
                <Text style={styles.playerName}>{opponent?.username || 'Opponent'}</Text>
                <Text style={styles.playerMmr}>{opponent?.mmr || 1000} MMR</Text>
              </View>
            </View>

            <View style={styles.countdownCircle}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
            <Text style={styles.countdownLabel}>Get Ready!</Text>
          </View>
        )}

        {/* State: In Game */}
        {matchState === 'in_game' && (
          <View style={[styles.inGameContainer, isWide && styles.inGameContainerWide]}>
            {/* Top Battle Status Bar */}
            <View style={styles.battleHeader}>
              <View style={[styles.timerPill, myFinished && { backgroundColor: '#27AE60', borderColor: '#1E8449' }]}>
                <Text style={styles.timerText}>
                  {myFinished ? `✅ ${formatTimer(myFinishTime ?? matchTime)}` : `⏱️ ${formatTimer(matchTime)}`}
                </Text>
              </View>

              {/* Opponent Live Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>{opponent?.username || 'Opponent'}</Text>
                  <Text style={[styles.progressFraction, opponentFinished && { color: '#27AE60', fontWeight: '900' }]}>
                    {opponentFinished
                      ? `FINISHED (${formatTimer(opponentFinishTime || 0)}) 🏁`
                      : `${opponentProgress} / 6 🐾`}
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, (opponentProgress / 6) * 100)}%` },
                      opponentFinished && { backgroundColor: '#2ECC71' },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Opponent Finished First Alert Banner (while I am still solving) */}
            {!myFinished && opponentFinished && (
              <View style={{
                backgroundColor: '#FFF4E5',
                borderWidth: 2,
                borderColor: '#F39C12',
                borderRadius: 16,
                paddingVertical: 10,
                paddingHorizontal: 16,
                marginBottom: 10,
                alignItems: 'center',
                width: '100%',
              }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#D35400', textAlign: 'center' }}>
                  ⚡ {opponentFinishName || 'Opponent'} finished in {formatTimer(opponentFinishTime || 0)}!
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#7E5109', marginTop: 2, textAlign: 'center' }}>
                  Keep going! Solve your puzzle to finish the race! 🐾
                </Text>
              </View>
            )}

            {/* My Live Cats Status */}
            <View style={styles.myProgressRow}>
              <Text style={styles.myProgressText}>
                Your Cats: <Text style={{ color: '#E84393' }}>{myCats} / 6</Text>
              </Text>
            </View>

            {/* 6x6 Tactile 3D Grid */}
            <PuzzleGrid
              grid={grid}
              initialGrid={initialGrid}
              regions={regions}
              selectedCell={selectedCell}
              onSinglePress={handleSingleTap}
              onDoublePress={handleDoubleTap}
              onCellPress={handleCellPress}
            />

            {/* If I Finished: Waiting for Opponent Card */}
            {myFinished && (
              <View style={{
                backgroundColor: '#E8F8F5',
                borderWidth: 2,
                borderColor: '#2ECC71',
                borderRadius: 20,
                paddingVertical: 16,
                paddingHorizontal: 20,
                marginTop: 14,
                alignItems: 'center',
                width: '100%',
              }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E8449', letterSpacing: 0.5 }}>
                  🎉 PUZZLE SOLVED! 🐾
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#49352E', marginTop: 4 }}>
                  Your Time: <Text style={{ color: '#E84393', fontWeight: '900' }}>{formatTimer(myFinishTime ?? matchTime)}</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: '#FFFFFF', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#A3E4D7' }}>
                  <ActivityIndicator size="small" color="#F39C12" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#8A5812' }}>
                    Waiting for {opponent?.username || 'Opponent'} to finish...
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#5D6D7E', textAlign: 'center', marginTop: 8 }}>
                  Final results & winner will be displayed once both players finish! ⏳
                </Text>
              </View>
            )}

            {/* 3D Action Controls: Only shown while actively solving */}
            {!myFinished && (
              <>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, history.length === 0 && styles.disabledBtn]}
                    onPress={handleUndo}
                    disabled={history.length === 0}
                  >
                    <Text style={styles.actionBtnText}>↩ Undo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} onPress={handleErase}>
                    <Text style={styles.actionBtnText}>🧹 Erase</Text>
                  </TouchableOpacity>
                </View>

                {/* 3D Wooden Tray - Mode Toggle */}
                <View style={styles.woodenTray}>
                  <TouchableOpacity
                    style={[styles.trayOption, inputMode === 'cat' && styles.trayOptionSelected]}
                    onPress={() => setInputMode('cat')}
                  >
                    <Image source={CAT_3D_IMG} style={styles.trayCatImg} resizeMode="contain" />
                    <Text style={[styles.trayLabel, inputMode === 'cat' && styles.trayLabelSelected]}>
                      Place Cat
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.trayOption, inputMode === 'cross' && styles.trayOptionSelected]}
                    onPress={() => setInputMode('cross')}
                  >
                    <View style={styles.crossCircle}>
                      <Text style={styles.trayCrossEmoji}>✕</Text>
                    </View>
                    <Text style={[styles.trayLabel, inputMode === 'cross' && styles.trayLabelSelected]}>
                      Mark Cross
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Manual Submit Button if 6 Cats placed */}
                {myCats === 6 && (
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => {
                      if (socketRef.current && matchId) {
                        socketRef.current.emit('match:submit', {
                          matchId,
                          submittedGrid: grid,
                        });
                      }
                    }}
                  >
                    <Text style={styles.submitButtonText}>SUBMIT BOARD 🐾</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {/* State: Match Finished */}
        {matchState === 'finished' && matchResult && (
          <View style={styles.centerCard}>
            <Image source={CAT_3D_IMG} style={styles.mascotImg} resizeMode="contain" />
            <Text style={styles.confetti}>
              {matchResult.winnerId === myId || matchResult.winnerUsername === myUsername
                ? '🏆 🌟 VICTORY! 🌟 🏆'
                : '🥈 RUNNER-UP 🥈'}
            </Text>

            <View style={{ backgroundColor: '#FFEAA7', padding: 12, borderRadius: 16, width: '100%', alignItems: 'center', marginVertical: 8, borderWidth: 2, borderColor: '#F39C12' }}>
              <Text style={{ fontSize: 26 }}>👑</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#49352E', marginTop: 2 }}>
                Winner: {matchResult.winnerUsername}!
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#8A5812', marginTop: 2 }}>
                Winning Time: {formatTimer(Math.floor(matchResult.elapsedMs / 1000))}
              </Text>
            </View>

            {/* Head-to-Head Comparison Card */}
            {(matchResult.player1 || matchResult.player2) && (
              <View style={{ width: '100%', marginVertical: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#94786A', textAlign: 'center', marginBottom: 6 }}>
                  HEAD-TO-HEAD SUMMARY
                </Text>

                {matchResult.player1 && (
                  <View style={{
                    backgroundColor: matchResult.player1.isWinner ? '#FFFBEA' : '#FFF0E4',
                    padding: 10,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: matchResult.player1.isWinner ? '#F39C12' : '#EEDCC8',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image source={CAT_3D_IMG} style={{ width: 32, height: 32, marginRight: 8 }} resizeMode="contain" />
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#49352E' }}>
                          {matchResult.player1.username}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#94786A' }}>Player 1</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#49352E' }}>
                        ⏱️ {matchResult.player1.finished !== false
                          ? formatTimer(Math.floor((matchResult.player1.timeMs || 0) / 1000))
                          : 'DNF (Timeout)'}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: matchResult.player1.isWinner ? '#27AE60' : '#E67E22', marginTop: 2 }}>
                        {matchResult.player1.isWinner ? '🏆 WINNER' : '🥈 RUNNER-UP'}
                      </Text>
                    </View>
                  </View>
                )}

                {matchResult.player2 && (
                  <View style={{
                    backgroundColor: matchResult.player2.isWinner ? '#FFFBEA' : '#FFF0E4',
                    padding: 10,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: matchResult.player2.isWinner ? '#F39C12' : '#EEDCC8',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image source={CAT_3D_IMG} style={{ width: 32, height: 32, marginRight: 8 }} resizeMode="contain" />
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#49352E' }}>
                          {matchResult.player2.username}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#94786A' }}>Player 2</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#49352E' }}>
                        ⏱️ {matchResult.player2.finished !== false
                          ? formatTimer(Math.floor((matchResult.player2.timeMs || 0) / 1000))
                          : 'DNF (Timeout)'}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: matchResult.player2.isWinner ? '#27AE60' : '#E67E22', marginTop: 2 }}>
                        {matchResult.player2.isWinner ? '🏆 WINNER' : '🥈 RUNNER-UP'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={styles.finishStatsBox}>
              <Text style={styles.finishRatingText}>
                Rating Change: {matchResult.ratingDelta > 0 ? `+${matchResult.ratingDelta}` : matchResult.ratingDelta} MMR 🏆
              </Text>
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={startSearching}>
              <Text style={styles.actionButtonText}>PLAY AGAIN 🐾</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Return to Lobby</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF0E4',
  },
  content: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCard: {
    backgroundColor: '#FFF8EF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#EEDCC8',
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    marginTop: 16,
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  mascotImg: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#49352E',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94786A',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  playerInfoRow: {
    backgroundColor: '#FFF0E4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 20,
  },
  playerInfoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#49352E',
  },
  actionButton: {
    backgroundColor: '#E84393',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C2185B',
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: '#95A5A6',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 16,
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 6,
  },
  backButtonText: {
    color: '#94786A',
    fontSize: 14,
    fontWeight: '700',
  },
  vsTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#E84393',
    letterSpacing: 1,
    marginBottom: 12,
  },
  versusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  playerBox: {
    alignItems: 'center',
    width: 100,
  },
  playerImg: {
    width: 52,
    height: 52,
    marginBottom: 4,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#49352E',
  },
  playerMmr: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B6CB0',
  },
  vsBadge: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FF6B6B',
  },
  countdownCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFD700',
    borderWidth: 3,
    borderColor: '#F39C12',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  countdownText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#49352E',
  },
  countdownLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94786A',
  },
  inGameContainer: {
    width: '100%',
    alignItems: 'center',
  },
  inGameContainerWide: {
    maxWidth: 440,
  },
  battleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  timerPill: {
    backgroundColor: '#FFF8EF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#49352E',
  },
  progressContainer: {
    flex: 1,
    marginLeft: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#49352E',
  },
  progressFraction: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E84393',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#EEDCC8',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E84393',
    borderRadius: 5,
  },
  myProgressRow: {
    backgroundColor: '#FFF8EF',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1DEC9',
    marginBottom: 10,
  },
  myProgressText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5C4033',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  actionBtn: {
    backgroundColor: '#FFF8EF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E6D5C3',
    shadowColor: '#C4A992',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledBtn: {
    opacity: 0.4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5C4033',
  },
  woodenTray: {
    flexDirection: 'row',
    backgroundColor: '#EAD7C5',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#CBB29C',
    gap: 10,
    marginBottom: 12,
  },
  trayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EF',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E3CDB8',
    gap: 8,
  },
  trayOptionSelected: {
    backgroundColor: '#FF6B8B',
    borderColor: '#D81B60',
    shadowColor: '#D81B60',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  trayCatImg: {
    width: 28,
    height: 28,
  },
  crossCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#94786A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trayCrossEmoji: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  trayLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#5C4033',
  },
  trayLabelSelected: {
    color: '#FFF',
  },
  submitButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#27AE60',
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
  confetti: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10,
  },
  finishWinnerName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#49352E',
    marginBottom: 12,
  },
  finishStatsBox: {
    backgroundColor: '#FFF0E4',
    padding: 14,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  finishTimeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#49352E',
    marginBottom: 4,
  },
  finishRatingText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2B6CB0',
  },
});
