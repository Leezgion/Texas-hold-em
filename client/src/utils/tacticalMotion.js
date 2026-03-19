import { getDisplayModeTheme } from './productMode.js';

function toSeconds(milliseconds) {
  return Number((milliseconds / 1000).toFixed(3));
}

export function buildTacticalMotionProfile(mode = 'pro', { reducedMotion = false } = {}) {
  if (reducedMotion) {
    return {
      reducedMotion: true,
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

  const theme = getDisplayModeTheme(mode);
  const durations = {
    enter: toSeconds(theme.motion.enterMs || 180),
    emphasis: toSeconds(theme.motion.emphasisMs || 260),
    spotlight: Number((theme.motion.spotlightSeconds || 2.4).toFixed(3)),
  };

  return {
    reducedMotion: false,
    durations,
    stage: {
      initial: { opacity: 0, y: 18, scale: 0.985 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -10, scale: 0.992 },
      transition: { duration: durations.emphasis, ease: [0.22, 1, 0.36, 1] },
    },
    cue: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -8 },
      transition: { duration: durations.enter, ease: [0.22, 1, 0.36, 1] },
    },
    turnChip: {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: [1, 1.03, 1] },
      exit: { opacity: 0, scale: 0.98 },
      transition: {
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
      initial: { opacity: 0, y: 20, scale: 0.985 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 12, scale: 0.99 },
      transition: { duration: durations.emphasis, ease: [0.22, 1, 0.36, 1] },
      lineTransition: { duration: durations.enter, ease: [0.22, 1, 0.36, 1] },
      staggerChildren: mode === 'study' ? 0.08 : mode === 'club' ? 0.07 : 0.05,
    },
    eventCard: {
      initial: { opacity: 0, y: 14, scale: 0.992 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -8, scale: 0.996 },
      transition: { duration: durations.enter, ease: [0.22, 1, 0.36, 1] },
    },
    handTape: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -6 },
      transition: { duration: durations.enter, ease: [0.22, 1, 0.36, 1] },
      staggerChildren: mode === 'study' ? 0.075 : mode === 'club' ? 0.06 : 0.045,
    },
  };
}
