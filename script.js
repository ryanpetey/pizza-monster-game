const ROUND_LENGTH = 4;
const MIN_SLICE = 1;
const MAX_SLICE = 9;

const MODE_CONFIG = {
  addition: {
    symbol: "+",
    createPair: () => {
      const a = randomInt(MIN_SLICE, MAX_SLICE);
      const b = randomInt(MIN_SLICE, MAX_SLICE);
      return [a, b];
    },
    targetFromPair: ([a, b]) => a + b,
    matchResults: (a, b) => [a + b],
  },
  subtraction: {
    symbol: "−",
    createPair: () => {
      const low = randomInt(1, 8);
      const delta = randomInt(1, 8 - low + 1);
      const high = low + delta;
      return [high, low];
    },
    targetFromPair: ([a, b]) => a - b,
    matchResults: (a, b) => {
      const results = [];
      if (a > b) {
        results.push(a - b);
      }
      if (b > a) {
        results.push(b - a);
      }
      return results;
    },
  },
  multiplication: {
    symbol: "×",
    createPair: () => {
      const a = randomInt(1, 6);
      const b = randomInt(1, 6);
      return [a, b];
    },
    targetFromPair: ([a, b]) => a * b,
    matchResults: (a, b) => [a * b],
  },
  division: {
    symbol: "÷",
    createPair: () => {
      const divisor = randomInt(1, 6);
      const quotient = randomInt(1, 6);
      const dividend = divisor * quotient;
      return [dividend, divisor];
    },
    targetFromPair: ([a, b]) => a / b,
    matchResults: (a, b) => {
      const results = [];
      if (b !== 0 && a % b === 0) {
        results.push(a / b);
      }
      if (a !== 0 && b % a === 0) {
        results.push(b / a);
      }
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
};

const targetList = document.getElementById("targetList");
const currentTarget = document.getElementById("currentTarget");
const feedback = document.getElementById("feedback");
const slices = document.getElementById("sliceContainer");
const monsterFace = document.getElementById("monsterFace");
const resetButton = document.getElementById("resetButton");
const modeInstruction = document.getElementById("modeInstruction");
const modeInputs = document.querySelectorAll('input[name="mode"]');

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

function updateModeInstruction() {
  const mode = MODE_CONFIG[state.mode];
  modeInstruction.textContent = `Pick two slices that make the current target with ${mode.symbol}!`;
}

function makeStep() {
  const mode = MODE_CONFIG[state.mode];
  const pair = mode.createPair();
  return {
    target: mode.targetFromPair(pair),
    pair,
    op: mode.symbol,
  };
}

function generateRound() {
  const gamePlan = [];

  for (let i = 0; i < ROUND_LENGTH; i += 1) {
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
  btn.dataset.value = String(value);

  if (state.usedNumbers.has(idx)) {
    btn.disabled = true;
  }

  btn.addEventListener("click", () => handleSliceSelection(idx, value));
  return btn;
}

function renderSlices() {
  slices.innerHTML = "";
  state.sliceValues.forEach((n, idx) => {
    const btn = createSliceButton(n, idx);
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
  if (state.selected.length < 2) {
    return;
  }

  const [a, b] = state.selected;
  const active = state.gamePlan[state.currentTargetIndex];

  if (!active) {
    return;
  }

  const possibleResults = MODE_CONFIG[state.mode].matchResults(a.value, b.value);
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
  if (state.usedNumbers.has(id)) {
    return;
  }

  const existingIndex = state.selected.findIndex((pick) => pick.id === id);
  if (existingIndex >= 0) {
    state.selected.splice(existingIndex, 1);
    renderSlices();
    return;
  }

  if (state.selected.length === 2) {
    return;
  }

  state.selected.push({ id, value });
  renderSlices();

  if (state.selected.length === 2) {
    checkSelection();
  }
}

function resetGame() {
  const newRound = generateRound();
  state.gamePlan = newRound.gamePlan;
  state.sliceValues = newRound.sliceValues;
  state.selected = [];
  state.currentTargetIndex = 0;
  state.usedNumbers = new Set();
  monsterFace.textContent = "😋";
  setFeedback(`Select two number slices to make each target with ${MODE_CONFIG[state.mode].symbol}.`);
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

resetButton.addEventListener("click", resetGame);
resetGame(); 