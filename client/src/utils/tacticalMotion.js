import { getDisplayModeTheme } from './productMode.js';
import { resolveRoomViewportLayout } from './roomViewportLayout.js';

function toSeconds(milliseconds) {
  return Number((milliseconds / 1000).toFixed(3));
}

function buildViewportMotionContract(viewport, ambientOpacity) {
  const isPhoneTerminal = viewport === 'phone-terminal';

  return {
    viewport,
    allowBackdropBlurStacks: !isPhoneTerminal,
    pageFloat: isPhoneTerminal ? 'disabled' : 'enabled',
    primaryTransitions: isPhoneTerminal ? 'transform-opacity-only' : 'full-shell',
    surfaceBlur: isPhoneTerminal ? 'minimal' : 'layered',
    ambientMotion: isPhoneTerminal ? 'reduced' : 'full',
    shell: {
      ambientOpacity: isPhoneTerminal ? Math.min(ambientOpacity ?? 0.85, 0.42) : ambientOpacity ?? 0.85,
      ambientBlurPx: isPhoneTerminal ? 28 : 56,
      overlayBackdropBlurPx: isPhoneTerminal ? 0 : 10,
      panelBackdropBlurPx: isPhoneTerminal ? 6 : 18,
      headerBackdropBlurPx: isPhoneTerminal ? 6 : 18,
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
  const viewportContract = buildViewportMotionContract(viewport, theme.motion?.ambientOpacity);
  const isPhoneTerminal = viewportContract.viewport === 'phone-terminal';

  if (reducedMotion) {
    return {
      reducedMotion: true,
      ...viewportContract,
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

  const durations = {
    enter: toSeconds(theme.motion.enterMs || 180),
    emphasis: toSeconds(theme.motion.emphasisMs || 260),
    spotlight: Number((theme.motion.spotlightSeconds || 2.4).toFixed(3)),
  };

  return {
    reducedMotion: false,
    ...viewportContract,
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
