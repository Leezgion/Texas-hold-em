import React from 'react';

const RoomPanelSheet = ({
  open = false,
  title = '',
  subtitle = '',
  presentation = 'bottom-sheet',
  onClose,
  children,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="room-panel-sheet"
      data-room-panel-presentation={presentation}
      onClick={onClose}
    >
      <div
        className="room-panel-sheet__surface"
        data-room-panel-presentation={presentation}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="room-panel-sheet__header">
          <div className="min-w-0">
            <div className="room-panel-sheet__kicker">Support Surface</div>
            <div className="room-panel-sheet__title">{title}</div>
            {subtitle ? <div className="room-panel-sheet__subtitle">{subtitle}</div> : null}
          </div>
          <button
            type="button"
            className="room-panel-sheet__close"
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <div className="room-panel-sheet__body">{children}</div>
      </div>
    </div>
  );
};

export default RoomPanelSheet;
