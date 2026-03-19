import { useEffect, useId, useRef, useState } from 'react';

import { useGame } from '../contexts/GameContext';
import { ROOM_MODE_META, buildModePreviewCards, deriveCreateRoomAdvancedPanelState, getDisplayModeTheme } from '../utils/productMode';
import { deriveRequestErrorFeedback } from '../view-models/gameViewModel';
import ModePreviewCard from './ModePreviewCard';
import SliderInput from './SliderInput';
import Modal from './Modal';

const CreateRoomModal = () => {
  const { showCreateRoom, setShowCreateRoom, createRoom } = useGame();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modeCards = buildModePreviewCards();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const wasOpenRef = useRef(showCreateRoom);
  const advancedPanelId = useId();

  const [settings, setSettings] = useState({
    roomMode: 'pro',
    duration: 60,
    maxPlayers: 6,
    allowStraddle: false,
    allinDealCount: 1,
  });

  useEffect(() => {
    const nextShowAdvanced = deriveCreateRoomAdvancedPanelState({
      wasOpen: wasOpenRef.current,
      isOpen: showCreateRoom,
      showAdvanced,
    });

    wasOpenRef.current = showCreateRoom;

    if (nextShowAdvanced !== showAdvanced) {
      setShowAdvanced(nextShowAdvanced);
    }
  }, [showAdvanced, showCreateRoom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createRoom(settings);
      setShowCreateRoom(false);
    } catch (error) {
      const notice = deriveRequestErrorFeedback({
        scope: 'createRoom',
        fallbackPrefix: '创建房间失败',
        error,
      });
      window.dispatchEvent(new CustomEvent(notice.channel, { detail: notice.detail }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setShowCreateRoom(false);
  };
  const selectedModeTheme = getDisplayModeTheme(settings.roomMode);
  const createRoomCopy = selectedModeTheme.createRoom;
  const selectedModeMeta = ROOM_MODE_META[settings.roomMode];

  const footerContent = (
    <div className="create-room-modal__footer-actions">
      <button
        type="button"
        onClick={handleClose}
        disabled={isSubmitting}
        className="mode-secondary-button"
      >
        取消
      </button>
      <button
        type="submit"
        form="create-room-form"
        disabled={isSubmitting}
        className="mode-primary-button"
      >
        {isSubmitting ? '创建中...' : createRoomCopy.primaryActionLabel}
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
      maxWidth="max-w-5xl"
      surface={createRoomCopy.surface}
      phoneSurface={createRoomCopy.phoneSurface}
      scrollbarStyle={createRoomCopy.scrollbarStyle}
      className="create-room-modal"
      bodyClassName="create-room-modal__body"
      headerClassName="create-room-modal__header"
      footerClassName="create-room-modal__footer"
      footer={footerContent}
      closeOnOverlayClick={!isSubmitting}
    >
      <form
        id="create-room-form"
        onSubmit={handleSubmit}
        className="create-room-modal__form"
      >
        {isSubmitting && <div className="create-room-modal__notice">正在等待服务器确认房间创建...</div>}

        <section className="create-room-modal__section create-room-modal__section--mode">
          <div className="create-room-modal__section-header">
            <div>
              <div className="create-room-modal__section-kicker">{createRoomCopy.modeSectionTitle}</div>
              <h3 className="create-room-modal__section-title">{selectedModeMeta.title}</h3>
            </div>
            <div className="create-room-modal__section-copy">
              {selectedModeMeta.gatewayScene} · {selectedModeMeta.gatewayPersona}
            </div>
          </div>

          <div className="create-room-modal__mode-grid">
            {modeCards.map((card) => (
              <ModePreviewCard
                key={card.mode}
                card={card}
                compact
                surfaceVariant="create-room"
                selected={settings.roomMode === card.mode}
                onSelect={() => setSettings({ ...settings, roomMode: card.mode })}
              />
            ))}
          </div>

          <div className="create-room-modal__mode-summary">
            <div className="create-room-modal__mode-summary-label">
              {selectedModeMeta.gatewayScene} · {selectedModeMeta.gatewayPersona}
            </div>
            <p className="create-room-modal__mode-summary-copy">{selectedModeMeta.detail}</p>
          </div>
        </section>

        <section className="create-room-modal__section">
          <div className="create-room-modal__section-header">
            <div>
              <div className="create-room-modal__section-kicker">{createRoomCopy.essentialSectionTitle}</div>
              <h3 className="create-room-modal__section-title">桌面参数</h3>
            </div>
          </div>

          <div className="create-room-modal__settings-grid">
            <div className="create-room-modal__field">
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

            <div className="create-room-modal__field">
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
          </div>
        </section>

        <section className="create-room-modal__section create-room-modal__section--advanced">
          <button
            type="button"
            className="create-room-modal__section-toggle"
            onClick={() => setShowAdvanced((value) => !value)}
            aria-expanded={showAdvanced}
            aria-controls={advancedPanelId}
          >
            <span>
              <span className="create-room-modal__section-kicker">{createRoomCopy.advancedSectionTitle}</span>
              <span className="create-room-modal__section-title create-room-modal__section-title--inline">
                高级选项
              </span>
            </span>
            <span className="create-room-modal__section-toggle-label">{showAdvanced ? '收起' : '展开'}</span>
          </button>

          {showAdvanced && (
            <div id={advancedPanelId} className="create-room-modal__advanced-body">
              <div className="create-room-modal__toggle-row">
                <div className="flex-1 pr-4">
                  <label className="form-label mb-0">允许Straddle</label>
                  <p className="text-xs text-gray-400 mt-1">允许在大盲注后额外下注</p>
                </div>
                <div className="relative shrink-0">
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

              <div className="create-room-modal__field">
                <label className="form-label">All-in发牌次数</label>
                <div className="create-room-modal__allin-grid">
                  {[1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSettings({ ...settings, allinDealCount: count })}
                      className={`create-room-modal__deal-count ${settings.allinDealCount === count ? 'create-room-modal__deal-count--selected' : ''}`}
                    >
                      {count}次
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">当多位玩家All-in时，将发出指定次数的公共牌来决定胜负</p>
              </div>

              <div className="create-room-modal__preset-note">
                <h4 className="font-semibold text-poker-gold mb-2 text-sm sm:text-base">桌面预设说明</h4>
                <ul className="text-xs sm:text-sm text-gray-300 space-y-1">
                  <li>• 当前房间模式：{selectedModeMeta.title}</li>
                  <li>• 初始筹码：1000</li>
                  <li>• 小盲注：10，大盲注：20</li>
                  <li>• 最小加注：大盲注金额</li>
                  <li>• 玩家可在弃牌时手动补码（1000-9000）</li>
                  <li>• 支持换座等高级功能</li>
                </ul>
              </div>
            </div>
          )}
        </section>
      </form>
    </Modal>
  );
};

export default CreateRoomModal;
