import React, { useState } from 'react';

import { useGame } from '../contexts/GameContext';
import SliderInput from './SliderInput';
import Modal from './Modal';

const RebuyModal = ({ show, onClose }) => {
  const { requestRebuy, players, currentPlayerId } = useGame();
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
              disabled={isSubmitting}
              colorScheme="gold"
              formatValue={(val) => val.toLocaleString()}
              formatLabel={(val) => val >= 1000 ? `${val/1000}K` : val.toLocaleString()}
              quickButtons={[1000, 3000, 5000, 7000, 9000]}
              onQuickSelect={handleSliderChange}
              showValue={true}
              showLabels={true}
              showSteps={true}
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
          </div>

          {/* 补码说明 */}
          <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
            <h4 className="font-semibold text-blue-400 mb-2 flex items-center">
              <span className="mr-2">ℹ️</span>
              补码说明
            </h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 只能在弃牌状态时补码</li>
              <li>• 补码金额：{minAmount.toLocaleString()}-{maxAmount.toLocaleString()}筹码</li>
              <li>• 步进单位：{stepSize.toLocaleString()}筹码</li>
              <li>• 补码立即生效，下一轮开始参与</li>
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
              disabled={isSubmitting || amount < minAmount || amount > maxAmount}
            >
              {isSubmitting ? '补码中...' : `💰 补码 ${amount.toLocaleString()}`}
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default RebuyModal;
