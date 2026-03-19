import React from 'react';
import Modal from './Modal';
import { deriveLeaveSeatDialog } from '../view-models/gameViewModel';

const LeaveSeatModal = ({
  show,
  onClose,
  onConfirm,
  player = null,
  roomState = 'idle',
  isExitingRoom = false,
}) => {
  const title = isExitingRoom ? '退出房间确认' : '离座确认';
  const confirmText = isExitingRoom ? '退出房间' : '离开座位';
  const dialog = deriveLeaveSeatDialog(player, roomState, isExitingRoom);

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
    >

        <div className="mb-6">
          <p className="text-white text-lg">{dialog.message}</p>
          {dialog.isDangerous && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <div className="flex items-center space-x-2 text-red-400">
                <span className="text-xl">⚠️</span>
                <span className="font-medium">{dialog.warning}</span>
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
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 font-medium rounded-lg transition-colors ${
              dialog.isDangerous ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-poker-gold hover:bg-yellow-500 text-black'
            }`}
          >
            {confirmText}
          </button>
        </div>
    </Modal>
  );
};export default LeaveSeatModal;
