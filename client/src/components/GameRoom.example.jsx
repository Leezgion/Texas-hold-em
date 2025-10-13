/**
 * 改进后的 GameRoom 示例（部分代码）
 * 展示如何集成 GameLog 组件
 */

import React, { useEffect, useState } from 'react';

import GameLog from './GameLog';
import { useGame } from '../contexts/GameContext';
import { useParams } from 'react-router-dom';
// ... 其他导入 ...

const GameRoom = () => {
  const { roomId } = useParams();
  const { gameState, players } = useGame();
  const [gameLogs, setGameLogs] = useState([]);

  // 监听游戏状态变化，生成日志
  useEffect(() => {
    if (!gameState || !gameState.lastAction) return;

    const { lastAction } = gameState;
    
    // 找到操作的玩家
    const player = players.find(p => p.id === lastAction.playerId);
    if (!player) return;

    // 创建日志条目
    const logEntry = {
      player: player.nickname,
      action: lastAction.action,
      amount: lastAction.amount,
      timestamp: Date.now(),
    };

    setGameLogs(prev => [...prev, logEntry]);

    // 限制日志条目数量（最多保留100条）
    if (gameLogs.length > 100) {
      setGameLogs(prev => prev.slice(-100));
    }
  }, [gameState?.lastAction, players]);

  // 监听手牌结果，添加获胜日志
  useEffect(() => {
    if (!gameState || !gameState.winners) return;

    gameState.winners.forEach(winner => {
      const player = players.find(p => p.id === winner.playerId);
      if (player) {
        setGameLogs(prev => [...prev, {
          player: player.nickname,
          action: 'win',
          amount: winner.amount,
          timestamp: Date.now(),
        }]);
      }
    });
  }, [gameState?.winners, players]);

  return (
    <div className="min-h-screen bg-poker-dark relative overflow-hidden">
      {/* ... 其他UI组件 ... */}

      {/* 在右侧边栏添加游戏日志 */}
      <div className="absolute right-4 top-20 w-72 space-y-4">
        {/* 玩家面板 */}
        <PlayerPanel 
          players={players}
          roomSettings={roomSettings}
          gameStarted={gameStarted}
          currentPlayerId={currentPlayerId}
        />

        {/* 游戏日志 */}
        <GameLog logs={gameLogs} />

        {/* 排行榜 */}
        <Leaderboard players={players} />
      </div>

      {/* ... 其他UI组件 ... */}
    </div>
  );
};

export default GameRoom;
