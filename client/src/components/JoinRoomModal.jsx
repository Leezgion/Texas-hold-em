import React, { useState } from 'react';

import { useGame } from '../contexts/GameContext';
import Modal from './Modal';

const JoinRoomModal = ({ roomId }) => {
  const { showJoinRoom, setShowJoinRoom, joinRoom } = useGame();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // 防止重复提交

    setIsSubmitting(true);
    try {
      await joinRoom(roomId);
      // 只有成功时才关闭模态框
      handleClose();
    } catch (error) {
      alert(`加入房间失败：${error.message}`);
      setIsSubmitting(false); // 重置提交状态，允许重试
    }
  };

  const handleClose = () => {
    setShowJoinRoom(false);
    setIsSubmitting(false);
  };

  return (
    <Modal
      show={showJoinRoom}
      onClose={handleClose}
      title="加入游戏房间"
      closeOnOverlayClick={!isSubmitting}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* 房间ID */}
        <div>
          <label className="form-label">房间ID</label>
          <div className="bg-gray-700 px-4 py-3 rounded-lg border border-gray-600">
            <span className="text-2xl font-mono text-poker-gold">{roomId}</span>
          </div>
        </div>

          {/* 游戏说明 */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-poker-gold mb-2">游戏说明</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 自动使用设备ID作为玩家标识</li>
              <li>• 有空座位时自动入座参与游戏</li>
              <li>• 座位已满时进入观战模式</li>
              <li>• 游戏进行中入座将等待下一轮</li>
              <li>• 支持换座和补码功能</li>
              <li>• 请保持网络连接稳定</li>
            </ul>
          </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          className="form-button text-lg py-3"
          disabled={isSubmitting}
        >
          {isSubmitting ? '加入中...' : '加入房间'}
        </button>
      </form>
    </Modal>
  );
};export default JoinRoomModal;
