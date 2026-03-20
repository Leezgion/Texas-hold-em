import React from 'react';

import EmptySeat from './EmptySeat';

const SeatCard = ({
  seat,
  tableProfile = null,
  roomState,
  gameState,
  gameStarted,
}) => {
  const resolvedTableProfile = tableProfile || seat.position?.profile || 'desktop-oval';
  const anchorZone = seat.anchorZone || seat.position?.anchorZone || 'table-flank';
  const anchorRole = seat.anchorRole || seat.position?.anchorRole || 'ring';
  const canonicalSlotIndex = Number.isInteger(seat.canonicalSlotIndex) ? seat.canonicalSlotIndex : null;
  const densityTier = seat.densityTier || 'compact-secondary';
  const visualRole = seat.visualRole || 'embedded-plaque';

  if (!seat.occupied) {
    return (
      <EmptySeat
        seatIndex={seat.seatIndex}
        position={seat.position}
        seatLabel={seat.seatLabel}
        seatTone={seat.seatTone}
        roomState={roomState}
        tableProfile={resolvedTableProfile}
        anchorZone={anchorZone}
        anchorRole={anchorRole}
        anchorSlotId={seat.anchorSlotId || null}
        visualRole={visualRole}
        densityTier={densityTier}
      />
    );
  }

  const player = seat.player || {};
  const displayName = player.nickname || player.id || (seat.isCurrentPlayer ? 'Hero' : '玩家');
  const currentBet = Number(player.currentBet) || 0;
  const hasNet = typeof seat.netLabel === 'string' && seat.netLabel !== '0';
  const seatToneClassName = `arena-seat-plaque--${seat.seatTone || 'occupied-live'}`;

  return (
    <div
      className={`arena-seat-plaque-anchor ${seat.isCurrentTurn ? 'arena-seat-plaque-anchor--current-turn' : ''}`}
      data-table-profile={resolvedTableProfile}
      data-anchor-zone={anchorZone}
      data-anchor-role={anchorRole}
      data-anchor-slot-id={seat.anchorSlotId || null}
      data-canonical-slot-index={canonicalSlotIndex}
      data-visual-role={visualRole}
      data-density-tier={densityTier}
      data-is-current-player={seat.isCurrentPlayer ? 'true' : 'false'}
      style={{
        left: `calc(50% + ${seat.position.x}px)`,
        top: `calc(50% + ${seat.position.y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={`arena-seat-plaque ${seatToneClassName} arena-seat-plaque--${densityTier} ${
          seat.isCurrentTurn ? 'arena-seat-plaque--current-turn' : ''
        } ${seat.isActiveTimer ? 'arena-seat-plaque--active-timer' : ''} ${player.folded ? 'arena-seat-plaque--folded' : ''}`}
        data-table-profile={resolvedTableProfile}
        data-anchor-zone={anchorZone}
        data-anchor-role={anchorRole}
        data-anchor-slot-id={seat.anchorSlotId || null}
        data-canonical-slot-index={canonicalSlotIndex}
        data-visual-role={visualRole}
        data-density-tier={densityTier}
        data-is-current-player={seat.isCurrentPlayer ? 'true' : 'false'}
      >
        <div className="arena-seat-plaque__header">
          <div className="min-w-0">
            <div className="arena-seat-plaque__seat-label">{seat.seatLabel}</div>
            <div className="arena-seat-plaque__name" title={displayName}>
              {seat.isCurrentPlayer ? 'Hero' : displayName}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {player.isHost && <span className="arena-seat-plaque__badge">HOST</span>}
            {seat.positionLabel && <span className="arena-seat-plaque__badge arena-seat-plaque__badge--ghost">{seat.positionLabel}</span>}
          </div>
        </div>

        <div className="arena-seat-plaque__stack-row">
          <span className="arena-seat-plaque__stack">{seat.chipsLabel || '0'}</span>
          {currentBet > 0 && <span className="arena-seat-plaque__bet">BET {currentBet}</span>}
        </div>

        <div className="arena-seat-plaque__status-row">
          <span className="arena-seat-plaque__status">{seat.statusLabel}</span>
          {hasNet && <span className="arena-seat-plaque__net">{seat.netLabel}</span>}
        </div>

        {seat.isCurrentTurn && (
          <span
            className="arena-seat-plaque__turn-glow"
            aria-hidden="true"
            data-anchor-slot-id={seat.anchorSlotId || null}
            data-canonical-slot-index={canonicalSlotIndex}
            data-anchor-role={anchorRole}
            data-anchor-zone={anchorZone}
          />
        )}
      </div>
    </div>
  );
};

export default SeatCard;
