import React from 'react';

const LeaveSeatModal = ({ show, onClose, onConfirm, isInGame = false, isExitingRoom = false }) => {
  if (!show) return null;

  const title = isExitingRoom ? '退出房间确认' : '离座确认';
  const message = isExitingRoom ? '您正在游戏中，退出房间将自动弃牌。确认要退出房间吗？' : '您正在游戏中，离座将自动弃牌。确认要离开座位吗？';

  const confirmText = isExitingRoom ? '退出房间' : '离开座位';
  const neutralMessage = isExitingRoom ? '确认要退出房间吗？' : '确认要离开座位进入观战模式吗？';

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-poker-gold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-white text-lg">{isInGame ? message : neutralMessage}</p>
          {isInGame && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <div className="flex items-center space-x-2 text-red-400">
                <span className="text-xl">⚠️</span>
                <span className="font-medium">注意：此操作将导致您自动弃牌</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              console.log('🔴 LeaveSeatModal: 确认按钮被点击');
              onConfirm();
            }}
            className={`flex-1 px-4 py-3 font-medium rounded-lg transition-colors ${
              isInGame ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-poker-gold hover:bg-yellow-500 text-black'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveSeatModal;
