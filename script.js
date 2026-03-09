const gamePlan = [
  { target: 12, pair: [3, 4], op: "×" },
  { target: 11, pair: [5, 6], op: "+" },
  { target: 9, pair: [7, 2], op: "+" },
  { target: 8, pair: [1, 8], op: "×" },
];

const state = {
  selected: [],
  currentTargetIndex: 0,
  usedNumbers: new Set(),
};

const targetList = document.getElementById("targetList");
const currentTarget = document.getElementById("currentTarget");
const feedback = document.getElementById("feedback");
const slices = document.getElementById("sliceContainer");
const monsterFace = document.getElementById("monsterFace");
const resetButton = document.getElementById("resetButton");

function allNumbers() {
  return gamePlan.flatMap((step) => step.pair);
}

function setFeedback(message, type = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`.trim();
}

function updateTargets() {
  targetList.innerHTML = "";

  gamePlan.forEach((step, idx) => {
    const li = document.createElement("li");
    li.textContent = step.target;

    if (idx < state.currentTargetIndex) {
      li.classList.add("eaten");
    } else if (idx === state.currentTargetIndex) {
      li.classList.add("active");
    }

    targetList.appendChild(li);
  });

  const active = gamePlan[state.currentTargetIndex];
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
  allNumbers().forEach((n, idx) => {
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
  const active = gamePlan[state.currentTargetIndex];

  if (!active) {
    return;
  }

  const addition = a.value + b.value;
  const multiplication = a.value * b.value;
  const isMatch = addition === active.target || multiplication === active.target;

  if (isMatch) {
    state.usedNumbers.add(a.id);
    state.usedNumbers.add(b.id);
    state.currentTargetIndex += 1;
    monsterFace.textContent = "😋";
    setFeedback(`Yum! ${a.value} + ${b.value} or ${a.value} × ${b.value} made ${active.target}!`, "good");
  } else {
    monsterFace.textContent = "😵";
    setFeedback(`Oops! ${a.value} and ${b.value} do not make ${active.target}. Try again!`, "bad");
  }

  clearSelection();
  updateTargets();

  if (state.currentTargetIndex >= gamePlan.length) {
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
  state.selected = [];
  state.currentTargetIndex = 0;
  state.usedNumbers = new Set();
  monsterFace.textContent = "😋";
  setFeedback("Select two number slices to start.");
  updateTargets();
  renderSlices();
}

resetButton.addEventListener("click", resetGame);
resetGame(); 