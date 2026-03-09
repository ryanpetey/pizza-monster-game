const PROGRESS_STORAGE_KEY = "pizza-monster-unlocks-v1";

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
    createPair: ({ range }) => [randomInt(range[0], range[1]), randomInt(range[0], range[1])],
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
      return [low + diff, low];
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
    createPair: ({ factorRange }) => [randomInt(factorRange[0], factorRange[1]), randomInt(factorRange[0], factorRange[1])],
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
      return [divisor * quotient, divisor];
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

const OPERATION_NAMES = {
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiplication",
  division: "Division",
};

const state = {
  screen: "menu",
  mode: "addition",
  level: 1,
  unlockedLevels: null,
  gamePlan: [],
  sliceValues: [],
  selected: [],
  usedNumbers: new Set(),
  currentTargetIndex: 0,
  levelCompleted: false,
};

const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");
const modeInputs = document.querySelectorAll('input[name="mode"]');
const levelInputs = document.querySelectorAll('input[name="level"]');
const startGameButton = document.getElementById("startGameButton");
const backToMenuButton = document.getElementById("backToMenuButton");
const resetButton = document.getElementById("resetButton");
const nextChallengeButton = document.getElementById("nextChallengeButton");
const modeInstruction = document.getElementById("modeInstruction");
const targetList = document.getElementById("targetList");
const currentTarget = document.getElementById("currentTarget");
const feedback = document.getElementById("feedback");
const slices = document.getElementById("sliceContainer");
const monsterFace = document.getElementById("monsterFace");

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

function createDefaultUnlockState() {
  return { addition: 1, subtraction: 1, multiplication: 1, division: 1 };
}

function sanitizeUnlockState(raw) {
  const base = createDefaultUnlockState();
  if (!raw || typeof raw !== "object") return base;

  Object.keys(base).forEach((mode) => {
    const value = Number(raw[mode]);
    if (Number.isInteger(value) && value >= 1 && value <= 5) {
      base[mode] = value;
    }
  });
  return base;
}

function loadUnlockState() {
  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return stored ? sanitizeUnlockState(JSON.parse(stored)) : createDefaultUnlockState();
  } catch (_err) {
    return createDefaultUnlockState();
  }
}

function saveUnlockState() {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state.unlockedLevels));
  } catch (_err) {
    // ignore persistence errors
  }
}

function isLevelUnlocked(mode, level) {
  return level <= state.unlockedLevels[mode];
}

function ensureSelectedLevelUnlocked() {
  if (!isLevelUnlocked(state.mode, state.level)) {
    state.level = state.unlockedLevels[state.mode];
  }
}

function getRuleSet() {
  const operation = OPERATION_RULES[state.mode];
  return { operation, levelRules: operation.levels[state.level] };
}

function syncModeInputs() {
  modeInputs.forEach((input) => {
    input.checked = input.value === state.mode;
  });
}

function syncLevelInputs() {
  levelInputs.forEach((input) => {
    const level = Number(input.value);
    input.disabled = !isLevelUnlocked(state.mode, level);
    input.checked = level === state.level;
  });
}

function setScreen(screen) {
  state.screen = screen;
  menuScreen.classList.toggle("hidden", screen !== "menu");
  gameScreen.classList.toggle("hidden", screen !== "game");
}

function updateModeInstruction() {
  const { operation } = getRuleSet();
  modeInstruction.textContent = `Pick two slices that make the current target with ${operation.symbol} at Level ${state.level}!`;
}

function setFeedback(message, type = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`.trim();
}

function hideNextChallenge() {
  nextChallengeButton.classList.add("hidden");
}

function showNextChallenge(level) {
  nextChallengeButton.textContent = `Next Challenge: Level ${level}`;
  nextChallengeButton.classList.remove("hidden");
}

function makeStep() {
  const { operation, levelRules } = getRuleSet();
  const pair = operation.createPair(levelRules);
  return { target: operation.targetFromPair(pair), pair, op: operation.symbol };
}

function generateRound() {
  const { levelRules } = getRuleSet();
  const gamePlan = [];

  for (let i = 0; i < levelRules.roundLength; i += 1) {
    gamePlan.push(makeStep());
  }

  return { gamePlan, sliceValues: shuffle(gamePlan.flatMap((step) => step.pair)) };
}

function updateTargets() {
  targetList.innerHTML = "";
  state.gamePlan.forEach((step, idx) => {
    const li = document.createElement("li");
    li.textContent = step.target;
    if (idx < state.currentTargetIndex) li.classList.add("eaten");
    if (idx === state.currentTargetIndex) li.classList.add("active");
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
  if (state.usedNumbers.has(idx)) btn.disabled = true;
  btn.addEventListener("click", () => handleSliceSelection(idx, value));
  return btn;
}

function renderSlices() {
  slices.innerHTML = "";
  state.sliceValues.forEach((value, idx) => {
    const btn = createSliceButton(value, idx);
    if (state.selected.some((pick) => pick.id === idx)) btn.classList.add("selected");
    slices.appendChild(btn);
  });
}

function clearSelection() {
  state.selected = [];
  renderSlices();
}

function completeCurrentLevel() {
  state.levelCompleted = true;
  const nextLevel = state.level + 1;
  const previouslyUnlocked = state.unlockedLevels[state.mode];

  if (nextLevel <= 5 && nextLevel > previouslyUnlocked) {
    state.unlockedLevels[state.mode] = nextLevel;
    saveUnlockState();
  }

  syncLevelInputs();

  if (nextLevel <= 5) {
    showNextChallenge(nextLevel);
    setFeedback(`Great job! ${OPERATION_NAMES[state.mode]} Level ${state.level} complete. Next level unlocked!`, "good");
  } else {
    hideNextChallenge();
    setFeedback(`Amazing! You finished all 5 ${OPERATION_NAMES[state.mode]} levels!`, "good");
  }
}

function checkSelection() {
  if (state.selected.length < 2) return;
  const [a, b] = state.selected;
  const active = state.gamePlan[state.currentTargetIndex];
  if (!active) return;

  const possibleResults = getRuleSet().operation.matchResults(a.value, b.value);
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
    completeCurrentLevel();
  }
}

function handleSliceSelection(id, value) {
  if (state.levelCompleted || state.usedNumbers.has(id)) return;

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

function startRound() {
  ensureSelectedLevelUnlocked();
  const newRound = generateRound();
  state.gamePlan = newRound.gamePlan;
  state.sliceValues = newRound.sliceValues;
  state.selected = [];
  state.currentTargetIndex = 0;
  state.usedNumbers = new Set();
  state.levelCompleted = false;
  monsterFace.textContent = "😋";

  hideNextChallenge();
  syncModeInputs();
  syncLevelInputs();
  updateModeInstruction();
  setFeedback(`Select two slices to solve each target with ${getRuleSet().operation.symbol} (Level ${state.level}).`);
  updateTargets();
  renderSlices();
}

function startGame() {
  startRound();
  setScreen("game");
}

function backToMenu() {
  syncModeInputs();
  syncLevelInputs();
  setScreen("menu");
}

modeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    state.mode = input.value;
    ensureSelectedLevelUnlocked();
    syncLevelInputs();
  });
});

levelInputs.forEach((input) => {
  input.addEventListener("change", () => {
    const chosen = Number(input.value);
    if (!isLevelUnlocked(state.mode, chosen)) {
      syncLevelInputs();
      return;
    }
    state.level = chosen;
  });
});

startGameButton.addEventListener("click", startGame);
backToMenuButton.addEventListener("click", backToMenu);
resetButton.addEventListener("click", startRound);
nextChallengeButton.addEventListener("click", () => {
  const next = state.level + 1;
  if (next <= 5 && isLevelUnlocked(state.mode, next)) {
    state.level = next;
    startRound();
  }
});

function initGame() {
  state.unlockedLevels = loadUnlockState();
  ensureSelectedLevelUnlocked();
  syncModeInputs();
  syncLevelInputs();
  setScreen("menu");
}

initGame();