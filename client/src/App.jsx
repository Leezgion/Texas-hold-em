import { GameProvider, useGame } from './contexts/GameContext';
import React, { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';

import GameRoom from './components/GameRoom';
import HomePage from './components/HomePage';
import ModeShell from './components/ModeShell';
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

// Toast处理组件
function ToastHandler() {
  const toast = useToast();

  useEffect(() => {
    const handleError = (e) => {
      toast.error(e.detail);
    };

    const handleSuccess = (e) => {
      toast.success(e.detail);
    };

    const handleWarning = (e) => {
      toast.warning(e.detail);
    };

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

  return <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />;
}

function App() {
  return (
    <GameProvider>
      <Router>
        <NavigationHandler />
        <ToastHandler />
        <AppContent />
      </Router>
    </GameProvider>
  );
}

// 应用内容组件（可以访问useGame）
function AppContent() {
  const { isReconnecting, reconnectAttempts, manualReconnect, effectiveDisplayMode } = useGame();

  return (
    <>
      <ModeShell mode={effectiveDisplayMode}>
        <Routes>
          <Route
            path="/"
            element={<HomePage />}
          />
          <Route
            path="/game/:roomId"
            element={<GameRoom />}
          />
        </Routes>
      </ModeShell>
      <ReconnectingOverlay
        isReconnecting={isReconnecting}
        attemptNumber={reconnectAttempts}
        onManualReconnect={manualReconnect}
      />
    </>
  );
}

export default App;
