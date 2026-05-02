import React from 'react';

import Modal from './Modal';
import { deriveGameEndedSummary } from '../view-models/gameViewModel';

const HandResultModal = ({ show = false, result = null, onClose }) => {
  if (!show || !result?.isGameEnded) {
    return null;
  }

  const summary = deriveGameEndedSummary(result);

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={summary.title}
      maxWidth="max-w-lg"
      layout="scrollable"
      surface="panel"
      phoneSurface="full-screen-sheet"
      scrollbarStyle="themed"
      className="game-ended-summary"
      bodyClassName="game-ended-summary__body"
      footerClassName="game-ended-summary__footer"
      contentProps={{
        'data-game-ended-summary': 'true',
        'data-final-ranking-count': result?.finalRanking?.length || 0,
      }}
      footer={
        <button type="button" className="mode-primary-button w-full" onClick={onClose}>
          返回主页
        </button>
      }
    >
      <div className="game-ended-summary__hero">
        <div className="game-ended-summary__kicker">SESSION CLOSED</div>
        <div className="game-ended-summary__headline">{summary.reasonLabel}</div>
        <div className="game-ended-summary__meta">
          <span>{summary.playerCountLabel}</span>
          <span>总筹码 {summary.totalChipsLabel}</span>
          {summary.unsettledReturnLabel ? <span>{summary.unsettledReturnLabel}</span> : null}
        </div>
      </div>

      <div className="game-ended-summary__ranking" aria-label="最终排名">
        {summary.rankingRows.map((row) => (
          <div
            key={`${row.rank}-${row.name}`}
            className={`game-ended-summary__row ${row.isWinner ? 'game-ended-summary__row--winner' : ''}`}
          >
            <span className="game-ended-summary__rank">#{row.rank}</span>
            <span className="game-ended-summary__name">{row.name}</span>
            <span className="game-ended-summary__chips">{row.chipsLabel}</span>
            <span className="game-ended-summary__profit">{row.profitLabel}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default HandResultModal;
