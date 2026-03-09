const LEVEL_RANGE = [1, 2, 3, 4, 5];

const OPERATION_RULES = {
  addition: {
    symbol: "+",
    levels: {
      1: { range: [1, 5], roundLength: 4 },
      2: { range: [2, 7], roundLength: 4 },
      3: { range: [3, 9], roundLength: 5 },
      4: { range: [4, 12], roundLength: 5 },
      5: { range: [6, 15], roundLength: 6 },
    },
    createPair: ({ range }) => {
      const [min, max] = range;
      const a = randomInt(min, max);
      const b = randomInt(min, max);
      return [a, b];
    },
    targetFromPair: ([a, b]) => a + b,
    matchResults: (a, b) => [a + b],
  },
  subtraction: {
    symbol: "−",
    levels: {
      1: { lowRange: [1, 4], diffRange: [1, 3], roundLength: 4 },
      2: { lowRange: [1, 6], diffRange: [2, 5], roundLength: 4 },
      3: { lowRange: [2, 8], diffRange: [3, 7], roundLength: 5 },
      4: { lowRange: [3, 10], diffRange: [4, 9], roundLength: 5 },
      5: { lowRange: [4, 12], diffRange: [5, 12], roundLength: 6 },
    },
    createPair: ({ lowRange, diffRange }) => {
      const low = randomInt(lowRange[0], lowRange[1]);
      const diff = randomInt(diffRange[0], diffRange[1]);
      const high = low + diff;
      return [high, low];
    },
    targetFromPair: ([a, b]) => a - b,
    matchResults: (a, b) => {
      const results = [];
      if (a > b) results.push(a - b);
      if (b > a) results.push(b - a);
      return results;
    },
  },
  multiplication: {
    symbol: "×",
    levels: {
      1: { factorRange: [1, 4], roundLength: 4 },
      2: { factorRange: [2, 6], roundLength: 4 },
      3: { factorRange: [2, 8], roundLength: 5 },
      4: { factorRange: [3, 10], roundLength: 5 },
      5: { factorRange: [4, 12], roundLength: 6 },
    },
    createPair: ({ factorRange }) => {
      const a = randomInt(factorRange[0], factorRange[1]);
      const b = randomInt(factorRange[0], factorRange[1]);
      return [a, b];
    },
    targetFromPair: ([a, b]) => a * b,
    matchResults: (a, b) => [a * b],
  },
  division: {
    symbol: "÷",
    levels: {
      1: { divisorRange: [1, 4], quotientRange: [1, 4], roundLength: 4 },
      2: { divisorRange: [2, 6], quotientRange: [2, 6], roundLength: 4 },
      3: { divisorRange: [2, 8], quotientRange: [2, 8], roundLength: 5 },
      4: { divisorRange: [3, 10], quotientRange: [3, 10], roundLength: 5 },
      5: { divisorRange: [4, 12], quotientRange: [4, 12], roundLength: 6 },
    },
    createPair: ({ divisorRange, quotientRange }) => {
      const divisor = randomInt(divisorRange[0], divisorRange[1]);
      const quotient = randomInt(quotientRange[0], quotientRange[1]);
      const dividend = divisor * quotient;
      return [dividend, divisor];
    },
    targetFromPair: ([a, b]) => a / b,
    matchResults: (a, b) => {
      const results = [];
      if (b !== 0 && a % b === 0) results.push(a / b);
      if (a !== 0 && b % a === 0) results.push(b / a);
      return results;
    },
  },
};

const state = {
  selected: [],
  currentTargetIndex: 0,
  usedNumbers: new Set(),
  gamePlan: [],
  sliceValues: [],
  mode: "addition",
  level: 1,
};

const targetList = document.getElementById("targetList");
const currentTarget = document.getElementById("currentTarget");
const feedback = document.getElementById("feedback");
const slices = document.getElementById("sliceContainer");
const monsterFace = document.getElementById("monsterFace");
const resetButton = document.getElementById("resetButton");
const modeInstruction = document.getElementById("modeInstruction");
const modeInputs = document.querySelectorAll('input[name="mode"]');
const levelInputs = document.querySelectorAll('input[name="level"]');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(values) {
  const clone = [...values];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function getRuleSet() {
  const operation = OPERATION_RULES[state.mode];
  return {
    operation,
    levelRules: operation.levels[state.level],
  };
}

function updateModeInstruction() {
  const { operation } = getRuleSet();
  modeInstruction.textContent = `Pick two slices that make the current target with ${operation.symbol} at Level ${state.level}!`;
}

function makeStep() {
  const { operation, levelRules } = getRuleSet();
  const pair = operation.createPair(levelRules);
  return {
    target: operation.targetFromPair(pair),
    pair,
    op: operation.symbol,
  };
}

function generateRound() {
  const { levelRules } = getRuleSet();
  const gamePlan = [];

  for (let i = 0; i < levelRules.roundLength; i += 1) {
    gamePlan.push(makeStep());
  }

  const sliceValues = shuffle(gamePlan.flatMap((step) => step.pair));
  return { gamePlan, sliceValues };
}

function setFeedback(message, type = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`.trim();
}

function updateTargets() {
  targetList.innerHTML = "";

  state.gamePlan.forEach((step, idx) => {
    const li = document.createElement("li");
    li.textContent = step.target;

    if (idx < state.currentTargetIndex) {
      li.classList.add("eaten");
    } else if (idx === state.currentTargetIndex) {
      li.classList.add("active");
    }

    targetList.appendChild(li);
  });

  const active = state.gamePlan[state.currentTargetIndex];
  currentTarget.textContent = active ? active.target : "All gone!";
}

function createSliceButton(value, idx) {
  const btn = document.createElement("button");
  btn.className = "slice";
  btn.type = "button";
  btn.textContent = value;
  btn.dataset.id = String(idx);

  if (state.usedNumbers.has(idx)) {
    btn.disabled = true;
  }

  btn.addEventListener("click", () => handleSliceSelection(idx, value));
  return btn;
}

function renderSlices() {
  slices.innerHTML = "";
  state.sliceValues.forEach((value, idx) => {
    const btn = createSliceButton(value, idx);
    if (state.selected.some((pick) => pick.id === idx)) {
      btn.classList.add("selected");
    }
    slices.appendChild(btn);
  });
}

function clearSelection() {
  state.selected = [];
  renderSlices();
}

function checkSelection() {
  if (state.selected.length < 2) return;

  const [a, b] = state.selected;
  const active = state.gamePlan[state.currentTargetIndex];
  if (!active) return;

  const { operation } = getRuleSet();
  const possibleResults = operation.matchResults(a.value, b.value);
  const isMatch = possibleResults.includes(active.target);

  if (isMatch) {
    state.usedNumbers.add(a.id);
    state.usedNumbers.add(b.id);
    state.currentTargetIndex += 1;
    monsterFace.textContent = "😋";
    setFeedback(`Yum! ${a.value} ${active.op} ${b.value} can make ${active.target}!`, "good");
  } else {
    monsterFace.textContent = "😵";
    setFeedback(`Oops! ${a.value} ${active.op} ${b.value} does not make ${active.target}. Try again!`, "bad");
  }

  clearSelection();
  updateTargets();

  if (state.currentTargetIndex >= state.gamePlan.length) {
    monsterFace.textContent = "🥳";
    setFeedback("Pizza Monster is full! You ate every target!", "good");
  }
}

function handleSliceSelection(id, value) {
  if (state.usedNumbers.has(id)) return;

  const existingIndex = state.selected.findIndex((pick) => pick.id === id);
  if (existingIndex >= 0) {
    state.selected.splice(existingIndex, 1);
    renderSlices();
    return;
  }

  if (state.selected.length === 2) return;

  state.selected.push({ id, value });
  renderSlices();

  if (state.selected.length === 2) checkSelection();
}

function resetGame() {
  const newRound = generateRound();
  state.gamePlan = newRound.gamePlan;
  state.sliceValues = newRound.sliceValues;
  state.selected = [];
  state.currentTargetIndex = 0;
  state.usedNumbers = new Set();
  monsterFace.textContent = "😋";

  const { operation } = getRuleSet();
  setFeedback(`Select two slices to solve each target with ${operation.symbol} (Level ${state.level}).`);
  updateModeInstruction();
  updateTargets();
  renderSlices();
}

modeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    state.mode = input.value;
    resetGame();
  });
});

levelInputs.forEach((input) => {
  input.addEventListener("change", () => {
    state.level = Number(input.value);
    resetGame();
  });
});

function initSelectors() {
  modeInputs.forEach((input) => {
    input.checked = input.value === state.mode;
  });
  levelInputs.forEach((input) => {
    const level = Number(input.value);
    input.checked = level === state.level && LEVEL_RANGE.includes(level);
  });
}

resetButton.addEventListener("click", resetGame);
initSelectors();
resetGame();