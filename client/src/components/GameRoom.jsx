import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ActionDock from './ActionDock';
import EventRail from './EventRail';
import HandResultModal from './HandResultModal';
import IntelRail from './IntelRail';
import JoinRoomModal from './JoinRoomModal';
import LeaveSeatModal from './LeaveSeatModal';
import RebuyModal from './RebuyModal';
import RoomPanelSheet from './RoomPanelSheet';
import SeatRing from './SeatRing';
import SettlementOverlay from './SettlementOverlay';
import ShareLinkModal from './ShareLinkModal';
import TableBanner from './TableBanner';
import TableHeader from './TableHeader';
import TableStage from './TableStage';
import { useGame } from '../contexts/GameContext';
import { getDisplayModeTheme } from '../utils/productMode';
import { resolveRoomViewportLayout } from '../utils/roomViewportLayout';
import { resolveTableDiameter } from '../utils/seatRingLayout';
import { resolveRoomGeometryContract } from '../utils/tableStageLayout';
import {
  deriveCanStartGame,
  deriveIntelRailView,
  deriveLeaveRoomFeedback,
  deriveLeaveSeatFeedback,
  derivePendingJoinBanner,
  derivePlayerStateView,
  deriveRequestErrorFeedback,
  deriveSeatRingView,
  deriveTableShellView,
  deriveRecoveryBanner,
  deriveRecoverRoomFeedback,
  deriveStartGameFeedback,
} from '../view-models/gameViewModel';
import { buildTablePotSummary, deriveEventRailView } from '../view-models/handHistoryViewModel';

const EMPTY_PLAYERS = [];

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

const mapViewportModelToStageShellLayout = (viewportModel) => {
  switch (viewportModel) {
    case 'ultrawide-terminal':
      return 'three-column';
    case 'desktop-terminal':
      return 'split-stage';
    case 'tablet-terminal':
    case 'phone-terminal':
    default:
      return 'stacked';
  }
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
    leaveRoom,
    leaveSeat,
    isCreatingRoom,
    navigationTarget,
    currentPlayerView,
    revealHand,
    revealRequestPending,
    effectiveDisplayMode,
  } = useGame();

  const [showShareLink, setShowShareLink] = useState(false);
  const windowSize = useWindowSize();
  const roomViewportLayout = resolveRoomViewportLayout(windowSize);
  const [showRebuy, setShowRebuy] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsJoin, setNeedsJoin] = useState(false);
  const [roomError, setRoomError] = useState(null);
  const [showLeaveSeat, setShowLeaveSeat] = useState(false);
  const [showExitRoom, setShowExitRoom] = useState(false);
  const [activeSupportPanel, setActiveSupportPanel] = useState(null);
  const [gameLogs, setGameLogs] = useState([]);
  const [measuredDockReservePx, setMeasuredDockReservePx] = useState(roomViewportLayout.dockReservePx);
  const lastLoggedActionKeyRef = useRef(null);
  const roomDockRef = useRef(null);
  const playersList = Array.isArray(players) ? players : EMPTY_PLAYERS;
  const activeRoomState = roomState || 'idle';
  const safeGameState = gameState && typeof gameState === 'object' ? gameState : null;
  const maxPlayers = Math.max(2, Number(roomSettings?.maxPlayers) || 6);
  const stageShellLayout = mapViewportModelToStageShellLayout(roomViewportLayout.viewportModel);
  const usesSideRails = roomViewportLayout.supportSurfacePolicyKey === 'ultrawide';
  const usesSupportPanels = roomViewportLayout.supportSurfacePolicyKey !== 'ultrawide';
  const supportPanelPresentation =
    roomViewportLayout.supportSurfacePolicyValue === 'sheet' ? 'bottom-sheet' : 'slide-panel';
  const roomShellGridClassName = usesSideRails
    ? 'room-shell-grid room-shell-grid--three-column'
    : 'room-shell-grid room-shell-grid--terminal-stack';
  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const supportLabels = theme.sheetLabels || {};

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
  const handHistoryRecords = safeGameState?.handHistory || [];
  const tablePotSummary = buildTablePotSummary(safeGameState);
  const shellView = deriveTableShellView({
    roomId,
    roomState: activeRoomState,
    roomSettings,
    connected,
    effectiveDisplayMode,
    currentPlayer,
    players: playersList,
    gameState: safeGameState,
  });
  const intelRailView = deriveIntelRailView({
    roomState: activeRoomState,
    roomSettings,
    currentPlayer,
    players: playersList,
  });
  const eventRailView = deriveEventRailView({
    roomState: activeRoomState,
    gameState: safeGameState,
  });

  useEffect(() => {
    setGameLogs([]);
    lastLoggedActionKeyRef.current = null;
  }, [roomId]);

  useEffect(() => {
    if (usesSideRails) {
      setActiveSupportPanel(null);
    }
  }, [usesSideRails]);

  useEffect(() => {
    setActiveSupportPanel(null);
  }, [roomId]);

  useLayoutEffect(() => {
    const dockElement = roomDockRef.current;

    if (!dockElement) {
      setMeasuredDockReservePx(roomViewportLayout.dockReservePx);
      return undefined;
    }

    const updateDockReserve = () => {
      const measuredHeight = Math.ceil(dockElement.getBoundingClientRect().height);
      const computedDockBottomPx = Number.parseFloat(window.getComputedStyle(dockElement).bottom) || 0;
      const occupiedDockHeightPx = measuredHeight + Math.ceil(Math.max(0, computedDockBottomPx));
      const nextDockReservePx = Math.max(roomViewportLayout.dockReservePx, occupiedDockHeightPx);

      setMeasuredDockReservePx((currentValue) =>
        currentValue === nextDockReservePx ? currentValue : nextDockReservePx
      );
    };

    updateDockReserve();

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(updateDockReserve);
      observer.observe(dockElement);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateDockReserve);
    return () => window.removeEventListener('resize', updateDockReserve);
  }, [roomViewportLayout.dockReservePx, roomViewportLayout.viewportModel]);

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
    if (gameStarted && currentPlayer && currentPlayerStateView?.tableState === 'active_in_hand') {
      // 游戏中离座，需要确认
      setShowLeaveSeat(true);
    } else {
      // 游戏外离座，直接执行
      confirmLeaveSeat();
    }
  };

  // 确认离座
  const confirmLeaveSeat = async () => {
    if (!currentPlayer) {
      window.dispatchEvent(new CustomEvent('game-error', { detail: '当前没有可离开的座位状态' }));
      return;
    }

    try {
      const result = await leaveSeat();
      const notice = deriveLeaveSeatFeedback(result);
      window.dispatchEvent(new CustomEvent(notice.channel, { detail: notice.detail }));
      setShowLeaveSeat(false);
    } catch (error) {
      const notice = deriveRequestErrorFeedback({
        scope: 'leaveSeat',
        fallbackPrefix: '离座失败',
        error,
      });
      window.dispatchEvent(new CustomEvent(notice.channel, { detail: notice.detail }));
    }
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
  const confirmExitRoom = async () => {
    try {
      const result = await leaveRoom();
      const notice = deriveLeaveRoomFeedback(result);
      window.dispatchEvent(new CustomEvent(notice.channel, { detail: notice.detail }));
      resetGame();
      setShowExitRoom(false);
      navigate('/');
    } catch (error) {
      const notice = deriveRequestErrorFeedback({
        scope: 'leaveRoom',
        fallbackPrefix: '退出房间失败',
        error,
      });
      window.dispatchEvent(new CustomEvent(notice.channel, { detail: notice.detail }));
    }
  };

  const handleStartGame = async () => {
    try {
      const result = await startGame();
      const notice = deriveStartGameFeedback(result);
      if (notice) {
        window.dispatchEvent(new CustomEvent(notice.channel, { detail: notice.detail }));
      }
    } catch (error) {
      if (error.code === 'ROOM_RECOVERY_REQUIRED') {
        return;
      }

      const notice = deriveRequestErrorFeedback({
        scope: 'startGame',
        fallbackPrefix: '开始游戏失败',
        error,
      });
      window.dispatchEvent(new CustomEvent(notice.channel, { detail: notice.detail }));
    }
  };

  const handleRecoverRoom = async () => {
    try {
      const result = await recoverRoom();
      const notice = deriveRecoverRoomFeedback(result);
      window.dispatchEvent(new CustomEvent(notice.channel, { detail: notice.detail }));
    } catch (error) {
      const notice = deriveRequestErrorFeedback({
        scope: 'recoverRoom',
        fallbackPrefix: '恢复房间失败',
        error,
      });
      window.dispatchEvent(new CustomEvent(notice.channel, { detail: notice.detail }));
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

  const tableDiameter = resolveTableDiameter({
    viewportWidth: windowSize.width,
    roomShellLayout: stageShellLayout,
  });
  const roomGeometryContract = resolveRoomGeometryContract({
    viewportLayout: roomViewportLayout,
    viewportWidth: windowSize.width,
    viewportHeight: windowSize.height,
    roomShellLayout: stageShellLayout,
    tableDiameter,
    playerCount: maxPlayers,
  });
  const toggleSupportPanel = (panelId) => {
    if (!usesSupportPanels) {
      return;
    }

    setActiveSupportPanel((currentValue) => (currentValue === panelId ? null : panelId));
  };
  const closeSupportPanel = () => setActiveSupportPanel(null);
  const tableSizeClassName =
    tableDiameter === 208
      ? 'w-52 h-52'
      : tableDiameter === 256
      ? 'w-64 h-64'
      : tableDiameter === 352
      ? 'w-[22rem] h-[22rem]'
      : 'w-80 h-80';
  const currentTurnPlayer =
    safeGameState && Number.isInteger(safeGameState.currentPlayerIndex)
      ? playersList[safeGameState.currentPlayerIndex] || null
      : null;
  const seatRingEntries = deriveSeatRingView({
    players: playersList,
    maxPlayers,
    currentPlayerId,
    roomState: activeRoomState,
    gameState: safeGameState,
    canonicalSlots: roomGeometryContract.canonicalSlots,
  }).map((seat) => {
    const isCurrentTurn = Boolean(seat.player && currentTurnPlayer && seat.player.id === currentTurnPlayer.id);

    return {
      ...seat,
      isCurrentTurn,
      isActiveTimer: Boolean(safeGameState && safeGameState.timeRemaining > 0 && isCurrentTurn),
    };
  });

  return (
    <div
      className="room-terminal-shell px-3 py-3 sm:px-4 lg:px-6"
      data-viewport-model={roomViewportLayout.viewportModel}
      data-height-class={roomViewportLayout.heightClass}
      data-stage-density={roomViewportLayout.stageDensity}
      data-page-scroll={roomViewportLayout.pageScroll}
      data-hero-dock-placement={roomViewportLayout.heroDockPlacement}
      data-support-surface-model={roomViewportLayout.supportSurfaceModel}
      data-support-surface-policy={roomViewportLayout.supportSurfacePolicyValue}
      data-support-surface-policy-key={roomViewportLayout.supportSurfacePolicyKey}
      data-shell-layout={shellView.shellLayout}
      data-hero-dock-priority={shellView.heroDockPriority}
      data-hero-dock-style={shellView.heroDockStyle}
      data-hero-dock-density={shellView.heroDockDensity}
      data-room-motion-budget={roomViewportLayout.viewportModel === 'phone-terminal' ? 'mobile-tight' : 'standard'}
      data-room-scroll-contract={roomViewportLayout.roomScrollContract}
      data-room-touch-scroll-model={
        roomViewportLayout.viewportModel === 'phone-terminal' ? 'sheet-body-y-only' : 'multi-surface'
      }
      style={{ '--room-terminal-stage-budget': `${roomViewportLayout.minStageBudgetPx}px` }}
    >
      <div
        className="room-terminal-frame mx-auto w-full"
        style={{
          maxWidth: roomViewportLayout.contentMaxWidth,
          '--room-terminal-dock-reserve': `${measuredDockReservePx}px`,
        }}
      >
        <div className="room-terminal-header-stack">
          <TableHeader
            shellView={shellView}
            viewportLayout={roomViewportLayout}
            onShare={() => setShowShareLink(true)}
            onLeaveRoom={handleExitRoom}
            onLeaveSeat={handleLeaveSeat}
            onOpenRebuy={() => setShowRebuy(true)}
            canLeaveSeat={Boolean(currentPlayerStateView?.canLeaveSeat)}
            canRequestRebuy={Boolean(currentPlayerStateView?.canRequestRebuy)}
          />

          {(shellView.recoveryBanner || shellView.pendingJoinBanner) && (
            <div className="room-terminal-banner-stack">
              <TableBanner
                banner={shellView.recoveryBanner}
                tone="amber"
                onAction={handleRecoverRoom}
              />
              <TableBanner
                banner={shellView.pendingJoinBanner}
                tone="sky"
              />
            </div>
          )}
        </div>

        <div className="room-terminal-main room-terminal-main--table-coupled">
          <div className={roomShellGridClassName}>
            {usesSideRails ? (
              <>
                <div className="room-shell-grid__intel">
                  <IntelRail
                    intelRailView={intelRailView}
                    players={playersList}
                    roomSettings={roomSettings}
                    gameStarted={gameStarted}
                    roomState={activeRoomState}
                    roomStateLabel={shellView.roomStateLabel}
                    currentPlayerId={currentPlayerId}
                    gameState={safeGameState}
                    effectiveDisplayMode={effectiveDisplayMode}
                    viewportLayout={roomViewportLayout}
                  />
                </div>

                <div className="room-shell-grid__stage">
                  <TableStage
                    shellView={shellView}
                    tablePotSummary={tablePotSummary}
                    tableSizeClassName={tableSizeClassName}
                    viewportWidth={windowSize.width}
                    viewportHeight={windowSize.height}
                    tableDiameter={tableDiameter}
                    effectiveDisplayMode={effectiveDisplayMode}
                    roomShellLayout={stageShellLayout}
                    viewportLayout={roomViewportLayout}
                    seatGuides={seatRingEntries}
                    geometryContract={roomGeometryContract}
                    settlementOverlay={
                      <SettlementOverlay
                        roomState={activeRoomState}
                        gameState={safeGameState}
                        currentPlayer={currentPlayer}
                        currentPlayerId={currentPlayerId}
                        onReveal={revealHand}
                        revealRequestPending={revealRequestPending}
                        effectiveDisplayMode={effectiveDisplayMode}
                      />
                    }
                    seatRing={
                      <SeatRing
                        seats={seatRingEntries}
                        roomState={activeRoomState}
                        gameState={safeGameState}
                        gameStarted={gameStarted}
                        geometryContract={roomGeometryContract}
                      />
                    }
                  />
                </div>

                <div className="room-shell-grid__event">
                  <EventRail
                    eventRailView={eventRailView}
                    records={handHistoryRecords}
                    players={playersList}
                    roomState={activeRoomState}
                    gameState={safeGameState}
                    currentPlayerId={currentPlayerId}
                    effectiveDisplayMode={effectiveDisplayMode}
                    viewportLayout={roomViewportLayout}
                  />
                </div>
              </>
            ) : (
              <div className="room-shell-grid__stage">
                <TableStage
                  shellView={shellView}
                  tablePotSummary={tablePotSummary}
                  tableSizeClassName={tableSizeClassName}
                  viewportWidth={windowSize.width}
                  viewportHeight={windowSize.height}
                  tableDiameter={tableDiameter}
                  effectiveDisplayMode={effectiveDisplayMode}
                  roomShellLayout={stageShellLayout}
                  viewportLayout={roomViewportLayout}
                  seatGuides={seatRingEntries}
                  geometryContract={roomGeometryContract}
                  settlementOverlay={
                    <SettlementOverlay
                      roomState={activeRoomState}
                      gameState={safeGameState}
                      currentPlayer={currentPlayer}
                      currentPlayerId={currentPlayerId}
                      onReveal={revealHand}
                      revealRequestPending={revealRequestPending}
                      effectiveDisplayMode={effectiveDisplayMode}
                    />
                  }
                  seatRing={
                    <SeatRing
                      seats={seatRingEntries}
                      roomState={activeRoomState}
                      gameState={safeGameState}
                      gameStarted={gameStarted}
                      geometryContract={roomGeometryContract}
                    />
                  }
                />
              </div>
            )}
          </div>

          <div className="room-terminal-dock room-terminal-dock--lower-rail-coupled" ref={roomDockRef}>
            <ActionDock
              currentPlayer={currentPlayer}
              currentPlayerView={currentPlayerStateView}
              gameStarted={gameStarted}
              canStartGame={canStartGame}
              onStartGame={handleStartGame}
              gameState={safeGameState}
              currentPlayerId={currentPlayerId}
              players={playersList}
              effectiveDisplayMode={effectiveDisplayMode}
              roomState={activeRoomState}
              viewportLayout={roomViewportLayout}
              shellView={shellView}
              activeSupportPanel={activeSupportPanel}
              onToggleSupportPanel={toggleSupportPanel}
            />
          </div>
        </div>

        {usesSupportPanels && (
          <>
            <RoomPanelSheet
              open={activeSupportPanel === 'players'}
              title={supportLabels.players || 'Players'}
              subtitle={intelRailView.occupancyLabel}
              presentation={supportPanelPresentation}
              onClose={closeSupportPanel}
            >
              <IntelRail
                intelRailView={intelRailView}
                players={playersList}
                roomSettings={roomSettings}
                gameStarted={gameStarted}
                roomState={activeRoomState}
                roomStateLabel={shellView.roomStateLabel}
                currentPlayerId={currentPlayerId}
                gameState={safeGameState}
                effectiveDisplayMode={effectiveDisplayMode}
                viewportLayout={roomViewportLayout}
                presentation="panel"
              />
            </RoomPanelSheet>

            <RoomPanelSheet
              open={activeSupportPanel === 'history'}
              title={supportLabels.history || 'History'}
              subtitle={`${eventRailView.historyCount} 手牌`}
              presentation={supportPanelPresentation}
              onClose={closeSupportPanel}
            >
              <EventRail
                eventRailView={eventRailView}
                records={handHistoryRecords}
                players={playersList}
                roomState={activeRoomState}
                gameState={safeGameState}
                currentPlayerId={currentPlayerId}
                effectiveDisplayMode={effectiveDisplayMode}
                viewportLayout={roomViewportLayout}
                presentation="panel"
              />
            </RoomPanelSheet>

            <RoomPanelSheet
              open={activeSupportPanel === 'room'}
              title={supportLabels.room || 'Room'}
              subtitle={`${shellView.modeLabel} · ${shellView.modeTitle}`}
              presentation={supportPanelPresentation}
              onClose={closeSupportPanel}
            >
              <div className="room-tool-panel">
                <section className="room-tool-panel__section">
                  <div className="room-tool-panel__kicker">Room State</div>
                  <div className="room-tool-panel__headline">{shellView.roomStateLabel}</div>
                  <div className="room-tool-panel__copy">
                    {shellView.connectedLabel} · {intelRailView.occupancyLabel} 在桌
                  </div>
                </section>

                <section className="room-tool-panel__section room-tool-panel__section--grid">
                  <div className="room-tool-panel__metric">
                    <span className="room-tool-panel__metric-label">模式</span>
                    <span className="room-tool-panel__metric-value">{shellView.modeTitle}</span>
                  </div>
                  <div className="room-tool-panel__metric">
                    <span className="room-tool-panel__metric-label">入座</span>
                    <span className="room-tool-panel__metric-value">{intelRailView.seatedCount}</span>
                  </div>
                  <div className="room-tool-panel__metric">
                    <span className="room-tool-panel__metric-label">观战</span>
                    <span className="room-tool-panel__metric-value">{intelRailView.spectatorCount}</span>
                  </div>
                  <div className="room-tool-panel__metric">
                    <span className="room-tool-panel__metric-label">房间码</span>
                    <span className="room-tool-panel__metric-value">{shellView.roomCode}</span>
                  </div>
                </section>

                <section className="room-tool-panel__section">
                  <div className="room-tool-panel__kicker">Tools</div>
                  <div className="room-tool-panel__actions">
                    <button
                      type="button"
                      className="room-tool-panel__button"
                      onClick={() => {
                        closeSupportPanel();
                        setShowShareLink(true);
                      }}
                    >
                      分享房间链接
                    </button>
                    {currentPlayerStateView?.canRequestRebuy ? (
                      <button
                        type="button"
                        className="room-tool-panel__button room-tool-panel__button--success"
                        onClick={() => {
                          closeSupportPanel();
                          setShowRebuy(true);
                        }}
                      >
                        补码
                      </button>
                    ) : null}
                    {currentPlayerStateView?.canLeaveSeat ? (
                      <button
                        type="button"
                        className="room-tool-panel__button room-tool-panel__button--warning"
                        onClick={() => {
                          closeSupportPanel();
                          handleLeaveSeat();
                        }}
                      >
                        离座观战
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="room-tool-panel__button room-tool-panel__button--danger"
                      onClick={() => {
                        closeSupportPanel();
                        handleExitRoom();
                      }}
                    >
                      退出房间
                    </button>
                  </div>
                </section>
              </div>
            </RoomPanelSheet>
          </>
        )}

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

        <LeaveSeatModal
          show={showLeaveSeat}
          onClose={() => setShowLeaveSeat(false)}
          onConfirm={confirmLeaveSeat}
          player={currentPlayer}
          roomState={activeRoomState}
          isExitingRoom={false}
        />

        <LeaveSeatModal
          show={showExitRoom}
          onClose={() => setShowExitRoom(false)}
          onConfirm={confirmExitRoom}
          player={currentPlayer}
          roomState={activeRoomState}
          isExitingRoom={true}
        />

        <JoinRoomModal roomId={roomId} />
      </div>
    </div>
  );
};

export default GameRoom;
