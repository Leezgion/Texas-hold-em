import React, { createContext, useContext, useEffect } from 'react';

import { create } from 'zustand';
import deviceIdManager from '../utils/deviceId';
import io from 'socket.io-client';
import { derivePlayerStateView } from '../view-models/gameViewModel';

// 创建Zustand store
const useGameStore = create((set, get) => ({
  // 连接状态
  socket: null,
  connected: false,
  isReconnecting: false,
  reconnectAttempts: 0,

  // 房间状态
  roomId: null,
  roomSettings: null,
  roomState: null,
  players: [],
  gameStarted: false,

  // 游戏状态
  gameState: null,
  currentPlayer: null,
  currentPlayerView: null,
  communityCards: [],
  pot: 0,

  // 玩家状态
  currentPlayerId: null,
  deviceId: null,
  playerHand: [],
  playerChips: 0,
  playerBet: 0,
  canCheck: false,
  canRaise: false,
  minRaise: 0,

  // 模态框状态
  showCreateRoom: false,
  showJoinRoom: false,
  showHandResult: false,
  handResult: null,

  // 房间创建状态
  isCreatingRoom: false,

  // 导航状态
  navigationTarget: null,
  intentionalJoin: false, // 标记是否是主动加入房间

  // 连接Socket
  connectSocket: () => {
    // 获取设备唯一ID
    const deviceId = deviceIdManager.getDeviceId();

    // 自动检测当前访问的主机地址
    const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : `http://${window.location.hostname}:3001`;
    const socket = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      // 使用设备ID作为持久化的玩家ID
      set({ socket, connected: true, currentPlayerId: deviceId, deviceId, isReconnecting: false, reconnectAttempts: 0 });
      console.log('已连接到服务器，Socket ID:', socket.id, '设备ID:', deviceId);

      // 向服务器注册设备ID和Socket ID的映射
      socket.emit('registerDevice', { deviceId, socketId: socket.id });

      // 如果URL中包含房间ID，可能是直接访问或页面刷新
      const path = window.location.pathname;
      const roomIdMatch = path.match(/\/game\/([A-Z0-9]+)/);
      if (roomIdMatch) {
        const roomId = roomIdMatch[1];
        console.log('检测到房间ID:', roomId);
        // 不在这里设置roomId，让GameRoom组件来处理验证
        // set({ roomId });
      }
    });

    socket.on('disconnect', () => {
      set({ connected: false });
      console.log('与服务器断开连接');
    });

    // 重连监听
    socket.io.on('reconnect_attempt', (attemptNumber) => {
      set({ isReconnecting: true, reconnectAttempts: attemptNumber });
      console.log(`正在尝试重连... (第 ${attemptNumber} 次)`);
    });

    socket.io.on('reconnect', (attemptNumber) => {
      set({ isReconnecting: false, reconnectAttempts: 0 });
      console.log('重连成功！');
      
      // 重连后重新加入房间
      const { roomId, deviceId } = get();
      if (roomId) {
        socket.emit('joinRoom', { roomId, deviceId, playerName: null });
      }
    });

    socket.io.on('reconnect_failed', () => {
      set({ isReconnecting: false });
      console.error('重连失败');
      window.dispatchEvent(new CustomEvent('game-error', { 
        detail: '无法连接到服务器，请检查网络连接' 
      }));
    });

    socket.on('roomCreated', ({ roomId }) => {
      // 房间创建成功，保持使用设备ID
      set({ roomId, isCreatingRoom: false, navigationTarget: `/game/${roomId}` });
    });

    // 监听房间更新事件
    socket.on('roomUpdate', (roomData) => {
      console.log('收到房间更新:', roomData);
      
      // 验证roomData数据的完整性
      if (!roomData || !roomData.id || !Array.isArray(roomData.players)) {
        console.error('收到无效的房间数据:', roomData);
        return;
      }

      const previousRoomId = get().roomId;
      const currentPlayerId = get().currentPlayerId;

      // 如果已经有房间ID且与接收到的不同，忽略此更新（除非是首次连接）
      if (previousRoomId && previousRoomId !== roomData.id) {
        console.log('收到其他房间的更新，忽略:', roomData.id, 'vs', previousRoomId);
        return;
      }

      // 更新房间状态
      set({
        roomId: roomData.id,
        roomState: roomData.roomState,
        players: roomData.players,
        gameStarted: roomData.gameStarted,
        roomSettings: roomData.settings,
      });

      // 如果有游戏状态，也更新游戏状态
      if (roomData.gameState) {
        set({ gameState: roomData.gameState });
      }

      console.log('房间状态已更新, 玩家数量:', roomData.players.length);
    });

    // 监听玩家加入事件
    socket.on('playerJoined', (playerData) => {
      console.log('玩家加入:', playerData);
      // 这个事件通常会被roomUpdate覆盖，但可以用于实时提示
    });

    // 监听游戏开始事件
    socket.on('gameStarted', (gameData) => {
      console.log('游戏开始:', gameData);
      set({ gameStarted: true });
    });

    socket.on('gameStateUpdate', (gameState) => {
      console.log('收到游戏状态更新:', gameState);

      // 验证gameState数据的完整性
      if (!gameState || !gameState.id || !Array.isArray(gameState.players)) {
        console.error('收到无效的游戏状态数据:', gameState);
        return;
      }

      const previousRoomId = get().roomId;
      const previousGameState = get().gameState;
      const currentPlayerId = get().currentPlayerId;

      // 如果已经有房间ID且与接收到的不同，忽略此更新（除非是首次连接）
      if (previousRoomId && previousRoomId !== gameState.id) {
        console.log('收到其他房间的状态更新，忽略:', gameState.id, 'vs', previousRoomId);
        return;
      }

      const nextPhase = gameState.gameState?.phase || null;

      set({
        roomId: gameState.id, // 设置roomId
        roomState: gameState.roomState,
        players: gameState.players,
        gameStarted: gameState.gameStarted,
        gameState: gameState.gameState,
        roomSettings: gameState.settings,
      });

      // 新一手开始后自动关闭上一手的结果弹窗，避免遮挡后续操作
      if (get().showHandResult && previousGameState && nextPhase !== 'showdown') {
        set({ showHandResult: false, handResult: null });
      }

      // 更新当前玩家状态
      const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId);

      if (currentPlayer) {
        const amountToCall = Math.max(0, (gameState.gameState?.currentBet || 0) - currentPlayer.currentBet);
        const currentPlayerView = derivePlayerStateView(currentPlayer, gameState.roomState);
        set({
          currentPlayer,
          currentPlayerView,
          playerHand: currentPlayer.hand,
          playerChips: currentPlayer.chips,
          playerBet: currentPlayer.currentBet,
          canCheck: currentPlayer.currentBet >= (gameState.gameState?.currentBet || 0),
          canRaise: currentPlayer.chips - amountToCall >= (gameState.gameState?.minRaise || 0),
          minRaise: gameState.gameState?.minRaise || 0,
        });

        // 如果刚加入房间（之前没有roomId或roomId不同），并且当前不在房间页面，则跳转
        // 但要排除正在创建房间的情况（创建房间有专门的跳转逻辑）
        // 只有在用户主动加入房间时才跳转（通过joinRoom方法设置的intentionalJoin标志）
        const currentPath = window.location.pathname;
        const isNotInGameRoom = !currentPath.includes(`/game/${gameState.id}`);
        const { isCreatingRoom, intentionalJoin } = get();

        // 只要是主动加入且当前不在目标房间页，就执行跳转
        if (isNotInGameRoom && !isCreatingRoom && intentionalJoin) {
          console.log('加入房间成功，跳转到房间页面:', gameState.id);
          console.log('跳转条件检查:', {
            isNotInGameRoom,
            isCreatingRoom,
            intentionalJoin,
            currentPath,
            gameStateId: gameState.id
          });
          set({
            navigationTarget: `/game/${gameState.id}`,
            showJoinRoom: false, // 关闭加入房间模态框
            intentionalJoin: false, // 重置标志
          });
        } else {
          console.log('跳转条件不满足:', {
            isNotInGameRoom,
            isCreatingRoom,
            intentionalJoin,
            currentPath,
            gameStateId: gameState.id
          });
        }
      } else {
        set({ currentPlayer: null, currentPlayerView: null });
      }
    });

    socket.on('handResult', (result) => {
      set({ showHandResult: true, handResult: result });
    });

    socket.on('allinResult', (result) => {
      set({ showHandResult: true, handResult: { ...result, isAllin: true } });
    });

    // 观战模式通知
    socket.on('spectatorMode', (data) => {
      console.log('进入观战模式:', data.message);
      window.dispatchEvent(new CustomEvent('game-info', { detail: data.message }));
    });

    // 等待下一轮通知
    socket.on('waitingForNextRound', (data) => {
      console.log('等待下一轮游戏:', data);
      window.dispatchEvent(new CustomEvent('game-info', { detail: data.message }));
    });

    socket.on('error', (message) => {
      // 如果是创建房间时出错，重置创建状态
      const { isCreatingRoom } = get();
      if (isCreatingRoom) {
        set({ isCreatingRoom: false });
      }
      // 使用自定义事件发送错误，由Toast组件处理
      window.dispatchEvent(new CustomEvent('game-error', { detail: message }));
    });

    return socket;
  },

  // 断开Socket
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },

  // 创建房间
  createRoom: (settings) => {
    const { socket } = get();
    if (socket) {
      set({ isCreatingRoom: true });
      socket.emit('createRoom', settings);
    }
  },

  // 验证房间是否存在
  checkRoom: async (roomId) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (response.ok) {
        const roomData = await response.json();
        return roomData;
      } else {
        const error = await response.json();
        throw new Error(error.error || '房间不存在');
      }
    } catch (error) {
      throw error;
    }
  },

  // 加入房间
  joinRoom: (roomId) => {
    return new Promise((resolve, reject) => {
      const { socket, deviceId } = get();
      if (!socket || !deviceId) {
        reject(new Error('连接未建立'));
        return;
      }

      // 设置主动加入标志
      set({ intentionalJoin: true });

      let timeoutId;
      let resolved = false;

      // 创建一次性监听器来处理响应
      const successHandler = ({ roomId: joinedRoomId }) => {
        if (resolved) return;
        if (joinedRoomId === roomId) {
          resolved = true;
          socket.off('error', errorHandler);
          clearTimeout(timeoutId);
          const targetPath = `/game/${joinedRoomId}`;
          const currentPath = window.location.pathname;

          set({
            roomId,
            showJoinRoom: false,
            intentionalJoin: false,
            navigationTarget: currentPath === targetPath ? null : targetPath,
          });
          resolve({ roomId: joinedRoomId });
        }
      };

      const errorHandler = (message) => {
        if (resolved) return;
        resolved = true;
        socket.off('joinedRoom', successHandler);
        clearTimeout(timeoutId);
        set({ intentionalJoin: false });
        reject(new Error(message));
      };

      // 超时处理
      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.off('joinedRoom', successHandler);
          socket.off('error', errorHandler);
          set({ intentionalJoin: false });
          reject(new Error('加入房间超时'));
        }
      }, 10000); // 10秒超时

      // 监听成功和错误响应
      socket.once('joinedRoom', successHandler);
      socket.once('error', errorHandler);

      // 发送加入房间请求（只传递roomId和deviceId）
      socket.emit('joinRoom', { roomId, deviceId, playerName: null });
    });
  },

  // 开始游戏
  startGame: () => {
    const { socket, roomId } = get();
    console.log('开始游戏被调用', { socket: !!socket, roomId });
    if (socket && roomId) {
      console.log('发送startGame事件到服务器', roomId);
      socket.emit('startGame', roomId);
    } else {
      console.log('无法开始游戏：socket或roomId不存在');
    }
  },

  // 玩家动作
  playerAction: (action, amount = 0) => {
    const { socket } = get();
    if (socket) {
      socket.emit('playerAction', { action, amount });
    }
  },

  // 换座
  changeSeat: (fromSeat, toSeat) => {
    const { socket } = get();
    if (socket) {
      socket.emit('changeSeat', { fromSeat, toSeat });
    }
  },

  // 入座
  takeSeat: (seatIndex) => {
    const { socket } = get();
    if (socket) {
      socket.emit('takeSeat', { seatIndex });
    }
  },

  // 离座
  leaveSeat: () => {
    const { socket } = get();
    if (socket) {
      console.log('请求离座');
      socket.emit('leaveSeat');
    }
  },

  // 补码请求
  requestRebuy: (amount) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) {
        reject(new Error('连接未建立'));
        return;
      }

      let timeoutId;
      let resolved = false;

      // 创建一次性监听器来处理响应
      const successHandler = (payload) => {
        if (resolved) return;
        resolved = true;
        socket.off('error', errorHandler);
        clearTimeout(timeoutId);
        resolve(payload);
      };

      const errorHandler = (message) => {
        if (resolved) return;
        resolved = true;
        socket.off('rebuySuccess', successHandler);
        clearTimeout(timeoutId);
        reject(new Error(message));
      };

      // 超时处理
      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.off('rebuySuccess', successHandler);
          socket.off('error', errorHandler);
          reject(new Error('补码请求超时'));
        }
      }, 5000); // 5秒超时

      // 监听成功和错误响应
      socket.once('rebuySuccess', successHandler);
      socket.once('error', errorHandler);

      // 发送补码请求
      socket.emit('requestRebuy', amount);
    });
  },

  // 亮牌
  showHand: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('revealHand', { mode: 'show_all' });
    }
  },

  // 盖牌
  muckHand: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('revealHand', { mode: 'hide' });
    }
  },

  // 手动重连
  manualReconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  },

  // 模态框控制
  setShowCreateRoom: (show) => set({ showCreateRoom: show }),
  setShowJoinRoom: (show) => set({ showJoinRoom: show }),
  setShowHandResult: (show) =>
    set(show ? { showHandResult: true } : { showHandResult: false, handResult: null }),

  // 导航控制
  clearNavigationTarget: () => set({ navigationTarget: null }),

  // 重置状态（保留连接和设备信息）
  resetGame: () => {
    const { socket, connected, currentPlayerId, deviceId } = get();
    set({
      roomId: null,
      roomSettings: null,
      roomState: null,
      players: [],
      gameStarted: false,
      gameState: null,
      currentPlayer: null,
      currentPlayerView: null,
      communityCards: [],
      pot: 0,
      isCreatingRoom: false,
      navigationTarget: null,
      // 保留连接状态和设备ID
      socket,
      connected,
      currentPlayerId,
      deviceId,
      playerHand: [],
      playerChips: 0,
      playerBet: 0,
      canCheck: false,
      canRaise: false,
      minRaise: 0,
      showHandResult: false,
      handResult: null,
    });
  },
}));

// 创建Context
const GameContext = createContext();

// Provider组件
export const GameProvider = ({ children }) => {
  const store = useGameStore();

  useEffect(() => {
    // 组件挂载时连接Socket
    store.connectSocket();

    // 组件卸载时断开Socket
    return () => {
      store.disconnectSocket();
    };
  }, []);

  return <GameContext.Provider value={store}>{children}</GameContext.Provider>;
};

// 自定义Hook
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
