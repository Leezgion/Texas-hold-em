import React from 'react';

const TONE_CLASS_MAP = {
  amber: 'border-amber-400/40 bg-amber-500/10 text-amber-100',
  sky: 'border-sky-400/40 bg-sky-500/10 text-sky-100',
  slate: 'border-white/10 bg-white/5 text-slate-100',
};

const TableBanner = ({ banner = null, tone = 'slate', onAction = null }) => {
  if (!banner) {
    return null;
  }

  const toneClassName = TONE_CLASS_MAP[tone] || TONE_CLASS_MAP.slate;

  return (
    <div className={`rounded-2xl border px-4 py-3 backdrop-blur-sm ${toneClassName}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{banner.title}</p>
          <p className="mt-1 text-sm opacity-90">{banner.detail}</p>
        </div>
        {banner.actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            {banner.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default TableBanner;
