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

  return (
    <div className="relative min-h-screen py-2 sm:py-4">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] w-full max-w-[1720px] flex-col gap-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_420px]">
          <section className="mode-gateway-panel mode-gateway-panel--hero overflow-hidden">
            <div className="mode-gateway-panel__inner">
              <div className="mode-gateway-hero">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.55)]" />
                    Poker OS Tactical Arena
                  </div>

                  <div className="mt-6 max-w-3xl">
                    <h1 className="mode-gateway-title">
                      为私局、职业对局和训练复盘准备的沉浸式德州扑克桌面。
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                      一套后端真相，三种前端体验。桌面像赛事舞台，操作像职业终端，状态像真实牌桌一样清楚。
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <div
                      className={`mode-status-pill ${connected ? 'mode-status-pill--online' : 'mode-status-pill--offline'}`}
                      role="status"
                      aria-live="polite"
                    >
                      {connected ? '服务器已连接' : '服务器未连接'}
                    </div>
                    <div className="mode-status-pill">
                      当前偏好：{DISPLAY_MODE_META[displayModePreference].label}
                    </div>
                    <div className="mode-status-pill">
                      当前生效：{DISPLAY_MODE_META[effectiveDisplayMode].label}
                    </div>
                  </div>
                </div>

                <div className={`mode-gateway-stage ${effectiveCard.shellClassName}`}>
                  <div className="mode-gateway-stage__eyebrow">Current Table Profile</div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <div className={`mode-preview-card__eyebrow ${effectiveCard.accentClassName}`}>{effectiveCard.label}</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{effectiveCard.title}</div>
                    </div>
                    <span className="mode-preview-card__scene">{effectiveCard.gatewayScene}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{effectiveCard.tagline}</p>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="mode-gateway-stage__stat">
                      <span className="mode-gateway-stage__stat-kicker">Persona</span>
                      <span className="mode-gateway-stage__stat-value">{effectiveCard.gatewayPersona}</span>
                    </div>
                    <div className="mode-gateway-stage__stat">
                      <span className="mode-gateway-stage__stat-kicker">Density</span>
                      <span className="mode-gateway-stage__stat-value">{effectiveCard.layoutDensity === 'high' ? 'High' : 'Medium'}</span>
                    </div>
                    <div className="mode-gateway-stage__stat">
                      <span className="mode-gateway-stage__stat-kicker">Motion</span>
                      <span className="mode-gateway-stage__stat-value">{effectiveCard.motionStyle}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Display Mode</div>
                    <div className="mt-1 text-sm text-slate-300">选择你想看到的桌面风格。房间规则和状态真相仍然以服务器为准。</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetDisplayModePreference('inherit')}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      displayModePreference === 'inherit'
                        ? 'border-white/30 bg-white/10 text-white'
                        : 'border-white/10 bg-black/15 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    跟随房间
                  </button>
                </div>

                <div className="mode-gateway-preview-grid">
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

          <aside className="mode-gateway-control">
            <div className="mode-gateway-control__block">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Start Table</div>
              <h2 className="mt-3 text-3xl font-semibold text-white">创建新房间</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                创建房间时会继承你在模态框里选择的房间模式。客户端显示模式仍可单独覆盖，用于你自己的阅读习惯。
              </p>
              <div className="mode-gateway-side-note mt-5">
                <span className="mode-gateway-side-note__label">推荐流程</span>
                <span className="mode-gateway-side-note__value">先选桌型，再进房，再让显示模式跟随或覆盖。</span>
              </div>
              <button
                onClick={onCreateRoom}
                disabled={!connected}
                className="mode-primary-button mt-6"
              >
                创建新游戏
              </button>
            </div>

            <div className="mode-gateway-control__block">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Join Table</div>
              <h3 className="mt-3 text-2xl font-semibold text-white">输入房间号</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                适合通过房主分享的房间码直接进入。系统会保留当前设备身份，并在入房后自动应用你的显示偏好。
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

            <div className="mode-gateway-control__block">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Operational Notes</div>
              <div className="mt-4 grid gap-3">
                {previewCards.map((card) => (
                  <ModePreviewCard
                    key={`${card.mode}-compact`}
                    card={card}
                    compact
                    selected={effectiveDisplayMode === card.mode}
                    onSelect={() => onSetDisplayModePreference(card.mode)}
                  />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ModeGateway;
