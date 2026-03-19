import React from 'react';

const ModePreviewCard = ({
  card,
  selected = false,
  active = false,
  compact = false,
  onSelect,
}) => {
  const baseClassName = compact
    ? 'mode-preview-card mode-preview-card--compact'
    : 'mode-preview-card';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${baseClassName} ${card.shellClassName} ${selected ? 'mode-preview-card--selected' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`mode-preview-card__eyebrow ${card.accentClassName}`}>{card.label}</div>
          <div className="mt-2 text-xl font-semibold text-white">{card.title}</div>
          <div className="mt-2 text-sm text-slate-300">{card.tagline || card.detail}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {selected && <span className="mode-preview-card__badge">当前偏好</span>}
          {!selected && active && <span className="mode-preview-card__badge mode-preview-card__badge--ghost">当前生效</span>}
        </div>
      </div>

      {!compact && (
        <>
          <div className="mt-4 text-sm text-slate-400">{card.detail}</div>
          <div className="mt-5 flex flex-wrap gap-2">
            {(card.highlights || []).map((item) => (
              <span key={item} className="mode-preview-card__chip">
                {item}
              </span>
            ))}
          </div>
        </>
      )}
    </button>
  );
};

export default ModePreviewCard;
