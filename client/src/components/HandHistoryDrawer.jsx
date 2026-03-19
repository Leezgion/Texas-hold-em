import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import { buildTacticalMotionProfile, resolveTacticalMotionViewport } from '../utils/tacticalMotion';
import { buildHandHistoryView } from '../view-models/handHistoryViewModel';

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
          <div className="tactical-history-drawer__kicker">Hand History</div>
          <div className="tactical-history-drawer__title">Recent Tape</div>
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
            {summary.boardLabel && <div className="tactical-history-card__board">Board {summary.boardLabel}</div>}
            <div className="tactical-history-card__lines">
              {summary.lines.length > 0 ? (
                summary.lines.slice(0, lineLimit).map((line, index) => (
                  <motion.div
                    key={`${summary.handNumber}-${index}`}
                    className="tactical-history-card__line"
                    initial={motionProfile.handTape.initial}
                    animate={motionProfile.handTape.animate}
                    transition={{
                      ...motionProfile.handTape.transition,
                      delay: motionProfile.handTape.staggerChildren * (index + 1),
                    }}
                  >
                    {line}
                  </motion.div>
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
  const lineLimit = effectiveDisplayMode === 'study' ? 6 : 4;

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
