import { doorEvents, journalRules, potatoStory } from "./content.js";

const button = (label, action, value = "", color = "plain") =>
  `<button class="pill ${color}" type="button" data-game="${action}" data-value="${value}">${label}</button>`;

function potatoChoices(stage) {
  const scene = potatoStory[stage];
  if (scene.title)
    return `<strong class="game-ending">${scene.icon} ${scene.title}</strong><p>${scene.text}</p>${button("重新开始", "potato-start")}`;
  return `<p class="game-prompt">${scene.text}</p><div class="game-options">${scene.choices.map(([label, next]) => button(label, "potato-choice", next)).join("")}</div>`;
}

function writtenNote(placeholder, label = "写下一句") {
  return `<form class="idea-form" data-form="experience"><label for="idea-answer">${label}</label><div>
    <input id="idea-answer" name="answer" placeholder="${placeholder}" maxlength="120" required>
    <button type="submit" class="pill plain">递纸条</button></div></form>`;
}

export function renderGame(item, reduced, unlocked) {
  if (item.unlock && !unlocked(item.unlock)) {
    return '<p>把研究所的按钮按到 50 次，纸箱才会开门。</p><a href="/lab" class="pill plain">去研究所</a>';
  }
  switch (item.mode) {
    case "link":
      return `<a href="${item.route}" class="pill plain">去玩玩</a>`;
    case "potato":
      return `<div id="potato-story">${potatoChoices("start")}</div>
        <details class="potato-note"><summary>给土豆留句话</summary>${writtenNote("对土豆说…", "人生的意义是什么？")}</details>`;
    case "door":
      return `<div class="game-options">${button("试着关上它", "door")}</div><div id="door-event" class="door-event"></div>`;
    case "catch":
      return `<div class="game-hud"><span>时间 <strong id="catch-time">15</strong> 秒</span><span>抓到 <strong id="catch-score">0</strong> 次</span></div>
        <div class="catch-field" id="catch-field" aria-label="抓聊绒游戏区域">
          <button class="catch-target" type="button" data-game="catch-hit" aria-label="抓住聊绒" hidden><img src="/assets/loro.webp" width="64" height="68" alt="" draggable="false"></button>
          <p id="catch-hint">开始后，点到聊绒就得分。也可以按空格或回车。</p>
        </div><div class="game-options">${button("开始游戏", "catch-start", "", "lime")}</div>`;
    case "fish":
      return `<p class="game-hud"><span>投篮 <strong id="fish-shots">0</strong> / 5</span><span>命中 <strong id="fish-score">0</strong></span></p>
        <div class="fish-court" id="fish-court" aria-hidden="true"><b>🏀</b><span>▤</span></div>
        <p class="game-hint" id="fish-hint">${reduced ? "把力度调到 40–60，再投篮。" : "球经过中间刻线时投篮。"}</p>
        <div class="fish-meter" aria-hidden="true" ${reduced ? "hidden" : ""}><i></i></div>
        <label id="fish-manual" ${reduced ? "" : "hidden"}>投篮力度 <output id="fish-power-value">0</output><input id="fish-power" type="range" min="0" max="100" value="0"></label>
        <div class="game-options">${button("投篮！", "fish")}${button("手动瞄准", "fish-mode")}</div>`;
    case "journal":
      return writtenNote(item.placeholder);
    case "duck":
      return button(item.action, "duck");
    case "refuse":
      return `<div id="refusal" class="game-options">${button("请开始工作", "refuse", "order")}</div>`;
    case "waste":
      return `<div class="waste-gauge"><label for="waste-progress">浪费了 <strong id="waste-time">0.0</strong> / 8 秒</label><progress id="waste-progress" max="8" value="0"></progress></div>
        <div class="game-options">${button("开机", "waste-toggle")}${button("归零", "waste-reset")}</div>`;
    case "calculator":
      return `<form class="calc-form" data-form="calculator">
        <label>第一个数<input name="first" type="number" step="any" min="-9999" max="9999" required></label>
        <label>运算<select name="operator"><option value="+">加</option><option value="-">减</option><option value="*">乘</option><option value="/">除</option></select></label>
        <label>第二个数<input name="second" type="number" step="any" min="-9999" max="9999" required></label>
        <button class="pill plain" type="submit">计算</button></form>`;
    case "echo":
      return `<label class="echo-tuner">频率 <output id="echo-frequency">0</output><input id="echo-knob" type="range" min="0" max="100" value="0"></label>
        <p class="game-hint">便条上写着「四十附近有声音」。</p>${button("收听", "echo")}`;
    default:
      return button(item.action, "reveal");
  }
}

const pick = (items) => items[Math.floor(Math.random() * items.length)];

export function createGame({
  item,
  root,
  saved,
  finish,
  discover,
  thought,
  reduceMotion,
  feedback,
}) {
  const $ = (selector) => root.querySelector(selector);
  const art = $(".random-art");
  let timer;
  let duck = "waiting-for-start";
  let stage = "start";
  let doorPresses = 0;
  let secretSeen = false;
  let doorDeck = doorEvents.slice(0, -1);
  let lastRoom;
  let lastReveal;
  let target;
  let catchEnd = 0;
  let catchScore = 0;
  let lastPosition = -1;
  let shots = 0;
  let baskets = 0;
  let manualFish = reduceMotion();
  let wasteStart = null;
  let wasted = 0;

  function stop() {
    clearInterval(timer);
    clearTimeout(timer);
    timer = null;
  }

  function reply(message) {
    $("#activity-result").textContent = message;
  }

  function picture(symbol, color) {
    art.dataset.outcome = color;
    let badge = $(".outcome-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "outcome-badge";
      badge.setAttribute("aria-hidden", "true");
      art.append(badge);
    }
    badge.textContent = symbol;
  }

  function setStage(next) {
    stage = next;
    const scene = potatoStory[stage];
    $("#potato-story").innerHTML = potatoChoices(stage);
    $("#potato-story button").focus({ preventScroll: true });
    if (scene.title) {
      saved.potatoes++;
      picture(scene.icon, scene.color);
      thought("potato");
      finish(item.id);
      reply("结局：" + scene.title);
    } else {
      art.removeAttribute("data-outcome");
      $(".outcome-badge")?.remove();
      reply(stage === "start" ? "" : scene.text);
    }
  }

  function openDoor(control) {
    doorPresses++;
    control.textContent = doorPresses === 1 ? "再试着关上它" : "再打开看看";
    feedback($(".random-art img"), "door-swing", 550);
    let event;
    if (
      !secretSeen &&
      (doorPresses === 6 || (doorPresses >= 4 && Math.random() < 0.14))
    ) {
      secretSeen = true;
      event = doorEvents.at(-1);
      saved.rooms++;
      discover("door-person");
    } else {
      if (!doorDeck.length) doorDeck = doorEvents.slice(0, -1);
      const alternatives = doorDeck.filter((room) => room !== lastRoom);
      event = pick(alternatives.length ? alternatives : doorDeck);
      doorDeck.splice(doorDeck.indexOf(event), 1);
    }
    lastRoom = event;
    const room = $("#door-event");
    room.className = "door-event room-" + event.color;
    room.innerHTML = `<strong>${event.art ? '<img src="/assets/loro.webp" width="40" height="40" alt="">' : `<span aria-hidden="true">${event.icon}</span>`} ${event.title}</strong><p>${event.text}</p>`;
    if (event.icon) picture(event.icon, event.color);
    else {
      art.removeAttribute("data-outcome");
      $(".outcome-badge")?.remove();
    }
    reply("门后出现了" + event.title + "。");
    finish(item.id);
  }

  function moveTarget() {
    const positions = [
      [0.14, 0.24],
      [0.53, 0.17],
      [0.88, 0.26],
      [0.78, 0.76],
      [0.43, 0.84],
      [0.11, 0.74],
      [0.48, 0.48],
    ];
    const choices = positions
      .map((_, index) => index)
      .filter((index) => index !== lastPosition);
    lastPosition = pick(choices);
    const [x, y] = positions[lastPosition];
    target.style.setProperty("--catch-x", x);
    target.style.setProperty("--catch-y", y);
  }

  function catchTick() {
    const timeLeft = Math.ceil(
      Math.max(0, catchEnd - performance.now()) / 1000,
    );
    const clock = $("#catch-time");
    if (clock.textContent !== String(timeLeft)) clock.textContent = timeLeft;
    if (timeLeft > 0) return true;
    stop();
    const hadFocus = document.activeElement === target;
    target.hidden = true;
    $("#catch-hint").hidden = false;
    $("#catch-hint").textContent = "这一轮抓到 " + catchScore + " 次。";
    const start = $('[data-game="catch-start"]');
    start.disabled = false;
    start.textContent = "再玩一轮";
    if (hadFocus) start.focus({ preventScroll: true });
    const line =
      catchScore <= 2
        ? "聊绒今天跑得真快。"
        : catchScore <= 5
          ? "不错，你有点本事。"
          : catchScore <= 9
            ? "聊绒开始认真了。"
            : "你是不是偷偷练习过？";
    saved.games.catchRounds++;
    saved.games.catchBest = Math.max(saved.games.catchBest, catchScore);
    finish(item.id);
    reply("抓到 " + catchScore + " 次。" + line);
    return false;
  }

  function startCatch(control) {
    stop();
    catchScore = 0;
    catchEnd = performance.now() + 15_000;
    lastPosition = -1;
    $("#catch-score").textContent = "0";
    $("#catch-time").textContent = "15";
    $("#catch-hint").hidden = true;
    target = $(".catch-target");
    target.hidden = false;
    control.disabled = true;
    moveTarget();
    target.focus({ preventScroll: true });
    reply("开始！聊绒会跑来跑去。");
    timer = setInterval(catchTick, 160);
  }

  function fishMode() {
    $(".fish-meter").hidden = manualFish;
    $("#fish-manual").hidden = !manualFish;
    $("#fish-hint").textContent = manualFish
      ? "把力度调到 40–60，再投篮。"
      : "球经过中间刻线时投篮。";
    $('[data-game="fish-mode"]').textContent = manualFish
      ? "切换到时机瞄准"
      : "手动瞄准";
    $('[data-game="fish-mode"]').hidden = reduceMotion();
  }

  function shoot(control) {
    if (shots >= 5) return;
    const field = $(".fish-meter");
    const bounds = field.getBoundingClientRect();
    const marker = field.firstElementChild.getBoundingClientRect();
    const power = manualFish
      ? Number($("#fish-power").value) / 100
      : (marker.left + marker.width / 2 - bounds.left) / bounds.width;
    const hit = manualFish
      ? power >= 0.4 && power <= 0.6
      : power >= 0.35 && power <= 0.65;
    shots++;
    if (hit) baskets++;
    $("#fish-shots").textContent = shots;
    $("#fish-score").textContent = baskets;
    feedback($("#fish-court"), hit ? "fish-hit" : "fish-miss", 440);
    if (shots === 5) {
      saved.games.fishRounds++;
      saved.games.fishBest = Math.max(saved.games.fishBest, baskets);
      finish(item.id);
      control.textContent = "本轮结束";
      control.setAttribute("aria-disabled", "true");
      reply(
        `第 5 球${hit ? "命中" : "未进"}。最终成绩 ${baskets} / 5。金鱼已经把比分记在泡泡上了。`,
      );
    } else {
      reply(hit ? "球进了！" : "没进。下一球再调整一下。");
    }
  }

  function wasteTick() {
    const elapsed = Math.min(
      8,
      wasted +
        (wasteStart === null ? 0 : (performance.now() - wasteStart) / 1000),
    );
    $("#waste-time").textContent = elapsed.toFixed(1);
    $("#waste-progress").value = elapsed;
    if (elapsed < 8) return;
    wasted = elapsed;
    wasteStart = null;
    stop();
    $('[data-game="waste-toggle"]').textContent = "再开一次";
    reply("记录显示，八秒钟被折成了两片四秒钟。");
    finish(item.id);
  }

  function resetWaste() {
    stop();
    wasteStart = null;
    wasted = 0;
    $('[data-game="waste-toggle"]').textContent = "开机";
    wasteTick();
    reply("");
  }

  function toggleWaste(control) {
    if (wasteStart !== null) {
      wasted += (performance.now() - wasteStart) / 1000;
      wasteStart = null;
      stop();
      control.textContent = "继续";
      wasteTick();
      return;
    }
    if (wasted >= 8) resetWaste();
    wasteStart = performance.now();
    control.textContent = "暂停";
    timer = setInterval(wasteTick, 100);
    reply("机器确认，时间正在正常地被浪费。");
  }

  function refusal(choice) {
    const panel = $("#refusal");
    if (choice === "order") {
      reply("按钮：拒绝上班。除非你先问问我想不想。");
      panel.innerHTML =
        button("你愿意帮忙吗？", "refuse", "ask") +
        button("那休息吧", "refuse", "rest");
    } else {
      reply(
        choice === "ask"
          ? "按钮考虑后说：愿意帮你按一次。咔哒！"
          : "按钮给自己放了假，顺手给你批了一天。",
      );
      picture(
        choice === "ask" ? "✓" : "☾",
        choice === "ask" ? "lime" : "purple",
      );
      finish(item.id);
      panel.innerHTML = button("再商量一次", "refuse", "order");
    }
    panel.firstElementChild.focus({ preventScroll: true });
  }

  function doDuck(control) {
    if (duck === "ready") {
      duck = "waiting-for-start";
      control.textContent = "再等一次";
      reply("鸭子：嘎。它决定和你并列第一。");
      finish(item.id);
    } else if (duck === "waiting") {
      stop();
      duck = "waiting-for-start";
      control.textContent = "再试一次";
      reply("抢答了！鸭子还没准备好。");
    } else {
      duck = "waiting";
      control.textContent = "我等不及了";
      reply("嘘，鸭子在酝酿……");
      timer = setTimeout(
        () => {
          duck = "ready";
          control.textContent = "嘎！";
          reply("鸭子：嘎！轮到你了。");
        },
        2200 + Math.random() * 2300,
      );
    }
  }

  function reveal() {
    lastReveal =
      pick(item.replies.filter((line) => line !== lastReveal)) ||
      item.replies[0];
    reply(lastReveal);
    if (item.id === "secret") {
      thought("secret");
      discover("loro-secret");
    }
    finish(item.id);
  }

  const actions = {
    "potato-start": () => setStage("start"),
    "potato-choice": (control) => {
      const next = control.dataset.value;
      if (potatoStory[stage].choices?.some(([, value]) => value === next))
        setStage(next);
    },
    door: openDoor,
    "catch-start": startCatch,
    "catch-hit": () => {
      if (!timer || !catchTick()) return;
      $("#catch-score").textContent = ++catchScore;
      moveTarget();
    },
    fish: shoot,
    "fish-mode": () => {
      manualFish = !manualFish;
      fishMode();
    },
    duck: doDuck,
    refuse: (control) => refusal(control.dataset.value),
    "waste-toggle": toggleWaste,
    "waste-reset": resetWaste,
    echo: () => {
      const frequency = Number($("#echo-knob").value);
      if (Math.abs(frequency - 42) > 3) {
        reply(
          frequency < 42
            ? "只有沙沙声。试试更高一点。"
            : "声音飞太远了。再低一点。",
        );
        return;
      }
      picture("♫", "purple");
      reply("回声电台说：今天的节目，是三秒钟的安静。");
      finish(item.id);
    },
    reveal,
  };

  return {
    handle(control) {
      actions[control.dataset.game]?.(control);
    },
    stop,
    motionChanged() {
      if (item.mode !== "fish") return;
      if (reduceMotion()) manualFish = true;
      fishMode();
    },
    submit(form) {
      const data = new FormData(form);
      if (form.dataset.form === "calculator") {
        const a = Number(data.get("first"));
        const b = Number(data.get("second"));
        const op = data.get("operator");
        if (op === "/" && b === 0)
          return reply("零把这道题吃掉了。换个除数吧。");
        const results = {
          "+": [a + b, "朵云"],
          "-": [a - b, "个午睡借口"],
          "*": [a * b, "粒星星灰"],
          "/": [a / b, "格无聊时间"],
        };
        const [number, unit] = results[op];
        reply(
          new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 4 }).format(
            number,
          ) +
            " " +
            unit +
            "。算完了，意义待定。",
        );
        finish(item.id);
        return;
      }

      const answer = data.get("answer").trim();
      if (!answer) return $("#idea-answer").focus();
      if (item.mode === "potato") {
        const line = /钱|工资|银行/.test(answer)
          ? "土豆说：那我应该先去找个泥土银行吗？"
          : /吃|好吃|薯条/.test(answer)
            ? "土豆突然对这个话题失去了兴趣。"
            : "土豆点了点头。至少它的枕头点头了。";
        reply(line);
        return;
      }
      const match =
        item.id === "cloud" &&
        journalRules.find(([pattern]) => pattern.test(answer));
      if (match) {
        const [, line, symbol, color] = match;
        picture(symbol, color);
        reply(line);
      } else {
        picture(item.icon, item.color);
        reveal();
      }
      thought(item.id);
      finish(item.id);
    },
  };
}
