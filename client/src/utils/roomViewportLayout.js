export function resolveRoomViewportLayout({ width = 0, height = 0 } = {}) {
  const safeWidth = Number(width) || 0;

  if (safeWidth >= 1536) {
    return {
      viewportModel: 'ultrawide-terminal',
      pageScroll: 'locked',
      heroDockPlacement: 'fixed-bottom',
      supportSurfaceModel: 'rails-and-overlays',
      contentMaxWidth: '1600px',
    };
  }

  if (safeWidth >= 1280) {
    return {
      viewportModel: 'desktop-terminal',
      pageScroll: 'locked',
      heroDockPlacement: 'fixed-bottom',
      supportSurfaceModel: 'rails-and-overlays',
      contentMaxWidth: '1440px',
    };
  }

  if (safeWidth >= 768) {
    return {
      viewportModel: 'tablet-terminal',
      pageScroll: 'locked',
      heroDockPlacement: 'fixed-bottom',
      supportSurfaceModel: 'slide-panels',
      contentMaxWidth: '100%',
    };
  }

  return {
    viewportModel: 'phone-terminal',
    pageScroll: 'locked',
    heroDockPlacement: 'fixed-bottom',
    supportSurfaceModel: 'bottom-sheets',
    contentMaxWidth: '100%',
  };
}
