import React, { useState } from 'react';

import { deriveProPlayerSummary } from '../view-models/gameViewModel';
import { getPlayerDisplayName } from '../utils/playerIdentity';

function getRankTone(index) {
  if (index === 0) {
    return 'tactical-ledger__rank tactical-ledger__rank--gold';
  }

  if (index === 1) {
    return 'tactical-ledger__rank tactical-ledger__rank--silver';
  }

  if (index === 2) {
    return 'tactical-ledger__rank tactical-ledger__rank--bronze';
  }

  return 'tactical-ledger__rank';
}

const Leaderboard = ({
  players = [],
  roomState = 'idle',
  gameState = null,
  currentPlayerId = null,
  surfaceVariant = 'rail',
}) => {
  const allowCollapse = surfaceVariant === 'rail';
  const [isExpanded, setIsExpanded] = useState(true);
  const sortedPlayers = [...players].sort((left, right) => (Number(right?.chips) || 0) - (Number(left?.chips) || 0));
  const leader = sortedPlayers[0] || null;
  const totalChips = sortedPlayers.reduce((sum, player) => sum + (Number(player?.chips) || 0), 0);
  const shouldShowBody = allowCollapse ? isExpanded : true;
  const HeaderTag = allowCollapse ? 'button' : 'div';

  return (
    <div className="tactical-ledger" data-surface-variant={surfaceVariant}>
      <HeaderTag
        type={allowCollapse ? 'button' : undefined}
        onClick={allowCollapse ? () => setIsExpanded((value) => !value) : undefined}
        className="tactical-ledger__header"
      >
        <div>
          <div className="tactical-ledger__kicker">筹码榜</div>
          <div className="tactical-ledger__title">
            {leader ? `${getPlayerDisplayName(leader, { fallback: '玩家' })} 领跑` : '暂无玩家数据'}
          </div>
        </div>
        <div className="tactical-ledger__header-meta">
          <span>{sortedPlayers.length} 人</span>
          <span>{totalChips.toLocaleString()} 筹码</span>
        </div>
      </HeaderTag>

      {shouldShowBody && (
        <div className="tactical-ledger__body">
          {sortedPlayers.length === 0 ? (
            <div className="tactical-ledger__empty">当前没有可展示的筹码数据</div>
          ) : (
            <div className="tactical-ledger__rows">
              {sortedPlayers.map((player, index) => {
                const summary = deriveProPlayerSummary(player, {
                  roomState,
                  players,
                  gameState,
                });
                const displayName = getPlayerDisplayName(player, { fallback: '玩家' });
                const showHostPill = Boolean(player.isHost) && displayName !== '房主';

                return (
                  <div
                    key={player.id}
                    className={`tactical-ledger__row ${player.id === currentPlayerId ? 'tactical-ledger__row--hero' : ''}`}
                  >
                    <div className="tactical-ledger__identity">
                      <span className={getRankTone(index)}>{index + 1}</span>
                      <div className="min-w-0">
                        <div className="tactical-ledger__name">
                          <span className="truncate">{displayName}</span>
                          {player.id === currentPlayerId && <span className="tactical-ledger__self-pill">我</span>}
                          {showHostPill && <span className="tactical-ledger__host-pill">房主</span>}
                        </div>
                        <div className="tactical-ledger__meta">
                          {[summary.seatLabel, summary.positionLabel, summary.statusLabel].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </div>

                    <div className="tactical-ledger__stack">
                      <div className="tactical-ledger__stack-main">{summary.chipsLabel}</div>
                      <div className="tactical-ledger__stack-net">{summary.netLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
