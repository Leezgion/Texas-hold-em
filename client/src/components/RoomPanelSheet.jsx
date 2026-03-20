import React, { useId, useRef } from 'react';

import useModalSurface from '../hooks/useModalSurface.js';

const RoomPanelSheet = ({
  open = false,
  title = '',
  subtitle = '',
  presentation = 'bottom-sheet',
  onClose,
  children,
  closeOnEscape = true,
}) => {
  const surfaceRef = useRef(null);
  const closeButtonRef = useRef(null);
  const titleId = useId();
  const { handleKeyDown } = useModalSurface({
    open,
    onClose,
    surfaceRef,
    closeButtonRef,
    closeOnEscape,
  });

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
        ref={surfaceRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="room-panel-sheet__header">
          <div className="min-w-0">
            <div className="room-panel-sheet__kicker">Support Surface</div>
            <h2 id={titleId} className="room-panel-sheet__title">
              {title}
            </h2>
            {subtitle ? <div className="room-panel-sheet__subtitle">{subtitle}</div> : null}
          </div>
          <button
            type="button"
            className="room-panel-sheet__close"
            ref={closeButtonRef}
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
