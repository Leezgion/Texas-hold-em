/**
 * 改进后的 App.jsx 示例
 * 集成 Toast 通知和断线重连 UI
 */

import { GameProvider, useGame } from './contexts/GameContext';
import React, { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';

import GameRoom from './components/GameRoom';
import HomePage from './components/HomePage';
import ReconnectingOverlay from './components/ReconnectingOverlay';
import ToastContainer from './components/Toast';
import { useToast } from './hooks/useToast';

// 导航处理组件
function NavigationHandler() {
  const navigate = useNavigate();
  const { navigationTarget, clearNavigationTarget } = useGame();

  useEffect(() => {
    if (navigationTarget) {
      console.log('执行导航:', navigationTarget);
      navigate(navigationTarget);
      clearNavigationTarget();
    }
  }, [navigationTarget, navigate, clearNavigationTarget]);

  return null;
}

// Toast 事件监听器
function ToastListener() {
  const toast = useToast();

  useEffect(() => {
    // 监听全局错误事件
    const handleError = (e) => {
      toast.error(e.detail);
    };

    // 监听成功事件
    const handleSuccess = (e) => {
      toast.success(e.detail);
    };

    // 监听警告事件
    const handleWarning = (e) => {
      toast.warning(e.detail);
    };

    // 监听信息事件
    const handleInfo = (e) => {
      toast.info(e.detail);
    };

    window.addEventListener('game-error', handleError);
    window.addEventListener('game-success', handleSuccess);
    window.addEventListener('game-warning', handleWarning);
    window.addEventListener('game-info', handleInfo);

    return () => {
      window.removeEventListener('game-error', handleError);
      window.removeEventListener('game-success', handleSuccess);
      window.removeEventListener('game-warning', handleWarning);
      window.removeEventListener('game-info', handleInfo);
    };
  }, [toast]);

  return null;
}

// 重连覆盖层包装器
function ReconnectOverlayWrapper() {
  const { isReconnecting, reconnectAttempts, manualReconnect } = useGame();
  
  return (
    <ReconnectingOverlay
      isReconnecting={isReconnecting}
      attemptNumber={reconnectAttempts}
      onManualReconnect={manualReconnect}
    />
  );
}

function App() {
  const toast = useToast();

  return (
    <GameProvider>
      <Router>
        <NavigationHandler />
        <ToastListener />
        <ReconnectOverlayWrapper />
        
        <div className="min-h-screen bg-poker-dark">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game/:roomId" element={<GameRoom />} />
          </Routes>
        </div>

        {/* Toast 容器 */}
        <ToastContainer 
          toasts={toast.toasts} 
          onClose={toast.removeToast} 
        />
      </Router>
    </GameProvider>
  );
}

export default App;
