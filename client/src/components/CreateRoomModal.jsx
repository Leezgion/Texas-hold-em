import React, { useState } from 'react';

import { useGame } from '../contexts/GameContext';

const CreateRoomModal = () => {
  const { showCreateRoom, setShowCreateRoom, createRoom } = useGame();

  const [settings, setSettings] = useState({
    duration: 60,
    maxPlayers: 6,
    allowStraddle: false,
    allinDealCount: 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createRoom(settings);
    setShowCreateRoom(false);
  };

  const handleClose = () => {
    setShowCreateRoom(false);
  };

  if (!showCreateRoom) return null;

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
          <h2 className="text-2xl font-bold text-poker-gold">创建游戏房间</h2>
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
          {/* 游戏时长 */}
          <div>
            <label className="form-label">游戏时长</label>
            <select
              value={settings.duration}
              onChange={(e) => setSettings({ ...settings, duration: parseInt(e.target.value) })}
              className="form-input"
            >
              <option value={30}>30分钟</option>
              <option value={60}>60分钟</option>
              <option value={90}>90分钟</option>
              <option value={120}>120分钟</option>
              <option value={150}>150分钟</option>
              <option value={180}>180分钟</option>
              <option value={240}>240分钟</option>
              <option value={300}>300分钟</option>
            </select>
          </div>

          {/* 游戏人数 */}
          <div>
            <label className="form-label">游戏人数</label>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">2</span>
              <input
                type="range"
                min="2"
                max="10"
                value={settings.maxPlayers}
                onChange={(e) => setSettings({ ...settings, maxPlayers: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-sm text-gray-400">10</span>
            </div>
            <div className="text-center text-poker-gold font-semibold mt-2">{settings.maxPlayers} 人</div>
          </div>

          {/* 允许Straddle */}
          <div className="flex items-center justify-between">
            <label className="form-label mb-0">允许Straddle</label>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.allowStraddle}
                onChange={(e) => setSettings({ ...settings, allowStraddle: e.target.checked })}
                className="sr-only"
                id="straddle-toggle"
              />
              <label
                htmlFor="straddle-toggle"
                className={`block w-14 h-8 rounded-full cursor-pointer transition-colors duration-200 ${settings.allowStraddle ? 'bg-poker-gold' : 'bg-gray-600'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-200 transform ${settings.allowStraddle ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </label>
            </div>
          </div>

          {/* All-in发牌次数 */}
          <div>
            <label className="form-label">All-in发牌次数</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setSettings({ ...settings, allinDealCount: count })}
                  className={`py-2 px-4 rounded-lg border transition-colors duration-200 ${
                    settings.allinDealCount === count ? 'border-poker-gold bg-poker-gold text-white' : 'border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {count}次
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2">当多位玩家All-in时，将发出指定次数的公共牌来决定胜负</p>
          </div>

          {/* 初始筹码说明 */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-poker-gold mb-2">游戏设置说明</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 初始筹码：1000</li>
              <li>• 小盲注：10，大盲注：20</li>
              <li>• 最小加注：大盲注金额</li>
              <li>• 玩家可在弃牌时手动补码（1000-9000）</li>
              <li>• 支持换座等高级功能</li>
            </ul>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            className="form-button text-lg py-3"
          >
            创建房间
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;
