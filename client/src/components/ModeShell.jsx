import React from 'react';
import { MotionConfig } from 'motion/react';
import { useLocation } from 'react-router-dom';

import { getDisplayModeTheme } from '../utils/productMode';
import { buildTacticalMotionProfile } from '../utils/tacticalMotion';

const ModeShell = ({ mode = 'pro', children }) => {
  const location = useLocation();
  const theme = getDisplayModeTheme(mode);
  const [viewportWidth, setViewportWidth] = React.useState(() => window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const motionViewport =
    viewportWidth < 768
      ? 'phone-terminal'
      : viewportWidth < 1280
      ? 'tablet-terminal'
      : viewportWidth >= 1536
      ? 'ultrawide-terminal'
      : 'desktop-terminal';
  const motionProfile = buildTacticalMotionProfile(mode, { viewport: motionViewport });
  const motion = theme.motion || {};
  const shellMotionStyle = {
    '--arena-motion-enter': `${motion.enterMs || 180}ms`,
    '--arena-motion-emphasis': `${motion.emphasisMs || 260}ms`,
    '--arena-motion-ambient': `${motion.ambientSeconds || 12}s`,
    '--arena-motion-spotlight': `${motion.spotlightSeconds || 2.4}s`,
    '--arena-motion-float': `${motion.floatSeconds || 7}s`,
    '--arena-motion-ambient-opacity': motionProfile.shell.ambientOpacity,
    '--arena-shell-ambient-blur': `${motionProfile.shell.ambientBlurPx}px`,
    '--arena-shell-overlay-blur': `${motionProfile.shell.overlayBackdropBlurPx}px`,
    '--arena-shell-panel-blur': `${motionProfile.shell.panelBackdropBlurPx}px`,
    '--arena-shell-header-blur': `${motionProfile.shell.headerBackdropBlurPx}px`,
    '--arena-shell-ambient-play-state': motionProfile.ambientMotion === 'reduced' ? 'paused' : 'running',
    '--arena-shell-float-play-state': motionProfile.pageFloat === 'disabled' ? 'paused' : 'running',
  };

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: (motion.enterMs || 180) / 1000 }}>
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
        data-shell-page-float={motionProfile.pageFloat}
        data-shell-transition-budget={motionProfile.primaryTransitions}
        data-shell-backdrop-blur={motionProfile.surfaceBlur}
        data-shell-ambient-motion={motionProfile.ambientMotion}
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
