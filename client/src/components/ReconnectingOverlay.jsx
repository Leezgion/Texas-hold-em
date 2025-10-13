import { RefreshCw, WifiOff } from 'lucide-react';

import React from 'react';

/**
 * 断线重连覆盖层组件
 * 在断线时显示，提示用户正在重连
 */
const ReconnectingOverlay = ({ isReconnecting, attemptNumber, onManualReconnect }) => {
  if (!isReconnecting) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl max-w-md mx-4 text-center">
        {/* 图标 */}
        <div className="mb-6 relative">
          <WifiOff size={64} className="text-red-400 mx-auto" />
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
            <RefreshCw 
              size={32} 
              className="text-yellow-400 animate-spin" 
              style={{ animationDuration: '2s' }}
            />
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-2xl font-bold text-white mb-2">连接断开</h2>
        
        {/* 描述 */}
        <p className="text-gray-300 mb-4">
          与服务器的连接已断开，正在尝试重新连接...
        </p>

        {/* 重连状态 */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-yellow-400">
              第 {attemptNumber} 次尝试重连
            </span>
          </div>
          
          {/* 进度条 */}
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse"
              style={{ width: '60%' }}
            ></div>
          </div>
        </div>

        {/* 提示 */}
        <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-300">
            💡 请检查您的网络连接
          </p>
        </div>

        {/* 手动重连按钮 */}
        <button
          onClick={onManualReconnect}
          className="w-full bg-poker-gold hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <RefreshCw size={18} />
          <span>手动重连</span>
        </button>

        {/* 备选方案 */}
        <button
          onClick={() => window.location.reload()}
          className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
        >
          刷新页面
        </button>
      </div>
    </div>
  );
};

export default ReconnectingOverlay;
