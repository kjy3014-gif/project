const ui = {
  round: document.querySelector("#round-number"),
  score: document.querySelector("#score"),
  combo: document.querySelector("#combo"),
  lives: document.querySelector("#lives"),
  progress: document.querySelector("#round-progress-fill"),
  instruction: document.querySelector("#mission-instruction"),
  timer: document.querySelector("#timer"),
  timerFill: document.querySelector("#timer-fill"),
  lane: document.querySelector("#sorted-lane"),
  sortedCount: document.querySelector("#sorted-count"),
  pool: document.querySelector("#number-pool"),
  message: document.querySelector("#game-message"),
  start: document.querySelector("#start-button"),
  restart: document.querySelector("#restart-button"),
  next: document.querySelector("#next-button"),
  difficulty: [...document.querySelectorAll(".difficulty-option")],
  result: document.querySelector("#selection-result"),
  comparisons: document.querySelector("#selection-comparisons"),
  swaps: document.querySelector("#selection-swaps")
};

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
let targetArray = [];
let pool = [];
let answer = [];
let running = false;
let finished = false;

function stopTimer() {
  if (timerId !== null) window.clearInterval(timerId);
  timerId = null;
}

function updateTimer() {
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  ui.timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  ui.timerFill.style.width = `${duration ? remaining / duration * 100 : 0}%`;
  const low = remaining <= 10;
  ui.timer.classList.toggle("is-low", low);
  ui.timerFill.classList.toggle("is-low", low);
}

function updateScoreboard() {
  ui.score.textContent = String(score);
  ui.combo.textContent = String(combo);
  ui.lives.textContent = String(lives);
  ui.sortedCount.textContent = `${answer.length} / ${roundCount}`;
  ui.progress.style.width = `${roundCount ? answer.length / roundCount * 100 : 0}%`;
}

function renderPool() {
  ui.pool.replaceChildren();
  pool.forEach((tile, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "number-tile";
    button.textContent = String(tile.value);
    button.setAttribute("aria-label", `${tile.value} 선택`);
    button.addEventListener("click", () => chooseTile(tile.id, button));
    ui.pool.append(button);
  });
}

function renderLane() {
  ui.lane.replaceChildren();
  if (answer.length === 0) {
    const hint = document.createElement("p");
    hint.className = "lane-placeholder";
    hint.textContent = running ? "선택한 숫자가 여기에 차례로 놓여요" : "정렬한 숫자가 여기에 쌓여요";
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

function makeRound() {
  const values = new Set();
  while (values.size < roundCount) values.add(Math.floor(Math.random() * 90) + 10);
  startingArray = [...values];
  targetArray = [...startingArray].sort((a, b) => a - b);
  pool = startingArray.map((value, id) => ({ value, id }));
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  answer = [];
}

function selectionSortStats(values) {
  const sorted = [...values];
  let comparisons = 0;
  let swaps = 0;
  for (let start = 0; start < sorted.length - 1; start += 1) {
    let minIndex = start;
    for (let cursor = start + 1; cursor < sorted.length; cursor += 1) {
      comparisons += 1;
      if (sorted[cursor] < sorted[minIndex]) minIndex = cursor;
    }
    if (minIndex !== start) {
      [sorted[start], sorted[minIndex]] = [sorted[minIndex], sorted[start]];
      swaps += 1;
    }
  }
  return { comparisons, swaps };
}

function startRound() {
  stopTimer();
  roundCount = Math.min(15, baseCount + Math.max(0, roundNumber - 1));
  duration = Math.max(28, baseTime - Math.max(0, roundNumber - 1) * 2);
  remaining = duration;
  lives = 3;
  combo = 0;
  running = true;
  finished = false;
  makeRound();

  ui.round.textContent = String(roundNumber).padStart(2, "0");
  ui.instruction.textContent = "남은 숫자 중 가장 작은 수를 찾아 누르세요.";
  ui.message.className = "game-message";
  ui.message.textContent = "숫자를 오름차순으로 정리하면 미션 성공!";
  ui.result.hidden = true;
  ui.start.hidden = true;
  ui.restart.hidden = false;
  ui.restart.textContent = "이번 판 다시하기";
  ui.next.hidden = true;
  ui.difficulty.forEach(button => { button.disabled = true; });
  renderPool();
  renderLane();
  updateScoreboard();
  updateTimer();
  timerId = window.setInterval(() => {
    remaining -= 1;
    updateTimer();
    if (remaining <= 0) endGame("시간이 다 됐어요. 다음 도전에서 다시 줄을 세워봐요!");
  }, 1000);
}

function startJourney() {
  score = 0;
  combo = 0;
  roundNumber = 1;
  ui.result.hidden = true;
  startRound();
}

function endGame(message) {
  stopTimer();
  running = false;
  finished = true;
  ui.instruction.textContent = "미션 종료";
  ui.message.className = "game-message is-wrong";
  ui.message.textContent = `${message} 현재 점수 ${score}점.`;
  ui.restart.hidden = false;
  ui.restart.textContent = "처음부터 다시 도전";
  ui.next.hidden = true;
  ui.difficulty.forEach(button => { button.disabled = false; });
}

function finishRound() {
  stopTimer();
  running = false;
  finished = true;
  const bonus = roundCount * 5 + remaining * 2;
  score += bonus;
  ui.score.textContent = String(score);
  ui.instruction.textContent = "완벽해요! 숫자들이 줄을 섰어요.";
  ui.message.className = "game-message is-win";
  ui.message.textContent = `라운드 통과! 정리 보너스 +${bonus}점 · 다음 라운드에서 숫자가 하나 더 늘어요.`;
  ui.restart.hidden = true;
  ui.next.hidden = false;
  ui.result.hidden = false;
  const stats = selectionSortStats(startingArray);
  ui.comparisons.textContent = String(stats.comparisons);
  ui.swaps.textContent = String(stats.swaps);
}

function chooseTile(id, button) {
  if (!running) return;
  const index = pool.findIndex(tile => tile.id === id);
  if (index < 0) return;
  const selected = pool[index];
  const expected = targetArray[answer.length];
  if (selected.value !== expected) {
    lives -= 1;
    combo = 0;
    updateScoreboard();
    button.classList.remove("is-wrong");
    void button.offsetWidth;
    button.classList.add("is-wrong");
    ui.message.className = "game-message is-wrong";
    ui.message.textContent = `조금 더 작은 수를 찾아봐요. 지금 고를 숫자는 ${expected}보다 작아요.`;
    if (lives <= 0) endGame("기회를 모두 사용했어요.");
    return;
  }

  pool.splice(index, 1);
  answer.push(selected.value);
  combo += 1;
  score += 10 + Math.min((combo - 1) * 2, 10);
  updateScoreboard();
  renderPool();
  renderLane();
  ui.message.className = "game-message is-good";
  ui.message.textContent = combo > 1 ? `정답! ${combo}콤보 이어가는 중!` : `정답! ${selected.value}을(를) 제자리에 놓았어요.`;

  if (answer.length === roundCount) finishRound();
  else ui.instruction.textContent = `좋아요! 남은 ${pool.length}개 중 가장 작은 수를 찾아요.`;
}

ui.difficulty.forEach(button => button.addEventListener("click", () => {
  baseCount = Number(button.dataset.count);
  baseTime = Number(button.dataset.time);
  ui.difficulty.forEach(option => {
    const selected = option === button;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
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
ui.message.textContent = "숫자를 오름차순으로 정리하면 미션 성공!";
