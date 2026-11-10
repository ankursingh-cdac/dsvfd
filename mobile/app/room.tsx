import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
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

const DEFAULT_6X6_REGIONS = [
  [0, 0, 0, 1, 1, 1],
  [0, 0, 2, 2, 1, 1],
  [3, 3, 2, 2, 4, 4],
  [3, 3, 5, 5, 4, 4],
  [3, 5, 5, 5, 4, 4],
  [5, 5, 5, 5, 4, 4],
];

// Local Queens verification (6x6)
function validateQueens6x6(grid: number[][], regions: number[][]): { isValid: boolean; reason?: string } {
  const N = 6;
  const cats: { r: number; c: number; reg: number }[] = [];

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (grid[r] && grid[r][c] === 1) {
        cats.push({ r, c, reg: regions[r] ? regions[r][c] : 0 });
      }
    }
  }

  if (cats.length !== N) {
    return { isValid: false, reason: `Need exactly 6 cats placed (currently ${cats.length})` };
  }

  const rowCounts = new Array(N).fill(0);
  for (const cat of cats) {
    rowCounts[cat.r]++;
    if (rowCounts[cat.r] > 1) return { isValid: false, reason: `Row ${cat.r + 1} has multiple cats!` };
  }

  const colCounts = new Array(N).fill(0);
  for (const cat of cats) {
    colCounts[cat.c]++;
    if (colCounts[cat.c] > 1) return { isValid: false, reason: `Column ${cat.c + 1} has multiple cats!` };
  }

  const regCounts = new Array(N).fill(0);
  for (const cat of cats) {
    regCounts[cat.reg]++;
    if (regCounts[cat.reg] > 1) return { isValid: false, reason: `A color region has multiple cats!` };
  }

  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const c1 = cats[i];
      const c2 = cats[j];
      if (Math.abs(c1.r - c2.r) <= 1 && Math.abs(c1.c - c2.c) <= 1) {
        return { isValid: false, reason: `Cats cannot touch each other, even diagonally!` };
      }
    }
  }

  return { isValid: true };
}

type RoomMode = 'menu' | 'lobby' | 'countdown' | 'in_game' | 'finished';

export default function RoomScreen() {
  const router = useRouter();
  const { profile, user, refreshProfile } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const myUsername = user?.username || profile?.username || 'You';
  const myId = user?.id || profile?.userId;

  // Room Lobby State
  const [mode, setMode] = useState<RoomMode>('menu');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeRoomCode, setActiveRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [hostName, setHostName] = useState<string>('Host');
  const [guestName, setGuestName] = useState<string | null>(null);
  const [hostReady, setHostReady] = useState(false);
  const [guestReady, setGuestReady] = useState(false);

  // Match / In-Game State
  const [matchId, setMatchId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);
  const [initialGrid, setInitialGrid] = useState<number[][]>([]);
  const [grid, setGrid] = useState<number[][]>([]);
  const [regions, setRegions] = useState<number[][]>(DEFAULT_6X6_REGIONS);
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

      socket.on('room:created', (data: { roomCode: string }) => {
        setActiveRoomCode(data.roomCode);
        setIsHost(true);
        setHostName(myUsername);
        setHostReady(false);
        setGuestReady(false);
        setGuestName(null);
        setMode('lobby');
      });

      socket.on('room:joined', (data: { roomCode: string; hostName?: string; hostReady?: boolean; guestReady?: boolean }) => {
        setActiveRoomCode(data.roomCode);
        setIsHost(false);
        if (data.hostName) setHostName(data.hostName);
        setGuestName(myUsername);
        setHostReady(!!data.hostReady);
        setGuestReady(!!data.guestReady);
        setMode('lobby');
      });

      socket.on('room:player_joined', (data: { username: string; guestName?: string; hostName?: string }) => {
        const joinedName = data.guestName || data.username;
        setGuestName(joinedName);
        if (data.hostName) setHostName(data.hostName);
      });

      socket.on('room:status_update', (data: { hostReady: boolean; guestReady: boolean }) => {
        setHostReady(data.hostReady);
        setGuestReady(data.guestReady);
      });

      // Match started for both players!
      const handleMatchStart = (data: any) => {
        setMatchId(data.matchId);
        setOpponent(data.opponent);
        setInitialGrid(data.initialGrid || []);
        setGrid((data.initialGrid || []).map((row: number[]) => [...row]));
        if (data.regions && data.regions.length === 6) {
          setRegions(data.regions);
        }
        setHistory([]);
        setOpponentProgress(0);
        setMatchTime(0);
        setMyFinished(false);
        setMyFinishTime(null);
        setOpponentFinished(false);
        setOpponentFinishTime(null);
        setOpponentFinishName(null);
        setMatchResult(null);
        setMode('countdown');

        // 3-second synchronized countdown
        let count = data.countdownSeconds || 3;
        setCountdown(count);
        const cdInterval = setInterval(() => {
          count--;
          if (count > 0) {
            setCountdown(count);
          } else {
            clearInterval(cdInterval);
            setMode('in_game');
          }
        }, 1000);
      };

      socket.on('room:match_start', handleMatchStart);
      socket.on('matchmaking:found', handleMatchStart);

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

      // Final summary: both players have finished!
      socket.on('match:finished', (data: any) => {
        setMatchResult(data);
        setMode('finished');
        refreshProfile();
      });

      socket.on('room:reset_to_lobby', () => {
        setHostReady(false);
        setGuestReady(false);
        setMatchResult(null);
        setMatchId(null);
        setMyFinished(false);
        setMyFinishTime(null);
        setOpponentFinished(false);
        setOpponentFinishTime(null);
        setOpponentFinishName(null);
        setMode('lobby');
      });

      socket.on('error', (err: { message: string }) => {
        Alert.alert('Notice', err.message);
      });
    };

    setupSocket();

    return () => {
      if (socket) {
        socket.off('room:created');
        socket.off('room:joined');
        socket.off('room:player_joined');
        socket.off('room:status_update');
        socket.off('room:match_start');
        socket.off('matchmaking:found');
        socket.off('match:opponent_progress');
        socket.off('match:player_completed');
        socket.off('match:submit_result');
        socket.off('match:finished');
        socket.off('room:reset_to_lobby');
        socket.off('error');
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [myUsername, myId]);

  // Match live timer: stops for this player once they finish
  useEffect(() => {
    if (mode === 'in_game' && !myFinished) {
      timerRef.current = setInterval(() => {
        setMatchTime((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, myFinished]);

  const handleCreateRoom = async () => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('room:create', { difficulty: 'medium' });
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCodeInput || roomCodeInput.trim().length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-character room code');
      return;
    }
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('room:join', { roomCode: roomCodeInput.trim().toUpperCase() });
    }
  };

  const handleToggleReady = () => {
    const socket = socketService.getSocket();
    if (socket && activeRoomCode) {
      socket.emit('room:ready', { roomCode: activeRoomCode });
    }
  };

  // Host clicks Play to start game for both players
  const handleStartRoomMatch = () => {
    const socket = socketService.getSocket();
    if (socket && activeRoomCode) {
      socket.emit('room:start', { roomCode: activeRoomCode });
    }
  };

  const handleRematch = () => {
    const socket = socketService.getSocket();
    if (socket && activeRoomCode) {
      socket.emit('room:rematch', { roomCode: activeRoomCode });
    }
  };

  // Cell interactions during game
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

      // If all 6 cats placed, validate locally & auto-submit!
      if (catsPlaced === 6) {
        const val = validateQueens6x6(newGrid, regions);
        if (val.isValid) {
          socketRef.current.emit('match:submit', {
            matchId,
            submittedGrid: newGrid,
          });
        }
      }
    }
  };

  const handleCellPress = (row: number, col: number) => {
    if (myFinished) return;
    setSelectedCell({ row, col });
    if (initialGrid[row] && initialGrid[row][col] !== 0) return;

    const currentVal = grid[row][col];
    let nextVal = currentVal;
    if (inputMode === 'cat') {
      nextVal = currentVal === 1 ? 0 : 1;
    } else {
      nextVal = currentVal === -1 ? 0 : -1;
    }

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
        const val = validateQueens6x6(newGrid, regions);
        if (val.isValid) {
          socketRef.current.emit('match:submit', { matchId, submittedGrid: newGrid });
        }
      }
    }
  };

  const handleUndo = () => {
    if (myFinished) return;
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setGrid(prev);
    let catsPlaced = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (prev[r][c] === 1) catsPlaced++;
      }
    }
    if (socketRef.current && matchId) {
      socketRef.current.emit('match:progress', { matchId, cellsFilled: catsPlaced });
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
        socketRef.current.emit('match:progress', { matchId, cellsFilled: catsPlaced });
      }
    }
  };

  const handleSubmitBoard = () => {
    if (myFinished) return;
    const val = validateQueens6x6(grid, regions);
    if (!val.isValid) {
      Alert.alert('Check Placement 🐾', val.reason || 'Check the 4 Queens rules: 1 cat per row, col, region, and no diagonal touches!');
      return;
    }
    if (socketRef.current && matchId) {
      socketRef.current.emit('match:submit', { matchId, submittedGrid: grid });
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Count placed cats
  let myCats = 0;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (grid[r] && grid[r][c] === 1) myCats++;
    }
  }

  const isMyVictory = matchResult && (matchResult.winnerId === myId || matchResult.winnerUsername === myUsername);

  // Ready conditions for starting game
  const canStartGame = isHost && guestName && (hostReady || guestReady);
  const myReady = isHost ? hostReady : guestReady;

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar onPressLeaderboard={() => router.push('/leaderboard')} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* MODE 1: MENU (Create or Join) */}
        {mode === 'menu' && (
          <View style={styles.card}>
            <Image source={CAT_3D_IMG} style={styles.mascotImg} resizeMode="contain" />
            <Text style={styles.title}>Play With Friends</Text>
            <Text style={styles.subtitle}>
              Challenge a friend in a private room with a custom room code!
            </Text>

            <TouchableOpacity style={styles.createButton} onPress={handleCreateRoom}>
              <Text style={styles.createButtonText}>CREATE ROOM 🐾</Text>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR JOIN ROOM</Text>
              <View style={styles.line} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="ENTER 6-CHAR CODE"
              placeholderTextColor="#B8A498"
              value={roomCodeInput}
              onChangeText={(t) => setRoomCodeInput(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
            />

            <TouchableOpacity style={styles.joinButton} onPress={handleJoinRoom}>
              <Text style={styles.joinButtonText}>JOIN ROOM 👥</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Back to Lobby</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MODE 2: ROOM LOBBY (Both players in room, ready buttons, and START GAME) */}
        {mode === 'lobby' && (
          <View style={styles.card}>
            <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{activeRoomCode}</Text>
            </View>
            <Text style={styles.shareHint}>Share this code with your friend to play together!</Text>

            {/* Players Status Box */}
            <View style={styles.playersStatusBox}>
              {/* Host Row */}
              <View style={styles.statusRow}>
                <View style={styles.playerTagRow}>
                  <Text style={styles.roleTag}>HOST</Text>
                  <Text style={styles.statusPlayer}>{isHost ? `${myUsername} (You)` : hostName}</Text>
                </View>
                <Text style={hostReady ? styles.readyBadge : styles.notReadyBadge}>
                  {hostReady ? 'READY ✅' : 'NOT READY ⏳'}
                </Text>
              </View>

              {/* Guest Row */}
              <View style={styles.statusRow}>
                <View style={styles.playerTagRow}>
                  <Text style={[styles.roleTag, { backgroundColor: '#82C8ED' }]}>GUEST</Text>
                  <Text style={styles.statusPlayer}>
                    {!isHost ? `${myUsername} (You)` : guestName || 'Waiting for Friend...'}
                  </Text>
                </View>
                <Text style={guestReady ? styles.readyBadge : styles.notReadyBadge}>
                  {guestReady ? 'READY ✅' : guestName ? 'NOT READY ⏳' : 'WAITING ⏳'}
                </Text>
              </View>
            </View>

            {/* Toggle Ready Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.readyButton, myReady && styles.readyButtonActive]}
              onPress={handleToggleReady}
            >
              <Text style={styles.readyButtonText}>
                {myReady ? 'YOU ARE READY! ✅ (Tap to cancel)' : 'CLICK READY! 🐾'}
              </Text>
            </TouchableOpacity>

            {/* PLAY BUTTON: Available to Host once friend is in room */}
            {isHost ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.playButton, !canStartGame && styles.playButtonDisabled]}
                onPress={handleStartRoomMatch}
                disabled={!canStartGame}
              >
                <Text style={styles.playButtonText}>
                  {canStartGame ? '▶ START GAME NOW 🐾' : 'WAITING FOR FRIEND READY ⏳'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.waitingForHostBox}>
                <Text style={styles.waitingForHostText}>
                  {hostReady && guestReady
                    ? 'Waiting for Host to click Start Game... ⏳'
                    : 'Click READY above so the Host can start the game!'}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.backButton} onPress={() => setMode('menu')}>
              <Text style={styles.backButtonText}>Leave Room</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MODE 3: COUNTDOWN (3... 2... 1... GO!) */}
        {mode === 'countdown' && (
          <View style={styles.centerCard}>
            <Text style={styles.vsTitle}>MATCH STARTING!</Text>

            <View style={styles.versusContainer}>
              <View style={styles.playerBox}>
                <Image source={CAT_3D_IMG} style={styles.playerImg} resizeMode="contain" />
                <Text style={styles.playerName}>{myUsername}</Text>
                <Text style={styles.playerRoleLabel}>{isHost ? 'Host' : 'Guest'}</Text>
              </View>

              <Text style={styles.vsBadge}>VS</Text>

              <View style={styles.playerBox}>
                <Image source={CAT_3D_IMG} style={styles.playerImg} resizeMode="contain" />
                <Text style={styles.playerName}>{opponent?.username || (isHost ? guestName : hostName) || 'Friend'}</Text>
                <Text style={styles.playerRoleLabel}>{!isHost ? 'Host' : 'Guest'}</Text>
              </View>
            </View>

            <View style={styles.countdownCircle}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
            <Text style={styles.countdownLabel}>Get Ready to Race! 🐾</Text>
          </View>
        )}

        {/* MODE 4: IN_GAME (Direct 6x6 Battle Grid with Opponent Progress Bar) */}
        {mode === 'in_game' && (
          <View style={[styles.inGameContainer, isWide && styles.inGameContainerWide]}>
            {/* Top Battle Status Bar */}
            <View style={styles.battleHeader}>
              <View style={[styles.timerPill, myFinished && styles.timerPillFinished]}>
                <Text style={styles.timerText}>
                  {myFinished ? `✅ ${formatTimer(myFinishTime ?? matchTime)}` : `⏱️ ${formatTimer(matchTime)}`}
                </Text>
              </View>

              {/* Opponent Live Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>
                    Opponent: {opponent?.username || (isHost ? guestName : hostName) || 'Friend'}
                  </Text>
                  <Text style={[styles.progressFraction, opponentFinished && styles.opponentFinishedBadgeText]}>
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
              <View style={styles.opponentFinishedBanner}>
                <Text style={styles.opponentFinishedTitle}>
                  ⚡ {opponentFinishName || 'Opponent'} finished in {formatTimer(opponentFinishTime || 0)}!
                </Text>
                <Text style={styles.opponentFinishedSubtitle}>
                  Keep going! Solve your puzzle to finish the race! 🐾
                </Text>
              </View>
            )}

            {/* My Live Cats Status */}
            <View style={styles.myProgressRow}>
              <Text style={styles.myProgressText}>
                Your Cats: <Text style={{ color: '#E84393' }}>{myCats} / 6</Text>
              </Text>
              <Text style={styles.rulesHintText}>1 Cat per row, col & region • No touching!</Text>
            </View>

            {/* 6x6 Authentic Meowdoku Grid */}
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
              <View style={styles.myFinishedBanner}>
                <Text style={styles.myFinishedTitle}>🎉 PUZZLE SOLVED! 🐾</Text>
                <Text style={styles.myFinishedTime}>
                  Your Time: <Text style={{ color: '#E84393', fontWeight: '900' }}>{formatTimer(myFinishTime ?? matchTime)}</Text>
                </Text>
                <View style={styles.waitingOpponentRow}>
                  <ActivityIndicator size="small" color="#F39C12" style={{ marginRight: 8 }} />
                  <Text style={styles.waitingOpponentText}>
                    Waiting for {opponent?.username || (isHost ? guestName : hostName) || 'Opponent'} to finish...
                  </Text>
                </View>
                <Text style={styles.waitingOpponentHint}>
                  Final comparison & winner will be displayed once both players finish! ⏳
                </Text>
              </View>
            )}

            {/* Action Tools: Only shown while actively solving */}
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

                {/* Mode Toggle Bar */}
                <View style={styles.woodenTray}>
                  <TouchableOpacity
                    style={[styles.trayOption, inputMode === 'cat' && styles.trayOptionSelected]}
                    onPress={() => setInputMode('cat')}
                  >
                    <Image source={CAT_3D_IMG} style={styles.trayCatImg} resizeMode="contain" />
                    <Text style={[styles.trayLabel, inputMode === 'cat' && styles.trayLabelSelected]}>
                      Place Cat 🐱
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.trayOption, inputMode === 'cross' && styles.trayOptionSelected]}
                    onPress={() => setInputMode('cross')}
                  >
                    <Text style={styles.crossIconText}>✕</Text>
                    <Text style={[styles.trayLabel, inputMode === 'cross' && styles.trayLabelSelected]}>
                      Mark Cross ✕
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Submit Button if 6 Cats placed */}
                {myCats === 6 && (
                  <TouchableOpacity style={styles.submitButton} onPress={handleSubmitBoard}>
                    <Text style={styles.submitButtonText}>SUBMIT PUZZLE 🐾</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {/* MODE 5: FINISHED (Displays Both Players' Times & Declares Winner) */}
        {mode === 'finished' && matchResult && (
          <View style={styles.centerCard}>
            <Image source={CAT_3D_IMG} style={styles.mascotImg} resizeMode="contain" />

            <Text style={styles.victoryBanner}>
              {isMyVictory ? '🏆 VICTORY! YOU WON! 🏆' : '🥈 RUNNER-UP 🥈'}
            </Text>

            {/* Prominent Winner Declaration */}
            <View style={styles.winnerAnnounceCard}>
              <Text style={styles.winnerCrown}>👑</Text>
              <Text style={styles.winnerDeclarationText}>
                {matchResult.winnerUsername} Won The Battle!
              </Text>
              <Text style={styles.winningTimeText}>
                Winning Time: {formatTimer(Math.floor(matchResult.elapsedMs / 1000))}
              </Text>
            </View>

            {/* Detailed Head-to-Head Comparison Card */}
            <View style={styles.comparisonContainer}>
              <Text style={styles.comparisonHeader}>MATCH SUMMARY</Text>

              {/* Player 1 Card */}
              {matchResult.player1 && (
                <View
                  style={[
                    styles.playerResultCard,
                    matchResult.player1.isWinner && styles.winnerResultBorder,
                  ]}
                >
                  <View style={styles.playerResultLeft}>
                    <Image source={CAT_3D_IMG} style={styles.avatarMini} resizeMode="contain" />
                    <View>
                      <Text style={styles.resultPlayerName}>
                        {matchResult.player1.username}
                        {matchResult.player1.userId === myId ? ' (You)' : ''}
                      </Text>
                      <Text style={styles.resultRole}>Player 1</Text>
                    </View>
                  </View>
                  <View style={styles.playerResultRight}>
                    <Text style={styles.resultTimeText}>
                      ⏱️ {matchResult.player1.finished !== false
                        ? formatTimer(Math.floor((matchResult.player1.timeMs || 0) / 1000))
                        : 'DNF (Timeout)'}
                    </Text>
                    <Text style={matchResult.player1.isWinner ? styles.winBadge : styles.runnerBadge}>
                      {matchResult.player1.isWinner ? '🏆 WINNER' : '🥈 2ND PLACE'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Player 2 Card */}
              {matchResult.player2 && (
                <View
                  style={[
                    styles.playerResultCard,
                    matchResult.player2.isWinner && styles.winnerResultBorder,
                  ]}
                >
                  <View style={styles.playerResultLeft}>
                    <Image source={CAT_3D_IMG} style={styles.avatarMini} resizeMode="contain" />
                    <View>
                      <Text style={styles.resultPlayerName}>
                        {matchResult.player2.username}
                        {matchResult.player2.userId === myId ? ' (You)' : ''}
                      </Text>
                      <Text style={styles.resultRole}>Player 2</Text>
                    </View>
                  </View>
                  <View style={styles.playerResultRight}>
                    <Text style={styles.resultTimeText}>
                      ⏱️ {matchResult.player2.finished !== false
                        ? formatTimer(Math.floor((matchResult.player2.timeMs || 0) / 1000))
                        : 'DNF (Timeout)'}
                    </Text>
                    <Text style={matchResult.player2.isWinner ? styles.winBadge : styles.runnerBadge}>
                      {matchResult.player2.isWinner ? '🏆 WINNER' : '🥈 2ND PLACE'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Rematch / Play Again in same room */}
            <TouchableOpacity style={styles.rematchButton} onPress={handleRematch}>
              <Text style={styles.rematchButtonText}>PLAY AGAIN / REMATCH 🔄</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
              <Text style={styles.backButtonText}>Return to Main Lobby</Text>
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
    backgroundColor: '#F8F6EF',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFF8EF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#EEDCC8',
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
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
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94786A',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  createButton: {
    backgroundColor: '#E84393',
    paddingVertical: 14,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C2185B',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEDCC8',
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 11,
    fontWeight: '800',
    color: '#94786A',
  },
  input: {
    backgroundColor: '#FFF0E4',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    color: '#49352E',
    letterSpacing: 3,
    borderWidth: 2,
    borderColor: '#EEDCC8',
    marginBottom: 12,
  },
  joinButton: {
    backgroundColor: '#82C8ED',
    paddingVertical: 14,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5CA4EA',
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
  backButton: {
    marginTop: 14,
    paddingVertical: 6,
  },
  backButtonText: {
    color: '#94786A',
    fontSize: 14,
    fontWeight: '700',
  },
  roomCodeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94786A',
  },
  codeBox: {
    backgroundColor: '#FFEAA7',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F39C12',
    marginVertical: 8,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#49352E',
    letterSpacing: 6,
  },
  shareHint: {
    fontSize: 12,
    color: '#94786A',
    textAlign: 'center',
    marginBottom: 14,
  },
  playersStatusBox: {
    backgroundColor: '#FFF0E4',
    width: '100%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2DFD1',
  },
  playerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleTag: {
    backgroundColor: '#E84393',
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  statusPlayer: {
    fontSize: 14,
    fontWeight: '800',
    color: '#49352E',
  },
  readyBadge: {
    fontSize: 12,
    fontWeight: '900',
    color: '#27AE60',
  },
  notReadyBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E67E22',
  },
  readyButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 13,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#27AE60',
    marginBottom: 10,
  },
  readyButtonActive: {
    backgroundColor: '#F39C12',
    borderColor: '#D68910',
  },
  readyButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
  playButton: {
    backgroundColor: '#E84393',
    paddingVertical: 14,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C2185B',
    marginBottom: 6,
  },
  playButtonDisabled: {
    backgroundColor: '#D8C6BA',
    borderColor: '#C0AEA2',
    opacity: 0.7,
  },
  playButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  waitingForHostBox: {
    backgroundColor: '#FFF0E4',
    padding: 10,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  waitingForHostText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94786A',
  },
  vsTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E84393',
    marginBottom: 16,
  },
  versusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  playerBox: {
    alignItems: 'center',
    flex: 1,
  },
  playerImg: {
    width: 60,
    height: 60,
    marginBottom: 4,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#49352E',
  },
  playerRoleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94786A',
  },
  vsBadge: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF6B6B',
    marginHorizontal: 12,
  },
  countdownCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFEAA7',
    borderWidth: 3,
    borderColor: '#F39C12',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  countdownText: {
    fontSize: 38,
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
    maxWidth: 420,
    alignItems: 'center',
  },
  inGameContainerWide: {
    maxWidth: 480,
  },
  battleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  timerPill: {
    backgroundColor: '#FFF8EF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#49352E',
  },
  progressContainer: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#FFF8EF',
    padding: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#49352E',
  },
  progressFraction: {
    fontSize: 11,
    fontWeight: '900',
    color: '#E84393',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F0E2D4',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E84393',
    borderRadius: 4,
  },
  myProgressRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  myProgressText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#49352E',
  },
  rulesHintText: {
    fontSize: 11,
    color: '#94786A',
    fontWeight: '600',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    backgroundColor: '#FFF8EF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#49352E',
  },
  woodenTray: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
  },
  trayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FFF8EF',
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
  },
  trayOptionSelected: {
    backgroundColor: '#FFEAA7',
    borderColor: '#F39C12',
  },
  trayCatImg: {
    width: 22,
    height: 22,
    marginRight: 6,
  },
  crossIconText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#49352E',
    marginRight: 6,
  },
  trayLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94786A',
  },
  trayLabelSelected: {
    color: '#49352E',
  },
  submitButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 13,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#219653',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  victoryBanner: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E84393',
    marginVertical: 8,
  },
  winnerAnnounceCard: {
    backgroundColor: '#FFEAA7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F39C12',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  winnerCrown: {
    fontSize: 28,
  },
  winnerDeclarationText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#49352E',
    marginTop: 2,
  },
  winningTimeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8A5812',
    marginTop: 2,
  },
  comparisonContainer: {
    width: '100%',
    marginVertical: 10,
  },
  comparisonHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94786A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  playerResultCard: {
    backgroundColor: '#FFF0E4',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  winnerResultBorder: {
    borderColor: '#F39C12',
    backgroundColor: '#FFFBEA',
  },
  playerResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  resultPlayerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#49352E',
  },
  resultRole: {
    fontSize: 11,
    color: '#94786A',
    fontWeight: '600',
  },
  playerResultRight: {
    alignItems: 'flex-end',
  },
  resultTimeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#49352E',
  },
  winBadge: {
    fontSize: 11,
    fontWeight: '900',
    color: '#27AE60',
    marginTop: 2,
  },
  runnerBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E67E22',
    marginTop: 2,
  },
  rematchButton: {
    backgroundColor: '#E84393',
    paddingVertical: 14,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C2185B',
    marginTop: 8,
  },
  rematchButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
  timerPillFinished: {
    backgroundColor: '#27AE60',
    borderColor: '#1E8449',
  },
  opponentFinishedBadgeText: {
    color: '#27AE60',
    fontWeight: '900',
  },
  opponentFinishedBanner: {
    backgroundColor: '#FFF4E5',
    borderWidth: 2,
    borderColor: '#F39C12',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  opponentFinishedTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#D35400',
    textAlign: 'center',
  },
  opponentFinishedSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E5109',
    marginTop: 2,
    textAlign: 'center',
  },
  myFinishedBanner: {
    backgroundColor: '#E8F8F5',
    borderWidth: 2,
    borderColor: '#2ECC71',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 14,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  myFinishedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E8449',
    letterSpacing: 0.5,
  },
  myFinishedTime: {
    fontSize: 14,
    fontWeight: '800',
    color: '#49352E',
    marginTop: 4,
  },
  waitingOpponentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A3E4D7',
  },
  waitingOpponentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A5812',
  },
  waitingOpponentHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5D6D7E',
    textAlign: 'center',
    marginTop: 8,
  },
});
