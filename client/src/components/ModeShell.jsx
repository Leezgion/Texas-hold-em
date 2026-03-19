import React from 'react';
import { MotionConfig } from 'motion/react';

import { getDisplayModeTheme } from '../utils/productMode';

const ModeShell = ({ mode = 'pro', children }) => {
  const theme = getDisplayModeTheme(mode);
  const motion = theme.motion || {};
  const shellMotionStyle = {
    '--arena-motion-enter': `${motion.enterMs || 180}ms`,
    '--arena-motion-emphasis': `${motion.emphasisMs || 260}ms`,
    '--arena-motion-ambient': `${motion.ambientSeconds || 12}s`,
    '--arena-motion-spotlight': `${motion.spotlightSeconds || 2.4}s`,
    '--arena-motion-float': `${motion.floatSeconds || 7}s`,
    '--arena-motion-ambient-opacity': motion.ambientOpacity ?? 0.85,
  };

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: (motion.enterMs || 180) / 1000 }}>
      <div
        className={`mode-shell ${theme.shellClassName}`}
        style={shellMotionStyle}
        data-display-mode={theme.mode}
        data-shell-tone={theme.shellTone}
        data-table-tone={theme.tableTone}
        data-seat-tone={theme.seatTone}
        data-chrome-tone={theme.chromeTone}
        data-layout-density={theme.layoutDensity}
        data-motion-style={theme.motionStyle}
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
