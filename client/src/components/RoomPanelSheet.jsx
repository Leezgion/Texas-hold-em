import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import useModalSurface, { resolveModalPortalHost } from '../hooks/useModalSurface.js';

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
  const sheetDensity = presentation === 'bottom-sheet' ? 'tight-terminal' : 'panel-surface';
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

  const portalHost = resolveModalPortalHost();

  if (!portalHost) {
    return null;
  }

  return createPortal(
    <div
      className="room-panel-sheet"
      data-room-panel-presentation={presentation}
      data-sheet-density={sheetDensity}
      onClick={onClose}
    >
      <div
        className="room-panel-sheet__surface"
        data-room-panel-presentation={presentation}
        data-sheet-density={sheetDensity}
        onClick={(event) => event.stopPropagation()}
        ref={surfaceRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="room-panel-sheet__header" data-sheet-density={sheetDensity}>
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
            data-sheet-density={sheetDensity}
            ref={closeButtonRef}
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <div className="room-panel-sheet__body" data-sheet-density={sheetDensity}>{children}</div>
      </div>
    </div>,
    portalHost
  );
};

export default RoomPanelSheet;
