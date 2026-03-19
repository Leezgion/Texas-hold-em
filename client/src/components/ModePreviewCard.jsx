import React from 'react';

const ModePreviewCard = ({
  card,
  selected = false,
  active = false,
  compact = false,
  surfaceVariant = 'default',
  onSelect,
}) => {
  const baseClassName = compact
    ? 'mode-preview-card mode-preview-card--compact'
    : 'mode-preview-card';
  const variantClassName = surfaceVariant === 'create-room' ? 'mode-preview-card--create-room' : '';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${baseClassName} ${variantClassName} ${card.shellClassName} ${selected ? 'mode-preview-card--selected' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className={`mode-preview-card__eyebrow ${card.accentClassName}`}>{card.label}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="text-xl font-semibold text-white">{card.title}</div>
            {!compact && <span className="mode-preview-card__scene">{card.gatewayScene}</span>}
          </div>
          <div className="mt-2 text-sm font-medium text-slate-200">{card.gatewayPersona}</div>
          <div className="mt-2 text-sm text-slate-300">{card.tagline || card.detail}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {selected && <span className="mode-preview-card__badge">当前偏好</span>}
          {!selected && active && <span className="mode-preview-card__badge mode-preview-card__badge--ghost">当前生效</span>}
        </div>
      </div>

      {surfaceVariant === 'create-room' ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {(card.highlights || []).slice(0, 2).map((item) => (
            <span key={item} className="mode-preview-card__chip">
              {item}
            </span>
          ))}
        </div>
      ) : !compact ? (
        <>
          <div className="mt-4 text-sm text-slate-400">{card.detail}</div>
          <div className="mode-preview-card__persona mt-4">
            <span className="mode-preview-card__persona-kicker">适合</span>
            <span className="mode-preview-card__persona-value">{card.gatewayPersona}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {(card.highlights || []).map((item) => (
              <span key={item} className="mode-preview-card__chip">
                {item}
              </span>
            ))}
          </div>
        </>
      ) : null}
    </button>
  );
};

export default ModePreviewCard;
