import { Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';

import { GameProvider, useGame } from './contexts/GameContext';
import GameRoom from './components/GameRoom';
import HomePage from './components/HomePage';
import React, { useEffect } from 'react';

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

function App() {
  return (
    <GameProvider>
      <Router>
        <NavigationHandler />
        <div className="min-h-screen bg-poker-dark">
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
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;
