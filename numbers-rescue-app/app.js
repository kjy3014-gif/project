const algorithms = {
  bubble: {
    name: "버블 정렬", english: "Bubble sort", average: "O(n²)", best: "O(n)", worst: "O(n²)", space: "O(1)", movement: "교환",
    summary: "이웃한 두 값을 비교해 큰 값을 오른쪽으로 보냅니다. 한 바퀴가 끝나면 가장 큰 값 하나가 제자리를 찾습니다.",
    concept: "왼쪽부터 이웃한 값끼리 비교합니다. 앞의 값이 더 크면 자리를 바꾸고, 오른쪽 끝에 가장 큰 값이 쌓여 갑니다.",
    tip: "이미 정렬된 구간은 다시 확인하지 않아요. 한 번도 교환하지 않은 회차가 생기면 일찍 끝낼 수 있습니다.",
    question: "한 회차가 끝날 때마다 어느 쪽의 값이 확정될까요?", answer: "오른쪽 끝의 값이 확정됩니다. 그 회차에서 가장 큰 값을 이웃과 계속 바꾸어 맨 오른쪽까지 보냈기 때문입니다."
  },
  selection: {
    name: "선택 정렬", english: "Selection sort", average: "O(n²)", best: "O(n²)", worst: "O(n²)", space: "O(1)", movement: "교환",
    summary: "아직 정렬되지 않은 구간에서 가장 작은 값을 찾아 맨 앞 값과 한 번 바꿉니다.",
    concept: "정렬된 구간과 아직 정렬되지 않은 구간을 나눕니다. 남은 구간에서 최솟값을 찾고, 정렬 구간 바로 다음 칸으로 가져옵니다.",
    tip: "입력 상태와 관계없이 최솟값을 찾기 위해 남은 값을 모두 살펴봅니다. 교환 횟수는 많아도 한 회차에 한 번입니다.",
    question: "이미 정렬된 숫자에 선택 정렬을 적용해도 비교가 필요한 이유는 무엇일까요?", answer: "남은 구간의 다른 값이 더 작지 않다는 것을 확인해야 최솟값이라고 결정할 수 있기 때문입니다."
  },
  insertion: {
    name: "삽입 정렬", english: "Insertion sort", average: "O(n²)", best: "O(n)", worst: "O(n²)", space: "O(1)", movement: "이동",
    summary: "정렬된 왼쪽 구간에 다음 숫자를 꺼내 알맞은 자리를 만들고 끼워 넣습니다.",
    concept: "왼쪽은 늘 정렬되어 있다고 생각합니다. 새 숫자보다 큰 값들을 오른쪽으로 한 칸씩 밀고, 빈자리에 새 숫자를 넣습니다.",
    tip: "이 실습에서는 삽입값을 빈 칸에 놓는 동작은 세지 않고, 정렬된 구간의 큰 값을 오른쪽으로 한 칸씩 민 횟수만 이동으로 셉니다.",
    question: "숫자가 이미 오름차순이면 삽입 정렬은 왜 빠르게 끝날까요?", answer: "매번 꺼낸 값이 정렬 구간의 마지막 값보다 크거나 같아서, 오른쪽으로 미는 이동 없이 바로 자리에 남기 때문입니다."
  },
  quick: {
    name: "퀵 정렬", english: "Quick sort · Pivot partition", average: "O(n log n)", best: "O(n log n)", worst: "O(n²)", space: "O(log n)", movement: "교환",
    summary: "각 구간의 첫 숫자를 기준값(Pivot)으로 고릅니다. 작은 값과 큰 값을 나눈 뒤 Pivot을 제자리에 놓고, 양쪽 구간을 다시 정렬합니다.",
    concept: "왼쪽 포인터는 Pivot 이하의 값을 지나가고, 오른쪽 포인터는 Pivot보다 큰 값을 지나갑니다. 두 포인터가 멈춘 값을 교환하고, 교차하면 Pivot을 확정 위치에 놓습니다.",
    tip: "각 구간의 첫 원소를 Pivot으로 선택합니다. 값을 교환하면 두 포인터를 안쪽으로 한 칸씩 옮겨, 이미 확인한 칸은 다시 비교하지 않습니다.",
    question: "한 구간의 분할이 끝나면 Pivot은 어떻게 될까요?", answer: "Pivot은 작은 값 구간과 큰 값 구간 사이의 최종 위치에 놓입니다. 그 위치는 확정되며, Pivot을 제외한 왼쪽·오른쪽 구간을 재귀적으로 정렬합니다."
  }
};

const exampleData = ["8", "3", "6", "1", "9", "4", "2"];
function parseNumber(raw) {
  const text = String(raw).trim();
  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(text);
  if (!match) return null;
  const fraction = match[3] ?? match[4] ?? "";
  let digits = `${match[2] ?? "0"}${fraction}`.replace(/^0+/, "");
  if (!digits) return { raw: text, sign: 0, digits: "0", exponent: 0n };
  let exponent = BigInt(match[5] || "0") - BigInt(fraction.length);
  while (digits.endsWith("0")) {
    digits = digits.slice(0, -1);
    exponent += 1n;
  }
  return { raw: text, sign: match[1] === "-" ? -1 : 1, digits, exponent };
}

function compareMagnitude(left, right) {
  const leftOrder = BigInt(left.digits.length) + left.exponent;
  const rightOrder = BigInt(right.digits.length) + right.exponent;
  if (leftOrder !== rightOrder) return leftOrder < rightOrder ? -1 : 1;
  const width = Math.max(left.digits.length, right.digits.length);
  const leftDigits = left.digits.padEnd(width, "0");
  const rightDigits = right.digits.padEnd(width, "0");
  return leftDigits === rightDigits ? 0 : leftDigits < rightDigits ? -1 : 1;
}

function compareNumbers(left, right) {
  if (left.sign !== right.sign) return left.sign < right.sign ? -1 : 1;
  if (left.sign === 0) return 0;
  return compareMagnitude(left, right) * left.sign;
}

function compactNumber(value) {
  if (value.raw.length <= 8) return value.raw;
  if (value.sign === 0) return "0";
  const order = BigInt(value.digits.length) + value.exponent - 1n;
  const fraction = value.digits.slice(1, 4);
  return `${value.sign < 0 ? "-" : ""}${value.digits[0]}${fraction ? `.${fraction}` : ""}e${order}`;
}

function magnitudeRatio(value, largest) {
  if (value.sign === 0 || !largest) return 0;
  const valueOrder = BigInt(value.digits.length) + value.exponent;
  const largestOrder = BigInt(largest.digits.length) + largest.exponent;
  const difference = valueOrder - largestOrder;
  if (difference < -12n) return 0;
  const valueSignificand = Number(`0.${value.digits.slice(0, 15)}`);
  const largestSignificand = Number(`0.${largest.digits.slice(0, 15)}`);
  return valueSignificand / largestSignificand * 10 ** Number(difference);
}

const els = {
  tabs: [...document.querySelectorAll(".algorithm-tab")],
  count: document.querySelector("#count-select"), inputs: document.querySelector("#number-inputs"), error: document.querySelector("#input-error"),
  chart: document.querySelector("#bar-chart"), state: document.querySelector("#run-state"), stepDescription: document.querySelector("#step-description"), keyInHand: document.querySelector("#key-in-hand"),
  stepCount: document.querySelector("#step-count"), progress: document.querySelector("#progress-fill"), pointers: document.querySelector("#pointer-readout"),
  comparison: document.querySelector("#comparison-count"), movement: document.querySelector("#movement-count"), movementLabel: document.querySelector("#movement-label"),
  initial: document.querySelector("#initial-array"), current: document.querySelector("#current-array"), completion: document.querySelector("#completion-badge")
};
let algorithm = "bubble";
let timeline = [];
let frame = 0;
let timer = null;
let values = [];

function readDataCount() {
  const count = Number(els.count.value);
  const valid = els.count.value.trim() !== "" && Number.isInteger(count) && count >= 3 && count <= 15;
  els.count.setAttribute("aria-invalid", String(!valid));
  if (!valid) {
    els.error.textContent = "숫자 개수는 3개부터 15개까지 정수로 입력해 주세요.";
    return null;
  }
  els.error.textContent = "";
  return count;
}

function buildInputs(nextValues) {
  els.count.value = String(nextValues.length);
  els.inputs.replaceChildren();
  nextValues.forEach((value, index) => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = String(value);
    input.setAttribute("aria-label", `${index + 1}번째 숫자`);
    input.inputMode = "decimal";
    input.autocomplete = "off";
    els.inputs.append(input);
  });
}

function clearTimer() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  els.state.classList.remove("is-playing");
  document.querySelector("#play-label").textContent = "재생";
  document.querySelector(".play-icon").textContent = "▶";
}

function createTimeline(inputValues) {
  let items = inputValues.map((raw, id) => ({ value: parseNumber(raw), id }));
  const initial = [...items];
  let comparisons = 0;
  let movements = 0;
  const fixed = new Set();
  const events = [];
  const record = (type, description, extra = {}) => {
    events.push({
      type, description, values: items.map(item => item?.value.raw ?? null), numbers: items.map(item => item?.value ?? null), ids: items.map(item => item?.id ?? null),
      comparisons, movements, fixed: [...fixed], ...extra
    });
  };
  record("start", inputValues.length ? "데이터가 준비됐어요. 다음을 눌러 비교를 시작하세요." : "숫자 개수를 입력하면 숫자 입력칸이 나타납니다.", { active: [], pointers: null, pivotId: null, keyId: null });

  if (algorithm === "bubble") {
    let end = items.length - 1;
    while (end > 0) {
      let swapped = false;
      for (let i = 0; i < end; i += 1) {
        comparisons += 1;
        record("compare", `${items[i].value.raw}와 ${items[i + 1].value.raw}을(를) 비교합니다.`, { active: [i, i + 1], pointers: null, pivotId: null, keyId: null });
        if (compareNumbers(items[i].value, items[i + 1].value) > 0) {
          [items[i], items[i + 1]] = [items[i + 1], items[i]];
          movements += 1;
          swapped = true;
          record("swap", `${items[i].value.raw}과 ${items[i + 1].value.raw}의 자리를 바꿉니다.`, { active: [i, i + 1], pointers: null, pivotId: null, keyId: null });
        }
      }
      fixed.add(end);
      if (!swapped) for (let i = 0; i < end; i += 1) fixed.add(i);
      record("pass", swapped ? `회차가 끝났어요. 오른쪽 ${items[end].value.raw}의 자리가 확정됐습니다.` : "교환이 없어요. 전체 데이터가 이미 정렬되어 있어 마칩니다.", { active: [], pointers: null, pivotId: null, keyId: null, passEnd: end });
      if (!swapped) break;
      end -= 1;
    }
    if (items.length === 1) fixed.add(0);
  } else if (algorithm === "selection") {
    for (let start = 0; start < items.length - 1; start += 1) {
      let min = start;
      record("select", `정렬되지 않은 구간에서 최솟값을 찾습니다. 현재 후보는 ${items[min].value.raw}입니다.`, { active: [min], minIndex: min, pointers: null, pivotId: null, keyId: null, range: [start, items.length - 1] });
      for (let j = start + 1; j < items.length; j += 1) {
        comparisons += 1;
        record("compare", `${items[j].value.raw}을(를) 현재 최솟값 후보 ${items[min].value.raw}과 비교합니다.`, { active: [j, min], minIndex: min, pointers: null, pivotId: null, keyId: null, range: [start, items.length - 1] });
        if (compareNumbers(items[j].value, items[min].value) < 0) {
          min = j;
          record("minimum", `${items[min].value.raw}이(가) 새로운 최솟값 후보입니다.`, { active: [min], minIndex: min, pointers: null, pivotId: null, keyId: null, range: [start, items.length - 1] });
        }
      }
      if (min !== start) {
        [items[start], items[min]] = [items[min], items[start]];
        movements += 1;
        record("swap", `${items[start].value.raw}과 ${items[min].value.raw}을(를) 교환합니다.`, { active: [start, min], minIndex: null, pointers: null, pivotId: null, keyId: null, range: [start, items.length - 1] });
      }
      fixed.add(start);
      record("lock", `${items[start].value.raw}의 위치가 확정됐습니다.`, { active: [start], minIndex: null, pointers: null, pivotId: null, keyId: null, range: [start, items.length - 1] });
    }
    fixed.add(items.length - 1);
    record("done", "마지막 숫자도 제자리에 있어요. 정렬이 끝났습니다.", { active: [], pointers: null, pivotId: null, keyId: null });
  } else if (algorithm === "insertion") {
    for (let i = 1; i < items.length; i += 1) {
      const key = items[i];
      let j = i - 1;
      items[i] = null;
      record("key", `${key.value.raw}을(를) 삽입할 값으로 골라 잠시 들고 있습니다.`, { active: [i], keyId: key.id, keyValue: key.value.raw, pointers: null, pivotId: null, range: [0, i] });
      while (j >= 0) {
        comparisons += 1;
        record("compare", `${items[j].value.raw}과 삽입할 값 ${key.value.raw}을(를) 비교합니다.`, { active: [j, i], keyId: key.id, keyValue: key.value.raw, pointers: { left: j, right: null }, pivotId: null, range: [0, i] });
        if (compareNumbers(items[j].value, key.value) <= 0) break;
        items[j + 1] = items[j];
        items[j] = null;
        movements += 1;
        fixed.clear();
        for (let index = 0; index < j; index += 1) fixed.add(index);
        record("shift", `${items[j + 1].value.raw}을(를) 오른쪽으로 한 칸 이동해 빈 칸을 만듭니다.`, { active: [j, j + 1], keyId: key.id, keyValue: key.value.raw, pointers: { left: j, right: j + 1 }, pivotId: null, range: [0, i] });
        j -= 1;
      }
      const destination = j + 1;
      items[destination] = key;
      fixed.clear();
      for (let index = 0; index <= i; index += 1) fixed.add(index);
      record("insert", `${key.value.raw}을(를) ${destination + 1}번째 빈 칸에 삽입합니다.`, { active: [destination], keyId: key.id, keyValue: key.value.raw, pointers: null, pivotId: null, range: [0, i] });
    }
    if (items.length === 1) fixed.add(0);
  } else {
    function partition(low, high) {
      const pivotItem = items[low];
      const pivotId = pivotItem.id;
      const pivotValue = pivotItem.value;
      let left = low + 1;
      let right = high;
      record("pivot", `구간 ${low + 1}–${high + 1}번째에서 첫 값 ${pivotValue.raw}을(를) Pivot으로 고릅니다.`, { active: [], pointers: { left, right }, pivotId, pivotValue: pivotValue.raw, range: [low, high] });
      while (true) {
        while (left <= high) {
          comparisons += 1;
          const leftFits = compareNumbers(items[left].value, pivotValue) <= 0;
          record("compare", `왼쪽 포인터: ${items[left].value.raw} ≤ Pivot ${pivotValue.raw}인지 확인합니다.`, { active: [left], pointers: { left, right }, pivotId, pivotValue: pivotValue.raw, range: [low, high] });
          if (!leftFits) break;
          left += 1;
        }
        while (right > low) {
          comparisons += 1;
          const rightIsLarge = compareNumbers(items[right].value, pivotValue) > 0;
          record("compare", `오른쪽 포인터: ${items[right].value.raw} > Pivot ${pivotValue.raw}인지 확인합니다.`, { active: [right], pointers: { left, right }, pivotId, pivotValue: pivotValue.raw, range: [low, high] });
          if (!rightIsLarge) break;
          right -= 1;
        }
        if (left >= right) {
          break;
        }
        const leftIndex = left;
        const rightIndex = right;
        [items[leftIndex], items[rightIndex]] = [items[rightIndex], items[leftIndex]];
        movements += 1;
        left += 1;
        right -= 1;
        record("swap", `왼쪽 ${items[rightIndex].value.raw}과 오른쪽 ${items[leftIndex].value.raw}을(를) 교환하고, 두 포인터를 안쪽으로 옮깁니다.`, { active: [leftIndex, rightIndex], pointers: { left, right }, pivotId, pivotValue: pivotValue.raw, range: [low, high] });
      }
      if (right !== low) {
        [items[low], items[right]] = [items[right], items[low]];
        movements += 1;
        record("swap", `Pivot ${pivotValue.raw}을(를) ${items[low].value.raw}과 교환해 제자리에 놓습니다.`, { active: [low, right], pointers: { left, right }, pivotId, pivotValue: pivotValue.raw, range: [low, high] });
      }
      fixed.add(right);
      record("partition", `분할이 끝났어요. Pivot ${pivotValue.raw}의 ${right + 1}번째 위치가 확정됐습니다.`, { active: [right], pointers: { left, right }, pivotId, pivotValue: pivotValue.raw, range: [low, high], boundary: right });
      return right;
    }
    function quickSort(low, high) {
      if (low >= high) {
        if (low === high) {
          fixed.add(low);
          record("lock", `${items[low].value.raw}은(는) 원소가 하나인 구간이라 위치가 확정됐습니다.`, { active: [low], pointers: null, pivotId: null, range: [low, high] });
        }
        return;
      }
      const boundary = partition(low, high);
      quickSort(low, boundary - 1);
      quickSort(boundary + 1, high);
    }
    quickSort(0, items.length - 1);
  }

  fixed.clear();
  for (let i = 0; i < items.length; i += 1) fixed.add(i);
  record("complete", "모든 숫자가 오름차순으로 정렬됐습니다.", { active: [], pointers: null, pivotId: null, keyId: null, range: null });
  return { initial: initial.map(item => item.value.raw), events };
}

function renderFrame() {
  const event = timeline[frame];
  if (!event) return;
  const presentNumbers = event.numbers.filter(Boolean);
  const positive = presentNumbers.filter(value => value.sign > 0);
  const negative = presentNumbers.filter(value => value.sign < 0).map(value => ({ ...value, sign: 1 }));
  const largestPositive = positive.reduce((largest, value) => !largest || compareMagnitude(value, largest) > 0 ? value : largest, null);
  const largestNegative = negative.reduce((largest, value) => !largest || compareMagnitude(value, largest) > 0 ? value : largest, null);
  els.chart.classList.toggle("has-negative", negative.length > 0);
  const active = new Set(event.active || []);
  const fixed = new Set(event.fixed || []);
  const moving = new Set(event.type === "swap" || event.type === "shift" ? event.active : []);
  const isComplete = event.type === "complete";
  const hasValues = event.values.length > 0;
  els.chart.replaceChildren();
  event.values.forEach((value, index) => {
    const numberValue = event.numbers[index];
    const item = document.createElement("div");
    item.className = "bar-item";
    if (!numberValue) item.classList.add("is-hole");
    if (numberValue?.sign < 0) item.classList.add("is-negative");
    if (active.has(index)) item.classList.add("is-compare");
    if (moving.has(index)) item.classList.add("is-move");
    if (fixed.has(index)) item.classList.add("is-fixed");
    if (event.ids[index] === event.pivotId) item.classList.add("is-pivot");
    const largest = numberValue?.sign < 0 ? largestNegative : largestPositive;
    const height = !numberValue || numberValue.sign === 0 ? 5 : Math.max(7, magnitudeRatio(numberValue, largest) * 76);
    item.style.setProperty("--bar-height", `${height}%`);
    const number = document.createElement("span");
    number.className = numberValue ? "bar-value" : "hole-label";
    number.textContent = numberValue ? compactNumber(numberValue) : "빈 칸";
    if (numberValue) number.title = value;
    const bar = document.createElement("div");
    bar.className = "bar";
    if (!numberValue) bar.classList.add("hole-bar");
    const indexLabel = document.createElement("span");
    indexLabel.className = "bar-index";
    indexLabel.textContent = String(index + 1);
    item.append(number, bar);
    if (event.ids[index] === event.pivotId) {
      const badge = document.createElement("span"); badge.className = "bar-badge pivot-badge"; badge.textContent = "Pivot"; item.append(badge);
    } else if (event.minIndex === index) {
      const badge = document.createElement("span"); badge.className = "bar-badge"; badge.textContent = "최솟값"; item.append(badge);
    }
    if (event.pointers && algorithm === "quick" && (event.pointers.left === index || event.pointers.right === index)) {
      const markers = document.createElement("span");
      markers.className = "pointer-markers";
      if (event.pointers.left === index) { const marker = document.createElement("span"); marker.textContent = "L"; markers.append(marker); }
      if (event.pointers.right === index) { const marker = document.createElement("span"); marker.className = "pointer-right"; marker.textContent = "R"; markers.append(marker); }
      item.append(markers);
    }
    item.append(indexLabel);
    els.chart.append(item);
  });
  const visibleValues = event.values.map(value => value ?? "빈 칸");
  els.chart.setAttribute("aria-label", `현재 배열 ${visibleValues.join(", ")}`);
  els.keyInHand.hidden = event.keyValue === undefined;
  els.keyInHand.textContent = event.keyValue === undefined ? "" : `들고 있는 삽입값 ${event.keyValue}`;
  els.stepDescription.textContent = event.description;
  els.stepCount.textContent = `${frame} / ${timeline.length - 1}`;
  els.progress.style.width = `${timeline.length <= 1 ? 100 : frame / (timeline.length - 1) * 100}%`;
  els.comparison.textContent = String(event.comparisons);
  els.movement.textContent = String(event.movements);
  els.current.textContent = `[${visibleValues.join(", ")}]`;
  els.completion.textContent = isComplete ? "정렬 완료" : "진행 중";
  els.completion.classList.toggle("complete", isComplete);
  els.state.classList.toggle("is-done", isComplete);
  els.state.querySelector("span").style.background = "";
  els.state.lastChild.textContent = isComplete ? " 완료" : els.state.classList.contains("is-playing") ? " 재생 중" : " 준비";
  document.querySelector("#first-button").disabled = !hasValues || frame === 0;
  document.querySelector("#previous-button").disabled = !hasValues || frame === 0;
  document.querySelector("#next-button").disabled = !hasValues || frame === timeline.length - 1;
  document.querySelector("#play-button").disabled = !hasValues;
  const pointerParts = [];
  if (event.pivotValue !== undefined && event.range) pointerParts.push(`구간 ${event.range[0] + 1}–${event.range[1] + 1}`);
  if (event.pointers && algorithm === "quick") pointerParts.push(`왼쪽 L=${event.pointers.left + 1} · 오른쪽 R=${event.pointers.right + 1}번째`);
  if (event.pointers && algorithm === "insertion") pointerParts.push(`비교 위치 ${event.pointers.left + 1} · 이동 위치 ${event.pointers.right + 1}`);
  if (event.minIndex !== undefined && event.minIndex !== null) pointerParts.push(`최솟값 후보: ${event.values[event.minIndex]}`);
  if (event.keyValue !== undefined) pointerParts.push(`삽입할 값: ${event.keyValue}`);
  if (event.passEnd !== undefined) pointerParts.push(`이번 회차에서 오른쪽 ${event.passEnd + 1}번째 확정`);
  if (event.boundary !== undefined) pointerParts.push(`Pivot 확정 위치: ${event.boundary + 1}번째`);
  els.pointers.textContent = pointerParts.join("   ·   ");
}

function startRun(nextValues = values) {
  clearTimer();
  values = nextValues.map(value => String(value).trim());
  const result = createTimeline(values);
  timeline = result.events;
  frame = 0;
  els.initial.textContent = `[${result.initial.join(", ")}]`;
  els.movementLabel.textContent = algorithms[algorithm].movement;
  els.error.textContent = "";
  renderFrame();
}

function changeAlgorithm(nextAlgorithm) {
  algorithm = nextAlgorithm;
  els.tabs.forEach(tab => {
    const selected = tab.dataset.algorithm === algorithm;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-pressed", String(selected));
  });
  const info = algorithms[algorithm];
  document.querySelector("#algorithm-name").innerHTML = `${info.name} <span>${info.english}</span>`;
  document.querySelector("#algorithm-summary").textContent = info.summary;
  document.querySelector("#stats-note").textContent = algorithm === "insertion"
    ? "이동은 이미 정렬된 값들을 오른쪽으로 민 횟수입니다. 삽입값을 빈 칸에 놓는 동작은 세지 않습니다."
    : "비교는 값의 크기를 확인한 횟수입니다. 큰 수와 소수도 반올림 없이 비교합니다.";
  document.querySelector("#average-complexity").textContent = info.average;
  document.querySelector("#best-complexity").textContent = info.best;
  document.querySelector("#worst-complexity").textContent = info.worst;
  document.querySelector("#space-complexity").textContent = info.space;
  document.querySelector("#concept-copy").textContent = info.concept;
  document.querySelector("#teaching-tip").textContent = info.tip;
  document.querySelector("#question-copy").textContent = info.question;
  document.querySelector("#answer-copy").textContent = info.answer;
  document.querySelector("#answer-copy").hidden = true;
  document.querySelector("#student-answer").value = "";
  document.querySelector("#answer-toggle").setAttribute("aria-expanded", "false");
  document.querySelector("#answer-toggle").disabled = true;
  document.querySelector("#answer-toggle").innerHTML = '답 확인하기 <span aria-hidden="true">＋</span>';
  startRun(values);
}

function applyInputs() {
  const count = readDataCount();
  if (count === null) {
    clearTimer();
    renderFrame();
    return;
  }
  const inputs = [...els.inputs.querySelectorAll("input")];
  if (inputs.length !== count) {
    els.error.textContent = "숫자 개수를 입력하면 나타나는 칸에 정렬할 숫자를 입력해 주세요.";
    return;
  }
  let invalid = false;
  const next = inputs.map(input => {
    const number = parseNumber(input.value);
    const valid = number !== null;
    input.setAttribute("aria-invalid", String(!valid));
    if (!valid) invalid = true;
    return number?.raw ?? input.value;
  });
  if (invalid) {
    els.error.textContent = "각 칸에 숫자를 입력해 주세요. 예: -12, 3.14, 2e100, 123456789012345678901234567890";
    return;
  }
  startRun(next);
  document.querySelector("#play-button").click();
}

function setPreset(kind) {
  const count = kind === "example" ? exampleData.length : readDataCount();
  if (count === null) return;
  let preset;
  if (kind === "example") preset = [...exampleData];
  if (kind === "reverse") preset = Array.from({ length: count }, (_, index) => count - index);
  if (kind === "sorted") preset = Array.from({ length: count }, (_, index) => index + 1);
  values = preset;
  buildInputs(values);
  startRun(values);
}

function stepBy(amount) {
  clearTimer();
  frame = Math.max(0, Math.min(timeline.length - 1, frame + amount));
  renderFrame();
}

els.tabs.forEach(tab => tab.addEventListener("click", () => changeAlgorithm(tab.dataset.algorithm)));
els.count.addEventListener("change", () => {
  clearTimer();
  const count = readDataCount();
  if (count === null) { renderFrame(); return; }
  const currentInputs = [...els.inputs.querySelectorAll("input")].map(input => input.value);
  const next = Array.from({ length: count }, (_, index) => {
    if (index < currentInputs.length) return currentInputs[index];
    return "";
  });
  buildInputs(next);
  if (next.every(value => parseNumber(value))) startRun(next);
  else renderFrame();
});
document.querySelectorAll("[data-preset]").forEach(button => button.addEventListener("click", () => setPreset(button.dataset.preset)));
document.querySelector("#random-button").addEventListener("click", () => {
  const count = readDataCount();
  if (count === null) return;
  const next = Array.from({ length: count }, () => String(Math.floor(Math.random() * 2001) - 1000));
  buildInputs(next);
  startRun(next);
});
document.querySelector("#apply-button").addEventListener("click", applyInputs);
els.inputs.addEventListener("input", () => {
  els.error.textContent = "";
  els.inputs.querySelectorAll("input").forEach(input => input.removeAttribute("aria-invalid"));
});
document.querySelector("#first-button").addEventListener("click", () => { clearTimer(); frame = 0; renderFrame(); });
document.querySelector("#previous-button").addEventListener("click", () => stepBy(-1));
document.querySelector("#next-button").addEventListener("click", () => stepBy(1));
document.querySelector("#play-button").addEventListener("click", () => {
  if (timer !== null) {
    clearTimer();
    els.state.lastChild.textContent = " 일시정지";
    return;
  }
  if (frame >= timeline.length - 1) { frame = 0; renderFrame(); }
  els.state.classList.add("is-playing");
  els.state.lastChild.textContent = " 재생 중";
  document.querySelector("#play-label").textContent = "일시정지";
  document.querySelector(".play-icon").textContent = "Ⅱ";
  timer = window.setInterval(() => {
    if (frame >= timeline.length - 1) { clearTimer(); renderFrame(); return; }
    frame += 1;
    renderFrame();
    if (frame >= timeline.length - 1) clearTimer();
  }, Number(document.querySelector("#speed-select").value));
});
document.querySelector("#speed-select").addEventListener("change", () => {
  if (timer !== null) {
    clearTimer();
    document.querySelector("#play-button").click();
  }
});
document.querySelector("#student-answer").addEventListener("input", event => {
  const hasAnswer = event.currentTarget.value.trim().length > 0;
  const button = document.querySelector("#answer-toggle");
  button.disabled = !hasAnswer;
  if (!hasAnswer) {
    document.querySelector("#answer-copy").hidden = true;
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = '답 확인하기 <span aria-hidden="true">＋</span>';
  }
});
document.querySelector("#answer-toggle").addEventListener("click", event => {
  if (!document.querySelector("#student-answer").value.trim()) return;
  const answer = document.querySelector("#answer-copy");
  const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
  answer.hidden = expanded;
  event.currentTarget.setAttribute("aria-expanded", String(!expanded));
  event.currentTarget.innerHTML = expanded ? '답 확인하기 <span aria-hidden="true">＋</span>' : '답 숨기기 <span aria-hidden="true">−</span>';
});

changeAlgorithm(algorithm);
