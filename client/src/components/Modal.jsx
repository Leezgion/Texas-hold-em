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
}) => {
  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  if (!show) return null;

  if (layout === 'scrollable') {
    // 特殊布局：固定头部、可滚动内容、固定底部
    return (
      <div
        className="modal-overlay"
        onClick={handleOverlayClick}
      >
        <div
          className={`modal-content ${maxWidth} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 固定头部 */}
          {(title || showCloseButton) && (
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-700 bg-gray-800 rounded-t-lg flex-shrink-0">
              {title && (
                <h2 className="text-xl sm:text-2xl font-bold text-poker-gold">{title}</h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white text-2xl flex-shrink-0 p-1 hover:bg-gray-700 rounded ml-auto"
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
          )}
          
          {/* 可滚动内容区域 */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {children}
          </div>

          {/* 固定底部 */}
          {footer && (
            <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-700 bg-gray-800 rounded-b-lg">
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
      onClick={handleOverlayClick}
    >
      <div
        className={`modal-content ${maxWidth} ${padding} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center mb-6">
            {title && (
              <h2 className="text-2xl font-bold text-poker-gold">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl ml-auto"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        )}
        
        {/* 内容区域 */}
        {children}
      </div>
    </div>
  );
};

export default Modal;
