const algorithms = {
  selection: { name: "선택 정렬", metric: "교환", description: "남은 구간에서 가장 작은 값을 골라 앞에 놓아요." },
  bubble: { name: "버블 정렬", metric: "교환", description: "이웃한 두 값을 비교하고, 큰 값을 오른쪽으로 보내요." },
  insertion: { name: "삽입 정렬", metric: "이동", description: "정렬된 구간에 다음 숫자가 들어갈 자리를 찾아요." },
  quick: { name: "퀵 정렬", metric: "교환", description: "Pivot을 기준으로 나눈 뒤, Pivot의 자리를 찾아요." }
};

const ui = {
  round: document.querySelector("#round-number"), score: document.querySelector("#score"), combo: document.querySelector("#combo"), lives: document.querySelector("#lives"),
  progress: document.querySelector("#round-progress-fill"), instruction: document.querySelector("#mission-instruction"), timer: document.querySelector("#timer"), timerFill: document.querySelector("#timer-fill"),
  selectionBoard: document.querySelector("#selection-board"), lane: document.querySelector("#sorted-lane"), sortedCount: document.querySelector("#sorted-count"), pool: document.querySelector("#number-pool"),
  operationBoard: document.querySelector("#operation-board"), operationLabel: document.querySelector("#operation-label"), operationCounter: document.querySelector("#operation-counter"), operationArray: document.querySelector("#operation-array"), operationQuestion: document.querySelector("#operation-question"), operationChoices: document.querySelector("#operation-choices"),
  message: document.querySelector("#game-message"), start: document.querySelector("#start-button"), restart: document.querySelector("#restart-button"), next: document.querySelector("#next-button"),
  difficulty: [...document.querySelectorAll(".difficulty-option")], algorithmOptions: [...document.querySelectorAll(".algorithm-option")], algorithmDescription: document.querySelector("#algorithm-description"),
  result: document.querySelector("#algorithm-result"), resultHeading: document.querySelector("#result-heading"), resultComparisons: document.querySelector("#result-comparisons"), resultMovements: document.querySelector("#result-movements"), resultMovementLabel: document.querySelector("#result-movement-label")
};

let algorithm = "selection";
let baseCount = 5;
let baseTime = 55;
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
let quickRanges = [];
let quickPartitionState = null;
let quickPartitions = 0;
let quickFixed = new Set();

function stopTimer() {
  if (timerId !== null) window.clearInterval(timerId);
  timerId = null;
}

function updateTimer() {
  ui.timer.textContent = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  ui.timerFill.style.width = `${duration ? remaining / duration * 100 : 0}%`;
  const low = remaining <= 10;
  ui.timer.classList.toggle("is-low", low);
  ui.timerFill.classList.toggle("is-low", low);
}

function updateProgress() {
  let done = 0;
  let total = roundCount;
  if (algorithm === "selection") done = answer.length;
  if (algorithm === "bubble") { done = bubbleStep; total = bubbleActions.length; }
  if (algorithm === "insertion") { done = insertionIndex - 1; total = roundCount - 1; }
  if (algorithm === "quick") { done = quickPartitions; total = roundCount - 1; }
  ui.progress.style.width = `${total ? Math.min(100, done / total * 100) : 0}%`;
  ui.sortedCount.textContent = algorithm === "selection" ? `${answer.length} / ${roundCount}` : `${done} / ${total}`;
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
  values.forEach((value, index) => {
    const tile = document.createElement("span");
    tile.className = "array-token";
    if (markers.left === index) tile.classList.add("is-left");
    if (markers.right === index) tile.classList.add("is-right");
    if (markers.pivot === index) tile.classList.add("is-pivot");
    if (markers.low !== undefined && (index < markers.low || index > markers.high)) tile.classList.add("is-outside");
    if (markers.fixed?.has(index)) tile.classList.add("is-fixed");
    tile.textContent = String(value);
    const labels = [];
    if (markers.pivot === index) labels.push("Pivot");
    if (markers.left === index) labels.push("L");
    if (markers.right === index) labels.push("R");
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
  ui.timer.textContent = "--:--";
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
  quickRanges = [];
  quickPartitionState = null;
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
  ui.selectionBoard.hidden = algorithm !== "selection";
  ui.operationBoard.hidden = algorithm === "selection";

  if (algorithm === "selection") {
    selectionPool = shuffle(startingArray.map((value, id) => ({ value, id })));
    ui.instruction.textContent = "남은 숫자 중 가장 작은 수를 찾아 누르세요.";
    renderSelectionPool();
    renderSortedLane();
  } else if (algorithm === "bubble") {
    bubbleActions = makeBubbleActions(startingArray);
    ui.instruction.textContent = "이웃한 두 수를 비교해 맞는 행동을 골라요.";
    renderBubbleAction();
  } else if (algorithm === "insertion") {
    ui.instruction.textContent = "현재 값이 정렬된 구간의 어디에 들어갈지 찾아요.";
    renderInsertionAction();
  } else {
    quickRanges = [[0, roundCount - 1]];
    ui.instruction.textContent = "포인터와 Pivot을 보고 확정 자리를 예측해요.";
    renderQuickAction();
  }
  const steps = algorithm === "bubble" ? bubbleActions.length : roundCount - 1;
  const secondsPerStep = algorithm === "bubble" ? .75 : algorithm === "selection" ? 1.15 : 1.5;
  duration = Math.max(Math.max(28, baseTime - Math.max(0, roundNumber - 1) * 2), Math.ceil(steps * secondsPerStep + 12));
  remaining = duration;
  updateScoreboard();
  updateTimer();
  timerId = window.setInterval(() => {
    remaining -= 1;
    updateTimer();
    if (remaining <= 0) endGame("시간이 다 됐어요. 다음 도전에서 다시 줄을 세워봐요!");
  }, 1000);
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
    renderSortedLane();
    renderSelectionPool();
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
  values.forEach((value, index) => {
    const tile = document.createElement("span");
    tile.className = "array-token";
    if (markers.left === index) tile.classList.add("is-left");
    if (markers.right === index) tile.classList.add("is-right");
    if (markers.pivot === index) tile.classList.add("is-pivot");
    if (markers.low !== undefined && (index < markers.low || index > markers.high)) tile.classList.add("is-outside");
    if (markers.fixed?.has(index)) tile.classList.add("is-fixed");
    tile.textContent = String(value);
    const labels = [];
    if (markers.pivot === index) labels.push("Pivot");
    if (markers.left === index) labels.push("L");
    if (markers.right === index) labels.push("R");
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
  if (insertionIndex >= roundCount) { finishRound(); return; }
  const { key } = insertionDestination(currentArray, insertionIndex);
  const prefix = currentArray.slice(0, insertionIndex);
  ui.operationLabel.textContent = "정렬된 구간에 삽입";
  ui.operationCounter.textContent = `${insertionIndex} / ${roundCount - 1}`;
  ui.operationArray.replaceChildren();
  const keyBadge = document.createElement("span");
  keyBadge.className = "insertion-key";
  keyBadge.textContent = `삽입값 ${key}`;
  ui.operationArray.append(keyBadge);
  const strip = document.createElement("div");
  strip.className = "insertion-strip";
  for (let slot = 0; slot <= prefix.length; slot += 1) {
    const gap = document.createElement("button");
    gap.type = "button";
    gap.className = "insertion-gap";
    gap.textContent = "+";
    gap.setAttribute("aria-label", `${key}을(를) ${slot + 1}번째 자리에 삽입`);
    gap.addEventListener("click", () => chooseInsertion(slot));
    strip.append(gap);
    if (slot < prefix.length) {
      const token = document.createElement("span");
      token.className = "array-token";
      token.textContent = String(prefix[slot]);
      strip.append(token);
    }
  }
  const remainingValues = currentArray.slice(insertionIndex + 1);
  if (remainingValues.length) {
    const rest = document.createElement("span");
    rest.className = "insertion-rest";
    rest.textContent = `다음: ${remainingValues.join(" · ")}`;
    strip.append(rest);
  }
  ui.operationArray.append(strip);
  ui.operationQuestion.textContent = `${key}은(는) 정렬된 구간의 어느 위치에 들어갈까요?`;
  ui.operationChoices.replaceChildren();
  updateProgress();
}

function renderQuickAction() {
  while (quickRanges.length) {
    const [low, high] = quickRanges.shift();
    if (low < high) {
      quickPartitionState = quickPartition(currentArray, low, high);
      ui.operationLabel.textContent = "Pivot 위치 예측";
      ui.operationCounter.textContent = `구간 ${low + 1}–${high + 1}`;
      drawOperationArray(currentArray, { low, high, pivot: low, left: low + 1, right: high, fixed: quickFixed });
      ui.operationQuestion.textContent = `Pivot ${quickPartitionState.pivot}은(는) 몇 번째 자리에 놓일까요?`;
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
      updateProgress();
      return;
    }
    if (low === high) quickFixed.add(low);
  }
  finishRound();
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

function chooseInsertion(slot) {
  if (!running) return;
  const insertion = insertionDestination(currentArray, insertionIndex);
  if (slot !== insertion.position) {
    markWrong(null, "작은 값은 앞에, 큰 값은 뒤에 와야 해요. 끼워 넣을 위치를 다시 골라보세요.");
    return;
  }
  const prefix = currentArray.slice(0, insertionIndex);
  prefix.splice(slot, 0, insertion.key);
  currentArray = [...prefix, ...currentArray.slice(insertionIndex + 1)];
  roundStats.comparisons += insertion.comparisons;
  roundStats.movements += insertion.movements;
  insertionIndex += 1;
  awardCorrect();
  if (insertionIndex >= roundCount) finishRound();
  else renderInsertionAction();
}

function chooseQuickPivot(index) {
  if (!running || !quickPartitionState) return;
  const part = quickPartitionState;
  if (index !== part.pivotIndex) {
    markWrong(null, `Pivot ${part.pivot}은(는) ${part.pivotIndex + 1}번째에 놓여요. 좌우 구간을 다시 살펴보세요.`);
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
  if (algorithm === "selection") {
    renderSortedLane();
    renderSelectionPool();
  } else drawOperationArray(currentArray, algorithm === "quick" ? { fixed: quickFixed } : {});
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
  quickRanges = [];
  quickPartitionState = null;
  quickPartitions = 0;
  quickFixed = new Set();
  roundStats = { comparisons: 0, movements: 0 };
  ui.round.textContent = "준비";
  ui.instruction.textContent = "알고리즘을 고르고 게임을 시작하세요!";
  ui.message.className = "game-message";
  ui.message.textContent = "난이도를 선택하고 숫자 줄서기 미션에 도전해요!";
  ui.timer.textContent = "--:--";
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
  ui.selectionBoard.hidden = algorithm !== "selection";
  ui.operationBoard.hidden = algorithm === "selection";
  updateScoreboard();
}

ui.difficulty.forEach(button => button.addEventListener("click", () => {
  if (running) return;
  baseCount = Number(button.dataset.count);
  baseTime = Number(button.dataset.time);
  ui.difficulty.forEach(option => {
    const selected = option === button;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
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
    ui.selectionBoard.hidden = algorithm !== "selection";
    ui.operationBoard.hidden = algorithm === "selection";
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
ui.timer.textContent = "--:--";
ui.sortedCount.textContent = "0 / 0";
ui.message.textContent = "난이도를 선택하고 숫자 줄서기 미션에 도전해요!";
ui.operationQuestion.textContent = "";
