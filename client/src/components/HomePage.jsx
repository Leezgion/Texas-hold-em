import React, { useState } from 'react';

import CreateRoomModal from './CreateRoomModal';
import JoinRoomModal from './JoinRoomModal';
import { useGame } from '../contexts/GameContext';

const HomePage = () => {
  const { setShowCreateRoom, setShowJoinRoom, connected } = useGame();
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && joinRoomId.trim() && connected) {
      handleJoinRoom();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-dark via-gray-900 to-poker-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="text-6xl mb-4">🃏</div>
            <h1 className="text-4xl font-bold text-poker-gold mb-2">德州扑克</h1>
            <p className="text-gray-400">在线多人游戏</p>
          </div>
          
          {/* 连接状态 */}
          <div className="mb-8">
            <div className={`inline-flex items-center px-4 py-2 rounded-full transition-all duration-300 ${
              connected 
                ? 'bg-green-600/20 border border-green-500/50 text-green-400' 
                : 'bg-red-600/20 border border-red-500/50 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                connected ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              {connected ? '服务器已连接' : '服务器未连接'}
            </div>
          </div>
        </div>

        {/* 主要操作区域 */}
        <div className="space-y-6">
          {/* 创建游戏按钮 */}
          <button
            onClick={handleCreateRoom}
            disabled={!connected}
            className="w-full bg-gradient-to-r from-poker-gold to-yellow-500 hover:from-yellow-500 hover:to-poker-gold text-black font-bold text-xl px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-poker-gold/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            🎮 创建新游戏
          </button>

          {/* 分隔线 */}
          <div className="flex items-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            <span className="px-4 text-gray-500 text-sm">或</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
          </div>

          {/* 加入游戏区域 */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">加入游戏</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">房间ID</label>
                <input
                  type="text"
                  placeholder="输入6位房间ID"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white text-center text-lg font-mono tracking-wider placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-poker-gold focus:border-transparent transition-all duration-300"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  按回车键快速加入
                </p>
              </div>
              
              <button
                onClick={handleJoinRoom}
                disabled={!connected || !joinRoomId.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                🚪 加入游戏
              </button>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            {connected ? '准备开始游戏！' : '等待连接服务器...'}
          </p>
        </div>
      </div>

      {/* 模态框 */}
      <CreateRoomModal />
      <JoinRoomModal roomId={joinRoomId} />
    </div>
  );
};

export default HomePage;
