import { ChevronDown, ChevronUp, Crown, Eye, Gamepad2, Users } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { derivePlayerStateView, deriveProPlayerSummary, deriveRoomOccupancy } from '../view-models/gameViewModel';

function getSafeNickname(player) {
  if (typeof player?.nickname === 'string' && player.nickname.trim()) {
    return player.nickname;
  }

  return player?.id || '未知玩家';
}

function truncateNickname(player) {
  const nickname = getSafeNickname(player);
  return nickname.length > 14 ? `${nickname.slice(0, 10)}...` : nickname;
}

function getStatusTone(player, roomState) {
  const stateView = derivePlayerStateView(player, roomState);

  if (player?.isHost) {
    return 'tactical-roster__status tactical-roster__status--host';
  }

  if (stateView.needsRebuy) {
    return 'tactical-roster__status tactical-roster__status--danger';
  }

  if (stateView.isWaitingNextHand) {
    return 'tactical-roster__status tactical-roster__status--pending';
  }

  if (stateView.tableState === 'active_in_hand' || stateView.tableState === 'all_in_this_hand') {
    return 'tactical-roster__status tactical-roster__status--live';
  }

  if (stateView.isSpectator) {
    return 'tactical-roster__status tactical-roster__status--spectator';
  }

  return 'tactical-roster__status';
}

function buildPlayerRow(player, { roomState, players, gameState, currentPlayerId }) {
  const summary = deriveProPlayerSummary(player, {
    roomState,
    players,
    gameState,
  });
  const stateView = derivePlayerStateView(player, roomState);

  return {
    id: player.id,
    isCurrentPlayer: player.id === currentPlayerId,
    isHost: Boolean(player.isHost),
    nickname: truncateNickname(player),
    title: getSafeNickname(player),
    seatLabel: summary.seatLabel,
    positionLabel: summary.positionLabel,
    chipsLabel: summary.chipsLabel,
    netLabel: summary.netLabel,
    statusLabel: summary.statusLabel,
    statusToneClassName: getStatusTone(player, roomState),
    isSpectator: stateView.isSpectator,
  };
}

const PlayerPanel = ({
  players = [],
  roomSettings = {},
  gameStarted = false,
  roomState = 'idle',
  currentPlayerId,
  gameState = null,
  effectiveDisplayMode = 'pro',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef(null);
  const safePlayers = Array.isArray(players) ? players.filter(Boolean) : [];
  const safeMaxPlayers = Math.max(2, Number(roomSettings?.maxPlayers) || 6);
  const { seatedPlayers, spectators } = deriveRoomOccupancy(safePlayers, roomState);
  const occupancyLabel = `${safePlayers.length}/${safeMaxPlayers}`;

  useEffect(() => {
    if (!isExpanded) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const seatedRows = seatedPlayers
    .sort((left, right) => (Number(left?.seat) || 0) - (Number(right?.seat) || 0))
    .map((player) => buildPlayerRow(player, { roomState, players: safePlayers, gameState, currentPlayerId }));

  const spectatorRows = spectators.map((player) =>
    buildPlayerRow(player, { roomState, players: safePlayers, gameState, currentPlayerId }),
  );

  return (
    <div className="tactical-roster" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        className={`tactical-roster__trigger ${isExpanded ? 'tactical-roster__trigger--open' : ''}`}
      >
        <div className="tactical-roster__trigger-head">
          <Users size={16} />
          <span>成员面板</span>
        </div>
        <div className="tactical-roster__trigger-meta">
          <span>{occupancyLabel}</span>
          <span>{seatedRows.length} 座</span>
          <span>{spectatorRows.length} 观</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {isExpanded && (
        <div className="tactical-roster__panel">
          <div className="tactical-roster__summary-grid">
            <div className="tactical-roster__summary-card">
              <span className="tactical-roster__summary-label">桌况</span>
              <span className="tactical-roster__summary-value">{gameStarted ? 'In Hand' : 'Waiting'}</span>
            </div>
            <div className="tactical-roster__summary-card">
              <span className="tactical-roster__summary-label">模式</span>
              <span className="tactical-roster__summary-value">{effectiveDisplayMode.toUpperCase()}</span>
            </div>
            <div className="tactical-roster__summary-card">
              <span className="tactical-roster__summary-label">已入座</span>
              <span className="tactical-roster__summary-value">{seatedRows.length}</span>
            </div>
            <div className="tactical-roster__summary-card">
              <span className="tactical-roster__summary-label">观战</span>
              <span className="tactical-roster__summary-value">{spectatorRows.length}</span>
            </div>
          </div>

          <div className="tactical-roster__section">
            <div className="tactical-roster__section-head">
              <div className="tactical-roster__section-title">
                <Gamepad2 size={14} />
                <span>Seat Roster</span>
              </div>
              <span className="tactical-roster__section-count">{seatedRows.length}</span>
            </div>

            {seatedRows.length === 0 ? (
              <div className="tactical-roster__empty">当前没有入座玩家</div>
            ) : (
              <div className="tactical-roster__rows">
                {seatedRows.map((row) => (
                  <div
                    key={row.id}
                    className={`tactical-roster__row ${row.isCurrentPlayer ? 'tactical-roster__row--hero' : ''}`}
                  >
                    <div className="tactical-roster__identity">
                      <div className="tactical-roster__identity-main">
                        {row.seatLabel && <span className="tactical-roster__seat-pill">{row.seatLabel}</span>}
                        <span className="tactical-roster__nickname" title={row.title}>
                          {row.nickname}
                        </span>
                        {row.isCurrentPlayer && <span className="tactical-roster__self-pill">我</span>}
                        {row.isHost && <Crown size={12} className="text-amber-300" />}
                      </div>
                      <div className="tactical-roster__identity-sub">
                        {[row.positionLabel, row.statusLabel].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div className="tactical-roster__ledger">
                      <div className="tactical-roster__chips">{row.chipsLabel}</div>
                      <div className="tactical-roster__net">{row.netLabel}</div>
                    </div>
                    <div className={row.statusToneClassName}>{row.statusLabel}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="tactical-roster__section">
            <div className="tactical-roster__section-head">
              <div className="tactical-roster__section-title">
                <Eye size={14} />
                <span>观战席</span>
              </div>
              <span className="tactical-roster__section-count">{spectatorRows.length}</span>
            </div>

            {spectatorRows.length === 0 ? (
              <div className="tactical-roster__empty">当前没有观战玩家</div>
            ) : (
              <div className="tactical-roster__rows">
                {spectatorRows.map((row) => (
                  <div
                    key={row.id}
                    className={`tactical-roster__row ${row.isCurrentPlayer ? 'tactical-roster__row--hero' : ''}`}
                  >
                    <div className="tactical-roster__identity">
                      <div className="tactical-roster__identity-main">
                        <span className="tactical-roster__nickname" title={row.title}>
                          {row.nickname}
                        </span>
                        {row.isCurrentPlayer && <span className="tactical-roster__self-pill">我</span>}
                        {row.isHost && <Crown size={12} className="text-amber-300" />}
                      </div>
                      <div className="tactical-roster__identity-sub">
                        {[row.seatLabel, row.positionLabel].filter(Boolean).join(' · ') || '观战中'}
                      </div>
                    </div>
                    <div className="tactical-roster__ledger">
                      <div className="tactical-roster__chips">{row.chipsLabel}</div>
                      <div className="tactical-roster__net">{row.netLabel}</div>
                    </div>
                    <div className={row.statusToneClassName}>{row.statusLabel}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerPanel;
