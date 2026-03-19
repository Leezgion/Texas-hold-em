import { ChevronDown, LogOut, Plus, Share2, Users } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ActionButtons from './ActionButtons';
import Card from './Card';
import CommunityCards from './CommunityCards';
import EmptySeat from './EmptySeat';
import HandHistoryDrawer from './HandHistoryDrawer';
import HandResultModal from './HandResultModal';
import JoinRoomModal from './JoinRoomModal';
import Leaderboard from './Leaderboard';
import LeaveSeatModal from './LeaveSeatModal';
import Player from './Player';
import PlayerPanel from './PlayerPanel';
import RebuyModal from './RebuyModal';
import SettlementOverlay from './SettlementOverlay';
import ShareLinkModal from './ShareLinkModal';
import { useGame } from '../contexts/GameContext';
import {
  deriveCanStartGame,
  derivePendingJoinBanner,
  derivePlayerStateView,
  deriveRecoveryBanner,
} from '../view-models/gameViewModel';
import { buildTablePotSummary } from '../view-models/handHistoryViewModel';

const EMPTY_PLAYERS = [];
const EMPTY_CARDS = [];

// 自定义hook来检测屏幕尺寸
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const GameRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const {
    roomId: currentRoomId,
    players,
    gameStarted,
    gameState,
    roomSettings,
    roomState,
    currentPlayerId,
    connected,
    socket,
    joinRoom,
    checkRoom,
    setShowJoinRoom,
    setShowHandResult,
    showHandResult,
    startGame,
    recoverRoom,
    resetGame,
    isCreatingRoom,
    navigationTarget,
    currentPlayerView,
    revealHand,
  } = useGame();

  const [showShareLink, setShowShareLink] = useState(false);
  const windowSize = useWindowSize();
  const [showRebuy, setShowRebuy] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsJoin, setNeedsJoin] = useState(false);
  const [roomError, setRoomError] = useState(null);
  const [showLeaveSeat, setShowLeaveSeat] = useState(false);
  const [showExitRoom, setShowExitRoom] = useState(false);
  const [gameLogs, setGameLogs] = useState([]);
  const lastLoggedActionKeyRef = useRef(null);
  const playersList = Array.isArray(players) ? players : EMPTY_PLAYERS;
  const activeRoomState = roomState || 'idle';
  const safeGameState = gameState && typeof gameState === 'object' ? gameState : null;
  const maxPlayers = Math.max(2, Number(roomSettings?.maxPlayers) || 6);

  useEffect(() => {
    const verifyRoom = async () => {
      console.log('验证房间状态:', {
        roomId,
        currentRoomId,
        currentPlayerId,
        connected,
        needsJoin,
        isLoading,
        isCreatingRoom,
        navigationTarget,
      });

      // 如果已经连接到正确的房间，不需要验证
      if (currentRoomId === roomId && currentPlayerId) {
        console.log('已经连接到房间:', roomId);
        setNeedsJoin(false);
        setRoomError(null);
        setIsLoading(false);
        return;
      }

      // 如果有不匹配的房间ID，先记录但不立即重定向
      // 这样可以避免在状态更新过程中的误判
      if (currentRoomId && currentRoomId !== roomId && !isCreatingRoom && !navigationTarget) {
        console.log('检测到房间ID不匹配:', currentRoomId, 'vs', roomId, '但暂不重定向');
        // 移除立即重定向，让用户操作完成
        // navigate('/');
        // return;
      }

      // 如果需要验证房间（URL中有roomId但没有连接到房间）
      if (roomId && !currentRoomId && connected && currentPlayerId) {
        try {
          console.log('验证房间:', roomId);
          const roomData = await checkRoom(roomId);
          console.log('验证房间结果:', roomData);

          if (roomData.exists) {
            // 支持观战模式：即使游戏已开始或座位已满，也允许加入
            try {
              console.log('自动加入房间:', roomId);
              await joinRoom(roomId);
              setIsLoading(false);
            } catch (error) {
              console.log('自动加入房间失败:', error);
              setNeedsJoin(true);
              setShowJoinRoom(true);
              setIsLoading(false);
            }
          } else {
            setRoomError('房间不存在');
            setIsLoading(false);
          }
        } catch (error) {
          console.log('房间验证失败:', error);
          setRoomError(error.message || '房间不存在');
          setIsLoading(false);
        }
      } else {
        console.log('等待条件满足:', {
          hasRoomId: !!roomId,
          hasCurrentRoomId: !!currentRoomId,
          connected,
          hasCurrentPlayerId: !!currentPlayerId,
        });
      }

      // 如果当前状态显示已连接到房间，但实际上没有玩家数据，可能房间已被删除
      // 但在创建房间过程中不要触发这个逻辑，因为玩家数据可能还在传输中
      if (currentRoomId === roomId && currentPlayerId && playersList.length === 0 && connected && !isCreatingRoom) {
        console.log('检测到房间状态异常，重新验证房间');
        // 清除错误的房间状态并重新验证
        if (socket) {
          socket.emit('leaveRoom', roomId);
        }

        // 重置客户端状态
        resetGame();
        setNeedsJoin(false);
        setCurrentPlayer(null);

        // 延迟重新验证，避免无限循环
        setTimeout(() => {
          verifyRoom();
        }, 1000);
      }
    };

    verifyRoom();
  }, [currentRoomId, roomId, navigate, setShowJoinRoom, connected, checkRoom, currentPlayerId, isCreatingRoom, navigationTarget, socket, resetGame, playersList.length]);

  useEffect(() => {
    if (currentPlayerId && playersList.length > 0) {
      const player = playersList.find((p) => p.id === currentPlayerId);
      setCurrentPlayer(player);

      // 如果找到了玩家且房间ID匹配，停止加载并重置加入状态
      if (player && currentRoomId === roomId) {
        setIsLoading(false);
        setNeedsJoin(false);
        setRoomError(null);
      }
    }
  }, [currentPlayerId, playersList, currentRoomId, roomId]);

  const currentPlayerStateView = currentPlayer
    ? derivePlayerStateView(currentPlayer, activeRoomState)
    : currentPlayerView;
  const canStartGame = deriveCanStartGame(currentPlayer, playersList, activeRoomState);
  const recoveryBanner = deriveRecoveryBanner(currentPlayer, activeRoomState);
  const pendingJoinBanner = derivePendingJoinBanner(currentPlayer, activeRoomState);
  const handHistoryRecords = safeGameState?.handHistory || [];
  const tablePotSummary = buildTablePotSummary(safeGameState);

  useEffect(() => {
    setGameLogs([]);
    lastLoggedActionKeyRef.current = null;
  }, [roomId]);

  // 监听游戏状态变化，更新日志
  useEffect(() => {
    if (!safeGameState || !safeGameState.lastAction) return;

    const { lastAction } = safeGameState;
    const actionKey = [
      safeGameState.handNumber || 0,
      lastAction.playerId,
      lastAction.action,
      lastAction.amount || 0,
      lastAction.totalBet || 0,
      lastAction.timestamp || 0,
      lastAction.reason || '',
      lastAction.auto ? 'auto' : 'manual',
    ].join(':');

    if (lastLoggedActionKeyRef.current === actionKey) {
      return;
    }

    const player = playersList.find((p) => p.id === lastAction.playerId);

    if (player) {
      lastLoggedActionKeyRef.current = actionKey;

      setGameLogs((prev) => [
        ...prev.slice(-19),
        {
          // 保留最近20条
          player: player.nickname || player.id || '玩家',
          action: lastAction.action,
          amount: lastAction.amount,
          timestamp: lastAction.timestamp || Date.now(),
        },
      ]);
    }
  }, [safeGameState?.handNumber, safeGameState?.lastAction, playersList]);

  // 如果有房间错误，显示错误信息
  if (roomError) {
    return (
      <div className="min-h-screen bg-poker-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-4">无法访问房间</h2>
          <p className="text-xl text-red-400 mb-6">{roomError}</p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/')}
              className=" primary px-8 py-3"
            >
              返回主页
            </button>
            {roomId && <p className="text-sm text-gray-400">房间ID: {roomId}</p>}
          </div>
        </div>
      </div>
    );
  }

  // 如果还没有玩家信息，显示加载状态
  if (isLoading || (!currentPlayer && !needsJoin && currentRoomId === roomId && playersList.length === 0)) {
    return (
      <div className="min-h-screen bg-poker-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-poker-gold mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">
            {!connected
              ? '正在连接服务器...'
              : !currentPlayerId
              ? '正在建立设备身份...'
              : needsJoin
              ? '验证房间中...'
              : roomId && !currentRoomId
              ? '验证房间状态...'
              : '正在加载游戏...'}
          </p>
          {roomId && <p className="text-sm text-gray-400 mt-2">房间ID: {roomId}</p>}
          {currentPlayerId && <p className="text-sm text-gray-400 mt-2">玩家ID: {currentPlayerId}</p>}
        </div>
      </div>
    );
  }

  // 处理离座确认
  const handleLeaveSeat = () => {
    console.log('离座按钮被点击', { gameStarted, currentPlayer });
    if (gameStarted && currentPlayer && currentPlayerStateView?.tableState === 'active_in_hand') {
      // 游戏中离座，需要确认
      setShowLeaveSeat(true);
    } else {
      // 游戏外离座，直接执行
      confirmLeaveSeat();
    }
  };

  // 确认离座
  const confirmLeaveSeat = () => {
    console.log('确认离座被调用');
    console.log('离座状态:', {
      hasSocket: !!socket,
      hasCurrentPlayer: !!currentPlayer,
      gameStarted,
      playerFolded: currentPlayer?.folded,
      playerId: currentPlayer?.id,
    });

    if (socket && currentPlayer) {
      if (gameStarted && currentPlayerStateView?.tableState === 'active_in_hand') {
        // 游戏中自动fold
        console.log('游戏中离座，先弃牌');
        socket.emit('playerAction', { action: 'fold', amount: 0 });
      }
      // 离开座位
      console.log('发送离座请求');
      socket.emit('leaveSeat');
    } else {
      console.log('无法离座: socket或currentPlayer不存在');
    }
    setShowLeaveSeat(false);
  };

  // 处理退出房间确认
  const handleExitRoom = () => {
    if (gameStarted && currentPlayer && currentPlayerStateView?.tableState === 'active_in_hand') {
      // 游戏中退出，需要确认
      setShowExitRoom(true);
    } else {
      // 游戏外退出，直接执行
      confirmExitRoom();
    }
  };

  // 确认退出房间
  const confirmExitRoom = () => {
    if (socket && currentPlayer) {
      if (gameStarted && currentPlayerStateView?.tableState === 'active_in_hand') {
        // 游戏中自动fold
        socket.emit('playerAction', { action: 'fold', amount: 0 });
      }
      // 离开房间
      socket.emit('leaveRoom', roomId);
    }
    resetGame();
    setShowExitRoom(false);
    navigate('/');
  };

  // 计算玩家座位位置 - 主观视角，当前玩家总是在底部
  const getPlayerPosition = (player, allPlayers) => {
    // 找到当前玩家的座位号
    const currentPlayerSeat = currentPlayer ? currentPlayer.seat : 0;

    // 计算相对座位位置（当前玩家为0）
    const totalPlayers = allPlayers.length;
    const relativeSeat = (player.seat - currentPlayerSeat + totalPlayers) % totalPlayers;

    // 根据玩家数量定义不同的布局
    const positions = getLayoutPositions(totalPlayers);

    return positions[relativeSeat] || { x: 0, y: 0 };
  };

  // 根据玩家数量获取座位布局
  const getLayoutPositions = (playerCount) => {
    // 响应式半径 - 根据屏幕尺寸调整
    const isMobile = windowSize.width < 768; // Tailwind的md断点
    const isSmallMobile = windowSize.width < 480; // 小屏手机

    // 根据屏幕尺寸选择半径和缩放比例
    // 增加半径以避免座位遮盖牌桌
    let radius, scale;
    if (isSmallMobile) {
      radius = 230; // 增加最小半径：从140->170
      scale = 0.6; // 最小缩放
    } else if (isMobile) {
      radius = 220; // 增加中等半径：从180->220
      scale = 0.7; // 中等缩放
    } else {
      radius = 320; // 增加桌面半径：从280->320
      scale = 1; // 原始尺寸
    }

    // 为不同玩家数量定义最佳布局，根据设备尺寸调整

    switch (playerCount) {
      case 2:
        return [
          { x: 0, y: Math.round(260 * scale) }, // 当前玩家 - 底部 (220->260)
          { x: 0, y: Math.round(-260 * scale) }, // 对手 - 顶部 (220->260)
        ];
      case 3:
        return [
          { x: 0, y: Math.round(260 * scale) }, // 当前玩家 - 底部 (220->260)
          { x: Math.round(-240 * scale), y: Math.round(-130 * scale) }, // 左上 (200->240, 110->130)
          { x: Math.round(240 * scale), y: Math.round(-130 * scale) }, // 右上 (200->240, 110->130)
        ];
      case 4:
        return [
          { x: 0, y: Math.round(260 * scale) }, // 当前玩家 - 底部 (220->260)
          { x: Math.round(-280 * scale), y: 0 }, // 左边 (240->280)
          { x: 0, y: Math.round(-260 * scale) }, // 顶部 (220->260)
          { x: Math.round(280 * scale), y: 0 }, // 右边 (240->280)
        ];
      case 5:
        return [
          { x: 0, y: Math.round(260 * scale) }, // 当前玩家 - 底部 (220->260)
          { x: Math.round(-270 * scale), y: Math.round(95 * scale) }, // 左下 (230->270, 80->95)
          { x: Math.round(-180 * scale), y: Math.round(-210 * scale) }, // 左上 (150->180, 180->210)
          { x: Math.round(180 * scale), y: Math.round(-210 * scale) }, // 右上 (150->180, 180->210)
          { x: Math.round(270 * scale), y: Math.round(95 * scale) }, // 右下 (230->270, 80->95)
        ];
      case 6:
        return [
          { x: 0, y: Math.round(260 * scale) }, // 当前玩家 - 底部 (220->260)
          { x: Math.round(-250 * scale), y: Math.round(130 * scale) }, // 左下 (210->250, 110->130)
          { x: Math.round(-250 * scale), y: Math.round(-130 * scale) }, // 左上 (210->250, 110->130)
          { x: 0, y: Math.round(-260 * scale) }, // 顶部 (220->260)
          { x: Math.round(250 * scale), y: Math.round(-130 * scale) }, // 右上 (210->250, 110->130)
          { x: Math.round(250 * scale), y: Math.round(130 * scale) }, // 右下 (210->250, 110->130)
        ];
      case 7:
      case 8:
      case 9:
      case 10:
      default:
        // 椭圆形布局算法：主要分布在上下方，避免正左右两侧
        const positions = [];

        // 椭圆参数：水平半径较小，垂直半径较大，形成胶囊形状
        const horizontalRadius = radius * 0.7; // 水平压缩到70%
        const verticalRadius = radius * 1.1; // 垂直拉伸到110%

        for (let i = 0; i < playerCount; i++) {
          // 从底部开始，顺时针分布
          // 底部是90度，所以起始角度是90度（π/2）
          const angle = Math.PI / 2 + (i * 2 * Math.PI) / playerCount;
          const x = Math.round(horizontalRadius * Math.cos(angle));
          const y = Math.round(verticalRadius * Math.sin(angle));
          positions.push({ x, y });
        }
        return positions;
    }
  };

  // 简化设备ID显示
  const getDisplayName = (nickname) => {
    const safeNickname = typeof nickname === 'string' && nickname.trim() ? nickname : '玩家';

    if (safeNickname.startsWith('房主-')) {
      return '房主';
    }
    // 如果是设备ID，显示前6位
    if (safeNickname.length > 10) {
      return safeNickname.slice(0, 6) + '...';
    }
    return safeNickname;
  };

  // 获取德州扑克位置标记
  const getPositionLabel = (seatIndex) => {
    if (!gameStarted || !safeGameState || safeGameState.dealerPosition === undefined) {
      return `座位 ${seatIndex + 1}`;
    }

    // 找到该座位的玩家
    const seatPlayer = playersList.find((p) => p.seat === seatIndex);
    if (!seatPlayer) {
      return `座位 ${seatIndex + 1}`;
    }

    const activePlayers = playersList.filter((p) => p.isActive);
    const playerCount = activePlayers.length;

    if (playerCount < 2) {
      return `座位 ${seatIndex + 1}`;
    }

    // 获取庄家位置
    const dealerPosition = safeGameState.dealerPosition;

    // 计算位置
    if (playerCount === 2) {
      // 双人游戏：庄家是小盲，另一个是大盲
      if (seatIndex === dealerPosition) {
        return 'SB/BTN'; // 小盲/按钮
      } else {
        return 'BB'; // 大盲
      }
    } else {
      // 多人游戏
      if (seatIndex === dealerPosition) {
        return 'BTN'; // 按钮位
      }

      // 创建活跃玩家的座位顺序（按座位号排序）
      const activeSeats = activePlayers.map((p) => p.seat).sort((a, b) => a - b);

      const dealerSeatIndex = activeSeats.indexOf(dealerPosition);
      const currentSeatIndex = activeSeats.indexOf(seatIndex);

      if (dealerSeatIndex !== -1 && currentSeatIndex !== -1) {
        // 计算相对于庄家的位置
        const positionFromDealer = (currentSeatIndex - dealerSeatIndex + activeSeats.length) % activeSeats.length;

        if (positionFromDealer === 1) {
          return 'SB'; // 小盲（庄家左边第一个）
        } else if (positionFromDealer === 2) {
          return 'BB'; // 大盲（庄家左边第二个）
        } else if (positionFromDealer === activeSeats.length - 1) {
          return 'CO'; // Cutoff（庄家右边第一个）
        } else if (positionFromDealer === activeSeats.length - 2 && activeSeats.length > 6) {
          return 'HJ'; // Hijack（只在6人以上时显示）
        } else if (positionFromDealer <= 3) {
          return 'EP'; // Early Position
        } else {
          return 'MP'; // Middle Position
        }
      }
    }

    return `座位 ${seatIndex + 1}`;
  };

  return (
    <div className="min-h-screen bg-poker-dark relative overflow-hidden">
      {/* 重新设计的顶部信息栏 */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        {/* 左侧：玩家面板 */}
        <PlayerPanel
          players={playersList}
          roomSettings={roomSettings}
          gameStarted={gameStarted}
          roomState={activeRoomState}
          currentPlayerId={currentPlayerId}
        />

        {/* 右侧：操作按钮组 + 倒计时 */}
        <div className="flex items-center space-x-2">
          {/* 倒计时器 - 紧凑版 */}
          {safeGameState && safeGameState.timeRemaining > 0 && safeGameState.currentPlayerIndex !== undefined && (
            <div
              className={`w-12 h-12 rounded-full border-2 ${
                safeGameState.timeRemaining > 30
                  ? 'border-green-400 text-green-400'
                  : safeGameState.timeRemaining > 10
                  ? 'border-yellow-400 text-yellow-400'
                  : 'border-red-400 text-red-400'
              } bg-gray-800/95 backdrop-blur-sm flex items-center justify-center`}
            >
              <div className="text-sm font-bold font-mono">{safeGameState.timeRemaining}</div>
            </div>
          )}

          {/* 补码按钮 */}
          {currentPlayer && currentPlayerStateView?.canRequestRebuy && (
            <div
              onClick={() => setShowRebuy(true)}
              className="w-10 h-10 bg-green-600/80 hover:bg-green-600 backdrop-blur-sm rounded-lg border border-green-500 flex items-center justify-center transition-colors cursor-pointer"
              title="补码"
            >
              <Plus size={18} />
            </div>
          )}

          {/* 分享按钮 */}
          <div
            onClick={() => setShowShareLink(true)}
            className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded-lg border border-gray-600 flex items-center justify-center transition-colors cursor-pointer"
            title="分享链接"
          >
            <Share2 size={18} />
          </div>

          {/* 离座按钮 - 只有已入座的玩家才显示 */}
          {currentPlayer && currentPlayerStateView?.canLeaveSeat && (
            <div
              onClick={handleLeaveSeat}
              className="w-10 h-10 bg-orange-600/80 hover:bg-orange-600 backdrop-blur-sm rounded-lg border border-orange-500 flex items-center justify-center transition-colors cursor-pointer"
              title="离座观战"
            >
              <ChevronDown size={18} />
            </div>
          )}

          {/* 退出按钮 */}
          <div
            onClick={handleExitRoom}
            className="w-10 h-10 bg-red-600/80 hover:bg-red-600 backdrop-blur-sm rounded-lg border border-red-500 flex items-center justify-center transition-colors cursor-pointer"
            title="退出房间"
          >
            <LogOut size={18} />
          </div>
        </div>
      </div>

      {(recoveryBanner || pendingJoinBanner) && (
        <div className="absolute top-20 left-4 right-4 z-10 space-y-3">
          {recoveryBanner && (
            <div className="mx-auto max-w-3xl rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-amber-200">{recoveryBanner.title}</p>
                  <p className="text-sm text-amber-100/90">{recoveryBanner.detail}</p>
                </div>
                {recoveryBanner.canRecover && (
                  <button
                    onClick={() => recoverRoom()}
                    className="rounded-lg border border-amber-300/60 bg-amber-200/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-200/20"
                  >
                    {recoveryBanner.actionLabel}
                  </button>
                )}
              </div>
            </div>
          )}

          {pendingJoinBanner && (
            <div className="mx-auto max-w-3xl rounded-2xl border border-sky-400/40 bg-sky-500/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-sm font-semibold text-sky-100">{pendingJoinBanner.title}</p>
              <p className="mt-1 text-sm text-sky-50/90">{pendingJoinBanner.detail}</p>
            </div>
          )}
        </div>
      )}

      {/* 游戏桌 */}
      <div className="relative w-full h-screen flex items-center justify-center">
        {/* 扑克桌 */}
        <div
          className={`poker-table relative ${
            windowSize.width < 480
              ? 'w-48 h-48' // 小屏手机: 192px (减小从224px)
              : windowSize.width < 768
              ? 'w-56 h-56' // 普通手机: 224px (减小从256px)
              : 'w-72 h-72' // 桌面: 288px (减小从320px)
          }`}
        >
          {/* 公共牌区域 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <CommunityCards />
          </div>

          {/* 底池 */}
          {safeGameState && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-16">
              <div className="bg-black bg-opacity-50 px-4 py-2 rounded-lg border border-poker-gold">
                <div className="space-y-1">
                  {tablePotSummary.items.map((item, index) => (
                    <div
                      key={`${item.label}-${index}`}
                      className={`flex items-center justify-between gap-4 text-xs ${
                        index === 0 ? 'border-b border-gray-600 pb-1 text-sm' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div className={index === 0 ? 'text-poker-gold font-semibold' : 'text-gray-300'}>{item.label}</div>
                        {item.detail && <div className="text-[11px] text-gray-500">{item.detail}</div>}
                      </div>
                      <span className={index === 0 ? 'text-white text-lg' : 'text-yellow-400'}>{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 游戏阶段和倒计时 */}
          {safeGameState && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-32">
              <div className="bg-black bg-opacity-50 px-4 py-2 rounded-lg border border-poker-gold">
                <span className="text-poker-gold font-semibold">
                  {safeGameState.phase === 'preflop' && '翻牌前'}
                  {safeGameState.phase === 'flop' && '翻牌'}
                  {safeGameState.phase === 'turn' && '转牌'}
                  {safeGameState.phase === 'river' && '河牌'}
                  {safeGameState.phase === 'showdown' && '摊牌'}
                </span>
              </div>
            </div>
          )}
        </div>

        <SettlementOverlay
          roomState={activeRoomState}
          gameState={safeGameState}
          currentPlayer={currentPlayer}
          currentPlayerId={currentPlayerId}
          onReveal={revealHand}
        />

        {/* 所有座位（玩家和空座位） */}
        {Array.from({ length: maxPlayers }, (_, seatIndex) => {
          // 找到该座位的玩家（包括当前玩家）
          const seatPlayer = playersList.find((player) => player.seat === seatIndex);

          // 为了正确计算位置，我们需要模拟一个玩家数组
          const allPlayers = Array.from({ length: maxPlayers }, (_, i) => ({ seat: i }));
          const position = getPlayerPosition({ seat: seatIndex }, allPlayers);

          if (seatPlayer) {
            // 有玩家的座位
            const isCurrentPlayer = seatPlayer.id === currentPlayerId;
            const isCurrentTurn = safeGameState && safeGameState.currentPlayerIndex === playersList.indexOf(seatPlayer);
            const isActiveTimer = safeGameState && safeGameState.timeRemaining > 0 && isCurrentTurn;

            if (isCurrentPlayer) {
              // 当前玩家的座位显示为占用状态，但不显示详细信息（详细信息在底部）
              return (
                <div
                  key={`seat-${seatIndex}`}
                  className={`player-seat current-player-seat compact ${isActiveTimer ? 'current-turn-timer' : ''}`}
                  style={{
                    left: `calc(50% + ${position.x}px)`,
                    top: `calc(50% + ${position.y}px)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="text-center relative">
                    <div
                      className={`w-12 h-12 bg-blue-600/20 backdrop-blur-sm rounded-lg border-2 ${
                        isActiveTimer ? 'border-yellow-400 animate-pulse' : 'border-blue-400'
                      } flex items-center justify-center`}
                    >
                      <div className={`text-xs font-semibold ${isActiveTimer ? 'text-yellow-400' : 'text-blue-400'}`}>
                        我的
                        <br />
                        位置
                      </div>
                    </div>
                    <div className={`text-xs mt-1 ${isActiveTimer ? 'text-yellow-400' : 'text-blue-400'}`}>{getPositionLabel(seatIndex)}</div>
                  </div>
                </div>
              );
            } else {
              // 其他玩家的座位
              return (
                <div
                  key={`seat-${seatIndex}`}
                  className={`player-seat compact ${seatPlayer.isActive ? 'active' : ''} ${isCurrentTurn ? 'current-turn' : ''} ${isActiveTimer ? 'current-turn-timer' : ''}`}
                  style={{
                    left: `calc(50% + ${position.x}px)`,
                    top: `calc(50% + ${position.y}px)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <Player
                    player={seatPlayer}
                    isCurrentPlayer={false}
                    isCurrentTurn={isCurrentTurn}
                    gameState={safeGameState}
                    gameStarted={gameStarted}
                    isActiveTimer={isActiveTimer}
                    getPositionLabel={getPositionLabel}
                  />
                </div>
              );
            }
          } else {
            // 空座位
            return (
              <EmptySeat
                key={`empty-seat-${seatIndex}`}
                seatIndex={seatIndex}
                position={position}
                getPositionLabel={getPositionLabel}
                roomState={activeRoomState}
              />
            );
          }
        })}
      </div>

      {/* 右侧边栏 - 移动端隐藏或调整位置 */}
      <div
        className={`absolute ${
          windowSize.width < 768
            ? 'hidden'
            : 'right-4 top-20 w-72 space-y-4'
        }`}
      >
        <Leaderboard players={playersList} />
      </div>

      <HandHistoryDrawer records={handHistoryRecords} />

      {/* 底部UI区域 - 简化设计 */}
      {currentPlayer && (
        <div className="absolute bottom-0 left-0 right-0">
          {/* 操作按钮区域 */}
          {gameStarted && (
            <div className="flex justify-center mb-3">
              <ActionButtons
                player={currentPlayer}
                gameState={safeGameState}
                currentPlayerId={currentPlayerId}
                players={playersList}
              />
            </div>
          )}

          <div className="relative">
            {/* 手牌区域 - 居中显示 */}
            {gameStarted && (Array.isArray(currentPlayer.hand) ? currentPlayer.hand : EMPTY_CARDS).length > 0 && (
              <div className="flex justify-center space-x-4 mb-4">
                {(Array.isArray(currentPlayer.hand) ? currentPlayer.hand : EMPTY_CARDS).map((card, index) => (
                  <Card
                    key={index}
                    card={card}
                    size="large"
                  />
                ))}
              </div>
            )}

            {/* 左下角玩家信息 */}
            <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-600">
              <div className="flex items-center space-x-2 text-sm">
                <span
                  className="font-semibold text-white"
                  title={currentPlayer.nickname || currentPlayer.id || '玩家'}
                >
                  {getDisplayName(currentPlayer.nickname)}
                </span>
                {currentPlayer.isHost && <span className="text-poker-gold">👑</span>}
              </div>
              <div className="text-poker-gold font-semibold">{Number(currentPlayer.chips) || 0}</div>
              {gameStarted && currentPlayerStateView && (
                <div
                  className={`text-xs ${
                    currentPlayerStateView.tableState === 'folded_this_hand'
                      ? 'text-red-400'
                      : currentPlayerStateView.tableState === 'all_in_this_hand'
                      ? 'text-poker-gold'
                      : (Number(currentPlayer.currentBet) || 0) > 0
                      ? 'text-blue-400'
                      : 'text-gray-400'
                  }`}
                >
                  {(Number(currentPlayer.currentBet) || 0) > 0 && currentPlayerStateView.tableState === 'active_in_hand'
                    ? `下注: ${Number(currentPlayer.currentBet) || 0}`
                    : currentPlayerStateView.statusLabel}
                </div>
              )}
            </div>

            {/* 开始游戏按钮（入座玩家可用） - 居中显示 */}
            {!gameStarted && currentPlayer && canStartGame && (
              <div className="flex justify-center pb-4">
                <button
                  onClick={() => startGame()}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold text-lg px-8 py-3 rounded-lg transition-colors"
                >
                  开始游戏
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 模态框 */}
      <ShareLinkModal
        show={showShareLink}
        onClose={() => setShowShareLink(false)}
        roomId={roomId}
      />

      <RebuyModal
        show={showRebuy}
        onClose={() => setShowRebuy(false)}
      />

      <HandResultModal
        show={showHandResult}
        onClose={() => setShowHandResult(false)}
      />

      {/* 离座确认模态框 */}
      <LeaveSeatModal
        show={showLeaveSeat}
        onClose={() => setShowLeaveSeat(false)}
        onConfirm={confirmLeaveSeat}
        player={currentPlayer}
        roomState={activeRoomState}
        isExitingRoom={false}
      />

      {/* 退出房间确认模态框 */}
      <LeaveSeatModal
        show={showExitRoom}
        onClose={() => setShowExitRoom(false)}
        onConfirm={confirmExitRoom}
        player={currentPlayer}
        roomState={activeRoomState}
        isExitingRoom={true}
      />

      {/* 加入房间模态框 - 用于直接访问URL的情况 */}
      <JoinRoomModal roomId={roomId} />
    </div>
  );
};

export default GameRoom;
