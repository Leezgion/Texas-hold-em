import React from 'react';

import { getDisplayModeTheme } from '../utils/productMode';

const ModeShell = ({ mode = 'pro', children }) => {
  const theme = getDisplayModeTheme(mode);

  return (
    <div
      className={`mode-shell ${theme.shellClassName}`}
      data-display-mode={theme.mode}
      data-layout-density={theme.layoutDensity}
      data-motion-style={theme.motionStyle}
    >
      <div className="mode-shell__ambient mode-shell__ambient--primary" aria-hidden="true" />
      <div className="mode-shell__ambient mode-shell__ambient--secondary" aria-hidden="true" />
      <div className="mode-shell__grid" aria-hidden="true" />
      <div className="mode-shell__content">{children}</div>
    </div>
  );
};

export default ModeShell;
