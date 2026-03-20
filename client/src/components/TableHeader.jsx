import { Activity, LifeBuoy, LogOut, Plus, Share2 } from 'lucide-react';
import React from 'react';

const ActionIconButton = ({ title, onClick, icon: Icon, tone = 'default' }) => {
  const toneClassName =
    tone === 'danger'
      ? 'border-rose-500/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/20'
      : tone === 'success'
      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20'
      : tone === 'warning'
      ? 'border-amber-500/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/20'
      : 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10';

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${toneClassName}`}
    >
      <Icon size={18} />
    </button>
  );
};

const TableHeader = ({
  shellView,
  viewportLayout,
  onShare,
  onLeaveRoom,
  onLeaveSeat,
  onOpenRebuy,
  canLeaveSeat = false,
  canRequestRebuy = false,
}) => {
  const usesToolbarActions = viewportLayout?.headerActionModel === 'toolbar';

  return (
    <header
      className="room-terminal-header rounded-[1.75rem] border border-white/10 bg-black/25 px-4 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      data-viewport-model={viewportLayout?.viewportModel}
      data-height-class={viewportLayout?.heightClass}
      data-header-density={viewportLayout?.headerDensity}
      data-header-action-model={viewportLayout?.headerActionModel}
      data-stage-density={viewportLayout?.stageDensity}
      data-support-surface-model={viewportLayout?.supportSurfaceModel}
      data-page-scroll={viewportLayout?.pageScroll}
      data-hero-dock-priority={shellView?.heroDockPriority}
    >
      <div className="room-terminal-header__content flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="room-terminal-header__identity flex flex-wrap items-center gap-3">
          <div className="room-terminal-header__room-code">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Room</div>
            <div className="mt-1 text-2xl font-semibold tracking-[0.22em] text-white">{shellView.roomCode}</div>
          </div>
          <span className="room-terminal-header__pill rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
            {shellView.modeLabel} · {shellView.modeTitle}
          </span>
          <span className="room-terminal-header__pill rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
            {shellView.roomStateLabel}
          </span>
          <span className="room-terminal-header__pill inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
            <Activity size={14} />
            {shellView.connectedLabel}
          </span>
        </div>

        {usesToolbarActions ? (
          <div className="room-terminal-header__actions flex flex-wrap items-center gap-2">
            {canRequestRebuy && (
              <ActionIconButton
                title="补码"
                onClick={onOpenRebuy}
                icon={Plus}
                tone="success"
              />
            )}
            {canLeaveSeat && (
              <ActionIconButton
                title="离座观战"
                onClick={onLeaveSeat}
                icon={LifeBuoy}
                tone="warning"
              />
            )}
            <ActionIconButton
              title="分享链接"
              onClick={onShare}
              icon={Share2}
            />
            <ActionIconButton
              title="退出房间"
              onClick={onLeaveRoom}
              icon={LogOut}
              tone="danger"
            />
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default TableHeader;
