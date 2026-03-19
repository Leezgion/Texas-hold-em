import React from 'react';

import EmptySeat from './EmptySeat';

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
        seatTone={seat.seatTone}
        roomState={roomState}
      />
    );
  }

  const player = seat.player || {};
  const displayName = player.nickname || player.id || (seat.isCurrentPlayer ? 'Hero' : '玩家');
  const currentBet = Number(player.currentBet) || 0;
  const hasNet = typeof seat.netLabel === 'string' && seat.netLabel !== '0';
  const seatToneClassName = `arena-seat-card--${seat.seatTone || 'occupied-live'}`;
  const tableProfile = seat.position?.profile || 'desktop-oval';
  const anchorZone = seat.position?.anchorZone || 'table-flank';

  return (
    <div
      className={`arena-seat-anchor ${seat.isCurrentTurn ? 'arena-seat-anchor--current-turn' : ''}`}
      data-table-profile={tableProfile}
      data-anchor-zone={anchorZone}
      style={{
        left: `calc(50% + ${seat.position.x}px)`,
        top: `calc(50% + ${seat.position.y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={`arena-seat-card ${seatToneClassName} ${seat.isCurrentTurn ? 'arena-seat-card--current-turn' : ''} ${
          seat.isActiveTimer ? 'arena-seat-card--active-timer' : ''
        } ${player.folded ? 'arena-seat-card--folded' : ''}`}
        data-table-profile={tableProfile}
        data-anchor-zone={anchorZone}
      >
        <div className="arena-seat-card__header">
          <div className="min-w-0">
            <div className="arena-seat-card__seat-label">{seat.seatLabel}</div>
            <div className="arena-seat-card__name" title={displayName}>
              {seat.isCurrentPlayer ? 'Hero' : displayName}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {player.isHost && <span className="arena-seat-card__badge">HOST</span>}
            {seat.positionLabel && <span className="arena-seat-card__badge arena-seat-card__badge--ghost">{seat.positionLabel}</span>}
          </div>
        </div>

        <div className="arena-seat-card__stack-row">
          <span className="arena-seat-card__stack">{seat.chipsLabel || '0'}</span>
          {currentBet > 0 && <span className="arena-seat-card__bet">BET {currentBet}</span>}
        </div>

        <div className="arena-seat-card__footer">
          <span className="arena-seat-card__status">{seat.statusLabel}</span>
          {hasNet && <span className="arena-seat-card__net">{seat.netLabel}</span>}
        </div>

        {seat.isCurrentTurn && <span className="arena-seat-card__turn-marker" aria-hidden="true" />}
      </div>
    </div>
  );
};

export default SeatCard;
