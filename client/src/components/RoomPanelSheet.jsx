import React, { useEffect, useId, useRef } from 'react';

const RoomPanelSheet = ({
  open = false,
  title = '',
  subtitle = '',
  presentation = 'bottom-sheet',
  onClose,
  children,
}) => {
  const dialogTitleId = useId();
  const dialogSurfaceRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previousActiveElementRef.current = document.activeElement;
    dialogSurfaceRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElementRef.current?.focus?.();
    };
  }, [open, onClose]);

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
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        ref={dialogSurfaceRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="room-panel-sheet__header">
          <div className="min-w-0">
            <div className="room-panel-sheet__kicker">Support Surface</div>
            <div id={dialogTitleId} className="room-panel-sheet__title">{title}</div>
            {subtitle ? <div className="room-panel-sheet__subtitle">{subtitle}</div> : null}
          </div>
          <button
            type="button"
            className="room-panel-sheet__close"
            onClick={onClose}
            aria-label="关闭面板"
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
