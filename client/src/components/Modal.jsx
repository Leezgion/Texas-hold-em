import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import useModalSurface, { resolveModalPortalHost } from '../hooks/useModalSurface.js';

const Modal = ({
  show,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  padding = 'p-6',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  layout = 'default', // 'default' | 'scrollable'
  footer = null,
  surface = 'default',
  phoneSurface = 'default',
  scrollbarStyle = 'default',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
  closeOnEscape = closeOnOverlayClick,
}) => {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const titleId = useId();
  const { handleKeyDown } = useModalSurface({
    open: show,
    onClose,
    surfaceRef: dialogRef,
    closeButtonRef,
    closeOnEscape,
  });

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  if (!show) return null;
  const portalHost = resolveModalPortalHost();

  if (!portalHost) {
    return null;
  }

  const dialogProps = {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': title ? titleId : undefined,
    tabIndex: -1,
    ref: dialogRef,
    onKeyDown: handleKeyDown,
  };

  const renderTitle = (titleClassName) =>
    title ? (
      <h2 id={titleId} className={titleClassName}>
        {title}
      </h2>
    ) : null;

  const renderCloseButton = () =>
    showCloseButton ? (
      <button
        ref={closeButtonRef}
        onClick={onClose}
        className="modal-content__close-button"
        type="button"
      >
        ×
      </button>
    ) : null;

  if (layout === 'scrollable') {
    return createPortal(
      <div
        className="modal-overlay"
        data-modal-surface={surface}
        data-modal-phone-surface={phoneSurface}
        onClick={handleOverlayClick}
      >
        <div
          className={`modal-content ${maxWidth} ${className}`}
          data-modal-surface={surface}
          data-modal-phone-surface={phoneSurface}
          onClick={(e) => e.stopPropagation()}
          {...dialogProps}
        >
          {(title || showCloseButton) && (
            <div className={`modal-content__header ${headerClassName}`}>
              {renderTitle('text-xl sm:text-2xl font-bold text-poker-gold')}
              {renderCloseButton()}
            </div>
          )}

          <div
            className={`modal-content__body ${bodyClassName}`}
            data-modal-scrollbar={scrollbarStyle}
          >
            {children}
          </div>

          {footer && (
            <div className={`modal-content__footer ${footerClassName}`}>
              {footer}
            </div>
          )}
        </div>
      </div>,
      portalHost
    );
  }

  // 默认布局
  return createPortal(
    <div
      className="modal-overlay"
      data-modal-surface={surface}
      data-modal-phone-surface={phoneSurface}
      onClick={handleOverlayClick}
    >
      <div
        className={`modal-content ${maxWidth} ${padding} ${className}`}
        data-modal-surface={surface}
        data-modal-phone-surface={phoneSurface}
        onClick={(e) => e.stopPropagation()}
        {...dialogProps}
      >
        {(title || showCloseButton) && (
          <div className={`modal-content__header modal-content__header--default ${headerClassName}`}>
            {renderTitle('text-2xl font-bold text-poker-gold')}
            {renderCloseButton()}
          </div>
        )}

        <div
          className={`modal-content__body modal-content__body--default ${bodyClassName}`}
          data-modal-scrollbar={scrollbarStyle}
        >
          {children}
        </div>
      </div>
    </div>,
    portalHost
  );
};

export default Modal;
