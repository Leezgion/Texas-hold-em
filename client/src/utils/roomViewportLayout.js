export function resolveRoomViewportLayout({ width = 0, height = 0 } = {}) {
  const safeWidth = Number(width) || 0;
  const safeHeight = Number(height) || 0;
  const isPortrait = safeHeight > safeWidth;

  if (safeWidth >= 1536) {
    return {
      viewportModel: 'ultrawide-terminal',
      pageScroll: 'locked',
      heroDockPlacement: 'fixed-bottom',
      supportSurfaceModel: 'rails-and-overlays',
      supportSurfaceOrder: ['players', 'history', 'room'],
      contentMaxWidth: '1600px',
      orientation: isPortrait ? 'portrait' : 'landscape',
    };
  }

  if (safeWidth >= 1280) {
    return {
      viewportModel: 'desktop-terminal',
      pageScroll: 'locked',
      heroDockPlacement: 'fixed-bottom',
      supportSurfaceModel: 'rails-and-overlays',
      supportSurfaceOrder: ['players', 'history', 'room'],
      contentMaxWidth: '1440px',
      orientation: isPortrait ? 'portrait' : 'landscape',
    };
  }

  if (safeWidth >= 768) {
    return {
      viewportModel: 'tablet-terminal',
      pageScroll: 'locked',
      heroDockPlacement: 'fixed-bottom',
      supportSurfaceModel: 'slide-panels',
      supportSurfaceOrder: ['players', 'history', 'room'],
      contentMaxWidth: '100%',
      orientation: isPortrait ? 'portrait' : 'landscape',
    };
  }

  return {
    viewportModel: 'phone-terminal',
    pageScroll: 'locked',
    heroDockPlacement: 'fixed-bottom',
    supportSurfaceModel: 'bottom-sheets',
    supportSurfaceOrder: ['players', 'history', 'room'],
    contentMaxWidth: '100%',
    orientation: isPortrait ? 'portrait' : 'landscape',
  };
}
