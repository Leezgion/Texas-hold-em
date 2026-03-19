export const ROOM_MODE_META = Object.freeze({
  club: {
    label: 'Club',
    title: '私局辅助',
    detail: '强调少争议、低认知负担和稳定操作。',
    tagline: '像高级私局桌控台一样稳。',
    highlights: ['少争议', '房主管理', '清晰结算'],
    gatewayScene: 'Host Table',
    gatewayPersona: '线下私局组织者',
  },
  pro: {
    label: 'Pro',
    title: '职业对局',
    detail: '强调节奏、信息密度和操作效率。',
    tagline: '像线上职业桌一样快。',
    highlights: ['密集信息', '快速操作', '数字优先'],
    gatewayScene: 'Arena Table',
    gatewayPersona: '线上职业玩家',
  },
  study: {
    label: 'Study',
    title: '训练复盘',
    detail: '强调解释、记录和回看理解。',
    tagline: '像牌局分析台一样清楚。',
    highlights: ['时间线', '状态解释', '复盘友好'],
    gatewayScene: 'Review Desk',
    gatewayPersona: '复盘与训练者',
  },
});

export const DISPLAY_MODE_META = Object.freeze({
  inherit: {
    label: '跟随房间',
    detail: '默认跟随当前房间模式。',
  },
  ...ROOM_MODE_META,
});

const ROOM_TERMINAL_LABELS = Object.freeze({
  club: Object.freeze({
    players: '成员',
    history: '最近动态',
    room: '房间设置',
  }),
  pro: Object.freeze({
    players: 'Roster',
    history: 'Hand Tape',
    room: 'Room',
  }),
  study: Object.freeze({
    players: '状态面板',
    history: 'Timeline',
    room: '复盘设置',
  }),
});

const ROOM_TERMINAL_META = Object.freeze({
  club: Object.freeze({
    intent: 'single-screen-terminal',
    desktop: Object.freeze({
      surfaceModel: 'single-screen',
      surfacePolicy: 'table-and-dock',
    }),
    phone: Object.freeze({
      surfaceModel: 'single-screen',
      heroDock: 'fixed-bottom',
      sheetOrder: Object.freeze(['players', 'history', 'room']),
      surfacePolicy: 'bottom-sheets',
    }),
    sheetLabels: ROOM_TERMINAL_LABELS.club,
  }),
  pro: Object.freeze({
    intent: 'single-screen-terminal',
    desktop: Object.freeze({
      surfaceModel: 'single-screen',
      surfacePolicy: 'table-and-dock',
    }),
    phone: Object.freeze({
      surfaceModel: 'single-screen',
      heroDock: 'fixed-bottom',
      sheetOrder: Object.freeze(['players', 'history', 'room']),
      surfacePolicy: 'bottom-sheets',
    }),
    sheetLabels: ROOM_TERMINAL_LABELS.pro,
  }),
  study: Object.freeze({
    intent: 'single-screen-terminal',
    desktop: Object.freeze({
      surfaceModel: 'single-screen',
      surfacePolicy: 'table-and-dock',
    }),
    phone: Object.freeze({
      surfaceModel: 'single-screen',
      heroDock: 'fixed-bottom',
      sheetOrder: Object.freeze(['players', 'history', 'room']),
      surfacePolicy: 'bottom-sheets',
    }),
    sheetLabels: ROOM_TERMINAL_LABELS.study,
  }),
});

const CREATE_ROOM_META = Object.freeze({
  club: Object.freeze({
    entryModel: 'profile-first',
    primaryActionLabel: '创建房间',
    surface: 'panel',
    phoneSurface: 'full-screen-sheet',
    tileLayout: 'horizontal',
    advancedSettingsMode: 'collapsed',
    sectionOrder: Object.freeze(['mode', 'essentials', 'advanced']),
    phoneChrome: 'sticky-header-footer',
    scrollbarStyle: 'themed',
    essentialSectionTitle: '基础设置',
    advancedSectionTitle: '高级规则',
    modeSectionTitle: '桌型预设',
  }),
  pro: Object.freeze({
    entryModel: 'profile-first',
    primaryActionLabel: '创建房间',
    surface: 'panel',
    phoneSurface: 'full-screen-sheet',
    tileLayout: 'horizontal',
    advancedSettingsMode: 'collapsed',
    sectionOrder: Object.freeze(['mode', 'essentials', 'advanced']),
    phoneChrome: 'sticky-header-footer',
    scrollbarStyle: 'themed',
    essentialSectionTitle: '基础设置',
    advancedSectionTitle: '高级规则',
    modeSectionTitle: '桌型预设',
  }),
  study: Object.freeze({
    entryModel: 'profile-first',
    primaryActionLabel: '创建房间',
    surface: 'panel',
    phoneSurface: 'full-screen-sheet',
    tileLayout: 'horizontal',
    advancedSettingsMode: 'collapsed',
    sectionOrder: Object.freeze(['mode', 'essentials', 'advanced']),
    phoneChrome: 'sticky-header-footer',
    scrollbarStyle: 'themed',
    essentialSectionTitle: '基础设置',
    advancedSectionTitle: '高级规则',
    modeSectionTitle: '桌型预设',
  }),
});

const DISPLAY_MODE_THEME_META = Object.freeze({
  club: Object.freeze({
    mode: 'club',
    label: ROOM_MODE_META.club.label,
    title: ROOM_MODE_META.club.title,
    shellClassName: 'mode-shell-club',
    accentClassName: 'mode-accent-club',
    shellTone: 'private-lounge',
    tableTone: 'walnut-felt',
    seatTone: 'host-console',
    chromeTone: 'brass-rig',
    layoutDensity: 'medium',
    motionStyle: 'measured',
    motion: Object.freeze({
      enterMs: 220,
      emphasisMs: 320,
      ambientSeconds: 16,
      spotlightSeconds: 3.2,
      floatSeconds: 9,
      ambientOpacity: 0.78,
    }),
    responsiveProfile: Object.freeze({
      phone: 'stacked-drawers',
      tablet: 'host-rail-persistent',
      desktop: 'triple-rail',
      ultrawide: 'center-stage',
    }),
    shellLayout: Object.freeze({
      phone: 'stacked',
      tablet: 'host-split',
      desktop: 'command-center',
      ultrawide: 'framed-center',
    }),
    roomTerminal: ROOM_TERMINAL_META.club,
    createRoom: CREATE_ROOM_META.club,
    sheetLabels: ROOM_TERMINAL_LABELS.club,
    room: Object.freeze({
      stageLabel: 'Table Console',
      stageCaption: '把牌桌状态、入座和主持动作放在最稳的视线里。',
      intelTitle: '桌况总览',
      intelCaption: '房主和成员先看这里，再决定下一步。',
      eventTitle: '最近动态',
      eventCaption: '保留最关键的结算和变更，不让信息过载。',
      actionTitle: '本席控制',
      actionCaption: '当前座位、筹码和开局入口保持清楚直接。',
      rosterTitle: '成员名单',
      rosterCaption: '优先减少争议和误读。',
      stacksTitle: '桌上筹码',
      historyTitle: '最近几手',
      latestHandLabel: '最近结算',
      historyPreviewCount: 3,
      startButtonLabel: '发下一手',
      actionStatStyle: 'pills',
    }),
  }),
  pro: Object.freeze({
    mode: 'pro',
    label: ROOM_MODE_META.pro.label,
    title: ROOM_MODE_META.pro.title,
    shellClassName: 'mode-shell-pro',
    accentClassName: 'mode-accent-pro',
    shellTone: 'broadcast-arena',
    tableTone: 'velocity-felt',
    seatTone: 'combat-plaque',
    chromeTone: 'broadcast-rig',
    layoutDensity: 'high',
    motionStyle: 'sharp',
    motion: Object.freeze({
      enterMs: 180,
      emphasisMs: 260,
      ambientSeconds: 12,
      spotlightSeconds: 2.4,
      floatSeconds: 7,
      ambientOpacity: 0.9,
    }),
    responsiveProfile: Object.freeze({
      phone: 'hero-dock-first',
      tablet: 'dual-rail-adaptive',
      desktop: 'triple-rail',
      ultrawide: 'center-stage',
    }),
    shellLayout: Object.freeze({
      phone: 'stacked',
      tablet: 'split-focus',
      desktop: 'command-center',
      ultrawide: 'framed-center',
    }),
    roomTerminal: ROOM_TERMINAL_META.pro,
    createRoom: CREATE_ROOM_META.pro,
    sheetLabels: ROOM_TERMINAL_LABELS.pro,
    room: Object.freeze({
      stageLabel: 'Table Stage',
      stageCaption: '底池、牌面和轮转保持在同一焦点内。',
      intelTitle: 'Intel Rail',
      intelCaption: '紧凑桌况、座位和主持动作集中在左侧。',
      eventTitle: 'Event Rail',
      eventCaption: '资金流、最新结果和时间线优先。',
      actionTitle: 'Hero Seat',
      actionCaption: '数字优先的即时决策区。',
      rosterTitle: 'Roster',
      rosterCaption: '座位、位置、状态、净额。',
      stacksTitle: 'Stacks',
      historyTitle: 'Hand Tape',
      latestHandLabel: 'Latest Hand',
      historyPreviewCount: 4,
      startButtonLabel: '开始游戏',
      actionStatStyle: 'grid',
    }),
  }),
  study: Object.freeze({
    mode: 'study',
    label: ROOM_MODE_META.study.label,
    title: ROOM_MODE_META.study.title,
    shellClassName: 'mode-shell-study',
    accentClassName: 'mode-accent-study',
    shellTone: 'review-studio',
    tableTone: 'review-grid',
    seatTone: 'analysis-plaque',
    chromeTone: 'analysis-rig',
    layoutDensity: 'medium',
    motionStyle: 'annotated',
    motion: Object.freeze({
      enterMs: 240,
      emphasisMs: 340,
      ambientSeconds: 18,
      spotlightSeconds: 3.4,
      floatSeconds: 10,
      ambientOpacity: 0.82,
    }),
    responsiveProfile: Object.freeze({
      phone: 'tabbed-analysis',
      tablet: 'timeline-persistent',
      desktop: 'triple-rail',
      ultrawide: 'center-stage',
    }),
    shellLayout: Object.freeze({
      phone: 'stacked',
      tablet: 'split-review',
      desktop: 'command-center',
      ultrawide: 'framed-center',
    }),
    roomTerminal: ROOM_TERMINAL_META.study,
    createRoom: CREATE_ROOM_META.study,
    sheetLabels: ROOM_TERMINAL_LABELS.study,
    room: Object.freeze({
      stageLabel: 'Review Stage',
      stageCaption: '当前牌面、池子层级和结算窗口都为回看服务。',
      intelTitle: 'State Notes',
      intelCaption: '房间状态和成员语义更显式。',
      eventTitle: 'Review Rail',
      eventCaption: '上一手、底池层级和时间线更详细。',
      actionTitle: 'Hero Review',
      actionCaption: '操作前先看清位置、筹码和说明。',
      rosterTitle: '状态面板',
      rosterCaption: '保留更强的解释性标签。',
      stacksTitle: 'Chip Ledger',
      historyTitle: 'Timeline',
      latestHandLabel: '上一手结算',
      historyPreviewCount: 6,
      startButtonLabel: '开始并记录本手',
      actionStatStyle: 'annotated',
    }),
  }),
});

const ROOM_MODES = Object.freeze(Object.keys(ROOM_MODE_META));
const DISPLAY_MODE_PREFERENCES = Object.freeze(Object.keys(DISPLAY_MODE_META));

export function normalizeRoomMode(mode) {
  return ROOM_MODES.includes(mode) ? mode : 'pro';
}

export function normalizeDisplayModePreference(mode) {
  return DISPLAY_MODE_PREFERENCES.includes(mode) ? mode : 'inherit';
}

export function resolveDisplayMode(roomMode, displayModePreference = 'inherit') {
  const normalizedRoomMode = normalizeRoomMode(roomMode);
  const normalizedDisplayModePreference = normalizeDisplayModePreference(displayModePreference);

  if (normalizedDisplayModePreference === 'inherit') {
    return normalizedRoomMode;
  }

  return normalizedDisplayModePreference;
}

export function getDisplayModeTheme(mode) {
  const normalizedMode = normalizeRoomMode(mode === 'inherit' ? 'pro' : mode);
  return DISPLAY_MODE_THEME_META[normalizedMode];
}

export function resolveRoomShellLayout(width = 0) {
  const safeWidth = Number(width) || 0;

  if (safeWidth >= 1536) {
    return 'three-column';
  }

  if (safeWidth >= 1280) {
    return 'split-stage';
  }

  return 'stacked';
}

export function buildModePreviewCards() {
  return ['club', 'pro', 'study'].map((mode) => ({
    ...ROOM_MODE_META[mode],
    ...DISPLAY_MODE_THEME_META[mode],
  }));
}
