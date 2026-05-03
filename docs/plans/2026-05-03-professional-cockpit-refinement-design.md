# Professional Cockpit Refinement Design

## Goal

Make the live-hand cockpit feel closer to a serious online/professional Hold'em decision surface without breaking the single-screen table contract that is now stable across phone, tablet, desktop, and ultrawide.

## Current Context

- The refreshed capsule table, live action dock, raise drawer, settlement panels, player-count matrix, and deep gameplay edge suite are passing.
- `ActionDock` already couples hero cards and action controls into the table apron.
- `ActionButtons` already renders decision/watch/sync states, duplicate-submit protection, timer, quick raise sizes, call-only behavior, and phone-safe raise drawer layout.
- `deriveProActionSummary` currently exposes only `toCall`, `minRaise`, `pot`, and `effectiveStack`.

The next pass should refine decision quality and professional feel, not rebuild the table or reopen the responsive architecture.

## Recommended Approach

Use an incremental professional cockpit layer:

- Extend view-model data first so UI remains driven by server-authoritative game state.
- Add compact pro metrics that help decision-making: pot odds, SPR, effective stack in BB, street, current price, and last action.
- Keep phone copy short and numeric-first; use chips/badges/tooltips instead of long explanatory text.
- Add high-risk misclick prevention only where it matters: all-in and large raise commit paths.
- Keep fold/check/call fast because professional players need low-friction common actions.
- Verify every layout with existing contract tests and real browser scripts before committing.

## Alternatives Considered

### Full Redesign

Rebuilding the dock, table, and betting console together would allow a cleaner visual system, but it would invalidate the responsive and edge-case evidence we just stabilized. This is too risky for the current stage.

### Cosmetic Polish Only

Adjusting colors, spacing, and button styles would improve screenshots but would not solve the professional-player requirement. Serious players need faster access to decision numbers, not just prettier controls.

### Incremental Professional Layer

This keeps the proven layout and adds the missing decision surface. It is the best tradeoff because it improves product value while preserving the regression baseline.

## Data Design

Extend `deriveProActionSummary` with compact derived fields:

- `toCall`
- `minRaise`
- `pot`
- `effectiveStack`
- `effectiveStackBb`
- `potOddsPercent`
- `spr`
- `streetLabel`
- `lastActionLabel`
- `actionModeLabel`

Derived numbers should be safe on missing data:

- division by zero returns `null`, not `Infinity`
- unknown street returns `null`
- call-only action mode returns a compact label like `仅可跟注`
- open/check spots keep labels concise

`buildProActionStatRows` should remain display-mode aware, but the pro mode should prioritize decision metrics over repeated labels.

## UI Design

`ActionButtons` remains the main decision console.

- Add a compact pro decision strip above or beside the main commands depending on viewport.
- Phone should keep no more than one dense row of stats when the raise drawer is closed.
- Desktop/tablet can show richer stats while preserving command target size.
- Watch state should keep concise forced-action feedback and avoid adding extra clutter.

`ActionDock` remains responsible for hero identity, hand cards, and support launchers.

- Keep the hero ribbon compact.
- Avoid duplicating the same pot/call info in both dock and action console unless one is a short status chip.
- Do not move hand cards away from action controls.

`PlayerTimer` should stay visually integrated with action buttons.

- Keep warning/danger timing.
- Later performance tuning can reduce animation cost if browser evidence shows jank.

## Misclick Prevention

Only high-risk actions should gain friction:

- All-in direct button opens an inline confirmation state on phone and tablet.
- Custom raise commit asks for confirmation when the total commit is all-in or large relative to stack.
- Fold, check, and call remain one-tap unless a later real-browser test proves accidental fold is common.
- Submitting state must disable commands and keep the existing duplicate guard.

The confirmation UI must be small and inside the action console, not a full modal, because it must not detach from the table.

## Performance Direction

Use evidence before optimizing.

- Keep animation changes minimal.
- Prefer CSS simplification and lower blur/box-shadow intensity on phone if traces show jank.
- Do not introduce canvas or a new animation library for this pass.
- Do not upgrade Tailwind during this feature; dependency upgrades should be a separate risk-managed task.

## Testing Strategy

Use TDD and keep each phase committable.

- View-model tests for pot odds, SPR, BB formatting, street labels, and safe null behavior.
- Contract tests for rendered decision stat hooks, all-in confirmation hooks, and phone-safe CSS selectors.
- Browser audits for phone and tablet decision states, raise drawer, all-in confirmation, duplicate guard, and no scroll/overlap regression.
- Full verification before each stage commit:
  - `cd client && pnpm exec node --test`
  - `cd client && pnpm build`
  - `cd server && npm test -- --runInBand`
  - `git diff --check`

## Non-Goals

- No merge to `main`.
- No deployment or launch preparation.
- No canvas rewrite.
- No Tailwind upgrade.
- No broad table geometry redesign.
- No new persistence layer.

## Open Risks

- Adding too many metrics can hurt phone clarity; phone must remain numeric-first and single-screen.
- Inline confirmations can slow down expert flow; only all-in and large commits should get friction.
- Some current browser scripts tolerate expected console noise; future scripts must continue using filtered failure conditions instead of raw console error counts.
