import React, { useState } from 'react';

import CreateRoomModal from './CreateRoomModal';
import JoinRoomModal from './JoinRoomModal';
import { useGame } from '../contexts/GameContext';

const HomePage = () => {
  const { setShowCreateRoom, setShowJoinRoom, connected } = useGame();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');

  const handleCreateRoom = () => {
    setShowCreateRoom(true);
  };

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      setShowJoinRoom(true);
    } else {
      alert('请输入房间ID');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-dark via-gray-900 to-poker-dark flex items-center justify-center">
      <div className="text-center">
        {/* 标题 */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-poker-gold mb-4 text-shadow">德州扑克</h1>
          <p className="text-xl text-gray-300">与朋友一起享受经典的德州扑克游戏</p>
        </div>

        {/* 连接状态 */}
        <div className="mb-8">
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${connected ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-300' : 'bg-red-300'}`}></div>
            {connected ? '已连接' : '未连接'}
          </div>
        </div>

        {/* 主按钮 */}
        <div className="space-y-4 mb-12">
          <button
            onClick={handleCreateRoom}
            disabled={!connected}
            className=" primary text-2xl px-12 py-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            创建新游戏
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-32 h-px bg-gray-600"></div>
            <span className="text-gray-400">或</span>
            <div className="w-32 h-px bg-gray-600"></div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="输入房间ID"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              className="form-input text-center text-lg"
              maxLength={6}
            />
            <button
              onClick={handleJoinRoom}
              disabled={!connected || !joinRoomId.trim()}
              className=" success text-lg px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              加入游戏
            </button>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
            <div className="text-poker-gold text-3xl mb-2">🎮</div>
            <h3 className="text-xl font-semibold mb-2">自定义规则</h3>
            <p className="text-gray-400">支持自定义游戏时长、人数、Straddle等规则</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
            <div className="text-poker-gold text-3xl mb-2">👥</div>
            <h3 className="text-xl font-semibold mb-2">多人游戏</h3>
            <p className="text-gray-400">支持2-10人同时游戏，实时同步</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
            <div className="text-poker-gold text-3xl mb-2">💰</div>
            <h3 className="text-xl font-semibold mb-2">高级功能</h3>
            <p className="text-gray-400">支持换座、补码、多次All-in发牌等</p>
          </div>
        </div>

        {/* 游戏说明 */}
        <div className="mt-12 text-gray-400 text-sm max-w-2xl mx-auto">
          <p>德州扑克是一种流行的扑克游戏变体。每位玩家获得2张底牌，然后共享5张公共牌。 玩家需要组合出最好的5张牌来获胜。游戏包含翻牌前、翻牌、转牌、河牌和摊牌五个阶段。</p>
        </div>
      </div>

      {/* 模态框 */}
      <CreateRoomModal />
      <JoinRoomModal roomId={joinRoomId} />
    </div>
  );
};

export default HomePage;
