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
    club: '桌面控制台',
    pro: 'Tactical Intel',
    study: '桌况分析台',
  };
  const summaryCardsByMode = {
    club: [
      {
        label: '桌况',
        value: roomStateLabel,
        detail: intelRailView.hostActionLabel || '等待房主操作',
      },
      {
        label: '人数',
        value: intelRailView.occupancyLabel,
        detail: `${intelRailView.seatedCount} 入座 · ${intelRailView.spectatorCount} 观战`,
      },
      {
        label: '桌型',
        value: intelRailView.modeTitle,
        detail: '减少争议，优先清楚广播。',
      },
      {
        label: '房主动作',
        value: intelRailView.hostActionLabel || '等待中',
        detail: intelRailView.canRecoverRoom ? '恢复优先' : '可直接继续',
      },
    ],
    pro: [
      { label: '人数', value: intelRailView.occupancyLabel, detail: null },
      { label: '模式', value: intelRailView.modeTitle, detail: null },
      { label: '已入座', value: intelRailView.seatedCount, detail: null },
      { label: '观战', value: intelRailView.spectatorCount, detail: null },
    ],
    study: [
      {
        label: '当前状态',
        value: roomStateLabel,
        detail: '状态广播与恢复提示都从这里解释。',
      },
      {
        label: '桌型',
        value: intelRailView.modeTitle,
        detail: '复盘优先保留语义。',
      },
      {
        label: '人数',
        value: intelRailView.occupancyLabel,
        detail: `${intelRailView.seatedCount} 入座 / ${intelRailView.spectatorCount} 观战`,
      },
      {
        label: '下一步',
        value: intelRailView.hostActionLabel || '等待广播',
        detail: '右侧时间线会同步最近结果。',
      },
    ],
  };
  const summaryCards = summaryCardsByMode[effectiveDisplayMode] || summaryCardsByMode.pro;
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
    >
      <section className="poker-shell-panel tactical-rail__panel tactical-rail__panel--intel rounded-[1.75rem] p-4 sm:p-5">
        <div className="tactical-rail__header">
          <div>
            <div className="poker-shell-kicker">{roomCopy.intelTitle}</div>
            <div className="tactical-rail__title">{consoleModeCopy[effectiveDisplayMode] || consoleModeCopy.pro}</div>
          </div>
          <span className="tactical-rail__pill">{intelRailView.modeTitle}</span>
        </div>

        <div className="tactical-rail__lead">{roomCopy.intelCaption}</div>

        <div className="tactical-rail__spotlight">
          <div>
            <div className="tactical-rail__spotlight-kicker">TABLE STATE</div>
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
            <div className="tactical-rail__title">Seat Intel</div>
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
