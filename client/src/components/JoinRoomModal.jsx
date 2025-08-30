import React, { useState } from 'react';

import { useGame } from '../contexts/GameContext';

const JoinRoomModal = ({ roomId }) => {
  const { showJoinRoom, setShowJoinRoom, joinRoom } = useGame();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // 防止重复提交

    setIsSubmitting(true);
    try {
      await joinRoom(roomId);
    } catch (error) {
      alert(`加入房间失败：${error.message}`);
    } finally {
      handleClose()
    }
  };

  const handleClose = () => {
    setShowJoinRoom(false);
    setIsSubmitting(false);
  };

  if (!showJoinRoom) return null;

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
          <h2 className="text-2xl font-bold text-poker-gold">加入游戏房间</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

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
              <li>• 游戏开始后无法加入</li>
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
      </div>
    </div>
  );
};

export default JoinRoomModal;
