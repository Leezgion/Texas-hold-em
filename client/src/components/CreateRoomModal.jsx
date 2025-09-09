import { useState } from 'react';

import { useGame } from '../contexts/GameContext';
import SliderInput from './SliderInput';
import Modal from './Modal';

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

  const footerContent = (
    <div className="flex space-x-3">
      <button
        type="button"
        onClick={handleClose}
        className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base"
      >
        取消
      </button>
      <button
        type="submit"
        form="create-room-form"
        className="flex-1 py-3 bg-poker-gold hover:bg-yellow-500 text-black rounded-lg font-bold transition-colors duration-200 text-sm sm:text-base"
      >
        创建房间
      </button>
    </div>
  );

  return (
    <Modal
      show={showCreateRoom}
      onClose={handleClose}
      title="创建游戏房间"
      layout="scrollable"
      padding=""
      footer={footerContent}
    >
      <form
        id="create-room-form"
        onSubmit={handleSubmit}
        className="space-y-4 sm:space-y-6"
      >
            {/* 游戏时长 */}
            <div>
              <label className="form-label">游戏时长</label>
              <select
                value={settings.duration}
                onChange={(e) => setSettings({ ...settings, duration: parseInt(e.target.value) })}
                className="form-input text-base"
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
            <div className="form-group">
              <label className="form-label">游戏人数</label>
              <SliderInput
                min={2}
                max={10}
                value={settings.maxPlayers}
                step={1}
                onChange={(value) => setSettings({ ...settings, maxPlayers: value })}
                colorScheme="blue"
                showQuickButtons={false}
                showMinMaxLabels={true}
                minLabel="2"
                maxLabel="10"
                formatValue={(value) => `${value} 人`}
              />
            </div>

            {/* 允许Straddle */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1 pr-4">
                <label className="form-label mb-0">允许Straddle</label>
                <p className="text-xs text-gray-500 mt-1">允许在大盲注后额外下注</p>
              </div>
              <div className="relative flex-shrink-0">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setSettings({ ...settings, allinDealCount: count })}
                    className={`py-3 px-4 rounded-lg border transition-colors duration-200 text-sm font-medium ${
                      settings.allinDealCount === count ? 'border-poker-gold bg-poker-gold text-black' : 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                    }`}
                  >
                    {count}次
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">当多位玩家All-in时，将发出指定次数的公共牌来决定胜负</p>
            </div>

            {/* 初始筹码说明 */}
            <div className="bg-gray-700/50 p-3 sm:p-4 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-poker-gold mb-2 text-sm sm:text-base">游戏设置说明</h4>
              <ul className="text-xs sm:text-sm text-gray-300 space-y-1">
                <li>• 初始筹码：1000</li>
                <li>• 小盲注：10，大盲注：20</li>
                <li>• 最小加注：大盲注金额</li>
                <li>• 玩家可在弃牌时手动补码（1000-9000）</li>
                <li>• 支持换座等高级功能</li>
              </ul>
            </div>
          </form>
    </Modal>
  );
};

export default CreateRoomModal;