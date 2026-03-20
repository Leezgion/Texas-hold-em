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
  const feltTone = chrome.material?.feltTone || 'deep-green-velvet';
  const railTone = chrome.material?.railTone || 'black-gold';
  const centerSurfaceModel = chrome.centerSurfaceModel || 'broadcast-clean-center';
  const outerRail = {
    x: chrome.centerX - chrome.table.outerRx,
    y: chrome.centerY - chrome.table.outerRy,
    width: chrome.table.outerRx * 2,
    height: chrome.table.outerRy * 2,
  };
  const transitionRail = {
    x: outerRail.x + 14,
    y: outerRail.y + 12,
    width: Math.max(0, outerRail.width - 28),
    height: Math.max(0, outerRail.height - 24),
  };
  const feltSurface = {
    x: transitionRail.x + 10,
    y: transitionRail.y + 8,
    width: Math.max(0, transitionRail.width - 20),
    height: Math.max(0, transitionRail.height - 16),
  };
  const centerFrame = {
    x: chrome.boardTray.x - 14,
    y: chrome.boardTray.y - 12,
    width: chrome.boardTray.width + 28,
    height: chrome.boardTray.height + 24,
  };
  const railRadius = Math.min(Math.min(outerRail.width, outerRail.height) / 2, chrome.table.shellCornerRadius || 999);
  const transitionRadius = Math.min(Math.min(transitionRail.width, transitionRail.height) / 2, Math.max(railRadius - 10, 0));
  const feltRadius = Math.min(Math.min(feltSurface.width, feltSurface.height) / 2, Math.max(transitionRadius - 8, 0));
  const frameRadius = Math.min(Math.min(centerFrame.width, centerFrame.height) / 2, Math.max(chrome.boardTray.rx + 6, 18));

  return (
    <svg
      className="table-stage-chrome"
      data-table-family={chrome.family}
      data-table-profile={chrome.profile}
      data-center-surface-model={centerSurfaceModel}
      data-table-material-felt-tone={feltTone}
      data-table-material-rail-tone={railTone}
      viewBox={`0 0 ${chrome.width} ${chrome.height}`}
      style={{ width: `${chrome.width}px`, height: `${chrome.height}px` }}
      aria-hidden="true"
    >
      <g className="table-stage-chrome__rail-stack">
        <rect
          className="table-stage-chrome__outer-rail"
          x={outerRail.x}
          y={outerRail.y}
          width={outerRail.width}
          height={outerRail.height}
          rx={railRadius}
          ry={railRadius}
        />
        <rect
          className="table-stage-chrome__transition-rail"
          x={transitionRail.x}
          y={transitionRail.y}
          width={transitionRail.width}
          height={transitionRail.height}
          rx={transitionRadius}
          ry={transitionRadius}
        />
        <rect
          className="table-stage-chrome__felt"
          x={feltSurface.x}
          y={feltSurface.y}
          width={feltSurface.width}
          height={feltSurface.height}
          rx={feltRadius}
          ry={feltRadius}
        />
      </g>

      <g className="table-stage-chrome__center-frame">
        <rect
          className="table-stage-chrome__center-frame-shell"
          x={centerFrame.x}
          y={centerFrame.y}
          width={centerFrame.width}
          height={centerFrame.height}
          rx={frameRadius}
          ry={frameRadius}
        />
        <line
          className="table-stage-chrome__center-frame-line"
          x1={centerFrame.x + 16}
          y1={chrome.centerY}
          x2={centerFrame.x + centerFrame.width - 16}
          y2={chrome.centerY}
        />
      </g>

      <g className="table-stage-chrome__seat-guides">
        {chrome.seatGuides.map((guide) => {
          const toneClassName = guide.isCurrentTurn
            ? 'table-stage-chrome__seat-node--current-turn'
            : guide.occupied
            ? 'table-stage-chrome__seat-node--occupied'
            : 'table-stage-chrome__seat-node--open';
          const nodeSize = chrome.guideRadius + 4;
          const nodeX = guide.cx - nodeSize;
          const nodeY = guide.cy - nodeSize;

          return (
            <g key={`guide-${guide.seatIndex}`} className={`table-stage-chrome__seat-guide ${toneClassName}`}>
              <line
                className="table-stage-chrome__guide-spoke"
                x1={chrome.centerX}
                y1={chrome.centerY}
                x2={guide.cx}
                y2={guide.cy}
              />
              <rect
                className="table-stage-chrome__seat-node"
                x={nodeX}
                y={nodeY}
                width={nodeSize * 2}
                height={nodeSize * 2}
                rx={Math.max(3, nodeSize / 2)}
                ry={Math.max(3, nodeSize / 2)}
              />
              {guide.anchorZone === 'dock-edge' && (
                <rect
                  className="table-stage-chrome__seat-node-pulse"
                  x={nodeX - 3}
                  y={nodeY - 3}
                  width={nodeSize * 2 + 6}
                  height={nodeSize * 2 + 6}
                  rx={Math.max(4, nodeSize / 2 + 1)}
                  ry={Math.max(4, nodeSize / 2 + 1)}
                />
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
