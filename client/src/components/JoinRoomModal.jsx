import React, { useState } from 'react';

import { useGame } from '../contexts/GameContext';
import { deriveRequestErrorFeedback } from '../view-models/gameViewModel';
import Modal from './Modal';

const JoinRoomModal = ({ roomId }) => {
  const { showJoinRoom, setShowJoinRoom, joinRoom } = useGame();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const normalizedRoomId = roomId?.trim().toUpperCase() || '------';
  const requestState = isSubmitting ? 'pending' : 'ready';
  const signalItems = [
    { label: '空位入座', value: '自动坐下' },
    { label: '满员观战', value: '保留视角' },
    { label: '网络稳定', value: '保持在线' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // 防止重复提交

    setIsSubmitting(true);
    try {
      await joinRoom(roomId);
      // 只有成功时才关闭模态框
      handleClose();
    } catch (error) {
      const notice = deriveRequestErrorFeedback({
        scope: 'joinRoom',
        fallbackPrefix: '加入房间失败',
        error,
      });
      window.dispatchEvent(new CustomEvent(notice.channel, { detail: notice.detail }));
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
      padding=""
      maxWidth="max-w-md"
      scrollbarStyle="themed"
      className="join-room-modal"
      bodyClassName="join-room-modal__body"
      headerClassName="join-room-modal__header"
      contentProps={{
        'data-join-room-density': 'compact-terminal',
        'data-join-request-state': requestState,
      }}
      closeOnOverlayClick={!isSubmitting}
    >
      <form
        onSubmit={handleSubmit}
        className="join-room-modal__form"
      >
        {isSubmitting && (
          <div className="join-room-modal__notice" role="status">
            正在请求牌桌席位...
          </div>
        )}

        <section className="join-room-modal__hero">
          <div>
            <div className="join-room-modal__kicker">ROOM LINK</div>
            <p className="join-room-modal__headline">确认加入这张牌桌</p>
          </div>
          <p className="join-room-modal__copy">
            使用当前设备身份进入。若房间已结束，请让房主重新分享最新房间号。
          </p>
        </section>

        <section className="join-room-modal__code-panel" aria-label="房间ID">
          <span className="join-room-modal__code-label">房间 ID</span>
          <span className="join-room-modal__code-value">{normalizedRoomId}</span>
          <span className="join-room-modal__code-status">等待确认</span>
        </section>

        <section className="join-room-modal__signal-panel" aria-label="席位策略">
          <div className="join-room-modal__signal-heading">席位策略</div>
          <div className="join-room-modal__signal-grid">
            {signalItems.map((item) => (
              <div className="join-room-modal__signal" key={item.label}>
                <span className="join-room-modal__signal-label">{item.label}</span>
                <span className="join-room-modal__signal-value">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <button
          type="submit"
          className="join-room-modal__submit"
          data-join-request-state={requestState}
          disabled={isSubmitting}
        >
          {isSubmitting ? '加入中...' : '加入房间'}
        </button>
      </form>
    </Modal>
  );
};

export default JoinRoomModal;
