import React, { useState } from 'react';

import CreateRoomModal from './CreateRoomModal';
import JoinRoomModal from './JoinRoomModal';
import ModeGateway from './ModeGateway';
import { useGame } from '../contexts/GameContext';

const HomePage = () => {
  const {
    setShowCreateRoom,
    setShowJoinRoom,
    connected,
    displayModePreference,
    effectiveDisplayMode,
    setDisplayModePreference,
  } = useGame();
  const [joinRoomId, setJoinRoomId] = useState('');

  const handleCreateRoom = () => {
    setShowCreateRoom(true);
  };

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      setShowJoinRoom(true);
    } else {
      window.dispatchEvent(new CustomEvent('game-error', { detail: '请输入房间ID' }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && joinRoomId.trim() && connected) {
      handleJoinRoom();
    }
  };

  return (
    <>
      <ModeGateway
        connected={connected}
        displayModePreference={displayModePreference}
        effectiveDisplayMode={effectiveDisplayMode}
        onSetDisplayModePreference={setDisplayModePreference}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        joinRoomId={joinRoomId}
        onJoinRoomIdChange={setJoinRoomId}
        onJoinRoomKeyPress={handleKeyPress}
      />
      <CreateRoomModal />
      <JoinRoomModal roomId={joinRoomId} />
    </>
  );
};

export default HomePage;
