import { asteroidDuration } from "./catalog.js";

const startPoint = { x: 47, y: 66 };
const points = [
  {
    id: "sleepy",
    x: 19,
    y: 66,
    icon: "✦",
    name: "打瞌睡的星星",
    star: true,
    line: "你发现了一颗正在打瞌睡的星星。",
  },
  {
    id: "work",
    x: 43,
    y: 26,
    icon: "✷",
    name: "不想上班的星星",
    star: true,
    line: "这颗星星说它不想上班。",
  },
  {
    id: "behind",
    x: 80,
    y: 65,
    icon: "✦",
    name: "藏起来的星星",
    star: true,
    line: "最后藏起来的星星就在聊绒背后。",
  },
  {
    id: "tree",
    x: 20,
    y: 31,
    icon: "♣",
    name: "奇怪的树",
    line: "树说：「把耳朵贴在西边的风上，会听见旧门的声音。」",
  },
  {
    id: "house",
    x: 76,
    y: 33,
    icon: "⌂",
    name: "小房子",
    line: "窗里有人悄悄说：「背面的门在南边，月尘盖住了把手。」",
  },
  {
    id: "potato",
    x: 36,
    y: 82,
    art: true,
    name: "安静的土豆",
    line: "土豆一言不发，悄悄往南边翻了个身。",
  },
  {
    id: "door",
    x: 65,
    y: 82,
    icon: "▯",
    name: "隐藏门",
    line: "门背后有一间小房间，三盏灯正在给夜空写信。",
  },
];
const directions = {
  arrowup: [0, -1],
  w: [0, -1],
  arrowleft: [-1, 0],
  a: [-1, 0],
  arrowdown: [0, 1],
  s: [0, 1],
  arrowright: [1, 0],
  d: [1, 0],
};
const speed = 39;

export function moveOnAsteroid(position, dx, dy) {
  return {
    x: Math.max(8, Math.min(92, position.x + dx)),
    y: Math.max(17, Math.min(87, position.y + dy)),
  };
}
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function render() {
  return `<div class="asteroid-game">
    <div class="asteroid-hud">
      <span>星星 <strong data-asteroid-count>0 / 3</strong></span>
      <span>剩余 <strong data-asteroid-time>60</strong> 秒</span>
      <button type="button" class="text-button" data-asteroid="pause" disabled>暂停</button>
    </div>
    <div class="asteroid-map" role="group" aria-label="小行星地图" tabindex="0">
      <div class="asteroid-island" aria-hidden="true"></div>
      <span class="asteroid-crater crater-one" aria-hidden="true"></span><span class="asteroid-crater crater-two" aria-hidden="true"></span>
      ${points.map((point) => `<button type="button" class="asteroid-point point-${point.id}" style="--x:${point.x}%;--y:${point.y}%" data-point="${point.id}" aria-label="${point.name}" disabled ${point.id === "door" ? "hidden" : ""}>${point.art ? '<img src="/assets/potato.webp" width="518" height="430" alt="">' : `<span aria-hidden="true">${point.icon}</span>`}</button>`).join("")}
      <img class="asteroid-player" src="/assets/loro.webp" width="502" height="530" alt="聊绒的位置">
    </div>
    <div class="asteroid-controls">
      <div class="asteroid-directions" aria-label="移动控制" role="group">
        ${[
          ["w", "↑", "向上走"],
          ["a", "←", "向左走"],
          ["s", "↓", "向下走"],
          ["d", "→", "向右走"],
        ]
          .map(
            ([key, glyph, name]) =>
              `<button type="button" data-direction="${key}" aria-label="${name}" disabled>${glyph}</button>`,
          )
          .join("")}
      </div>
      <div class="world-actions">
        <button type="button" class="pill lime" data-asteroid="start">开始探索</button>
        <button type="button" class="pill plain" data-asteroid="interact" disabled>查看附近</button>
        <button type="button" class="text-button" data-asteroid="finish" disabled>结束探索</button>
      </div>
    </div>
    <p class="world-feedback asteroid-feedback" role="status">聊绒正在等你。准备好就出发。</p>
    <section class="asteroid-secret" hidden aria-labelledby="asteroid-secret-title">
      <span aria-hidden="true">✦ ☾ ✧</span><h2 id="asteroid-secret-title">小行星背面的房间</h2><p>三盏灯挤在窗台上。它们写给夜空的信只有一句：「今天也辛苦啦。」</p>
    </section>
    <section class="asteroid-result" hidden aria-labelledby="asteroid-result-title">
      <h2 id="asteroid-result-title" tabindex="-1">探索结束</h2><p></p><a class="text-link" href="/archive#world-records">查看小站足迹</a>
    </section>
  </div>`;
}

export function mount(root, { signal, complete, secret, reduced }) {
  const $ = (selector) => root.querySelector(selector);
  const map = $(".asteroid-map");
  const loro = $(".asteroid-player");
  const note = $(".asteroid-feedback");
  const startButton = $('[data-asteroid="start"]');
  const pauseButton = $('[data-asteroid="pause"]');
  const finishButton = $('[data-asteroid="finish"]');
  const directionButtons = [...root.querySelectorAll("[data-direction]")];
  const pointButtons = Object.fromEntries(
    [...map.querySelectorAll("[data-point]")].map((button) => [
      button.dataset.point,
      button,
    ]),
  );
  const activeKeys = new Set();
  const held = new Map();
  const stars = new Set();
  let position,
    target,
    status,
    frame,
    began,
    spent,
    lastFrame,
    doorSeen,
    treeSeen,
    doorVisible;
  let lastSeconds;

  function setControls() {
    const running = status === "running";
    pauseButton.disabled = !running && status !== "paused";
    pauseButton.textContent = status === "paused" ? "继续探索" : "暂停";
    startButton.hidden = running || status === "paused";
    startButton.textContent = status === "finished" ? "再探索一轮" : "开始探索";
    finishButton.disabled = !running && status !== "paused";
    finishButton.textContent = stars.size === 3 ? "带星星回家" : "结束探索";
    $('[data-asteroid="interact"]').disabled = !running;
    for (const button of directionButtons) button.disabled = !running;
    for (const point of points) {
      pointButtons[point.id].disabled = !running;
      pointButtons[point.id].hidden =
        stars.has(point.id) || (point.id === "door" && !doorVisible);
    }
  }

  function stopLoop() {
    cancelAnimationFrame(frame);
    activeKeys.clear();
    held.clear();
    target = null;
  }

  function paintPosition() {
    loro.style.left = position.x + "%";
    loro.style.top = position.y + "%";
  }

  function revealDoor() {
    if (doorVisible) return;
    doorVisible = true;
    pointButtons.door.hidden = false;
  }

  function interact(point) {
    if (!point) {
      note.textContent = "附近只有月尘。再走几步看看。";
      return;
    }
    if (point.star) return;
    note.textContent = point.line;
    if (point.id === "house") revealDoor();
    if (point.id === "door" && !doorSeen) {
      doorSeen = true;
      $(".asteroid-secret").hidden = false;
      secret("asteroid-door");
    }
  }

  function checkPoints() {
    for (const point of points) {
      const near = distance(position, point);
      if (point.id === "door" && near < 17) revealDoor();
      if (point.id === "tree" && near < 10 && !treeSeen) {
        treeSeen = true;
        interact(point);
      }
      if (point.star && near < 8 && !stars.has(point.id)) {
        stars.add(point.id);
        setControls();
        $("[data-asteroid-count]").textContent = stars.size + " / 3";
        note.textContent =
          point.line + (stars.size === 3 ? " 已找齐，可以带星星回家。" : "");
        if (
          document.activeElement === pointButtons[point.id] ||
          document.activeElement === document.body
        ) {
          map.focus({ preventScroll: true });
        }
      }
    }
  }

  function move(dx, dy) {
    position = moveOnAsteroid(position, dx, dy);
    paintPosition();
    checkPoints();
  }

  function finish(now) {
    if (status !== "running" && status !== "paused") return;
    const total = Math.min(
      asteroidDuration,
      spent + (status === "running" ? now - began : 0),
    );
    status = "finished";
    stopLoop();
    setControls();
    const assessment =
      stars.size === 3 ? "聊绒想把这三颗都带回家。" : "聊绒说，下次再去转转。";
    const result = $(".asteroid-result");
    result.querySelector("p").textContent =
      `找到 ${stars.size} / 3 颗星星 · 用时 ${(total / 1000).toFixed(1)} 秒 · ${doorSeen ? "发现隐藏门" : "还没找到隐藏门"}。 ${assessment}`;
    result.hidden = false;
    complete({ stars: stars.size, ms: total });
    result.querySelector("h2").focus();
  }

  function tick(now) {
    if (status !== "running") return;
    const remaining = Math.max(0, asteroidDuration - spent - (now - began));
    const seconds = Math.ceil(remaining / 1000);
    if (seconds !== lastSeconds) {
      lastSeconds = seconds;
      $("[data-asteroid-time]").textContent = seconds;
    }
    if (!remaining) return finish(now);
    const quantum = (Math.min(Math.max(0, now - lastFrame), 40) * speed) / 1000;
    lastFrame = now;
    const keys = new Set([...activeKeys, ...held.values()]);
    const [x, y] = [...keys].reduce(
      ([x, y], key) => [x + directions[key][0], y + directions[key][1]],
      [0, 0],
    );
    if (x || y) {
      const length = Math.hypot(x, y);
      move((x / length) * quantum, (y / length) * quantum);
    } else if (target) {
      const delta = distance(position, target);
      if (delta <= quantum || reduced()) {
        const arrival = target.point;
        move(target.x - position.x, target.y - position.y);
        target = null;
        if (arrival) interact(arrival);
      } else {
        move(
          ((target.x - position.x) / delta) * quantum,
          ((target.y - position.y) / delta) * quantum,
        );
      }
    }
    frame = requestAnimationFrame(tick);
  }

  function resume() {
    status = "running";
    began = lastFrame = performance.now();
    setControls();
    map.focus({ preventScroll: true });
    frame = requestAnimationFrame(tick);
  }

  function pause() {
    if (status !== "running") return;
    spent += performance.now() - began;
    status = "paused";
    stopLoop();
    setControls();
    note.textContent = "聊绒在这里等你。";
  }

  function reset() {
    stopLoop();
    status = "ready";
    position = { ...startPoint };
    spent = 0;
    stars.clear();
    doorSeen = treeSeen = doorVisible = false;
    lastSeconds = asteroidDuration / 1000;
    $("[data-asteroid-time]").textContent = lastSeconds;
    $("[data-asteroid-count]").textContent = "0 / 3";
    $(".asteroid-result").hidden = true;
    $(".asteroid-secret").hidden = true;
    note.textContent = "聊绒正在等你。准备好就出发。";
    paintPosition();
    setControls();
  }

  function nearby() {
    const nearest = points
      .filter((point) => !point.star && (point.id !== "door" || doorVisible))
      .sort((a, b) => distance(a, position) - distance(b, position))[0];
    interact(distance(nearest, position) <= 13 ? nearest : null);
  }

  root.addEventListener(
    "click",
    (event) => {
      const control = event.target.closest("button");
      const action = control?.dataset.asteroid;
      if (action === "start") {
        reset();
        resume();
        note.textContent = "找回三颗星。也可以沿路看看地标。";
      }
      if (action === "pause") {
        if (status === "running") pause();
        else if (status === "paused") {
          resume();
          note.textContent = "继续探索。";
        }
      }
      if (action === "finish") finish(performance.now());
      if (action === "interact") nearby();
      if (status !== "running" || !map.contains(event.target)) return;
      const point = points.find(({ id }) => id === control?.dataset.point);
      if (point) {
        target = { x: point.x, y: point.y, point };
        map.focus({ preventScroll: true });
      } else if (!control) {
        const rect = map.getBoundingClientRect();
        target = moveOnAsteroid(
          { x: 0, y: 0 },
          ((event.clientX - rect.left) / rect.width) * 100,
          ((event.clientY - rect.top) / rect.height) * 100,
        );
      }
    },
    { signal },
  );

  map.addEventListener(
    "keydown",
    (event) => {
      if (
        status !== "running" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      const key = event.key.toLowerCase();
      if (Object.hasOwn(directions, key)) {
        event.preventDefault();
        if (!activeKeys.has(key))
          move(...directions[key].map((axis) => axis * 2));
        activeKeys.add(key);
        target = null;
      } else if (event.key === " " && event.target === map) {
        event.preventDefault();
        if (!event.repeat) nearby();
      }
    },
    { signal },
  );
  window.addEventListener(
    "keyup",
    (event) => activeKeys.delete(event.key.toLowerCase()),
    { signal },
  );
  window.addEventListener("blur", () => activeKeys.clear(), { signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) pause();
    },
    { signal },
  );

  for (const button of directionButtons) {
    const key = button.dataset.direction;
    const nudge = () => {
      move(...directions[key].map((axis) => axis * 2.8));
      target = null;
    };
    button.addEventListener(
      "pointerdown",
      (event) => {
        if (status !== "running" || event.button !== 0) return;
        held.set(event.pointerId, key);
        button.setPointerCapture(event.pointerId);
        nudge();
      },
      { signal },
    );
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) {
      button.addEventListener(event, (event) => held.delete(event.pointerId), {
        signal,
      });
    }
    button.addEventListener(
      "click",
      (event) => {
        if (!event.detail && status === "running") nudge();
      },
      { signal },
    );
  }

  signal.addEventListener("abort", stopLoop, { once: true });
  reset();
  return { reset };
}
