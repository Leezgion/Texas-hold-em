import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import { buildTacticalMotionProfile, resolveTacticalMotionViewport } from '../utils/tacticalMotion';
import { buildHandHistoryView } from '../view-models/handHistoryViewModel';

function resolveHandHistoryLineLimit({ effectiveDisplayMode, surfaceVariant }) {
  if (surfaceVariant === 'embedded') {
    return Number.POSITIVE_INFINITY;
  }

  return effectiveDisplayMode === 'study' ? 6 : 4;
}

export function buildHistoryLineSections(summary, lineLimit) {
  const fallbackLines = Array.isArray(summary.lines) ? summary.lines : [];
  const maxLines = Number.isFinite(lineLimit) ? Math.max(0, lineLimit) : Number.POSITIVE_INFINITY;
  const sections = [
    {
      key: 'total',
      label: '总览',
      lines: summary.totalLine ? [summary.totalLine] : [],
    },
    {
      key: 'scoreboard',
      label: '底池与输赢',
      lines: Array.isArray(summary.scoreboardLines) ? summary.scoreboardLines : [],
    },
    {
      key: 'reveal',
      label: '亮牌',
      lines: Array.isArray(summary.detailLines) ? summary.detailLines : [],
    },
  ];
  let consumed = 0;

  const groupedSections = sections
    .map((section) => {
      if (consumed >= maxLines) {
        return { ...section, lines: [] };
      }

      const remaining = Number.isFinite(maxLines) ? maxLines - consumed : Number.POSITIVE_INFINITY;
      const sectionLines = section.lines.slice(0, remaining).map((line, index) => ({
        text: line,
        globalIndex: consumed + index,
      }));
      consumed += sectionLines.length;
      return { ...section, lines: sectionLines };
    })
    .filter((section) => section.lines.length > 0);

  if (groupedSections.length > 0) {
    return groupedSections;
  }

  return [
    {
      key: 'summary',
      label: '摘要',
      lines: fallbackLines.slice(0, maxLines).map((line, index) => ({
        text: line,
        globalIndex: index,
      })),
    },
  ].filter((section) => section.lines.length > 0);
}

const HandHistoryDrawerContent = ({
  summaries,
  motionProfile,
  lineLimit,
}) => (
  <>
    <div className="tactical-history-drawer__header">
      <div className="flex items-center gap-2">
        <ScrollText size={18} className="text-[color:var(--mode-shell-accent-strong)]" />
        <div>
          <div className="tactical-history-drawer__kicker">牌局记录</div>
          <div className="tactical-history-drawer__title">最近手牌</div>
        </div>
      </div>
      <span className="tactical-history-drawer__count">{summaries.length}</span>
    </div>

    {summaries.length === 0 ? (
      <div className="tactical-history-card tactical-history-card--empty">暂无牌局记录</div>
    ) : (
      <div className="tactical-history-tape">
        {summaries.map((summary, summaryIndex) => (
          <motion.div
            key={summary.handNumber}
            className="tactical-history-card"
            initial={motionProfile.eventCard.initial}
            animate={motionProfile.eventCard.animate}
            transition={{
              ...motionProfile.eventCard.transition,
              delay: motionProfile.handTape.staggerChildren * summaryIndex,
            }}
          >
            <div className="tactical-history-card__header">
              <div className="tactical-history-card__title">{summary.title}</div>
              {summary.reason && <div className="tactical-history-card__reason">{summary.reason}</div>}
            </div>
            {summary.boardLabel && <div className="tactical-history-card__board">公牌 {summary.boardLabel}</div>}
            <div className="tactical-history-card__lines">
              {summary.lines.length > 0 ? (
                buildHistoryLineSections(summary, lineLimit).map((section) => (
                  <div
                    key={`${summary.handNumber}-${section.key}`}
                    className="tactical-history-card__section"
                    data-history-section={section.key}
                  >
                    <div className="tactical-history-card__section-label">{section.label}</div>
                    <div className="tactical-history-card__section-lines">
                      {section.lines.map((line) => (
                        <motion.div
                          key={`${summary.handNumber}-${section.key}-${line.globalIndex}`}
                          className="tactical-history-card__line"
                          data-history-line-type={section.key}
                          initial={motionProfile.handTape.initial}
                          animate={motionProfile.handTape.animate}
                          transition={{
                            ...motionProfile.handTape.transition,
                            delay: motionProfile.handTape.staggerChildren * (line.globalIndex + 1),
                          }}
                        >
                          {line.text}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="tactical-history-card__line">无结算摘要</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </>
);

const EmbeddedHandHistoryDrawer = ({ summaries, motionProfile, lineLimit, surfaceVariant }) => (
  <div
    className="tactical-history-drawer tactical-history-drawer--open"
    data-surface-variant={surfaceVariant}
  >
    <div className="tactical-history-drawer__panel">
      <HandHistoryDrawerContent
        summaries={summaries}
        motionProfile={motionProfile}
        lineLimit={lineLimit}
      />
    </div>
  </div>
);

const ToggleHandHistoryDrawer = ({
  summaries,
  motionProfile,
  lineLimit,
  surfaceVariant,
  defaultOpen,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`tactical-history-drawer ${open ? 'tactical-history-drawer--open' : ''}`}
      data-surface-variant={surfaceVariant}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="tactical-history-drawer__toggle"
        title={open ? '收起牌局记录' : '展开牌局记录'}
      >
        {open ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="tactical-history-drawer__panel">
        <HandHistoryDrawerContent
          summaries={summaries}
          motionProfile={motionProfile}
          lineLimit={lineLimit}
        />
      </div>
    </div>
  );
};

const HandHistoryDrawer = ({
  records = [],
  effectiveDisplayMode = 'pro',
  surfaceVariant = 'drawer',
  defaultOpen = false,
  viewportModel,
}) => {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const reducedMotion = useReducedMotion();
  const motionProfile = buildTacticalMotionProfile(effectiveDisplayMode, {
    reducedMotion,
    viewport: resolveTacticalMotionViewport({ viewportModel, viewportWidth }),
  });
  const summaries = buildHandHistoryView(records);
  const lineLimit = resolveHandHistoryLineLimit({ effectiveDisplayMode, surfaceVariant });

  useEffect(() => {
    if (viewportModel) {
      return undefined;
    }

    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewportModel]);

  if (surfaceVariant === 'embedded') {
    return (
      <EmbeddedHandHistoryDrawer
        summaries={summaries}
        motionProfile={motionProfile}
        lineLimit={lineLimit}
        surfaceVariant={surfaceVariant}
      />
    );
  }

  return (
    <ToggleHandHistoryDrawer
      summaries={summaries}
      motionProfile={motionProfile}
      lineLimit={lineLimit}
      surfaceVariant={surfaceVariant}
      defaultOpen={defaultOpen}
    />
  );
};

export default HandHistoryDrawer;
