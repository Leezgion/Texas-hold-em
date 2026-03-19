import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import React, { useState } from 'react';

import { buildHandHistoryView } from '../view-models/handHistoryViewModel';

const HandHistoryDrawer = ({ records = [], effectiveDisplayMode = 'pro' }) => {
  const [open, setOpen] = useState(false);
  const summaries = buildHandHistoryView(records);
  const lineLimit = effectiveDisplayMode === 'study' ? 6 : 4;

  return (
    <div className={`tactical-history-drawer ${open ? 'tactical-history-drawer--open' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="tactical-history-drawer__toggle"
        title={open ? '收起牌局记录' : '展开牌局记录'}
      >
        {open ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="tactical-history-drawer__panel">
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
            {summaries.map((summary) => (
              <div key={summary.handNumber} className="tactical-history-card">
                <div className="tactical-history-card__header">
                  <div className="tactical-history-card__title">{summary.title}</div>
                  {summary.reason && <div className="tactical-history-card__reason">{summary.reason}</div>}
                </div>
                {summary.boardLabel && <div className="tactical-history-card__board">Board {summary.boardLabel}</div>}
                <div className="tactical-history-card__lines">
                  {summary.lines.length > 0 ? (
                    summary.lines.slice(0, lineLimit).map((line, index) => (
                      <div key={`${summary.handNumber}-${index}`} className="tactical-history-card__line">
                        {line}
                      </div>
                    ))
                  ) : (
                    <div className="tactical-history-card__line">无结算摘要</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HandHistoryDrawer;
