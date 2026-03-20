import React from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { useLocation } from 'react-router-dom';

import { getDisplayModeTheme } from '../utils/productMode';
import { buildTacticalMotionProfile, resolveTacticalMotionViewport } from '../utils/tacticalMotion';

const ModeShell = ({ mode = 'pro', children }) => {
  const location = useLocation();
  const theme = getDisplayModeTheme(mode);
  const reducedMotion = useReducedMotion();
  const [viewportWidth, setViewportWidth] = React.useState(() => window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const motionViewport =
    resolveTacticalMotionViewport({ viewportWidth });
  const motionProfile = buildTacticalMotionProfile(mode, { reducedMotion, viewport: motionViewport });
  const motionTiming = motionProfile.shellTiming || {};
  const cueTiming = motionProfile.cueTiming || {};
  const shellMotionStyle = {
    '--arena-motion-enter': `${motionTiming.enterMs || 180}ms`,
    '--arena-motion-emphasis': `${motionTiming.emphasisMs || 260}ms`,
    '--arena-motion-ambient': `${motionTiming.ambientSeconds || 12}s`,
    '--arena-motion-spotlight': `${motionTiming.spotlightSeconds || 2.4}s`,
    '--arena-motion-float': `${motionTiming.floatSeconds || 7}s`,
    '--arena-motion-turn-emphasis': `${cueTiming.turnEmphasisMs || 2400}ms`,
    '--arena-motion-plaque-response': `${cueTiming.plaqueResponseMs || 180}ms`,
    '--arena-motion-dock-cue': `${cueTiming.dockCueMs || 220}ms`,
    '--arena-motion-settlement-confirm': `${cueTiming.settlementConfirmMs || 240}ms`,
    '--arena-motion-ambient-opacity': motionProfile.shell.ambientOpacity,
    '--arena-shell-ambient-blur': `${motionProfile.shell.ambientBlurPx}px`,
    '--arena-shell-overlay-blur': `${motionProfile.shell.overlayBackdropBlurPx}px`,
    '--arena-shell-panel-blur': `${motionProfile.shell.panelBackdropBlurPx}px`,
    '--arena-shell-header-blur': `${motionProfile.shell.headerBackdropBlurPx}px`,
    '--arena-shell-pot-blur': `${motionProfile.shell.potBackdropBlurPx}px`,
    '--arena-shell-beacon-blur': `${motionProfile.shell.beaconBackdropBlurPx}px`,
    '--arena-shell-seat-card-blur': `${motionProfile.shell.seatCardBackdropBlurPx}px`,
    '--arena-shell-history-drawer-blur': `${motionProfile.shell.historyDrawerBackdropBlurPx}px`,
    '--arena-shell-ambient-play-state': motionProfile.ambientMotion === 'reduced' ? 'paused' : 'running',
    '--arena-shell-float-play-state': motionProfile.pageFloat === 'disabled' ? 'paused' : 'running',
    '--arena-shell-cue-play-state': motionProfile.reducedMotion ? 'paused' : 'running',
  };

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: (motionTiming.enterMs || 180) / 1000 }}>
      <div
        className={`mode-shell ${theme.shellClassName}`}
        style={shellMotionStyle}
        data-display-mode={theme.mode}
        data-room-terminal-intent={theme.roomTerminal?.intent}
        data-shell-tone={theme.shellTone}
        data-table-tone={theme.tableTone}
        data-seat-tone={theme.seatTone}
        data-chrome-tone={theme.chromeTone}
        data-layout-density={theme.layoutDensity}
        data-motion-style={theme.motionStyle}
        data-shell-route={location.pathname.startsWith('/game/') ? 'room' : 'gateway'}
        data-shell-motion-viewport={motionProfile.viewport}
        data-shell-reduced-motion={motionProfile.reducedMotion ? 'true' : 'false'}
        data-shell-page-float={motionProfile.pageFloat}
        data-shell-transition-budget={motionProfile.primaryTransitions}
        data-shell-backdrop-blur={motionProfile.surfaceBlur}
        data-shell-ambient-motion={motionProfile.ambientMotion}
        data-shell-touch-scroll-model={motionProfile.touchScrollModel}
        data-shell-pulse-budget={motionProfile.pulseBudget}
        data-table-visual-cue-style={motionProfile.tableVisualCueStyle}
        data-shell-viewport-style={motionProfile.viewportShellStyle}
        data-shell-tactical-cue-budget={motionProfile.tacticalCueBudget}
        data-shell-tactical-cue-scope={motionProfile.tacticalCueScope}
        data-shell-layout-phone={theme.shellLayout.phone}
        data-shell-layout-tablet={theme.shellLayout.tablet}
        data-shell-layout-desktop={theme.shellLayout.desktop}
        data-shell-layout-ultrawide={theme.shellLayout.ultrawide}
      >
        <div className="mode-shell__ambient mode-shell__ambient--primary" aria-hidden="true" />
        <div className="mode-shell__ambient mode-shell__ambient--secondary" aria-hidden="true" />
        <div className="mode-shell__vignette" aria-hidden="true" />
        <div className="mode-shell__noise" aria-hidden="true" />
        <div className="mode-shell__grid" aria-hidden="true" />
        <div className="mode-shell__content">{children}</div>
      </div>
    </MotionConfig>
  );
};

export default ModeShell;
