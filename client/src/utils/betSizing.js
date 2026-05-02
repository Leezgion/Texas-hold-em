const QUICK_RAISE_CANDIDATES = Object.freeze([
  { label: '1/3池', potMultiplier: 1 / 3 },
  { label: '1/2池', potMultiplier: 1 / 2 },
  { label: '1x池', potMultiplier: 1 },
  { label: '1.2x池', potMultiplier: 1.2 },
]);

function toNonNegativeNumber(value) {
  return Math.max(0, Number(value) || 0);
}

function alignToBigBlind(value, { bigBlind = 0, minRaise = 0 } = {}) {
  const safeBigBlind = toNonNegativeNumber(bigBlind);
  const safeMinRaise = toNonNegativeNumber(minRaise);

  if (safeBigBlind <= 0) {
    return Math.max(safeMinRaise, Math.floor(toNonNegativeNumber(value)));
  }

  const minValue = Math.max(safeMinRaise, safeBigBlind);
  const normalized = Math.max(minValue, Math.floor(toNonNegativeNumber(value)));
  const remainder = normalized % safeBigBlind;

  return remainder === 0 ? normalized : normalized + (safeBigBlind - remainder);
}

export function buildQuickRaiseSizes({
  potSize = 0,
  minRaise = 0,
  maxRaiseAmount = 0,
  bigBlind = 0,
} = {}) {
  const safePotSize = toNonNegativeNumber(potSize);
  const safeMinRaise = toNonNegativeNumber(minRaise);
  const safeMaxRaiseAmount = toNonNegativeNumber(maxRaiseAmount);
  const seenAmounts = new Set();

  return QUICK_RAISE_CANDIDATES.map((candidate) => ({
    label: candidate.label,
    amount: alignToBigBlind(Math.max(safeMinRaise, Math.floor(safePotSize * candidate.potMultiplier)), {
      bigBlind,
      minRaise: safeMinRaise,
    }),
  })).filter((candidate) => {
    if (candidate.amount <= 0 || candidate.amount > safeMaxRaiseAmount || seenAmounts.has(candidate.amount)) {
      return false;
    }

    seenAmounts.add(candidate.amount);
    return true;
  });
}
