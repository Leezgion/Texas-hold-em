import { getDisplayModeTheme } from './productMode.js';
import { resolveRoomViewportLayout } from './roomViewportLayout.js';

function toSeconds(milliseconds) {
  return Number((milliseconds / 1000).toFixed(3));
}

function buildViewportShellTiming(viewport, motion = {}) {
  const isPhoneTerminal = viewport === 'phone-terminal';
  const isTabletTerminal = viewport === 'tablet-terminal';
  const enterMs = motion.enterMs || 180;
  const emphasisMs = motion.emphasisMs || 260;
  const ambientSeconds = motion.ambientSeconds || 12;
  const spotlightSeconds = motion.spotlightSeconds || 2.4;
  const floatSeconds = motion.floatSeconds || 7;

  if (isPhoneTerminal) {
    return {
      enterMs: Math.min(enterMs, 120),
      emphasisMs: Math.min(emphasisMs, 160),
      ambientSeconds: Math.min(ambientSeconds, 8),
      spotlightSeconds: Math.min(spotlightSeconds, 1.2),
      floatSeconds: Math.min(floatSeconds, 4),
    };
  }

  if (isTabletTerminal) {
    return {
      enterMs: Math.min(enterMs, 160),
      emphasisMs: Math.min(emphasisMs, 230),
      ambientSeconds,
      spotlightSeconds,
      floatSeconds,
    };
  }

  return {
    enterMs,
    emphasisMs,
    ambientSeconds,
    spotlightSeconds,
    floatSeconds,
  };
}

function buildViewportMotionContract(viewport, ambientOpacity, motion = {}) {
  const isPhoneTerminal = viewport === 'phone-terminal';
  const shellTiming = buildViewportShellTiming(viewport, motion);

  return {
    viewport,
    allowBackdropBlurStacks: !isPhoneTerminal,
    pageFloat: isPhoneTerminal ? 'disabled' : 'enabled',
    primaryTransitions: isPhoneTerminal ? 'transform-opacity-only' : 'full-shell',
    surfaceBlur: isPhoneTerminal ? 'minimal' : 'layered',
    ambientMotion: isPhoneTerminal ? 'reduced' : 'full',
    touchScrollModel: isPhoneTerminal ? 'sheet-body-y-only' : 'multi-surface',
    pulseBudget: isPhoneTerminal ? 'minimal' : 'full',
    shellTiming,
    shell: {
      ambientOpacity: isPhoneTerminal ? Math.min(ambientOpacity ?? 0.85, 0.36) : ambientOpacity ?? 0.85,
      ambientBlurPx: isPhoneTerminal ? 12 : 56,
      overlayBackdropBlurPx: isPhoneTerminal ? 0 : 10,
      panelBackdropBlurPx: isPhoneTerminal ? 0 : 18,
      headerBackdropBlurPx: isPhoneTerminal ? 0 : 18,
      potBackdropBlurPx: isPhoneTerminal ? 0 : 18,
      beaconBackdropBlurPx: isPhoneTerminal ? 0 : 14,
      seatCardBackdropBlurPx: isPhoneTerminal ? 0 : 16,
      historyDrawerBackdropBlurPx: isPhoneTerminal ? 0 : 18,
    },
  };
}

export function resolveTacticalMotionViewport({ viewportModel, viewportWidth } = {}) {
  if (typeof viewportModel === 'string' && viewportModel) {
    return viewportModel;
  }

  if (Number.isFinite(viewportWidth)) {
    return resolveRoomViewportLayout({ width: viewportWidth }).viewportModel;
  }

  return 'desktop-terminal';
}

export function buildTacticalMotionProfile(mode = 'pro', { reducedMotion = false, viewport = 'desktop-terminal' } = {}) {
  const theme = getDisplayModeTheme(mode);
  const viewportContract = buildViewportMotionContract(viewport, theme.motion?.ambientOpacity, theme.motion);
  const isPhoneTerminal = viewportContract.viewport === 'phone-terminal';

  if (reducedMotion) {
    return {
      reducedMotion: true,
      ...viewportContract,
      shellTiming: {
        enterMs: 10,
        emphasisMs: 10,
        ambientSeconds: 0.01,
        spotlightSeconds: 0.01,
        floatSeconds: 0.01,
      },
      durations: {
        enter: 0.01,
        emphasis: 0.01,
        spotlight: 0.01,
      },
      stage: {
        initial: { opacity: 0, y: 0, scale: 1 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 0, scale: 1 },
        transition: { duration: 0.01, ease: 'linear' },
      },
      cue: {
        initial: { opacity: 0, y: 0 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 0 },
        transition: { duration: 0.01, ease: 'linear' },
      },
      turnChip: {
        initial: { opacity: 0, scale: 1 },
        animate: { opacity: 1, scale: [1, 1, 1] },
        exit: { opacity: 0, scale: 1 },
        transition: { duration: 0.01, ease: 'linear' },
      },
      settlement: {
        initial: { opacity: 0, y: 0, scale: 1 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 0, scale: 1 },
        transition: { duration: 0.01, ease: 'linear' },
        lineTransition: { duration: 0.01, ease: 'linear' },
        staggerChildren: 0,
      },
      eventCard: {
        initial: { opacity: 0, y: 0, scale: 1 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 0, scale: 1 },
        transition: { duration: 0.01, ease: 'linear' },
      },
      handTape: {
        initial: { opacity: 0, y: 0 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 0 },
        transition: { duration: 0.01, ease: 'linear' },
        staggerChildren: 0,
      },
    };
  }

  const shellTiming = viewportContract.shellTiming;
  const durations = {
    enter: toSeconds(shellTiming.enterMs),
    emphasis: toSeconds(shellTiming.emphasisMs),
    spotlight: Number(shellTiming.spotlightSeconds.toFixed(3)),
  };

  return {
    reducedMotion: false,
    ...viewportContract,
    shellTiming,
    durations,
    stage: {
      initial: { opacity: 0, y: isPhoneTerminal ? 8 : 18, scale: isPhoneTerminal ? 0.994 : 0.985 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: isPhoneTerminal ? -4 : -10, scale: isPhoneTerminal ? 0.996 : 0.992 },
      transition: { duration: durations.emphasis, ease: [0.22, 1, 0.36, 1] },
    },
    cue: {
      initial: { opacity: 0, y: isPhoneTerminal ? 4 : 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: isPhoneTerminal ? -3 : -8 },
      transition: { duration: durations.enter, ease: [0.22, 1, 0.36, 1] },
    },
    turnChip: {
      initial: { opacity: 0, scale: isPhoneTerminal ? 1 : 0.98 },
      animate: { opacity: 1, scale: isPhoneTerminal ? 1 : [1, 1.03, 1] },
      exit: { opacity: 0, scale: isPhoneTerminal ? 1 : 0.98 },
      transition: isPhoneTerminal
        ? {
            duration: durations.enter,
            ease: [0.22, 1, 0.36, 1],
          }
        : {
            duration: durations.enter,
            ease: [0.22, 1, 0.36, 1],
            scale: {
              duration: durations.spotlight,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          },
    },
    settlement: {
      initial: { opacity: 0, y: isPhoneTerminal ? 10 : 20, scale: isPhoneTerminal ? 0.994 : 0.985 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: isPhoneTerminal ? 6 : 12, scale: isPhoneTerminal ? 0.996 : 0.99 },
      transition: { duration: durations.emphasis, ease: [0.22, 1, 0.36, 1] },
      lineTransition: { duration: durations.enter, ease: [0.22, 1, 0.36, 1] },
      staggerChildren: isPhoneTerminal ? 0.02 : mode === 'study' ? 0.08 : mode === 'club' ? 0.07 : 0.05,
    },
    eventCard: {
      initial: { opacity: 0, y: isPhoneTerminal ? 6 : 14, scale: isPhoneTerminal ? 0.996 : 0.992 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: isPhoneTerminal ? -4 : -8, scale: isPhoneTerminal ? 0.998 : 0.996 },
      transition: { duration: durations.enter, ease: [0.22, 1, 0.36, 1] },
    },
    handTape: {
      initial: { opacity: 0, y: isPhoneTerminal ? 4 : 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: isPhoneTerminal ? -3 : -6 },
      transition: { duration: durations.enter, ease: [0.22, 1, 0.36, 1] },
      staggerChildren: isPhoneTerminal ? 0.015 : mode === 'study' ? 0.075 : mode === 'club' ? 0.06 : 0.045,
    },
  };
}
