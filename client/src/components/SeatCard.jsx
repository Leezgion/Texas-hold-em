import React from 'react';

import EmptySeat from './EmptySeat';
import Player from './Player';

const SeatCard = ({
  seat,
  roomState,
  gameState,
  gameStarted,
}) => {
  if (!seat.occupied) {
    return (
      <EmptySeat
        seatIndex={seat.seatIndex}
        position={seat.position}
        seatLabel={seat.seatLabel}
        roomState={roomState}
      />
    );
  }

  if (seat.isCurrentPlayer) {
    return (
      <div
        className={`player-seat player-seat--compact ${seat.isActiveTimer ? 'current-turn-timer' : ''}`}
        style={{
          left: `calc(50% + ${seat.position.x}px)`,
          top: `calc(50% + ${seat.position.y}px)`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="min-w-[92px] rounded-xl border border-sky-400/50 bg-sky-500/12 px-3 py-2 text-center backdrop-blur-sm">
          <div className="text-[11px] uppercase tracking-[0.22em] text-sky-200">{seat.seatLabel}</div>
          <div className="mt-1 text-sm font-semibold text-white">Hero</div>
          <div className="mt-1 text-xs text-sky-100">{seat.positionLabel || seat.statusLabel}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`player-seat player-seat--compact ${seat.player?.isActive ? 'active' : ''} ${seat.isCurrentTurn ? 'current-turn' : ''} ${seat.isActiveTimer ? 'current-turn-timer' : ''}`}
      style={{
        left: `calc(50% + ${seat.position.x}px)`,
        top: `calc(50% + ${seat.position.y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <Player
        player={seat.player}
        isCurrentPlayer={false}
        isCurrentTurn={seat.isCurrentTurn}
        gameState={gameState}
        gameStarted={gameStarted}
        isActiveTimer={seat.isActiveTimer}
        getPositionLabel={() => seat.positionLabel || seat.seatLabel}
      />
    </div>
  );
};

export default SeatCard;
