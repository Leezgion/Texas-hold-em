import React from 'react';

import { getDisplayModeTheme } from '../utils/productMode';

const ModeShell = ({ mode = 'pro', children }) => {
  const theme = getDisplayModeTheme(mode);

  return (
    <div
      className={`mode-shell ${theme.shellClassName}`}
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
  );
};

export default ModeShell;
