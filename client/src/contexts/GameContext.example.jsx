/**
 * 改进后的 GameContext 示例
 * 展示如何集成 Toast 通知和断线重连处理
 */

import { create } from 'zustand';
import deviceIdManager from '../utils/deviceId';
import io from 'socket.io-client';
import { useToast } from '../hooks/useToast';

const useGameStore = create((set, get) => ({
  // ... 现有状态 ...
  
  // 新增：重连状态
  isReconnecting: false,
  reconnectAttempts: 0,
  
  // 修改：connectSocket 方法
  connectSocket: () => {
    const deviceId = deviceIdManager.getDeviceId();
    const serverUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : `http://${window.location.hostname}:3001`;
    
    const socket = io(serverUrl, {
      // 配置重连选项
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      set({ 
        socket, 
        connected: true, 
        currentPlayerId: deviceId, 
        deviceId,
        isReconnecting: false,
        reconnectAttempts: 0,
      });
      console.log('已连接到服务器，Socket ID:', socket.id, '设备ID:', deviceId);
      
      // 注册设备
      socket.emit('registerDevice', { deviceId, socketId: socket.id });
      
      // 如果之前在房间中，重新加入
      const { roomId } = get();
      if (roomId) {
        console.log('重连后自动加入房间:', roomId);
        socket.emit('rejoinRoom', { roomId, deviceId });
      }
    });

    socket.on('disconnect', (reason) => {
      set({ connected: false });
      console.log('与服务器断开连接:', reason);
      
      // 如果是服务器主动断开或IO错误，显示重连状态
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        set({ isReconnecting: true });
      }
    });

    // 监听重连尝试
    socket.io.on('reconnect_attempt', (attemptNumber) => {
      console.log('尝试重连...', attemptNumber);
      set({ 
        isReconnecting: true, 
        reconnectAttempts: attemptNumber 
      });
    });

    // 监听重连成功
    socket.io.on('reconnect', (attemptNumber) => {
      console.log('重连成功!', attemptNumber);
      set({ 
        isReconnecting: false, 
        reconnectAttempts: 0 
      });
    });

    // 监听重连失败
    socket.io.on('reconnect_failed', () => {
      console.error('重连失败');
      set({ isReconnecting: false });
    });

    // 监听错误事件（使用 Toast 替代 alert）
    socket.on('error', (message) => {
      const { isCreatingRoom } = get();
      if (isCreatingRoom) {
        set({ isCreatingRoom: false });
      }
      
      // 注意：这里需要在组件中调用 useToast
      // 在 store 中不能直接调用 hooks，需要通过事件传递
      const errorEvent = new CustomEvent('game-error', { detail: message });
      window.dispatchEvent(errorEvent);
    });

    // ... 其他 socket 事件监听 ...

    return socket;
  },

  // 新增：手动重连方法
  manualReconnect: () => {
    const { socket } = get();
    if (socket && !socket.connected) {
      socket.connect();
    }
  },

  // ... 其他方法 ...
}));

export default useGameStore;
