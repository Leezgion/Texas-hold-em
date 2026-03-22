import { Activity, LifeBuoy, LogOut, Plus, Share2 } from 'lucide-react';
import React from 'react';

const ActionIconButton = ({ title, onClick, icon: Icon, tone = 'default' }) => {
  const toneClassName =
    tone === 'danger'
      ? 'room-terminal-header__toolbar-button--danger'
      : tone === 'success'
      ? 'room-terminal-header__toolbar-button--success'
      : tone === 'warning'
      ? 'room-terminal-header__toolbar-button--warning'
      : 'room-terminal-header__toolbar-button--default';

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`room-terminal-header__toolbar-button ${toneClassName}`}
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
      className="room-terminal-header__spine room-terminal-header"
      data-viewport-model={viewportLayout?.viewportModel}
      data-height-class={viewportLayout?.heightClass}
      data-header-density={viewportLayout?.headerDensity}
      data-header-action-model={viewportLayout?.headerActionModel}
      data-stage-density={viewportLayout?.stageDensity}
      data-support-surface-model={viewportLayout?.supportSurfaceModel}
      data-support-surface-policy={viewportLayout?.supportSurfacePolicyValue}
      data-support-surface-policy-key={viewportLayout?.supportSurfacePolicyKey}
      data-page-scroll={viewportLayout?.pageScroll}
      data-hero-dock-priority={shellView?.heroDockPriority}
      data-stage-spacing={shellView?.stageSpacing}
    >
      <div className="room-terminal-header__content">
        <div className="room-terminal-header__track" aria-label="房间状态">
          <div className="room-terminal-header__badge room-terminal-header__badge--room-code">
            <span className="room-terminal-header__badge-label">房间</span>
            <span className="room-terminal-header__badge-value room-terminal-header__badge-value--code">
              {shellView.roomCode}
            </span>
          </div>
          <span className="room-terminal-header__badge room-terminal-header__badge--mode">
            {shellView.modeTitle}
          </span>
          <span className="room-terminal-header__badge room-terminal-header__badge--state">
            {shellView.roomStateLabel}
          </span>
          <span className="room-terminal-header__badge room-terminal-header__badge--connection">
            <Activity size={13} />
            <span>{shellView.connectedLabel}</span>
          </span>
        </div>

        {usesToolbarActions ? (
          <div className="room-terminal-header__toolbar">
            {canRequestRebuy && (
              <ActionIconButton title="补码" onClick={onOpenRebuy} icon={Plus} tone="success" />
            )}
            {canLeaveSeat && (
              <ActionIconButton title="离座观战" onClick={onLeaveSeat} icon={LifeBuoy} tone="warning" />
            )}
            <ActionIconButton title="分享链接" onClick={onShare} icon={Share2} />
            <ActionIconButton title="退出房间" onClick={onLeaveRoom} icon={LogOut} tone="danger" />
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default TableHeader;
