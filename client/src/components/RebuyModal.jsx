import React, { useState } from 'react';

import { useGame } from '../contexts/GameContext';
import { derivePlayerStateView } from '../view-models/gameViewModel';
import SliderInput from './SliderInput';
import Modal from './Modal';

const RebuyModal = ({ show, onClose }) => {
  const { requestRebuy, players, currentPlayerId, roomState } = useGame();
  const [amount, setAmount] = useState(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 滑动操作的最小值、最大值和步进
  const minAmount = 1000;
  const maxAmount = 9000;
  const stepSize = 1000;

  const handleSliderChange = (value) => {
    setAmount(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await requestRebuy(amount);
      onClose();
    } catch (error) {
      window.dispatchEvent(new CustomEvent('game-error', { detail: `补码失败：${error.message}` }));
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
  const currentPlayerView = currentPlayer ? derivePlayerStateView(currentPlayer, roomState || 'idle') : null;
  const canRequestRebuy = currentPlayerView?.canRequestRebuy ?? false;

  return (
    <Modal
      show={show}
      onClose={handleClose}
      title="补码"
      closeOnOverlayClick={!isSubmitting}
      showCloseButton={!isSubmitting}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
          {/* 滑动选择补码金额 */}
          <div>
            <label className="form-label">选择补码金额</label>
            
            <SliderInput
              value={amount}
              min={minAmount}
              max={maxAmount}
              step={stepSize}
              onChange={handleSliderChange}
              colorScheme="gold"
              formatValue={(val) => val.toLocaleString()}
              formatLabel={(val) => val >= 1000 ? `${val/1000}K` : val.toLocaleString()}
              quickButtons={[1000, 3000, 5000, 7000, 9000]}
              onQuickSelect={handleSliderChange}
              showValue={true}
              showLabels={true}
              showSteps={true}
              disabled={isSubmitting || !canRequestRebuy}
            />
          </div>

          {/* 当前筹码对比显示 */}
          <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">当前筹码</p>
                <p className="text-xl font-bold text-white">{currentChips.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">补码后筹码</p>
                <p className="text-xl font-bold text-poker-gold">{(currentChips + amount).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center justify-center mt-3 text-sm text-gray-400">
              <span>增加：</span>
              <span className="ml-1 font-semibold text-green-400">+{amount.toLocaleString()}</span>
            </div>
            {currentPlayerView && (
              <div className="mt-3 text-center text-xs text-gray-400">
                当前状态：<span className="text-blue-300">{currentPlayerView.statusLabel}</span>
              </div>
            )}
          </div>

          {/* 补码说明 */}
          <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
            <h4 className="font-semibold text-blue-400 mb-2 flex items-center">
              <span className="mr-2">ℹ️</span>
              补码说明
            </h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 当前是否可补码由服务器的桌面状态决定</li>
              <li>• 补码金额：{minAmount.toLocaleString()}-{maxAmount.toLocaleString()}筹码</li>
              <li>• 步进单位：{stepSize.toLocaleString()}筹码</li>
              <li>• 补码会立即记入筹码与总带入统计</li>
              <li>• 本手是否参与，取决于当前桌面状态：{currentPlayerView?.statusLabel || '未入座'}</li>
            </ul>
          </div>

          {/* 提交按钮 */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-poker-gold to-yellow-500 hover:from-yellow-500 hover:to-poker-gold text-black font-bold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              disabled={isSubmitting || !canRequestRebuy || amount < minAmount || amount > maxAmount}
            >
              {isSubmitting ? '补码中...' : canRequestRebuy ? `💰 补码 ${amount.toLocaleString()}` : '当前状态不可补码'}
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default RebuyModal;
