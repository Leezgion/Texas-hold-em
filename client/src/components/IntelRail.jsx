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
}) => {
  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const roomCopy = theme.room;
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

  return (
    <aside className="flex flex-col gap-4">
      <section className="poker-shell-panel rounded-[1.75rem] p-4">
        <div className="poker-shell-kicker">{roomCopy.intelTitle}</div>
        <div className="mt-2 text-sm leading-6 text-slate-300">{roomCopy.intelCaption}</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="poker-shell-stat-card rounded-2xl px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{card.label}</div>
              <div className="mt-2 text-lg font-semibold text-white">{card.value}</div>
              {card.detail && <div className="mt-1 text-xs text-slate-400">{card.detail}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="poker-shell-panel rounded-[1.75rem] p-4">
        <div className="poker-shell-kicker">{roomCopy.rosterTitle}</div>
        <div className="mt-2 text-sm leading-6 text-slate-300">{roomCopy.rosterCaption}</div>
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
    </aside>
  );
};

export default IntelRail;
