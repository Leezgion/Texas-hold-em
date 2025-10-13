import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import React, { useEffect } from 'react';

/**
 * Toast 通知组件
 * 替代原生 alert() 的现代化通知系统
 */
const Toast = ({ id, message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-600/90',
          border: 'border-green-500',
          icon: CheckCircle,
          iconColor: 'text-green-400',
        };
      case 'error':
        return {
          bg: 'bg-red-600/90',
          border: 'border-red-500',
          icon: AlertCircle,
          iconColor: 'text-red-400',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-600/90',
          border: 'border-yellow-500',
          icon: AlertTriangle,
          iconColor: 'text-yellow-400',
        };
      default:
        return {
          bg: 'bg-blue-600/90',
          border: 'border-blue-500',
          icon: Info,
          iconColor: 'text-blue-400',
        };
    }
  };

  const styles = getToastStyles();
  const Icon = styles.icon;

  return (
    <div
      className={`${styles.bg} ${styles.border} backdrop-blur-sm border rounded-lg p-4 shadow-xl transform transition-all duration-300 ease-out animate-toast-in flex items-start space-x-3 min-w-[300px] max-w-md`}
    >
      <Icon className={`${styles.iconColor} flex-shrink-0`} size={20} />
      <p className="text-white text-sm flex-1 leading-relaxed">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="text-white/80 hover:text-white transition-colors flex-shrink-0"
        aria-label="关闭通知"
      >
        <X size={18} />
      </button>
    </div>
  );
};

/**
 * Toast 容器组件
 */
const ToastContainer = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
