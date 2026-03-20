function resolveHeightClass({ width = 0, height = 0 } = {}) {
  const safeWidth = Number(width) || 0;
  const safeHeight = Number(height) || 0;

  if (safeHeight > 0 && (safeHeight < 520 || (safeWidth >= 768 && safeHeight < 720))) {
    return 'short-height';
  }

  return 'regular-height';
}

function resolveDockReservePx({ viewportModel = 'desktop-terminal', heightClass = 'regular-height' } = {}) {
  const isShortHeight = heightClass === 'short-height';

  switch (viewportModel) {
    case 'phone-terminal':
      return isShortHeight ? 208 : 224;
    case 'tablet-terminal':
      return isShortHeight ? 192 : 208;
    case 'ultrawide-terminal':
      return isShortHeight ? 192 : 208;
    case 'desktop-terminal':
    default:
      return isShortHeight ? 184 : 196;
  }
}

const SUPPORT_SURFACE_POLICY = Object.freeze({
  phone: 'sheet',
  tablet: 'panel',
  desktop: 'panel',
  ultrawide: 'rail',
});

function resolveSupportSurfacePolicyKey(viewportModel = 'desktop-terminal') {
  switch (viewportModel) {
    case 'phone-terminal':
      return 'phone';
    case 'tablet-terminal':
      return 'tablet';
    case 'ultrawide-terminal':
      return 'ultrawide';
    case 'desktop-terminal':
    default:
      return 'desktop';
  }
}

function resolveSupportLauncherDensity(viewportModel = 'desktop-terminal') {
  return viewportModel === 'phone-terminal' ? 'compact' : 'regular';
}

export function resolveStageViewportContract({ width = 0, height = 0 } = {}) {
  const safeWidth = Number(width) || 0;
  const heightClass = resolveHeightClass({ width: safeWidth, height });

  return {
    heightClass,
    stageDensity: heightClass === 'short-height' ? 'compressed' : safeWidth < 768 ? 'compact' : 'standard',
    minStageBudgetPx: heightClass === 'short-height' ? 180 : safeWidth < 768 ? 220 : safeWidth >= 1280 ? 300 : 260,
  };
}

function buildViewportLayout({
  viewportModel,
  supportSurfaceModel,
  contentMaxWidth,
  width = 0,
  height = 0,
} = {}) {
  const stageViewportContract = resolveStageViewportContract({ width, height });
  const supportSurfacePolicyKey = resolveSupportSurfacePolicyKey(viewportModel);
  const headerDensity =
    viewportModel === 'phone-terminal' || stageViewportContract.heightClass === 'short-height'
      ? 'compact'
      : 'regular';
  const prefersToolbarActions =
    viewportModel === 'ultrawide-terminal' || headerDensity !== 'compact';

  return {
    viewportModel,
    pageScroll: 'locked',
    roomScrollContract: 'single-screen',
    heroDockPlacement: 'fixed-bottom',
    dockPresentation: 'overlay-terminal',
    supportLauncherDensity: resolveSupportLauncherDensity(viewportModel),
    headerDensity,
    headerActionModel: prefersToolbarActions ? 'toolbar' : 'room-sheet-first',
    dockReservePx: resolveDockReservePx({
      viewportModel,
      heightClass: stageViewportContract.heightClass,
    }),
    supportSurfaceModel,
    supportSurfacePolicy: SUPPORT_SURFACE_POLICY,
    supportSurfacePolicyKey,
    supportSurfacePolicyValue: SUPPORT_SURFACE_POLICY[supportSurfacePolicyKey],
    contentMaxWidth,
    ...stageViewportContract,
  };
}

export function resolveRoomViewportLayout({ width = 0, height = 0 } = {}) {
  const safeWidth = Number(width) || 0;

  if (safeWidth >= 1536) {
    return buildViewportLayout({
      viewportModel: 'ultrawide-terminal',
      supportSurfaceModel: 'rails-and-overlays',
      contentMaxWidth: '1600px',
      width: safeWidth,
      height,
    });
  }

  if (safeWidth >= 1280) {
    return buildViewportLayout({
      viewportModel: 'desktop-terminal',
      supportSurfaceModel: 'slide-panels',
      contentMaxWidth: '1440px',
      width: safeWidth,
      height,
    });
  }

  if (safeWidth >= 768) {
    return buildViewportLayout({
      viewportModel: 'tablet-terminal',
      supportSurfaceModel: 'slide-panels',
      contentMaxWidth: '100%',
      width: safeWidth,
      height,
    });
  }

  return buildViewportLayout({
    viewportModel: 'phone-terminal',
    supportSurfaceModel: 'bottom-sheets',
    contentMaxWidth: '100%',
    width: safeWidth,
    height,
  });
}
