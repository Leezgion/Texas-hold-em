import React from 'react';

import ModePreviewCard from './ModePreviewCard';
import { DISPLAY_MODE_META, buildModePreviewCards } from '../utils/productMode';

const ModeGateway = ({
  connected,
  displayModePreference,
  effectiveDisplayMode,
  onSetDisplayModePreference,
  onCreateRoom,
  onJoinRoom,
  joinRoomId,
  onJoinRoomIdChange,
  onJoinRoomKeyPress,
}) => {
  const previewCards = buildModePreviewCards();
  const effectiveCard =
    previewCards.find((card) => card.mode === effectiveDisplayMode) ??
    previewCards.find((card) => card.mode === 'pro') ??
    previewCards[0];
  const createLabel =
    effectiveDisplayMode === 'club' ? '开私局' : effectiveDisplayMode === 'study' ? '开复盘桌' : '开职业桌';

  return (
    <div className="relative min-h-screen py-2 sm:py-4">
      <div className="mode-gateway-shell mx-auto flex min-h-[calc(100vh-1rem)] w-full max-w-[1720px] flex-col gap-6">
        <div className="mode-gateway-layout">
          <aside className="mode-gateway-control" data-phone-priority="primary-actions">
            <div className="mode-gateway-control__block mode-gateway-control__block--create">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">开桌</div>
              <h2 className="mt-3 text-3xl font-semibold text-white">{createLabel}</h2>
              <p className="mode-gateway-control__copy mt-3 text-sm leading-6 text-slate-300">
                使用当前选择的牌桌类型开房。盲注、买入和人数在下一步确认。
              </p>
              <div className="mode-gateway-side-note mt-5">
                <span className="mode-gateway-side-note__label">当前牌桌</span>
                <span className="mode-gateway-side-note__value">{effectiveCard.title}</span>
              </div>
              <button
                onClick={() => onCreateRoom(effectiveDisplayMode)}
                disabled={!connected}
                className="mode-primary-button mt-6"
              >
                {createLabel}
              </button>
            </div>

            <div className="mode-gateway-control__block mode-gateway-control__block--join">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">加入牌桌</div>
              <h3 className="mt-3 text-2xl font-semibold text-white">输入房间号</h3>
              <p className="mode-gateway-control__copy mt-3 text-sm leading-6 text-slate-300">
                输入房主分享的 6 位房间码。进桌后直接入座或观战。
              </p>
              <div className="mt-5 space-y-4">
                <label className="block" htmlFor="room-id-input">
                  <span className="mb-2 block text-sm text-slate-300">房间 ID</span>
                  <input
                    id="room-id-input"
                    type="text"
                    placeholder="输入 6 位房间 ID"
                    value={joinRoomId}
                    onChange={(event) => onJoinRoomIdChange(event.target.value.toUpperCase())}
                    onKeyPress={onJoinRoomKeyPress}
                    className="mode-room-input"
                    maxLength={6}
                  />
                </label>
                <button
                  onClick={onJoinRoom}
                  disabled={!connected || !joinRoomId.trim()}
                  className="mode-secondary-button"
                >
                  加入游戏
                </button>
              </div>
            </div>
          </aside>

          <section className="mode-gateway-panel mode-gateway-panel--hero overflow-hidden">
            <div className="mode-gateway-panel__inner">
              <div className="mode-gateway-hero">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.55)]" />
                    Poker OS
                  </div>

                  <div className="mt-6 max-w-3xl">
                    <h1 className="mode-gateway-title">
                      德州扑克牌桌，先服务当前这手牌。
                    </h1>
                    <p className="mode-gateway-hero__copy mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                      开私局、职业桌或复盘桌。桌型只选一次，进桌后专注手牌、底池和行动。
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <div
                      className={`mode-status-pill ${connected ? 'mode-status-pill--online' : 'mode-status-pill--offline'}`}
                      role="status"
                      aria-live="polite"
                    >
                      {connected ? '已连接' : '未连接'}
                    </div>
                    <div className="mode-status-pill">
                      牌桌：{DISPLAY_MODE_META[effectiveDisplayMode].label}
                    </div>
                  </div>
                </div>

                <div className={`mode-gateway-stage ${effectiveCard.shellClassName}`}>
                  <div className="mode-gateway-stage__eyebrow">当前牌桌</div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <div className={`mode-preview-card__eyebrow ${effectiveCard.accentClassName}`}>{effectiveCard.label}</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{effectiveCard.title}</div>
                    </div>
                    <span className="mode-preview-card__scene">{effectiveCard.gatewayScene}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{effectiveCard.tagline}</p>
                </div>
              </div>

              <div className="mt-10">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em] text-slate-400">选择牌桌</div>
                    <div className="mt-1 text-sm text-slate-300">这会决定下一间房的桌型和默认信息密度。</div>
                  </div>
                </div>

                <div className="mode-gateway-table-type-selector">
                  {previewCards.map((card) => (
                    <ModePreviewCard
                      key={card.mode}
                      card={card}
                      selected={displayModePreference === card.mode}
                      active={effectiveDisplayMode === card.mode}
                      onSelect={() => onSetDisplayModePreference(card.mode)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ModeGateway;
