import { create } from 'zustand';

/**
 * Toast 通知状态管理
 * 使用 Zustand 创建全局的 Toast 管理器
 */
const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = 'info') => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // 3秒后自动移除
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);

    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearAll: () => set({ toasts: [] }),
}));

/**
 * 便捷的 Toast Hook
 * 提供简化的 API 用于显示不同类型的通知
 */
export const useToast = () => {
  const { addToast, removeToast, clearAll, toasts } = useToastStore();

  return {
    toasts,
    removeToast,
    clearAll,
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    warning: (message) => addToast(message, 'warning'),
    info: (message) => addToast(message, 'info'),
  };
};

export default useToastStore;
