import React from 'react';

import { buildStageChromeLayout } from '../utils/tableStageLayout';

const TableStageChrome = ({
  viewportWidth = 1280,
  viewportHeight = 0,
  tableDiameter = 320,
  seatGuides = [],
  roomShellLayout = 'stacked',
  tableProfile = null,
}) => {
  const chrome = buildStageChromeLayout({
    viewportWidth,
    viewportHeight,
    tableDiameter,
    seatGuides,
    roomShellLayout,
    tableProfile,
  });

  return (
    <svg
      className="table-stage-chrome"
      data-table-family={chrome.family}
      data-table-profile={chrome.profile}
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
        <ellipse
          className="table-stage-chrome__halo"
          cx={chrome.centerX}
          cy={chrome.centerY}
          rx={chrome.table.outerRx + 28}
          ry={chrome.table.outerRy + 22}
        />
        <ellipse
          className="table-stage-chrome__outer"
          cx={chrome.centerX}
          cy={chrome.centerY}
          rx={chrome.table.outerRx}
          ry={chrome.table.outerRy}
        />
        <ellipse
          className="table-stage-chrome__inner"
          cx={chrome.centerX}
          cy={chrome.centerY}
          rx={chrome.table.innerRx}
          ry={chrome.table.innerRy}
        />
        <ellipse
          className="table-stage-chrome__glow"
          cx={chrome.centerX}
          cy={chrome.centerY}
          rx={chrome.table.innerRx - 12}
          ry={chrome.table.innerRy - 10}
          fill="url(#stage-felt-glow)"
        />
      </g>

      <g className="table-stage-chrome__orbit">
        <ellipse
          className="table-stage-chrome__orbit-ring"
          cx={chrome.centerX}
          cy={chrome.centerY}
          rx={chrome.orbit.rx}
          ry={chrome.orbit.ry}
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
