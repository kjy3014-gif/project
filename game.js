const algorithms = {
  selection: { name: "선택 정렬", metric: "교환", description: "남은 구간에서 가장 작은 값을 골라 앞에 놓아요." },
  bubble: { name: "버블 정렬", metric: "교환", description: "이웃한 두 값을 비교하고, 큰 값을 오른쪽으로 보내요." },
  insertion: { name: "삽입 정렬", metric: "이동", description: "정렬된 구간에 다음 숫자가 들어갈 자리를 찾아요." },
  quick: { name: "퀵 정렬", metric: "교환", description: "Pivot을 기준으로 나눈 뒤, Pivot의 자리를 찾아요." }
};

const ui = {
  round: document.querySelector("#round-number"), score: document.querySelector("#score"), combo: document.querySelector("#combo"), lives: document.querySelector("#lives"),
  progress: document.querySelector("#round-progress-fill"), instruction: document.querySelector("#mission-instruction"), timer: document.querySelector("#timer"), timerFill: document.querySelector("#timer-fill"), timerTrack: document.querySelector(".timer-track"),
  selectionBoard: document.querySelector("#selection-board"), lane: document.querySelector("#sorted-lane"), sortedCount: document.querySelector("#sorted-count"), pool: document.querySelector("#number-pool"),
  operationBoard: document.querySelector("#operation-board"), operationLabel: document.querySelector("#operation-label"), operationCounter: document.querySelector("#operation-counter"), operationArray: document.querySelector("#operation-array"), operationQuestion: document.querySelector("#operation-question"), operationChoices: document.querySelector("#operation-choices"),
  message: document.querySelector("#game-message"), start: document.querySelector("#start-button"), restart: document.querySelector("#restart-button"), next: document.querySelector("#next-button"),
  difficulty: [...document.querySelectorAll(".difficulty-option")], algorithmOptions: [...document.querySelectorAll(".algorithm-option")], algorithmDescription: document.querySelector("#algorithm-description"),
  result: document.querySelector("#algorithm-result"), resultHeading: document.querySelector("#result-heading"), resultComparisons: document.querySelector("#result-comparisons"), resultMovements: document.querySelector("#result-movements"), resultMovementLabel: document.querySelector("#result-movement-label")
};

let algorithm = "selection";
let baseCount = 5;
let baseTime = 55;
let hasTimeLimit = false;
let roundNumber = 0;
let roundCount = 5;
let score = 0;
let combo = 0;
let lives = 3;
let remaining = 0;
let duration = 0;
let timerId = null;
let startingArray = [];
let currentArray = [];
let targetArray = [];
let selectionPool = [];
let answer = [];
let running = false;
let finished = false;
let roundStats = { comparisons: 0, movements: 0 };
let bubbleActions = [];
let bubbleStep = 0;
let insertionIndex = 1;
let insertionKey = null;
let insertionCursor = -1;
let selectionStart = 0;
let selectionCursor = 1;
let selectionMin = 0;
let selectionFixed = new Set();
let insertionHeld = false;
let quickRanges = [];
let quickPartitionState = null;
let quickPhase = "left";
let quickLeft = 0;
let quickRight = 0;
let quickPartitions = 0;
let quickFixed = new Set();

function stopTimer() {
  if (timerId !== null) window.clearInterval(timerId);
  timerId = null;
}

function updateTimer() {
  if (!hasTimeLimit) {
    ui.timer.textContent = "제한 없음";
    ui.timer.classList.add("is-unlimited");
    ui.timer.classList.remove("is-low");
    ui.timerFill.style.width = "100%";
    ui.timerFill.classList.remove("is-low");
    return;
  }
  ui.timer.classList.remove("is-unlimited");
  ui.timer.textContent = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  ui.timerFill.style.width = `${duration ? remaining / duration * 100 : 0}%`;
  const low = remaining <= 10;
  ui.timer.classList.toggle("is-low", low);
  ui.timerFill.classList.toggle("is-low", low);
}

function updateProgress() {
  const done = roundStats.comparisons + roundStats.movements;
  const expected = roundNumber ? calculateStats(startingArray) : { comparisons: 0, movements: 0 };
  const total = expected.comparisons + expected.movements;
  ui.progress.style.width = `${total ? Math.min(100, done / total * 100) : 0}%`;
  ui.sortedCount.textContent = `${done} / ${total}`;
}

function updateScoreboard() {
  ui.score.textContent = String(score);
  ui.combo.textContent = String(combo);
  ui.lives.textContent = String(lives);
  updateProgress();
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function makeNumbers(count) {
  const values = new Set();
  while (values.size < count) values.add(Math.floor(Math.random() * 90) + 10);
  return [...values];
}

function selectionStats(values) {
  const array = [...values];
  let comparisons = 0;
  let movements = 0;
  for (let start = 0; start < array.length - 1; start += 1) {
    let min = start;
    for (let i = start + 1; i < array.length; i += 1) {
      comparisons += 1;
      if (array[i] < array[min]) min = i;
    }
    if (min !== start) {
      [array[start], array[min]] = [array[min], array[start]];
      movements += 1;
    }
  }
  return { comparisons, movements };
}

function makeBubbleActions(values) {
  const array = [...values];
  const actions = [];
  for (let end = array.length - 1; end > 0; end -= 1) {
    let changed = false;
    for (let left = 0; left < end; left += 1) {
      const swap = array[left] > array[left + 1];
      actions.push({ left, right: left + 1, swap });
      if (swap) {
        [array[left], array[left + 1]] = [array[left + 1], array[left]];
        changed = true;
      }
    }
    if (!changed) break;
  }
  return actions;
}

function bubbleStats(values) {
  const array = [...values];
  let comparisons = 0;
  let movements = 0;
  for (let end = array.length - 1; end > 0; end -= 1) {
    let changed = false;
    for (let left = 0; left < end; left += 1) {
      comparisons += 1;
      if (array[left] > array[left + 1]) {
        [array[left], array[left + 1]] = [array[left + 1], array[left]];
        movements += 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { comparisons, movements };
}

function insertionStats(values) {
  const array = [...values];
  let comparisons = 0;
  let movements = 0;
  for (let i = 1; i < array.length; i += 1) {
    const key = array[i];
    let j = i - 1;
    while (j >= 0) {
      comparisons += 1;
      if (array[j] <= key) break;
      array[j + 1] = array[j];
      movements += 1;
      j -= 1;
    }
    array[j + 1] = key;
  }
  return { comparisons, movements };
}

function quickPartition(array, low, high) {
  const next = [...array];
  const pivot = next[low];
  let left = low + 1;
  let right = high;
  let comparisons = 0;
  let movements = 0;
  while (true) {
    while (left <= high) {
      comparisons += 1;
      if (!(next[left] <= pivot)) break;
      left += 1;
    }
    while (right > low) {
      comparisons += 1;
      if (!(next[right] > pivot)) break;
      right -= 1;
    }
    if (left >= right) break;
    [next[left], next[right]] = [next[right], next[left]];
    movements += 1;
    left += 1;
    right -= 1;
  }
  if (right !== low) {
    [next[low], next[right]] = [next[right], next[low]];
    movements += 1;
  }
  return { array: next, pivot, pivotIndex: right, low, high, left, right, comparisons, movements };
}

function quickStats(values) {
  const array = [...values];
  let comparisons = 0;
  let movements = 0;
  function sort(low, high) {
    if (low >= high) return;
    const part = quickPartition(array, low, high);
    array.splice(0, array.length, ...part.array);
    comparisons += part.comparisons;
    movements += part.movements;
    sort(low, part.pivotIndex - 1);
    sort(part.pivotIndex + 1, high);
  }
  sort(0, array.length - 1);
  return { comparisons, movements };
}

function calculateStats(values) {
  if (algorithm === "bubble") return bubbleStats(values);
  if (algorithm === "selection") return selectionStats(values);
  if (algorithm === "insertion") return insertionStats(values);
  return quickStats(values);
}

function renderSelectionPool() {
  ui.pool.replaceChildren();
  selectionPool.forEach(tile => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "number-tile";
    button.textContent = String(tile.value);
    button.setAttribute("aria-label", `${tile.value} 선택`);
    button.addEventListener("click", () => chooseMinimum(tile.id));
    ui.pool.append(button);
  });
}

function renderSortedLane() {
  ui.lane.replaceChildren();
  if (!answer.length) {
    const hint = document.createElement("p");
    hint.className = "lane-placeholder";
    hint.textContent = "정렬한 숫자가 여기에 쌓여요";
    ui.lane.append(hint);
    return;
  }
  answer.forEach((value, index) => {
    const tile = document.createElement("span");
    tile.className = "sorted-tile";
    tile.style.animationDelay = `${index * 35}ms`;
    tile.textContent = String(value);
    ui.lane.append(tile);
  });
}

function drawOperationArray(values, markers = {}) {
  ui.operationArray.replaceChildren();
  if (markers.keyValue !== undefined) {
    const held = document.createElement("span");
    held.className = "insertion-key";
    held.textContent = `삽입값 ${markers.keyValue}`;
    ui.operationArray.append(held);
  }
  values.forEach((value, index) => {
    const tile = document.createElement("span");
    tile.className = "array-token";
    if (value === null) tile.classList.add("is-hole");
    if (markers.left === index) tile.classList.add("is-left");
    if (markers.right === index) tile.classList.add("is-right");
    if (markers.min === index) tile.classList.add("is-min");
    if (markers.check === index) tile.classList.add("is-check");
    if (markers.pivot === index) tile.classList.add("is-pivot");
    if (markers.low !== undefined && (index < markers.low || index > markers.high)) tile.classList.add("is-outside");
    if (markers.fixed?.has(index)) tile.classList.add("is-fixed");
    tile.textContent = value === null ? "빈 칸" : String(value);
    const labels = [];
    if (markers.pivot === index) labels.push("Pivot");
    if (markers.left === index) labels.push("L");
    if (markers.right === index) labels.push("R");
    if (markers.min === index) labels.push("최솟값 후보");
    if (markers.check === index) labels.push("비교값");
    if (markers.fixed?.has(index)) labels.push("확정");
    if (labels.length) {
      const badge = document.createElement("small");
      badge.textContent = labels.join(" · ");
      tile.append(badge);
    }
    ui.operationArray.append(tile);
  });
  ui.operationArray.setAttribute("aria-label", `현재 숫자 ${values.join(", ")}`);
}

function renderBubbleAction() {
  const action = bubbleActions[bubbleStep];
  if (!action) { finishRound(); return; }
  ui.operationLabel.textContent = "이웃한 두 수 비교";
  ui.operationCounter.textContent = `${bubbleStep + 1} / ${bubbleActions.length}`;
  drawOperationArray(currentArray, { left: action.left, right: action.right });
  const left = currentArray[action.left];
  const right = currentArray[action.right];
  ui.operationQuestion.textContent = `${left}과 ${right}, 자리를 바꿔야 할까요?`;
  ui.operationChoices.replaceChildren();
  addChoice("자리 바꾸기", () => chooseBubble(true));
  addChoice("그대로 두기", () => chooseBubble(false));
  ui.instruction.textContent = "큰 수가 오른쪽으로 가도록 이웃한 수를 살펴봐요.";
  updateProgress();
}

function insertionDestination(array, index) {
  const key = array[index];
  let position = 0;
  while (position < index && array[position] < key) position += 1;
  let comparisons = 0;
  let movements = 0;
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    comparisons += 1;
    if (array[cursor] <= key) break;
    movements += 1;
  }
  return { key, position, comparisons, movements };
}

function renderInsertionAction() {
  if (insertionIndex >= roundCount) { finishRound(); return; }
  const { key, position } = insertionDestination(currentArray, insertionIndex);
  ui.operationLabel.textContent = "삽입할 자리 찾기";
  ui.operationCounter.textContent = `${insertionIndex} / ${roundCount - 1}`;
  ui.operationArray.replaceChildren();
  const keyBadge = document.createElement("span");
  keyBadge.className = "insertion-key";
  keyBadge.textContent = `삽입값 ${key}`;
  ui.operationArray.append(keyBadge);
  const strip = document.createElement("div");
  strip.className = "insertion-strip";
  const prefix = currentArray.slice(0, insertionIndex);
  for (let slot = 0; slot <= prefix.length; slot += 1) {
    const gap = document.createElement("button");
    gap.type = "button";
    gap.className = "insertion-gap";
    gap.textContent = "+";
    gap.setAttribute("aria-label", `${key}을(를) 정렬된 구간의 ${slot + 1}번째 자리에 삽입`);
    gap.addEventListener("click", () => chooseInsertion(slot, position));
    strip.append(gap);
    if (slot < prefix.length) {
      const token = document.createElement("span");
      token.className = "array-token";
      token.textContent = String(prefix[slot]);
      strip.append(token);
    }
  }
  if (insertionIndex + 1 < roundCount) {
    const rest = document.createElement("span");
    rest.className = "insertion-rest";
    rest.textContent = `다음: ${currentArray.slice(insertionIndex + 1).join(" · ")}`;
    strip.append(rest);
  }
  ui.operationArray.append(strip);
  ui.operationArray.setAttribute("aria-label", `정렬된 구간 ${prefix.join(", ")}, 삽입값 ${key}`);
  ui.operationQuestion.textContent = `${key}은(는) 정렬된 구간의 어느 위치에 들어갈까요?`;
  ui.operationChoices.replaceChildren();
  ui.instruction.textContent = "이미 정렬된 숫자들 사이에서 알맞은 자리를 찾아요.";
  updateProgress();
}

function renderQuickAction() {
  while (quickRanges.length) {
    const [low, high] = quickRanges.shift();
    if (low < high) {
      quickPartitionState = quickPartition(currentArray, low, high);
      ui.operationLabel.textContent = "Pivot 자리 예측";
      ui.operationCounter.textContent = `구간 ${low + 1}–${high + 1}`;
      drawOperationArray(currentArray, { low, high, pivot: low, left: low + 1, right: high, fixed: quickFixed });
      ui.operationQuestion.textContent = `Pivot ${quickPartitionState.pivot}은(는) 분할이 끝나면 몇 번째 자리에 놓일까요?`;
      ui.operationChoices.replaceChildren();
      for (let index = low; index <= high; index += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-button is-position";
        button.textContent = `${index + 1}번`;
        button.setAttribute("aria-label", `Pivot을 ${index + 1}번째 자리에 놓기`);
        button.addEventListener("click", () => chooseQuickPivot(index));
        ui.operationChoices.append(button);
      }
      ui.instruction.textContent = "왼쪽은 Pivot 이하, 오른쪽은 Pivot보다 큰 수가 오도록 생각해요.";
      updateProgress();
      return;
    }
    if (low === high) quickFixed.add(low);
  }
  finishRound();
}

function renderOperation() {
  ui.selectionBoard.hidden = algorithm !== "selection";
  ui.operationBoard.hidden = algorithm === "selection";
  if (algorithm === "bubble") renderBubbleAction();
  if (algorithm === "insertion") renderInsertionAction();
  if (algorithm === "quick") renderQuickAction();
}

function addChoice(label, callback) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "choice-button";
  button.textContent = label;
  button.addEventListener("click", callback);
  ui.operationChoices.append(button);
}

function awardCorrect() {
  combo += 1;
  score += 10 + Math.min((combo - 1) * 2, 10);
  ui.message.className = "game-message is-good";
  updateScoreboard();
}

function markWrong(button, text) {
  lives -= 1;
  combo = 0;
  updateScoreboard();
  if (button) {
    button.classList.remove("is-wrong");
    void button.offsetWidth;
    button.classList.add("is-wrong");
  }
  ui.message.className = "game-message is-wrong";
  ui.message.textContent = text;
  if (lives <= 0) endGame("기회를 모두 사용했어요.");
}

function chooseMinimum(id) {
  if (!running) return;
  const tileIndex = selectionPool.findIndex(tile => tile.id === id);
  if (tileIndex < 0) return;
  const tile = selectionPool[tileIndex];
  const expected = targetArray[answer.length];
  if (tile.value !== expected) {
    markWrong(ui.pool.querySelector(`[aria-label="${tile.value} 선택"]`), `아쉬워요. 지금 찾는 수는 ${tile.value}보다 작아요.`);
    return;
  }
  selectionPool.splice(tileIndex, 1);
  answer.push(tile.value);
  awardCorrect();
  renderSelectionPool();
  renderSortedLane();
  if (answer.length === roundCount) finishRound();
  else ui.message.textContent = `${tile.value} 정답! 남은 숫자 중 가장 작은 수를 찾아요.`;
}

function chooseBubble(chooseSwap) {
  if (!running) return;
  const action = bubbleActions[bubbleStep];
  if (!action) return;
  if (chooseSwap !== action.swap) {
    const left = currentArray[action.left];
    const right = currentArray[action.right];
    markWrong(null, action.swap ? `${left}이(가) 더 커요. 큰 수를 오른쪽으로 보내야 해요.` : `${left}이(가) 이미 더 작아요. 이번에는 그대로 두세요.`);
    return;
  }
  roundStats.comparisons += 1;
  if (action.swap) {
    [currentArray[action.left], currentArray[action.right]] = [currentArray[action.right], currentArray[action.left]];
    roundStats.movements += 1;
  }
  bubbleStep += 1;
  awardCorrect();
  if (bubbleStep >= bubbleActions.length) finishRound();
  else renderBubbleAction();
}

function chooseInsertion(slot, correctSlot) {
  if (!running) return;
  if (slot !== correctSlot) {
    markWrong(null, "삽입값보다 작은 수는 앞에, 큰 수는 뒤에 오도록 자리를 찾아보세요.");
    return;
  }
  const { key, comparisons, movements } = insertionDestination(currentArray, insertionIndex);
  const prefix = currentArray.slice(0, insertionIndex);
  prefix.splice(slot, 0, key);
  currentArray = [...prefix, ...currentArray.slice(insertionIndex + 1)];
  roundStats.comparisons += comparisons;
  roundStats.movements += movements;
  insertionIndex += 1;
  awardCorrect();
  if (insertionIndex >= roundCount) finishRound();
  else renderInsertionAction();
}

function chooseQuickPivot(index) {
  if (!running || !quickPartitionState) return;
  const part = quickPartitionState;
  if (index !== part.pivotIndex) {
    markWrong(null, `Pivot ${part.pivot}은(는) ${part.pivotIndex + 1}번째 자리에 놓여요. 포인터가 교차하는 위치를 다시 살펴보세요.`);
    return;
  }
  currentArray = part.array;
  quickFixed.add(part.pivotIndex);
  roundStats.comparisons += part.comparisons;
  roundStats.movements += part.movements;
  quickPartitions += 1;
  quickRanges.unshift([part.pivotIndex + 1, part.high]);
  quickRanges.unshift([part.low, part.pivotIndex - 1]);
  quickPartitionState = null;
  awardCorrect();
  renderQuickAction();
}

function setAlgorithm(nextAlgorithm) {
  if (running) return;
  algorithm = nextAlgorithm;
  ui.algorithmOptions.forEach(button => {
    const selected = button.dataset.algorithm === algorithm;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  ui.algorithmDescription.textContent = algorithms[algorithm].description;
  if (roundNumber > 0) resetToReady();
  else {
    ui.selectionBoard.hidden = algorithm !== "selection";
    ui.operationBoard.hidden = algorithm === "selection";
    ui.instruction.textContent = "난이도를 고르고 게임을 시작하세요!";
  }
}

function selectDifficulty(button) {
  if (running) return;
  baseCount = Number(button.dataset.count);
  baseTime = Number(button.dataset.time);
  ui.difficulty.forEach(option => {
    const selected = option === button;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
  if (roundNumber > 0) resetToReady();
}

function resetToReady() {
  stopTimer();
  running = false;
  finished = false;
  roundNumber = 0;
  score = 0;
  combo = 0;
  lives = 3;
  startingArray = [];
  currentArray = [];
  targetArray = [];
  selectionPool = [];
  answer = [];
  roundStats = { comparisons: 0, movements: 0 };
  ui.round.textContent = "준비";
  ui.instruction.textContent = "난이도를 고르고 게임을 시작하세요!";
  ui.message.className = "game-message";
  ui.message.textContent = "알고리즘을 고르고 숫자 줄서기 미션에 도전해요!";
  ui.timer.textContent = hasTimeLimit ? "--:--" : "제한 없음";
  ui.timer.classList.toggle("is-unlimited", !hasTimeLimit);
  ui.timerTrack.hidden = !hasTimeLimit;
  ui.timer.classList.remove("is-low");
  ui.timerFill.style.width = "100%";
  ui.timerFill.classList.remove("is-low");
  ui.progress.style.width = "0%";
  ui.sortedCount.textContent = "0 / 0";
  ui.pool.replaceChildren();
  ui.lane.replaceChildren();
  ui.operationArray.replaceChildren();
  ui.operationChoices.replaceChildren();
  ui.result.hidden = true;
  ui.start.hidden = false;
  ui.restart.hidden = true;
  ui.next.hidden = true;
  ui.difficulty.forEach(button => { button.disabled = false; });
  ui.algorithmOptions.forEach(button => { button.disabled = false; });
  ui.selectionBoard.hidden = algorithm !== "selection";
  ui.operationBoard.hidden = algorithm === "selection";
  updateScoreboard();
}

function startJourney() {
  score = 0;
  combo = 0;
  roundNumber = 1;
  startRound();
}

function startRound() {
  stopTimer();
  score = 0;
  roundCount = Math.min(15, baseCount + Math.max(0, roundNumber - 1));
  lives = 3;
  combo = 0;
  running = true;
  finished = false;
  startingArray = makeNumbers(roundCount);
  currentArray = [...startingArray];
  targetArray = [...startingArray].sort((a, b) => a - b);
  answer = [];
  roundStats = { comparisons: 0, movements: 0 };
  bubbleActions = [];
  bubbleStep = 0;
  insertionIndex = 1;
  insertionKey = null;
  insertionCursor = -1;
  insertionHeld = false;
  selectionStart = 0;
  selectionCursor = 1;
  selectionMin = 0;
  selectionFixed = new Set();
  quickRanges = [];
  quickPartitionState = null;
  quickPhase = "left";
  quickLeft = 0;
  quickRight = 0;
  quickPartitions = 0;
  quickFixed = new Set();

  ui.round.textContent = String(roundNumber).padStart(2, "0");
  ui.message.className = "game-message";
  ui.result.hidden = true;
  ui.start.hidden = true;
  ui.restart.hidden = false;
  ui.restart.textContent = "이번 판 다시하기";
  ui.next.hidden = true;
  ui.difficulty.forEach(button => { button.disabled = true; });
  ui.algorithmOptions.forEach(button => { button.disabled = true; });
  ui.selectionBoard.hidden = true;
  ui.operationBoard.hidden = false;

  if (algorithm === "selection") {
    ui.instruction.textContent = "현재 최솟값 후보와 새 값을 비교해요.";
    renderSelectionAction();
  } else if (algorithm === "bubble") {
    bubbleActions = makeBubbleActions(startingArray);
    ui.instruction.textContent = "이웃한 두 수를 비교해 맞는 행동을 골라요.";
    renderBubbleAction();
  } else if (algorithm === "insertion") {
    ui.instruction.textContent = "앞의 숫자와 삽입값을 비교해 이동 여부를 정해요.";
    prepareInsertionStep();
  } else {
    quickRanges = [[0, roundCount - 1]];
    ui.instruction.textContent = "좌우 포인터가 확인한 값의 이동 여부를 정해요.";
    renderQuickAction();
  }
  const expected = calculateStats(startingArray);
  const steps = expected.comparisons + expected.movements;
  const secondsPerStep = algorithm === "bubble" || algorithm === "quick" ? .75 : 1.1;
  duration = hasTimeLimit ? Math.max(Math.max(28, baseTime - Math.max(0, roundNumber - 1) * 2), Math.ceil(steps * secondsPerStep + 12)) : 0;
  remaining = hasTimeLimit ? duration : 0;
  ui.timerTrack.hidden = !hasTimeLimit;
  updateScoreboard();
  updateTimer();
  if (hasTimeLimit) {
    timerId = window.setInterval(() => {
      remaining -= 1;
      updateTimer();
      if (remaining <= 0) endGame("시간이 다 됐어요. 다음 도전에서 다시 줄을 세워봐요!");
    }, 1000);
  }
}

function endGame(message) {
  stopTimer();
  running = false;
  finished = true;
  ui.instruction.textContent = "미션 종료";
  ui.message.className = "game-message is-wrong";
  ui.message.textContent = `${message} 현재 점수 ${score}점.`;
  ui.restart.hidden = false;
  ui.restart.textContent = "다시 도전하기";
  ui.next.hidden = true;
  ui.difficulty.forEach(button => { button.disabled = false; });
  ui.algorithmOptions.forEach(button => { button.disabled = false; });
}

function finishRound() {
  stopTimer();
  running = false;
  finished = true;
  const stats = calculateStats(startingArray);
  const bonus = roundCount * 5 + remaining * 2;
  score += bonus;
  ui.score.textContent = String(score);
  ui.instruction.textContent = "완벽해요! 숫자들이 줄을 섰어요.";
  ui.message.className = "game-message is-win";
  ui.message.textContent = `라운드 통과! 정리 보너스 +${bonus}점 · 다음 라운드에서 숫자가 하나 더 늘어요.`;
  ui.restart.hidden = false;
  ui.restart.textContent = "처음부터 다시";
  ui.next.hidden = false;
  ui.result.hidden = false;
  ui.resultHeading.textContent = `이번 배열 ${algorithms[algorithm].name} 통계`;
  ui.resultComparisons.textContent = String(stats.comparisons);
  ui.resultMovements.textContent = String(stats.movements);
  ui.resultMovementLabel.textContent = algorithms[algorithm].metric;
  ui.operationChoices.replaceChildren();
  ui.operationCounter.textContent = "완료";
  ui.operationQuestion.textContent = "모든 숫자가 오름차순으로 정렬됐어요!";
  ui.difficulty.forEach(button => { button.disabled = false; });
  ui.algorithmOptions.forEach(button => { button.disabled = false; });
  if (algorithm === "selection") {
    drawOperationArray(currentArray, { fixed: selectionFixed });
  } else drawOperationArray(currentArray, algorithm === "quick" ? { fixed: quickFixed } : {});
}

function renderSelectionPool() {
  ui.pool.replaceChildren();
  selectionPool.forEach(tile => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "number-tile";
    button.textContent = String(tile.value);
    button.setAttribute("aria-label", `${tile.value} 선택`);
    button.addEventListener("click", () => chooseMinimum(tile.id));
    ui.pool.append(button);
  });
}

function renderSortedLane() {
  ui.lane.replaceChildren();
  if (!answer.length) {
    const hint = document.createElement("p");
    hint.className = "lane-placeholder";
    hint.textContent = "정렬한 숫자가 여기에 쌓여요";
    ui.lane.append(hint);
    return;
  }
  answer.forEach((value, index) => {
    const tile = document.createElement("span");
    tile.className = "sorted-tile";
    tile.style.animationDelay = `${index * 35}ms`;
    tile.textContent = String(value);
    ui.lane.append(tile);
  });
}

function drawOperationArray(values, markers = {}) {
  ui.operationArray.replaceChildren();
  if (markers.keyValue !== undefined) {
    const held = document.createElement("span");
    held.className = "insertion-key";
    held.textContent = `삽입값 ${markers.keyValue}`;
    ui.operationArray.append(held);
  }
  values.forEach((value, index) => {
    const tile = document.createElement("span");
    tile.className = "array-token";
    if (value === null) tile.classList.add("is-hole");
    if (markers.left === index) tile.classList.add("is-left");
    if (markers.right === index) tile.classList.add("is-right");
    if (markers.min === index) tile.classList.add("is-min");
    if (markers.check === index) tile.classList.add("is-check");
    if (markers.pivot === index) tile.classList.add("is-pivot");
    if (markers.low !== undefined && (index < markers.low || index > markers.high)) tile.classList.add("is-outside");
    if (markers.fixed?.has(index)) tile.classList.add("is-fixed");
    tile.textContent = value === null ? "빈 칸" : String(value);
    const labels = [];
    if (markers.pivot === index) labels.push("Pivot");
    if (markers.left === index) labels.push("L");
    if (markers.right === index) labels.push("R");
    if (markers.min === index) labels.push("최솟값 후보");
    if (markers.check === index) labels.push("비교값");
    if (markers.fixed?.has(index)) labels.push("확정");
    if (labels.length) {
      const badge = document.createElement("small");
      badge.textContent = labels.join(" · ");
      tile.append(badge);
    }
    ui.operationArray.append(tile);
  });
  ui.operationArray.setAttribute("aria-label", `현재 숫자 ${values.join(", ")}`);
}

function renderBubbleAction() {
  const action = bubbleActions[bubbleStep];
  if (!action) { finishRound(); return; }
  ui.operationLabel.textContent = "이웃한 두 수 비교";
  ui.operationCounter.textContent = `${bubbleStep + 1} / ${bubbleActions.length}`;
  drawOperationArray(currentArray, { left: action.left, right: action.right });
  const left = currentArray[action.left];
  const right = currentArray[action.right];
  ui.operationQuestion.textContent = `${left}과 ${right}, 자리를 바꿔야 할까요?`;
  ui.operationChoices.replaceChildren();
  addChoice("자리 바꾸기", () => chooseBubble(true));
  addChoice("그대로 두기", () => chooseBubble(false));
  updateProgress();
}

function renderInsertionAction() {
  if (!insertionHeld) { prepareInsertionStep(); return; }
  ui.operationLabel.textContent = "정렬된 구간에 삽입";
  ui.operationCounter.textContent = `${insertionIndex} / ${roundCount - 1}`;
  drawOperationArray(currentArray, { left: insertionCursor, keyValue: insertionKey });
  ui.operationChoices.replaceChildren();
  if (insertionCursor < 0) {
    ui.operationQuestion.textContent = `빈 칸에 삽입값 ${insertionKey}을(를) 놓아주세요.`;
    addChoice("빈 칸에 삽입", placeInsertionKey);
  } else {
    const compared = currentArray[insertionCursor];
    ui.operationQuestion.textContent = `${compared} > ${insertionKey} ? 오른쪽으로 이동할까요?`;
    addChoice("오른쪽으로 이동", () => chooseInsertion(true));
    addChoice("그대로 두기", () => chooseInsertion(false));
  }
  updateProgress();
}

function prepareInsertionStep() {
  if (insertionIndex >= roundCount) { finishRound(); return; }
  insertionKey = currentArray[insertionIndex];
  currentArray[insertionIndex] = null;
  insertionCursor = insertionIndex - 1;
  insertionHeld = true;
  renderInsertionAction();
}

function insertHeldKey(index) {
  currentArray[index] = insertionKey;
  insertionKey = null;
  insertionHeld = false;
  insertionIndex += 1;
  if (insertionIndex >= roundCount) finishRound();
  else prepareInsertionStep();
}

function chooseInsertion(moveRight) {
  if (!running || insertionCursor < 0) return;
  const compared = currentArray[insertionCursor];
  const shouldMove = compared > insertionKey;
  if (moveRight !== shouldMove) {
    markWrong(null, shouldMove ? `${compared}이(가) 더 크므로 오른쪽으로 밀어야 해요.` : `${compared}은(는) 삽입값보다 작아요. 그대로 두고 삽입하세요.`);
    return;
  }
  roundStats.comparisons += 1;
  if (shouldMove) {
    currentArray[insertionCursor + 1] = compared;
    currentArray[insertionCursor] = null;
    roundStats.movements += 1;
    insertionCursor -= 1;
    awardCorrect();
    renderInsertionAction();
    return;
  }
  currentArray[insertionCursor + 1] = insertionKey;
  insertionKey = null;
  insertionHeld = false;
  insertionIndex += 1;
  awardCorrect();
  if (insertionIndex >= roundCount) finishRound();
  else prepareInsertionStep();
}

function placeInsertionKey() {
  if (!running || insertionCursor >= 0 || insertionKey === null) return;
  insertHeldKey(0);
  awardCorrect();
}

function renderSelectionAction() {
  if (selectionStart >= roundCount - 1) { finishRound(); return; }
  ui.operationLabel.textContent = `정렬되지 않은 구간 ${selectionStart + 1}부터`;
  ui.operationCounter.textContent = `후보 비교 ${selectionCursor - selectionStart} / ${roundCount - selectionStart - 1}`;
  ui.operationChoices.replaceChildren();
  if (selectionCursor < roundCount) {
    drawOperationArray(currentArray, { min: selectionMin, check: selectionCursor, fixed: selectionFixed });
    const currentMin = currentArray[selectionMin];
    const candidate = currentArray[selectionCursor];
    ui.operationQuestion.textContent = `${candidate}과 최솟값 후보 ${currentMin}을(를) 비교해요. 새 값이 더 작을까요?`;
    addChoice("새 값으로 후보 바꾸기", () => chooseSelectionCandidate(true));
    addChoice("현재 후보 유지", () => chooseSelectionCandidate(false));
    updateProgress();
    return;
  }
  if (selectionMin !== selectionStart) {
    drawOperationArray(currentArray, { left: selectionStart, right: selectionMin, fixed: selectionFixed });
    ui.operationQuestion.textContent = `최솟값 ${currentArray[selectionMin]}을(를) 앞의 ${currentArray[selectionStart]}과(와) 교환할까요?`;
    addChoice("두 값 교환", chooseSelectionSwap);
    addChoice("그대로 두기", () => markWrong(null, "찾은 최솟값을 정렬 구간의 첫 칸으로 보내야 해요."));
    return;
  }
  selectionFixed.add(selectionStart);
  selectionStart += 1;
  selectionMin = selectionStart;
  selectionCursor = selectionStart + 1;
  renderSelectionAction();
}

function chooseSelectionCandidate(replaceCandidate) {
  if (!running || selectionCursor >= roundCount) return;
  const shouldReplace = currentArray[selectionCursor] < currentArray[selectionMin];
  if (replaceCandidate !== shouldReplace) {
    markWrong(null, shouldReplace ? "새 숫자가 더 작아요. 최솟값 후보를 바꿔야 해요." : "현재 후보가 더 작아요. 그대로 유지하세요.");
    return;
  }
  roundStats.comparisons += 1;
  if (shouldReplace) selectionMin = selectionCursor;
  selectionCursor += 1;
  awardCorrect();
  renderSelectionAction();
}

function chooseSelectionSwap() {
  if (!running || selectionMin === selectionStart) return;
  [currentArray[selectionStart], currentArray[selectionMin]] = [currentArray[selectionMin], currentArray[selectionStart]];
  roundStats.movements += 1;
  selectionFixed.add(selectionStart);
  selectionStart += 1;
  selectionMin = selectionStart;
  selectionCursor = selectionStart + 1;
  awardCorrect();
  renderSelectionAction();
}

function renderQuickAction() {
  while (true) {
    if (!quickPartitionState) {
      while (quickRanges.length) {
        const [low, high] = quickRanges.shift();
        if (low < high) {
          quickPartitionState = { low, high, pivot: currentArray[low] };
          quickLeft = low + 1;
          quickRight = high;
          quickPhase = "left";
          break;
        }
        if (low === high) quickFixed.add(low);
      }
      if (!quickPartitionState) { finishRound(); return; }
    }
    const { low, high, pivot } = quickPartitionState;
    if (quickPhase === "left" && quickLeft > high) quickPhase = "right";
    if (quickPhase === "right" && quickRight <= low) quickPhase = "cross";
    if (quickPhase === "cross") {
      if (quickLeft < quickRight) quickPhase = "swap";
      else if (quickRight > low) quickPhase = "pivot";
      else { completeQuickPartition(); continue; }
    }

    drawOperationArray(currentArray, { low, high, pivot: low, left: quickLeft, right: quickRight, fixed: quickFixed });
    ui.operationCounter.textContent = `구간 ${low + 1}–${high + 1} · L=${quickLeft + 1} · R=${quickRight + 1}`;
    ui.operationChoices.replaceChildren();
    if (quickPhase === "left") {
      const value = currentArray[quickLeft];
      ui.operationLabel.textContent = "왼쪽 포인터 비교";
      ui.operationQuestion.textContent = `${value} ≤ Pivot ${pivot}인가요? 왼쪽 포인터를 이동할까요?`;
      addChoice("L 오른쪽으로 이동", () => chooseQuickScan("left", true));
      addChoice("L 멈추기", () => chooseQuickScan("left", false));
    } else if (quickPhase === "right") {
      const value = currentArray[quickRight];
      ui.operationLabel.textContent = "오른쪽 포인터 비교";
      ui.operationQuestion.textContent = `${value} > Pivot ${pivot}인가요? 오른쪽 포인터를 이동할까요?`;
      addChoice("R 왼쪽으로 이동", () => chooseQuickScan("right", true));
      addChoice("R 멈추기", () => chooseQuickScan("right", false));
    } else if (quickPhase === "swap") {
      ui.operationLabel.textContent = "포인터가 찾은 값 교환";
      ui.operationQuestion.textContent = `왼쪽 ${currentArray[quickLeft]}과(와) 오른쪽 ${currentArray[quickRight]}의 자리를 바꿀까요?`;
      addChoice("두 값 교환", () => chooseQuickExchange(true));
      addChoice("그대로 두기", () => chooseQuickExchange(false));
    } else {
      ui.operationLabel.textContent = "Pivot을 확정 위치로 이동";
      ui.operationQuestion.textContent = `Pivot ${pivot}과(와) R 위치의 ${currentArray[quickRight]}을(를) 교환할까요?`;
      addChoice("Pivot 교환", () => chooseQuickPivot(true));
      addChoice("그대로 두기", () => chooseQuickPivot(false));
    }
    updateProgress();
    return;
  }
}

function chooseQuickScan(side, move) {
  if (!running || !quickPartitionState) return;
  const { pivot } = quickPartitionState;
  const index = side === "left" ? quickLeft : quickRight;
  const shouldMove = side === "left" ? currentArray[index] <= pivot : currentArray[index] > pivot;
  if (move !== shouldMove) {
    markWrong(null, side === "left"
      ? shouldMove ? `${currentArray[index]}은(는) Pivot 이하예요. L을 더 이동하세요.` : `${currentArray[index]}은(는) Pivot보다 커요. L을 멈추세요.`
      : shouldMove ? `${currentArray[index]}은(는) Pivot보다 커요. R을 왼쪽으로 이동하세요.` : `${currentArray[index]}은(는) Pivot 이하예요. R을 멈추세요.`);
    return;
  }
  roundStats.comparisons += 1;
  if (side === "left") {
    if (move) quickLeft += 1;
    else quickPhase = "right";
  } else if (move) quickRight -= 1;
  else quickPhase = "cross";
  awardCorrect();
  renderQuickAction();
}

function chooseQuickExchange(swap) {
  if (!running || quickPhase !== "swap") return;
  if (!swap) { markWrong(null, "L이 찾은 큰 값과 R이 찾은 작은 값을 교환해야 해요."); return; }
  [currentArray[quickLeft], currentArray[quickRight]] = [currentArray[quickRight], currentArray[quickLeft]];
  roundStats.movements += 1;
  quickLeft += 1;
  quickRight -= 1;
  quickPhase = "left";
  awardCorrect();
  renderQuickAction();
}

function completeQuickPartition() {
  const { low, high } = quickPartitionState;
  quickFixed.add(quickRight);
  quickPartitions += 1;
  quickRanges.unshift([quickRight + 1, high]);
  quickRanges.unshift([low, quickRight - 1]);
  quickPartitionState = null;
}

function insertionDestination(array, index) {
  const key = array[index];
  let position = 0;
  while (position < index && array[position] < key) position += 1;
  let comparisons = 0;
  let movements = 0;
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    comparisons += 1;
    if (array[cursor] <= key) break;
    movements += 1;
  }
  return { key, position, comparisons, movements };
}

function chooseMinimum(id) {
  if (!running) return;
  const tileIndex = selectionPool.findIndex(tile => tile.id === id);
  if (tileIndex < 0) return;
  const tile = selectionPool[tileIndex];
  const expected = targetArray[answer.length];
  if (tile.value !== expected) {
    markWrong(ui.pool.querySelector(`[aria-label="${tile.value} 선택"]`), `아쉬워요. 지금 찾는 수는 ${tile.value}보다 작아요.`);
    return;
  }
  selectionPool.splice(tileIndex, 1);
  answer.push(tile.value);
  awardCorrect();
  renderSelectionPool();
  renderSortedLane();
  if (answer.length === roundCount) finishRound();
  else ui.message.textContent = `${tile.value} 정답! 남은 숫자 중 가장 작은 수를 찾아요.`;
}

function chooseBubble(swap) {
  if (!running) return;
  const action = bubbleActions[bubbleStep];
  if (swap !== action.swap) {
    const left = currentArray[action.left];
    const right = currentArray[action.right];
    markWrong(null, action.swap ? `${left}이(가) 더 커요. 큰 수를 오른쪽으로 보내야 해요.` : `${left}이(가) 이미 더 작아요. 이번에는 그대로 두세요.`);
    return;
  }
  roundStats.comparisons += 1;
  if (action.swap) {
    [currentArray[action.left], currentArray[action.right]] = [currentArray[action.right], currentArray[action.left]];
    roundStats.movements += 1;
  }
  bubbleStep += 1;
  awardCorrect();
  if (bubbleStep >= bubbleActions.length) finishRound();
  else renderBubbleAction();
}

function chooseInsertion(moveRight) {
  if (!running || insertionCursor < 0) return;
  const compared = currentArray[insertionCursor];
  const shouldMove = compared > insertionKey;
  if (moveRight !== shouldMove) {
    markWrong(null, shouldMove ? `${compared}이(가) 더 크므로 오른쪽으로 밀어야 해요.` : `${compared}은(는) 삽입값보다 작아요. 그대로 두고 삽입하세요.`);
    return;
  }
  roundStats.comparisons += 1;
  if (shouldMove) {
    currentArray[insertionCursor + 1] = compared;
    currentArray[insertionCursor] = null;
    roundStats.movements += 1;
    insertionCursor -= 1;
    awardCorrect();
    renderInsertionAction();
    return;
  }
  currentArray[insertionCursor + 1] = insertionKey;
  insertionKey = null;
  insertionHeld = false;
  insertionIndex += 1;
  awardCorrect();
  if (insertionIndex >= roundCount) finishRound();
  else prepareInsertionStep();
}

function chooseQuickPivot(swap) {
  if (!running || !quickPartitionState) return;
  const { low } = quickPartitionState;
  if (!swap) { markWrong(null, "Pivot을 R 위치로 옮겨 작은 구간과 큰 구간을 나눠야 해요."); return; }
  [currentArray[low], currentArray[quickRight]] = [currentArray[quickRight], currentArray[low]];
  roundStats.movements += 1;
  completeQuickPartition();
  awardCorrect();
  renderQuickAction();
}

function partitionQuick(array, low, high) {
  const next = [...array];
  const pivot = next[low];
  let left = low + 1;
  let right = high;
  let comparisons = 0;
  let movements = 0;
  while (true) {
    while (left <= high) {
      comparisons += 1;
      if (!(next[left] <= pivot)) break;
      left += 1;
    }
    while (right > low) {
      comparisons += 1;
      if (!(next[right] > pivot)) break;
      right -= 1;
    }
    if (left >= right) break;
    [next[left], next[right]] = [next[right], next[left]];
    movements += 1;
    left += 1;
    right -= 1;
  }
  if (right !== low) {
    [next[low], next[right]] = [next[right], next[low]];
    movements += 1;
  }
  return { array: next, pivot, pivotIndex: right, low, high, left, right, comparisons, movements };
}

function calculateStats(values) {
  if (algorithm === "selection") return selectionStats(values);
  if (algorithm === "bubble") return bubbleStats(values);
  if (algorithm === "insertion") return insertionStats(values);
  return quickStats(values);
}

function selectionStats(values) {
  const array = [...values];
  let comparisons = 0;
  let movements = 0;
  for (let start = 0; start < array.length - 1; start += 1) {
    let min = start;
    for (let i = start + 1; i < array.length; i += 1) {
      comparisons += 1;
      if (array[i] < array[min]) min = i;
    }
    if (min !== start) {
      [array[start], array[min]] = [array[min], array[start]];
      movements += 1;
    }
  }
  return { comparisons, movements };
}

function bubbleStats(values) {
  const array = [...values];
  let comparisons = 0;
  let movements = 0;
  for (let end = array.length - 1; end > 0; end -= 1) {
    let changed = false;
    for (let left = 0; left < end; left += 1) {
      comparisons += 1;
      if (array[left] > array[left + 1]) {
        [array[left], array[left + 1]] = [array[left + 1], array[left]];
        movements += 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { comparisons, movements };
}

function insertionStats(values) {
  const array = [...values];
  let comparisons = 0;
  let movements = 0;
  for (let i = 1; i < array.length; i += 1) {
    const key = array[i];
    let j = i - 1;
    while (j >= 0) {
      comparisons += 1;
      if (array[j] <= key) break;
      array[j + 1] = array[j];
      movements += 1;
      j -= 1;
    }
    array[j + 1] = key;
  }
  return { comparisons, movements };
}

function quickStats(values) {
  const array = [...values];
  let comparisons = 0;
  let movements = 0;
  function sort(low, high) {
    if (low >= high) return;
    const part = partitionQuick(array, low, high);
    array.splice(0, array.length, ...part.array);
    comparisons += part.comparisons;
    movements += part.movements;
    sort(low, part.pivotIndex - 1);
    sort(part.pivotIndex + 1, high);
  }
  sort(0, array.length - 1);
  return { comparisons, movements };
}

function markWrong(button, text) {
  lives -= 1;
  combo = 0;
  updateScoreboard();
  if (button) {
    button.classList.remove("is-wrong");
    void button.offsetWidth;
    button.classList.add("is-wrong");
  }
  ui.message.className = "game-message is-wrong";
  ui.message.textContent = text;
  if (lives <= 0) endGame("기회를 모두 사용했어요.");
}

function awardCorrect() {
  combo += 1;
  score += 10 + Math.min((combo - 1) * 2, 10);
  ui.message.className = "game-message is-good";
  updateScoreboard();
}

function finishRound() {
  stopTimer();
  running = false;
  finished = true;
  const stats = calculateStats(startingArray);
  const bonus = roundCount * 5 + remaining * 2;
  score += bonus;
  ui.score.textContent = String(score);
  ui.instruction.textContent = "완벽해요! 숫자들이 줄을 섰어요.";
  ui.message.className = "game-message is-win";
  ui.message.textContent = `라운드 통과! 정리 보너스 +${bonus}점 · 다음 라운드에서 숫자가 하나 더 늘어요.`;
  ui.restart.hidden = false;
  ui.restart.textContent = "처음부터 다시";
  ui.next.hidden = false;
  ui.result.hidden = false;
  ui.resultHeading.textContent = `이번 배열 ${algorithms[algorithm].name} 통계`;
  ui.resultComparisons.textContent = String(stats.comparisons);
  ui.resultMovements.textContent = String(stats.movements);
  ui.resultMovementLabel.textContent = algorithms[algorithm].metric;
  ui.operationChoices.replaceChildren();
  ui.operationCounter.textContent = "완료";
  ui.operationQuestion.textContent = "모든 숫자가 오름차순으로 정렬됐어요!";
  ui.difficulty.forEach(button => { button.disabled = false; });
  ui.algorithmOptions.forEach(button => { button.disabled = false; });
  if (algorithm === "selection") drawOperationArray(currentArray, { fixed: selectionFixed });
  else drawOperationArray(currentArray, algorithm === "quick" ? { fixed: quickFixed } : {});
}

function endGame(message) {
  stopTimer();
  running = false;
  finished = true;
  ui.instruction.textContent = "미션 종료";
  ui.message.className = "game-message is-wrong";
  ui.message.textContent = `${message} 현재 점수 ${score}점.`;
  ui.restart.hidden = false;
  ui.restart.textContent = "다시 도전하기";
  ui.next.hidden = true;
  ui.difficulty.forEach(button => { button.disabled = false; });
  ui.algorithmOptions.forEach(button => { button.disabled = false; });
}

function resetToReady() {
  stopTimer();
  running = false;
  finished = false;
  roundNumber = 0;
  score = 0;
  combo = 0;
  lives = 3;
  startingArray = [];
  currentArray = [];
  targetArray = [];
  selectionPool = [];
  answer = [];
  bubbleActions = [];
  bubbleStep = 0;
  insertionIndex = 1;
  insertionKey = null;
  insertionCursor = -1;
  insertionHeld = false;
  selectionStart = 0;
  selectionCursor = 1;
  selectionMin = 0;
  selectionFixed = new Set();
  quickRanges = [];
  quickPartitionState = null;
  quickPhase = "left";
  quickLeft = 0;
  quickRight = 0;
  quickPartitions = 0;
  quickFixed = new Set();
  roundStats = { comparisons: 0, movements: 0 };
  ui.round.textContent = "준비";
  ui.instruction.textContent = "알고리즘을 고르고 게임을 시작하세요!";
  ui.message.className = "game-message";
  ui.message.textContent = "난이도를 선택하고 숫자 줄서기 미션에 도전해요!";
  ui.timer.textContent = hasTimeLimit ? "--:--" : "제한 없음";
  ui.timer.classList.toggle("is-unlimited", !hasTimeLimit);
  ui.timerTrack.hidden = !hasTimeLimit;
  ui.timer.classList.remove("is-low");
  ui.timerFill.style.width = "100%";
  ui.timerFill.classList.remove("is-low");
  ui.pool.replaceChildren();
  ui.lane.replaceChildren();
  ui.operationArray.replaceChildren();
  ui.operationChoices.replaceChildren();
  ui.operationQuestion.textContent = "";
  ui.operationCounter.textContent = "";
  ui.result.hidden = true;
  ui.start.hidden = false;
  ui.restart.hidden = true;
  ui.next.hidden = true;
  ui.difficulty.forEach(button => { button.disabled = false; });
  ui.algorithmOptions.forEach(button => { button.disabled = false; });
  ui.selectionBoard.hidden = true;
  ui.operationBoard.hidden = false;
  updateScoreboard();
}

ui.difficulty.forEach(button => button.addEventListener("click", () => {
  if (running) return;
  baseCount = Number(button.dataset.count);
  hasTimeLimit = button.dataset.timed === "true";
  if (hasTimeLimit) baseTime = Number(button.dataset.time);
  ui.difficulty.forEach(option => {
    const selected = option === button;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
  ui.timer.textContent = hasTimeLimit ? "--:--" : "제한 없음";
  ui.timer.classList.toggle("is-unlimited", !hasTimeLimit);
  ui.timerTrack.hidden = !hasTimeLimit;
  ui.timerFill.style.width = "100%";
  if (roundNumber > 0) resetToReady();
}));

ui.algorithmOptions.forEach(button => button.addEventListener("click", () => {
  if (running) return;
  algorithm = button.dataset.algorithm;
  ui.algorithmOptions.forEach(option => {
    const selected = option === button;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
  ui.algorithmDescription.textContent = algorithms[algorithm].description;
  if (roundNumber > 0) resetToReady();
  else {
    ui.selectionBoard.hidden = true;
    ui.operationBoard.hidden = false;
  }
}));

ui.start.addEventListener("click", startJourney);
ui.restart.addEventListener("click", () => {
  if (running) startRound();
  else startJourney();
});
ui.next.addEventListener("click", () => {
  roundNumber += 1;
  startRound();
});

ui.round.textContent = "준비";
ui.timer.textContent = hasTimeLimit ? "--:--" : "제한 없음";
ui.timer.classList.toggle("is-unlimited", !hasTimeLimit);
ui.timerTrack.hidden = !hasTimeLimit;
ui.sortedCount.textContent = "0 / 0";
ui.message.textContent = "난이도를 선택하고 숫자 줄서기 미션에 도전해요!";
ui.operationQuestion.textContent = "";
ui.selectionBoard.hidden = true;
ui.operationBoard.hidden = false;
