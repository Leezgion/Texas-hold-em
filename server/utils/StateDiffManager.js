class StateDiffManager {
  createDiff(previousState = {}, nextState = {}) {
    const diff = {};
    const keys = new Set([...Object.keys(previousState), ...Object.keys(nextState)]);

    keys.forEach((key) => {
      const previousValue = previousState[key];
      const nextValue = nextState[key];
      if (JSON.stringify(previousValue) !== JSON.stringify(nextValue)) {
        diff[key] = {
          previous: previousValue,
          next: nextValue,
        };
      }
    });

    return diff;
  }

  hasChanges(previousState = {}, nextState = {}) {
    return Object.keys(this.createDiff(previousState, nextState)).length > 0;
  }
}

const stateDiffManager = new StateDiffManager();

module.exports = {
  StateDiffManager,
  stateDiffManager,
};
