import React from 'react';

import PlayerPanel from './PlayerPanel';
import { getDisplayModeTheme } from '../utils/productMode';

const IntelRail = ({
  intelRailView,
  players,
  roomSettings,
  gameStarted,
  roomState,
  currentPlayerId,
  gameState,
  effectiveDisplayMode,
  roomStateLabel,
  viewportLayout,
  presentation = 'rail',
}) => {
  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const roomCopy = theme.room;
  const consoleModeCopy = {
    club: '成员与桌况',
    pro: '桌况情报',
    study: '成员与复盘',
  };
  const summaryCards = [
    {
      label: '桌况',
      value: roomStateLabel,
      detail: intelRailView.hostActionLabel || '等待桌面行动',
    },
    {
      label: '在桌',
      value: intelRailView.occupancyLabel,
      detail: `${intelRailView.seatedCount} 座 · ${intelRailView.spectatorCount} 观`,
    },
    {
      label: '下一步',
      value: intelRailView.hostActionLabel || (intelRailView.canRecoverRoom ? '恢复牌桌' : '等待行动'),
      detail: intelRailView.canRecoverRoom ? '先恢复牌桌再继续' : null,
    },
  ];
  const ContainerTag = presentation === 'rail' ? 'aside' : 'div';
  const supportLauncherDensity = viewportLayout?.supportLauncherDensity || 'regular';

  return (
    <ContainerTag
      className="room-terminal-support-rail tactical-rail tactical-rail--intel"
      data-viewport-model={viewportLayout?.viewportModel}
      data-support-surface-model={viewportLayout?.supportSurfaceModel}
      data-support-surface-policy={viewportLayout?.supportSurfacePolicyValue}
      data-support-surface-policy-key={viewportLayout?.supportSurfacePolicyKey}
      data-surface-variant={presentation}
      data-support-launcher-density={supportLauncherDensity}
      data-info-model="decision-relevant"
    >
      <section className="poker-shell-panel tactical-rail__panel tactical-rail__panel--intel rounded-[1.75rem] p-4 sm:p-5">
        <div className="tactical-rail__header">
          <div>
            <div className="poker-shell-kicker">{roomCopy.intelTitle}</div>
            <div className="tactical-rail__title">{consoleModeCopy[effectiveDisplayMode] || consoleModeCopy.pro}</div>
          </div>
          <span className="tactical-rail__pill">{intelRailView.occupancyLabel}</span>
        </div>

        <div className="tactical-rail__lead">{roomCopy.intelCaption}</div>

        <div className="tactical-rail__spotlight">
          <div>
            <div className="tactical-rail__spotlight-kicker">桌况</div>
            <div className="tactical-rail__spotlight-value">{roomStateLabel}</div>
          </div>
          <div className="tactical-rail__spotlight-meta">
            {intelRailView.hostActionLabel || '等待下一条桌面指令'}
          </div>
        </div>

        <div className="tactical-rail__metric-grid">
          {summaryCards.map((card) => (
            <div key={card.label} className="tactical-rail__metric">
              <div className="tactical-rail__metric-label">{card.label}</div>
              <div className="tactical-rail__metric-value">{card.value}</div>
              {card.detail && <div className="tactical-rail__metric-detail">{card.detail}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="poker-shell-panel tactical-rail__panel rounded-[1.75rem] p-4 sm:p-5">
        <div className="tactical-rail__header">
          <div>
            <div className="poker-shell-kicker">{roomCopy.rosterTitle}</div>
            <div className="tactical-rail__title">席位总览</div>
          </div>
          <span className="tactical-rail__pill">{intelRailView.occupancyLabel}</span>
        </div>
        <div className="tactical-rail__lead">{roomCopy.rosterCaption}</div>
        <PlayerPanel
          players={players}
          roomSettings={roomSettings}
          gameStarted={gameStarted}
          roomState={roomState}
          currentPlayerId={currentPlayerId}
          gameState={gameState}
          effectiveDisplayMode={effectiveDisplayMode}
        />
      </section>
    </ContainerTag>
  );
};

export default IntelRail;
