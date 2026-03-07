import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import React, { useState } from 'react';

import { buildHandHistoryView } from '../view-models/handHistoryViewModel';

const HandHistoryDrawer = ({ records = [] }) => {
  const [open, setOpen] = useState(false);
  const summaries = buildHandHistoryView(records);

  return (
    <div className={`absolute right-0 top-24 z-20 flex h-[calc(100%-7rem)] transition-transform ${open ? 'translate-x-0' : 'translate-x-[18rem]'}`}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="h-12 rounded-l-xl border border-r-0 border-gray-700 bg-gray-900/95 px-3 text-gray-200 shadow-lg backdrop-blur-sm"
        title={open ? '收起牌局记录' : '展开牌局记录'}
      >
        {open ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="w-72 border-l border-gray-700 bg-gray-900/95 p-4 text-white shadow-2xl backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <ScrollText
            size={18}
            className="text-poker-gold"
          />
          <h3 className="text-sm font-semibold tracking-wide text-gray-100">牌局记录</h3>
        </div>

        {summaries.length === 0 ? (
          <div className="rounded-xl border border-gray-700 bg-gray-800/70 p-4 text-sm text-gray-400">暂无牌局记录</div>
        ) : (
          <div className="space-y-3 overflow-y-auto pr-1">
            {summaries.map((summary) => (
              <div
                key={summary.handNumber}
                className="rounded-xl border border-gray-700 bg-gray-800/70 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">{summary.title}</div>
                  {summary.reason && <div className="text-[11px] text-gray-400">{summary.reason}</div>}
                </div>
                <div className="space-y-1 text-xs text-gray-200">
                  {summary.lines.length > 0 ? (
                    summary.lines.map((line, index) => (
                      <div
                        key={`${summary.handNumber}-${index}`}
                        className="rounded-lg bg-black/20 px-2 py-1.5"
                      >
                        {line}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg bg-black/20 px-2 py-1.5 text-gray-400">无结算摘要</div>
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
