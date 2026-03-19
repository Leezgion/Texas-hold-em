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

  return (
    <div className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-6">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <section className="mode-gateway-panel overflow-hidden">
            <div className="mode-gateway-panel__inner">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.55)]" />
                Poker OS
              </div>

              <div className="mt-6 max-w-3xl">
                <h1 className="mode-gateway-title">
                  为私局、职业对局和训练复盘准备的沉浸式德州扑克桌面。
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  一套后端真相，三种前端体验。你可以先选桌面气质，再创建房间或直接输入房间号进入牌桌。
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

              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Display Mode</div>
                    <div className="mt-1 text-sm text-slate-300">选择你想看到的桌面风格。房间规则仍然以服务器为准。</div>
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

                <div className="grid gap-4 lg:grid-cols-3">
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
                创建房间时会继承你在模态框里选择的房间模式。客户端显示模式可以继续单独覆盖。
              </p>
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
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Mode Notes</div>
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
