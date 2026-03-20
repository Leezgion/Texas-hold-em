import React from 'react';

import { buildStageChromeLayout } from '../utils/tableStageLayout';

const TableStageChrome = ({
  seatGuides = [],
  roomShellLayout = 'stacked',
  geometryContract = null,
  viewportWidth = 1280,
  viewportHeight = 0,
  tableDiameter = 320,
  tableProfile = null,
}) => {
  const chrome = buildStageChromeLayout({
    geometryContract,
    viewportWidth,
    viewportHeight,
    tableDiameter,
    seatGuides,
    roomShellLayout,
    tableProfile,
  });
  const shellOrientation = chrome.table.shellOrientation || 'horizontal-capsule';
  const shellCornerRadius = chrome.table.shellCornerRadius || Math.round(Math.min(chrome.table.outerRx, chrome.table.outerRy));
  const outerShell = {
    x: chrome.centerX - chrome.table.outerRx,
    y: chrome.centerY - chrome.table.outerRy,
    width: chrome.table.outerRx * 2,
    height: chrome.table.outerRy * 2,
  };
  const innerShell = {
    x: chrome.centerX - chrome.table.innerRx,
    y: chrome.centerY - chrome.table.innerRy,
    width: chrome.table.innerRx * 2,
    height: chrome.table.innerRy * 2,
  };
  const haloShell = {
    x: outerShell.x - (shellOrientation === 'vertical-capsule' ? 22 : 28),
    y: outerShell.y - (shellOrientation === 'vertical-capsule' ? 18 : 22),
    width: outerShell.width + (shellOrientation === 'vertical-capsule' ? 44 : 56),
    height: outerShell.height + (shellOrientation === 'vertical-capsule' ? 36 : 44),
  };
  const glowShell = {
    x: innerShell.x + 12,
    y: innerShell.y + 10,
    width: Math.max(0, innerShell.width - 24),
    height: Math.max(0, innerShell.height - 20),
  };
  const tableShellRadius = Math.min(shellCornerRadius, Math.min(outerShell.width, outerShell.height) / 2);
  const innerShellRadius = Math.min(Math.max(shellCornerRadius - 4, 0), Math.min(innerShell.width, innerShell.height) / 2);
  const glowShellRadius = Math.min(Math.max(innerShellRadius - 2, 0), Math.min(glowShell.width, glowShell.height) / 2);
  const orbitRingPath = [
    `M ${chrome.centerX} ${chrome.centerY - chrome.orbit.ry}`,
    `A ${chrome.orbit.rx} ${chrome.orbit.ry} 0 1 1 ${chrome.centerX} ${chrome.centerY + chrome.orbit.ry}`,
    `A ${chrome.orbit.rx} ${chrome.orbit.ry} 0 1 1 ${chrome.centerX} ${chrome.centerY - chrome.orbit.ry}`,
    'Z',
  ].join(' ');

  return (
    <svg
      className="table-stage-chrome"
      data-table-family={chrome.family}
      data-table-profile={chrome.profile}
      data-shell-orientation={shellOrientation}
      viewBox={`0 0 ${chrome.width} ${chrome.height}`}
      style={{ width: `${chrome.width}px`, height: `${chrome.height}px` }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="stage-felt-glow" cx="50%" cy="45%" r="62%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="55%" stopColor="rgba(125,211,252,0.08)" />
          <stop offset="100%" stopColor="rgba(2,6,23,0)" />
        </radialGradient>
        <linearGradient id="stage-tray-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(191,219,254,0.36)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0.18)" />
        </linearGradient>
      </defs>

      <g className="table-stage-chrome__shell">
        <rect
          className="table-stage-chrome__halo"
          x={haloShell.x}
          y={haloShell.y}
          width={haloShell.width}
          height={haloShell.height}
          rx={Math.min(tableShellRadius + 12, Math.min(haloShell.width, haloShell.height) / 2)}
          ry={Math.min(tableShellRadius + 12, Math.min(haloShell.width, haloShell.height) / 2)}
        />
        <rect
          className="table-stage-chrome__outer"
          x={outerShell.x}
          y={outerShell.y}
          width={outerShell.width}
          height={outerShell.height}
          rx={tableShellRadius}
          ry={tableShellRadius}
        />
        <rect
          className="table-stage-chrome__inner"
          x={innerShell.x}
          y={innerShell.y}
          width={innerShell.width}
          height={innerShell.height}
          rx={innerShellRadius}
          ry={innerShellRadius}
        />
        <rect
          className="table-stage-chrome__glow"
          x={glowShell.x}
          y={glowShell.y}
          width={glowShell.width}
          height={glowShell.height}
          rx={glowShellRadius}
          ry={glowShellRadius}
          fill="url(#stage-felt-glow)"
        />
      </g>

      <g className="table-stage-chrome__orbit">
        <path
          className="table-stage-chrome__orbit-ring"
          d={orbitRingPath}
        />
        {chrome.orbitMarkers.map((marker) => (
          <circle
            key={`orbit-${marker.index}`}
            className={`table-stage-chrome__orbit-marker ${
              marker.isHeadMarker ? 'table-stage-chrome__orbit-marker--head' : ''
            }`}
            cx={marker.cx}
            cy={marker.cy}
            r={marker.r}
          />
        ))}
      </g>

      <g className="table-stage-chrome__tray">
        <rect
          className="table-stage-chrome__stage-band"
          x={chrome.stageBand.x}
          y={chrome.stageBand.y}
          width={chrome.stageBand.width}
          height={chrome.stageBand.height}
          rx={chrome.stageBand.rx}
        />
        <rect
          className="table-stage-chrome__tray-shell"
          x={chrome.boardTray.x}
          y={chrome.boardTray.y}
          width={chrome.boardTray.width}
          height={chrome.boardTray.height}
          rx={chrome.boardTray.rx}
          fill="rgba(2,6,23,0.24)"
          stroke="url(#stage-tray-stroke)"
        />
        <line
          className="table-stage-chrome__tray-line"
          x1={chrome.boardTray.x + 18}
          y1={chrome.centerY}
          x2={chrome.boardTray.x + chrome.boardTray.width - 18}
          y2={chrome.centerY}
        />
      </g>

      <g className="table-stage-chrome__seat-guides">
        {chrome.seatGuides.map((guide) => {
          const toneClassName = guide.isCurrentTurn
            ? 'table-stage-chrome__guide--current-turn'
            : guide.occupied
            ? 'table-stage-chrome__guide--occupied'
            : 'table-stage-chrome__guide--open';

          return (
            <g key={`guide-${guide.seatIndex}`} className={`table-stage-chrome__guide ${toneClassName}`}>
              <line
                className="table-stage-chrome__guide-line"
                x1={chrome.centerX}
                y1={chrome.centerY}
                x2={guide.cx}
                y2={guide.cy}
              />
              <circle className="table-stage-chrome__guide-ring" cx={guide.cx} cy={guide.cy} r={chrome.guideRadius + 6} />
              <circle className="table-stage-chrome__guide-core" cx={guide.cx} cy={guide.cy} r={chrome.guideRadius} />
              {guide.anchorZone === 'dock-edge' && (
                <circle className="table-stage-chrome__guide-dock" cx={guide.cx} cy={guide.cy} r={chrome.guideRadius + 10} />
              )}
              {guide.markerLabel && (
                <text className="table-stage-chrome__marker" x={guide.cx} y={guide.cy - chrome.guideRadius - 10}>
                  {guide.markerLabel}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default TableStageChrome;
