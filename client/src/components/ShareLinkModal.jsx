import React, { useState } from 'react';

const ShareLinkModal = ({ show, onClose, roomId }) => {
  const [copied, setCopied] = useState(false);
  const gameUrl = `${window.location.origin}/game/${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = gameUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '德州扑克游戏',
          text: '邀请你加入德州扑克游戏！',
          url: gameUrl,
        });
      } catch (err) {
        console.log('分享失败:', err);
      }
    } else {
      // 降级到复制链接
      handleCopy();
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-poker-gold">分享游戏链接</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* 房间信息 */}
          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
            <div className="text-center">
              <div className="text-poker-gold font-semibold mb-2">房间ID</div>
              <div className="text-3xl font-mono text-white">{roomId}</div>
            </div>
          </div>

          {/* 链接 */}
          <div>
            <label className="form-label">游戏链接</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={gameUrl}
                readOnly
                className="form-input flex-1"
              />
              <button
                onClick={handleCopy}
                className={` ${copied ? 'success' : 'primary'} px-4`}
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>

          {/* 分享方式 */}
          <div className="space-y-3">
            <div className="text-center text-gray-400">选择分享方式</div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleShare}
                className=" success py-3"
              >
                📱 系统分享
              </button>

              <button
                onClick={handleCopy}
                className=" primary py-3"
              >
                📋 复制链接
              </button>
            </div>
          </div>

          {/* 说明 */}
          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
            <h4 className="font-semibold text-poker-gold mb-2">分享说明</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 将链接发送给朋友，邀请他们加入游戏</li>
              <li>• 朋友点击链接后输入昵称即可加入</li>
              <li>• 游戏开始后无法再加入新玩家</li>
              <li>• 支持2-10人同时游戏</li>
            </ul>
          </div>

          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="form-button"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareLinkModal;
