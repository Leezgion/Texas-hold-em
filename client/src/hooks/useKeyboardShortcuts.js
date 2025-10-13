import { useEffect } from 'react';

/**
 * 键盘快捷键 Hook
 * 
 * 快捷键：
 * - F: 弃牌 (Fold)
 * - C: 过牌/跟注 (Check/Call)
 * - R: 打开加注面板 (Raise)
 * - A: All-in
 * - Esc: 关闭模态框/取消操作
 */
export const useKeyboardShortcuts = ({
  canAct,
  canCheck,
  canRaise,
  onFold,
  onCheck,
  onCall,
  onRaise,
  onAllIn,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      // 如果用户在输入框中，不触发快捷键
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // 如果不是当前玩家的回合，不响应快捷键
      if (!canAct) {
        return;
      }

      const key = e.key.toLowerCase();

      switch (key) {
        case 'f':
          // 弃牌
          e.preventDefault();
          onFold && onFold();
          break;

        case 'c':
          // 过牌/跟注
          e.preventDefault();
          if (canCheck) {
            onCheck && onCheck();
          } else {
            onCall && onCall();
          }
          break;

        case 'r':
          // 打开加注面板
          if (canRaise) {
            e.preventDefault();
            onRaise && onRaise();
          }
          break;

        case 'a':
          // All-in
          if (canRaise) {
            e.preventDefault();
            onAllIn && onAllIn();
          }
          break;

        case 'escape':
          // 取消操作/关闭面板
          e.preventDefault();
          onCancel && onCancel();
          break;

        default:
          break;
      }
    };

    // 添加事件监听
    window.addEventListener('keydown', handleKeyPress);

    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [canAct, canCheck, canRaise, onFold, onCheck, onCall, onRaise, onAllIn, onCancel]);
};

export default useKeyboardShortcuts;
