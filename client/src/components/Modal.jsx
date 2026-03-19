import React from 'react';

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
}) => {
  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  if (!show) return null;

  if (layout === 'scrollable') {
    return (
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
        >
          {(title || showCloseButton) && (
            <div className={`modal-content__header ${headerClassName}`}>
              {title && (
                <h2 className="text-xl sm:text-2xl font-bold text-poker-gold">{title}</h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="modal-content__close-button"
                  type="button"
                >
                  ×
                </button>
              )}
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
      </div>
    );
  }

  // 默认布局
  return (
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
      >
        {(title || showCloseButton) && (
          <div className={`modal-content__header modal-content__header--default ${headerClassName}`}>
            {title && (
              <h2 className="text-2xl font-bold text-poker-gold">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="modal-content__close-button"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        )}

        <div
          className={`modal-content__body modal-content__body--default ${bodyClassName}`}
          data-modal-scrollbar={scrollbarStyle}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
