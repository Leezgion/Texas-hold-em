import React, { useState } from 'react';

import { useGame } from '../contexts/GameContext';

const RebuyModal = ({ show, onClose }) => {
  const { requestRebuy, players, currentPlayerId } = useGame();
  const [amount, setAmount] = useState(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await requestRebuy(amount);
      onClose();
    } catch (error) {
      alert(`补码失败：${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setAmount(1000);
    }
  };

  if (!show) return null;

  // 获取当前玩家信息
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const currentChips = currentPlayer ? currentPlayer.chips : 0;

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-poker-gold">补码</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* 补码金额选择 */}
          <div>
            <label className="form-label">选择补码金额</label>
            <div className="grid grid-cols-3 gap-3">
              {[1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(value)}
                  className={`py-3 px-4 rounded-lg border transition-colors duration-200 ${
                    amount === value ? 'border-poker-gold bg-poker-gold text-white' : 'border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                  disabled={isSubmitting}
                >
                  {value.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* 自定义金额输入 */}
          <div>
            <label className="form-label">或输入自定义金额</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setAmount(value);
              }}
              min="1000"
              max="9000"
              step="1000"
              className="form-input text-center text-lg"
              placeholder="1000-9000"
              disabled={isSubmitting}
            />
            <p className="text-sm text-gray-400 mt-2">金额必须是1000-9000之间的1000整数倍</p>
          </div>

          {/* 当前筹码显示 */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-400">当前筹码</p>
                <p className="text-xl font-bold text-white">{currentChips.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">补码后筹码</p>
                <p className="text-xl font-bold text-poker-gold">{(currentChips + amount).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* 补码说明 */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-poker-gold mb-2">补码说明</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 只能在弃牌状态时补码</li>
              <li>• 补码金额：1000-9000筹码</li>
              <li>• 必须是1000的整数倍</li>
              <li>• 补码立即生效</li>
            </ul>
          </div>

          {/* 提交按钮 */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-poker-gold text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              disabled={isSubmitting || amount < 1000 || amount > 9000 || amount % 1000 !== 0}
            >
              {isSubmitting ? '补码中...' : `补码 ${amount.toLocaleString()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RebuyModal;
