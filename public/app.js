import { categories, experiences, taskCategories, tasks } from "./content.js";

const $ = (selector, root = document) => root.querySelector(selector);
const main = $("#main");
const dialog = $("#dialog");
const assets = "/assets/";
const storageKey = "wuliao-universe-v1";
const defaults = {
  presses: 0,
  potatoes: 0,
  rooms: 0,
  tasks: 0,
  seconds: 0,
  stars: [],
  favorites: [],
  visited: [],
  planet: "",
  hat: 0,
  motion: false,
};
let saved = { ...defaults };
try {
  const previous = JSON.parse(localStorage.getItem(storageKey));
  if (previous && typeof previous === "object")
    saved = { ...defaults, ...previous };
} catch {}
const save = () => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(saved));
  } catch {}
};
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const getItem = (id) => experiences.find((experience) => experience.id === id);
const art = (name, css = "") =>
  '<img class="' +
  css +
  '" src="' +
  assets +
  name +
  '.webp" alt="" draggable="false">';
const pageNames = {
  "/": "互联网发呆游乐场",
  "/random": "随机玩意",
  "/lab": "没用的东西研究所",
  "/space-daze": "宇宙发呆中心",
  "/fortune": "随机命运分配局",
  "/collection": "奇怪合集",
  "/archive": "无聊档案",
};
const hats = [
  { name: "睡帽", mark: "♡" },
  { name: "魔法帽", mark: "✦" },
  { name: "圣诞帽", mark: "❋" },
  { name: "奇怪的帽子", mark: "？" },
];
const stars = [
  { id: "first", x: 22, y: 38, label: "奶油星", symbol: "★" },
  { id: "second", x: 39, y: 59, label: "发呆星", symbol: "✦" },
  { id: "third", x: 59, y: 49, label: "好奇星", symbol: "★" },
  { id: "fourth", x: 73, y: 70, label: "晚安星", symbol: "✦" },
  { id: "fifth", x: 13, y: 65, label: "慢吞吞星", symbol: "✧" },
];

let currentPath;
let item;
let category = "全部";
let order = "推荐";
let pressesOnHome = 0;
let labMessage = "试试看。反正按钮自己也很好奇。";
let activity = {};
let idleTimer;
let idleSequence = 0;
let notificationTimer;
let rollTimer;
let taskType = "all";
let taskIndex = null;
let taskDone = false;
let soundSession;
let spacePositions = {};
let drag;
let pickedStar;
let interactionTimer;

function posterMark() {
  return '<span class="poster-mark" aria-hidden="true">✳</span>';
}

function artPanel(experience) {
  return experience.art
    ? art(experience.art)
    : '<span aria-hidden="true">' + experience.icon + "</span>";
}

function card(experience) {
  return `<a class="experience-card ${experience.color}" href="/random?id=${experience.id}">
    <div class="card-art">${artPanel(experience)}</div>
    <div class="card-copy"><small>${experience.type} · ${experience.time}</small><h3>${experience.title}</h3><p>${experience.intro}</p></div>
    <span class="card-arrow" aria-hidden="true">↗</span>
  </a>`;
}

function home() {
  return `<section class="home-scene" aria-labelledby="hero-title">
    <div class="poster">
      <div class="poster-top"><span><i></i> 点一下「你好」试试</span><span>WULIAO UNIVERSE</span></div>
      <div class="word-stack hello-stack">
        <button class="word hello one" type="button" data-action="hello">你好</button>
        <button class="word hello two" type="button" data-action="hello">你好</button>
        <button class="word hello three" type="button" data-action="hello">你好</button>
      </div>
      <div class="word-stack bored-stack">
        <button class="word bored one" type="button" data-action="bored">无聊</button>
        <button class="word bored two" type="button" data-action="bored">无聊</button>
        <button class="word bored three" type="button" data-action="bored">无聊</button>
      </div>
      <span class="doodle home-star" aria-hidden="true">☆</span><span class="doodle home-twinkle" aria-hidden="true">✧</span>
      <span class="doodle home-orbit" aria-hidden="true">⌁</span><span class="doodle home-question" aria-hidden="true">?!</span>
      <button type="button" class="post-it home-note" data-action="secret">别点我了！<br>…真的！</button>
      <aside class="home-aside">试试抓住「无聊」。<br>它会躲开鼠标。<span aria-hidden="true">↝</span></aside>
      <div class="hero-center">
        <button class="hero-mascot" type="button" data-action="mascot" aria-label="拍拍聊绒">${art("loro")}</button>
        <div class="speech" id="hero-speech"><h1 id="hero-title">你在干嘛？</h1><span aria-hidden="true"></span></div>
        <a href="/random" class="pill pink hero-cta">我无聊死了 <b aria-hidden="true">✹</b></a>
        <p class="hero-caption" id="home-reply" aria-live="polite">点击看看会发生什么…？</p>
      </div>
      <a class="side-cta" href="/random">再来一个<br>奇怪的东西 <span aria-hidden="true">↗</span></a>
      <a class="scroll-cue" href="#playground" aria-label="往下看看">⌄</a>
    </div>
  </section>
  <section id="playground" class="body-section playground">
    <div class="section-heading"><div><p class="eyeline">✦ 随便点一点</p><h2>今天想浪费一点什么？</h2></div><a class="text-link" href="/collection">逛逛奇怪合集</a></div>
    <div class="portal-grid">
      <a class="portal pink" href="/lab"><small>无聊实验</small>${art("button")}<h3>没用的东西研究所</h3><p>这里的实验，一个比一个没用。</p></a>
      <a class="portal purple" href="/space-daze"><small>慢慢来</small>${art("planet")}<h3>宇宙发呆中心</h3><p>什么都不用做，也挺好的。</p></a>
      <a class="portal lime" href="/fortune"><small>随机挑战</small>${art("machine")}<h3>随机命运分配局</h3><p>抽一件微不足道又挺有意思的事。</p></a>
    </div>
  </section>`;
}

function lab() {
  return `<section class="body-section lab-page">
    <div class="lab-grid">
      <div class="lab-intro">
        <p class="eyeline">⚗ 无聊实验</p>
        <h1 class="display tilted"><span class="marker lime">没用的东西</span><br><span class="marker pink">研究所</span></h1>
        <p>专门研究「没用但超有意思」的东西。</p>
        <div class="post-it checklist">☑ 没有功能<br>☑ 也许什么都不会发生<br>☑ 但就是很想按！</div>
      </div>
      <div class="lab-machine" id="lab-machine">
        ${art("loro", "lab-mascot")}
        <span class="doodle lab-spark" aria-hidden="true">✷</span>
        <button class="machine-button" type="button" data-action="lab-press">${art("button")}<span>千万不要按</span></button>
        <span class="machine-plate">没用的东西研究所 · 实验 001</span>
      </div>
      <aside class="lab-notes">
        <div class="lab-counter">你已经按了 <strong id="press-count">${saved.presses}</strong> 次</div>
        <div class="scrap"><h2>按下后可能发生</h2><ul><li>✧ 屏幕轻轻抖一下</li><li>♫ 听见聊绒说「叮」</li><li>✸ 解锁一张奇怪证书</li><li>☉ 又或者只是次数 +1</li></ul></div>
        <label class="sound-check"><input type="checkbox" data-change="lab-sound" ${labSound ? "checked" : ""}>允许按钮发出提示音</label>
      </aside>
    </div>
    <div class="experiment-status" role="status" id="lab-status">${esc(labMessage)}</div>
    <div class="section-heading lab-heading"><h2><span class="marker lime">精选实验</span></h2><a class="text-link" href="/collection?type=无聊实验">查看实验合集</a></div>
    <div class="card-grid lab-cards">${["potato", "door", "fish", "cloud"].map((id) => card(getItem(id))).join("")}</div>
  </section>`;
}

function space() {
  return `<section class="space-scene" aria-labelledby="space-title">
    <div class="space-stage" id="space-stage">
      <header class="space-title"><h1 id="space-title">宇宙发呆中心</h1><p>什么都不用做。</p></header>
      <aside class="star-note"><strong>拖动星星</strong><small>点一下，就能收藏。</small></aside>
      ${stars
        .map((star) => {
          const position = spacePositions[star.id] || star;
          return `<button class="space-star" type="button" data-action="star" data-id="${star.id}" aria-label="${star.label}，收藏到星星罐" style="--x:${position.x}%;--y:${position.y}%">${star.symbol}</button>`;
        })
        .join("")}
      <div class="planet-station">
        ${art("planet")}
        <form data-form="planet"><label for="planet-name">给星球取个名字</label><div><input id="planet-name" name="name" maxlength="14" placeholder="它叫…？" value="${esc(saved.planet)}"><button type="submit" aria-label="保存星球名字">✎</button></div></form>
      </div>
      <div class="moon-station"><p>给月亮戴帽子</p><div class="moon-art" aria-hidden="true"><span class="moon-hat hat-${saved.hat}">${hats[saved.hat].mark}</span>${art("moon", "moon-face")}</div>
        <div class="hat-list" role="group" aria-label="月亮的帽子">${hats.map((hat, index) => `<button class="hat-option hat-${index}" type="button" data-action="hat" data-id="${index}" aria-label="${hat.name}" aria-pressed="${saved.hat === index}">${hat.mark}</button>`).join("")}</div>
      </div>
      <div class="space-player">
        <button type="button" class="pill pink" data-action="space-sound" aria-pressed="${Boolean(soundSession?.ambient)}">${soundSession?.ambient ? "Ⅱ 暂停发呆音" : "▷ 一起发呆"}</button>
        <button type="button" class="jar-link" data-action="jar">星星收藏罐 <span id="star-count">${saved.stars.length}</span></button>
      </div>
    </div>
  </section>`;
}

function fortune() {
  const selected = tasks[taskIndex ?? 0];
  const type = taskCategories.find((entry) => entry.id === selected.type);
  return `<section class="body-section fortune-page">
    <div class="fortune-grid">
      <div class="fortune-intro">
        <p class="eyeline">✷ 随机命运分配局</p>
        <h1 class="display tilted"><span class="marker lime">今天你应该</span><br><span class="marker pink">干什么？</span></h1>
        <p>把今天交给命运。它说，做一点小事就好。</p>
        <button class="pill pink" type="button" data-action="roll">给我安排点事做 <span aria-hidden="true">✹</span></button>
      </div>
      <div class="fortune-machine" id="fortune-machine">
        ${art("machine")}
        <span class="doodle fortune-spark" aria-hidden="true">✧</span>
        <div class="task-card ${type.color}" id="task-card" aria-live="polite">
          <small>${taskIndex === null ? "你的任务会出现在这里" : type.name}</small>
          <strong>${taskIndex === null ? "好像有什么要掉出来了…" : selected.text}</strong>
          <span aria-hidden="true">${taskIndex === null ? "？" : selected.icon}</span>
          ${taskIndex !== null && selected.route ? `<a href="${selected.route}">现在去做</a>` : ""}
        </div>
      </div>
      <aside class="task-pool scrap">
        <h2>任务池</h2><p>选个口味，交给运气。</p>
        ${taskCategories.map((type) => `<button type="button" class="task-filter ${type.color}" data-action="task-filter" data-id="${type.id}" aria-pressed="${taskType === type.id}"><span aria-hidden="true">${type.icon}</span><span><strong>${type.name}</strong><small>${type.description}</small></span></button>`).join("")}
        <button class="text-button all-tasks" type="button" data-action="task-filter" data-id="all" aria-pressed="${taskType === "all"}">全部混在一起</button>
      </aside>
    </div>
    <div class="fortune-actions">
      <button type="button" class="pill lime" data-action="task-done" ${taskIndex === null || taskDone ? "disabled" : ""}>${taskDone ? "✓ 已完成，我真棒！" : "☆ 完成了，我真棒！"}</button>
      <button type="button" class="pill plain" data-action="roll">↻ 不干，换一个</button>
      <button type="button" class="text-button" data-action="share-task" ${taskIndex === null ? "disabled" : ""}>分享任务</button>
    </div>
  </section>`;
}

function randomPage() {
  if (!item)
    return `<section class="body-section empty"><h1 class="display">随机玩意</h1><p>这个分类暂时空空的。</p><button class="pill pink" data-action="next">随便来一个</button></section>`;
  return `<section class="body-section random-page">
    <div class="section-heading"><div><p class="eyeline">✦ 随机探索</p><h1 class="display"><span class="marker lime">随机玩意</span></h1></div><label class="select-label">选个类型<select data-change="random-filter">${categories.map((name) => `<option ${name === category ? "selected" : ""}>${name}</option>`).join("")}</select></label></div>
    <article class="random-card ${item.color}">
      <div class="random-art">${artPanel(item)}${posterMark()}</div>
      <div class="random-copy"><small>${item.type} · ${item.time}</small><h2>${item.title}</h2><p>${item.intro}</p>
        ${experienceControls(item)}
        <p class="result" id="activity-result" role="status">${esc(activity.result)}</p>
      </div>
    </article>
    <div class="random-actions">
      <button class="pill pink" type="button" data-action="next">再来一个奇怪的东西 <span aria-hidden="true">✦</span></button>
      ${item.route ? "" : '<button type="button" class="pill plain" data-action="retry">再玩一次</button>'}
      <button type="button" class="pill plain" data-action="favorite" aria-pressed="${saved.favorites.includes(item.id)}">${saved.favorites.includes(item.id) ? "★ 已收藏" : "☆ 收藏这个"}</button>
      <button type="button" class="text-button" data-action="share-item">分享给朋友</button>
    </div>
  </section>`;
}

function experienceControls(experience) {
  if (experience.route)
    return `<a href="${experience.route}" class="pill plain">去玩玩</a>`;
  if (experience.id === "potato" || experience.placeholder) {
    const potato = experience.id === "potato";
    return `<form class="idea-form" data-form="experience"><label for="idea-answer">${potato ? "人生的意义是什么？" : "写下一句"}</label><div>
      <input id="idea-answer" name="answer" placeholder="${experience.placeholder || "对土豆说…"}" maxlength="120" required>
      <button type="submit" class="pill plain">递纸条</button></div></form>
      ${potato ? '<button class="text-button idea-example" data-action="potato-example" type="button">替我随便答一句</button>' : ""}`;
  }
  if (experience.id === "fish")
    return `<div class="fish-meter" aria-hidden="true"><i></i></div><button type="button" class="pill plain" data-action="experience">投篮！</button>`;
  const action =
    {
      door: activity.door ? "再试着关上它" : "试着关上它",
      duck: activity.duck === "ready" ? "嘎！" : experience.action,
    }[experience.id] || experience.action;
  return `<button type="button" class="pill plain" data-action="experience">${action}</button>`;
}

function collection() {
  let shown =
    category === "全部"
      ? [...experiences]
      : experiences.filter((entry) => entry.type === category);
  if (order === "热门") shown.sort((a, b) => b.rank - a.rank);
  if (order === "最新") shown.reverse();
  return `<section class="body-section collection-page">
    <div class="section-heading"><div><p class="eyeline">✸ 脑洞存放处</p><h1 class="display"><span class="marker lime">奇怪合集</span></h1><p>收留没有地方可去的奇怪念头。</p></div><a class="pill plain" href="/archive#favorites">看我的收藏</a></div>
    <div class="collection-controls"><div class="chips" aria-label="按类型筛选">${categories.map((name) => `<button type="button" data-action="collection-filter" data-id="${name}" aria-pressed="${category === name}">${name}</button>`).join("")}</div>
    <label class="select-label">排序<select data-change="collection-order">${["推荐", "热门", "最新"].map((name) => `<option ${name === order ? "selected" : ""}>${name}</option>`).join("")}</select></label></div>
    <div class="card-grid">${shown.map(card).join("")}</div>
  </section>`;
}

function archive() {
  const favoriteItems = saved.favorites.map(getItem).filter(Boolean);
  const duration =
    saved.seconds < 60
      ? saved.seconds + " 秒"
      : Math.floor(saved.seconds / 60) + " 分钟";
  const stats = [
    [saved.presses, "按过按钮"],
    [saved.potatoes, "帮过土豆"],
    [saved.rooms, "发现秘密房间"],
    [saved.tasks, "完成命运任务"],
    [saved.stars.length, "收藏星星"],
    [duration, "在宇宙里"],
  ];
  return `<section class="body-section archive-page">
    <div class="section-heading"><div><p class="eyeline">✦ 聊绒的记录本</p><h1 class="display"><span class="marker pink">我的无聊档案</span></h1><p>你花在奇怪念头上的时间，都记在这个浏览器里。</p></div>${art("loro", "archive-loro")}</div>
    <div class="stat-grid">${stats.map(([count, label]) => `<div><strong>${count}</strong><span>${label}</span></div>`).join("")}</div>
    <div class="certificate-strip"><div><h2>${saved.presses >= 28 ? "优秀按钮按压员" : "国际无聊组织认证证书"}</h2><p>今天也给无聊留了一点位置。</p></div><button type="button" class="pill pink" data-action="certificate">领取我的证书</button></div>
    <section id="favorites"><div class="section-heading"><h2>我的收藏</h2><a href="/collection" class="text-link">去逛合集</a></div>
      ${favoriteItems.length ? '<div class="card-grid">' + favoriteItems.map(card).join("") + "</div>" : '<p class="empty-note">这里还空着。下次玩到喜欢的东西，就把它收进来。</p>'}
    </section>
  </section>`;
}

function missing() {
  return `<section class="body-section empty">${art("loro")}<h1>你掉进一个纸箱了。</h1><p>聊绒找遍了纸箱，也没找到这一页。</p><a class="pill lime" href="/">回无聊宇宙</a></section>`;
}

const pages = {
  "/": home,
  "/lab": lab,
  "/space-daze": space,
  "/fortune": fortune,
  "/random": randomPage,
  "/collection": collection,
  "/archive": archive,
};

function nextExperience(filter) {
  const eligible = experiences.filter(
    (entry) => filter === "全部" || filter === entry.type,
  );
  const withoutCurrent = eligible.filter((entry) => entry.id !== item?.id);
  const fresh = withoutCurrent.filter(
    (entry) => !saved.visited.includes(entry.id),
  );
  return pick(
    fresh.length ? fresh : withoutCurrent.length ? withoutCurrent : eligible,
  );
}

function render() {
  main.innerHTML = (pages[currentPath] || missing)();
  document.documentElement.dataset.page =
    currentPath === "/space-daze" ? "space" : "";
  document.title = "无聊宇宙 · " + (pageNames[currentPath] || "迷路了");
  document.querySelectorAll(".nav a, .archive-link").forEach((link) => {
    if (link.pathname === currentPath)
      link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  updateMotion();
  scheduleIdle(true);
}

function openRoute(fromNavigation = false) {
  if (currentPath === "/space-daze" && location.pathname !== currentPath)
    stopAmbient();
  currentPath = location.pathname.replace(/\/$/, "") || "/";
  const params = new URLSearchParams(location.search);
  category = categories.includes(params.get("type"))
    ? params.get("type")
    : "全部";
  clearTimeout(rollTimer);
  rollTimer = null;
  clearTimeout(interactionTimer);
  if (currentPath === "/random") {
    activity = {};
    item = getItem(params.get("id")) || nextExperience(category);
    saved.visited = [
      ...saved.visited.filter((id) => id !== item.id).slice(-5),
      item.id,
    ];
    save();
  }
  if (currentPath === "/fortune") {
    const shared = params.get("task");
    if (shared !== null && /^\d+$/.test(shared) && tasks[Number(shared)]) {
      taskIndex = Number(shared);
      taskDone = false;
    }
  }
  if (dialog.open) dialog.close();
  $("#nav").classList.remove("open");
  $(".menu-toggle").setAttribute("aria-expanded", "false");
  render();
  if (location.hash)
    document.getElementById(location.hash.slice(1))?.scrollIntoView();
  else if (fromNavigation) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
}

function navigate(href) {
  history.pushState(null, "", href);
  openRoute(true);
}

function announce(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => toast.classList.remove("visible"), 3800);
}

function scheduleIdle(reset = false) {
  clearTimeout(idleTimer);
  if (currentPath !== "/" || document.hidden) return;
  if (reset) idleSequence = 0;
  idleTimer = setTimeout(
    () => {
      const lines = ["喂。", "你还在吗？", "算了，我们一起发呆吧。"];
      $("#home-reply").textContent = lines[idleSequence++];
      if (idleSequence < lines.length) scheduleIdle();
    },
    idleSequence ? 4500 : 15000,
  );
}

function updateMotion() {
  document.documentElement.classList.toggle("reduce-motion", saved.motion);
  $('[data-action="motion"]').setAttribute(
    "aria-pressed",
    String(saved.motion),
  );
}

function animateOnce(element, name, duration) {
  if (!element) return;
  element.classList.remove(name);
  requestAnimationFrame(() => {
    element.classList.add(name);
    setTimeout(() => element.classList.remove(name), duration);
  });
}

function reply(text) {
  activity.result = text;
  $("#activity-result").textContent = text;
}

function potatoReply(text) {
  saved.potatoes++;
  save();
  if (/钱|工资|银行/.test(text))
    reply("土豆说：“那我是不是应该先去找个泥土银行？”");
  else if (/吃|好吃|薯条/.test(text)) reply("土豆突然对这个话题失去了兴趣。");
  else
    reply(
      pick([
        "土豆想了很久：“也许先长个芽再说。”",
        "土豆决定用接下来的一整个下午反驳你。",
        "土豆点头了。至少它的枕头点头了。",
      ]),
    );
}

function playExperience() {
  const button = $('[data-action="experience"]');
  switch (item.id) {
    case "door": {
      activity.door = (activity.door || 0) + 1;
      const count = activity.door;
      animateOnce($(".random-art img"), "door-swing", 550);
      button.textContent = "再试着关上它";
      if (count === 5) {
        saved.rooms++;
        save();
        showDialog(
          "秘密房间",
          `<div class="dialog-mascot">${art("loro")}</div><p>房间里只有一张便条：「门只是想留条缝透气。」</p>`,
        );
      }
      reply(
        count === 5
          ? "你发现了一个秘密房间！"
          : [
              "咔哒。它又开了。",
              "门假装没听见。",
              "门：能留一条缝吗？",
              "门后好像有一点光。",
            ][(count - 1) % 4],
      );
      break;
    }
    case "duck":
      if (activity.duck === "ready") {
        activity.duck = null;
        button.textContent = "再等一次";
        reply("鸭子：“嘎。” 它决定和你并列第一。");
      } else if (activity.duck === "waiting") {
        clearTimeout(interactionTimer);
        activity.duck = null;
        button.textContent = "再试一次";
        reply("抢答了！鸭子表示它还没准备好。");
      } else {
        activity.duck = "waiting";
        button.textContent = "我等不及了";
        reply("嘘，鸭子在酝酿……");
        interactionTimer = setTimeout(
          () => {
            activity.duck = "ready";
            button.textContent = "嘎！";
            reply("鸭子：“嘎！” 轮到你了。");
          },
          2200 + Math.random() * 2300,
        );
      }
      break;
    case "fish": {
      const marker = $(".fish-meter i").getBoundingClientRect();
      const bounds = $(".fish-meter").getBoundingClientRect();
      const relative =
        (marker.left + marker.width / 2 - bounds.left) / bounds.width;
      if (
        matchMedia("(prefers-reduced-motion: reduce)").matches ||
        saved.motion
      ) {
        reply("球进了！金鱼请你帮它把这一球写进自传。");
      } else {
        reply(
          relative >= 0.35 && relative <= 0.65
            ? "球进了！金鱼请你帮它把这一球写进自传。"
            : "差一点。看准中间的绿色区域再投一次。",
        );
      }
      break;
    }
    default: {
      const fresh = item.replies.filter((line) => line !== activity.result);
      reply(pick(fresh));
    }
  }
}

function pressLab() {
  const count = ++saved.presses;
  save();
  $("#press-count").textContent = count;
  const milestones = {
    1: "你按了。",
    2: "你又按了。",
    3: "你是不是没事干？",
    10: "你已经按了 10 次。",
    28: "恭喜你获得「优秀按钮按压员」称号！",
  };
  labMessage =
    milestones[count] ||
    pick([
      "好吧，只是次数 +1。",
      "刚刚按钮偷偷眨了一下眼。",
      "又一个奇怪念头被弹了出去。",
      "如果不按，它就会一直待在那里。",
    ]);
  $("#lab-status").textContent = labMessage;
  if (count === 28) certificate();
  if (count % 4 === 0) animateOnce($("#lab-machine"), "machine-shake", 420);
  else animateOnce($(".machine-button"), "button-squish", 340);
  if (labSound) playChime();
}

function getAudio() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return null;
  soundSession ||= { context: new Audio(), ambient: null };
  return soundSession.context;
}

async function playChime() {
  try {
    const context = getAudio();
    if (!context) return;
    await context.resume();
    const note = context.createOscillator();
    const volume = context.createGain();
    const time = context.currentTime;
    note.type = "sine";
    note.frequency.setValueAtTime(740, time);
    note.frequency.exponentialRampToValueAtTime(440, time + 0.15);
    volume.gain.setValueAtTime(0.065, time);
    volume.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    note.connect(volume).connect(context.destination);
    note.start(time);
    note.stop(time + 0.2);
  } catch {}
}

async function toggleAmbient(button) {
  if (soundSession?.ambient) {
    stopAmbient();
    button.textContent = "▷ 一起发呆";
    button.setAttribute("aria-pressed", "false");
    return;
  }
  if (button.disabled) return;
  button.disabled = true;
  try {
    const context = getAudio();
    if (!context) throw new Error("Audio unavailable");
    await context.resume();
    if (currentPath !== "/space-daze" || !button.isConnected) return;
    const volume = context.createGain();
    const time = context.currentTime;
    volume.gain.setValueAtTime(0, time);
    volume.gain.linearRampToValueAtTime(0.52, time + 0.7);
    volume.connect(context.destination);
    const tones = [130.81, 196, 261.63, 293.66].map((frequency, index) => {
      const note = context.createOscillator();
      const level = context.createGain();
      note.type = "sine";
      note.frequency.value = frequency;
      level.gain.value = 0.033 / (1 + index * 0.48);
      note.connect(level).connect(volume);
      note.start();
      return note;
    });
    soundSession.ambient = { volume, tones };
    button.textContent = "Ⅱ 暂停发呆音";
    button.setAttribute("aria-pressed", "true");
  } catch {
    announce("这个浏览器暂时放不了发呆音。");
  } finally {
    button.disabled = false;
  }
}

function stopAmbient() {
  const ambient = soundSession?.ambient;
  if (!ambient) return;
  const time = soundSession.context.currentTime;
  ambient.volume.gain.cancelScheduledValues(time);
  ambient.volume.gain.setTargetAtTime(0, time, 0.09);
  ambient.tones.forEach((tone) => tone.stop(time + 0.52));
  setTimeout(() => ambient.volume.disconnect(), 540);
  soundSession.ambient = null;
}

function showDialog(title, html) {
  dialog.innerHTML = `<div class="dialog-top"><h2 id="dialog-title">${title}</h2><button class="icon-button" type="button" data-action="close" aria-label="关闭">×</button></div>${html}`;
  if (!dialog.open) dialog.showModal();
}

function searchResults(value) {
  const query = value.trim().toLowerCase();
  const results = [
    ...Object.entries(pageNames)
      .slice(1)
      .map(([href, title]) => ({ href, title, subtitle: "游乐场" })),
    ...experiences.map((entry) => ({
      href: "/random?id=" + entry.id,
      title: entry.title,
      subtitle: entry.type,
      intro: entry.intro,
    })),
  ]
    .filter(
      (entry) =>
        !query ||
        [entry.title, entry.subtitle, entry.intro]
          .join(" ")
          .toLowerCase()
          .includes(query),
    )
    .slice(0, 8);
  $("#search-results").innerHTML = results.length
    ? results
        .map(
          (entry) =>
            `<a href="${entry.href}"><strong>${entry.title}</strong><small>${entry.subtitle}</small></a>`,
        )
        .join("")
    : "<p>聊绒翻了一遍，暂时没找到。</p>";
}

function certificate() {
  const title = saved.presses >= 28 ? "优秀按钮按压员" : "国际无聊组织认证证书";
  showDialog(
    "无聊认证",
    `<div class="certificate"><small>国际无聊组织</small><strong>${title}</strong>${art("loro")}<p>你已经按过 ${saved.presses} 次按钮，<br>并给无聊宇宙留了一点时间。</p></div><button class="pill pink" type="button" data-action="print">打印 / 存为 PDF</button>`,
  );
}

function showJar() {
  const contents = saved.stars
    .map((id) => stars.find((star) => star.id === id))
    .filter(Boolean);
  showDialog(
    "星星收藏罐",
    contents.length
      ? `<ul class="jar-list">${contents.map((star) => `<li><span>${star.symbol} ${star.label}</span><button type="button" class="text-button" data-action="release-star" data-id="${star.id}">放回夜空</button></li>`).join("")}</ul>`
      : "<p>罐子是空的。点一颗星星，把它收进来。</p>",
  );
}

async function share(text, path) {
  const url = new URL(path, location.origin).href;
  if (navigator.share) {
    try {
      await navigator.share({ title: "无聊宇宙", text, url });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(text + " " + url);
    announce("分享文案已复制。");
  } catch {
    showDialog(
      "分享给朋友",
      `<label class="share-copy">复制这段话<textarea readonly rows="4" autofocus>${esc(text + " " + url)}</textarea></label>`,
    );
    $(".share-copy textarea").select();
  }
}

function syncStarCount() {
  $("#star-count").textContent = saved.stars.length;
}

function collectStar(id) {
  const star = stars.find((entry) => entry.id === id);
  if (pickedStar === id || !star) return;
  if (saved.stars.includes(id)) {
    announce(star.label + "已经在罐子里了。");
  } else {
    saved.stars.push(id);
    save();
    syncStarCount();
    announce("把「" + star.label + "」收进了罐子。");
    animateOnce(
      $('[data-action="star"][data-id="' + id + '"]'),
      "star-pop",
      420,
    );
  }
}

function rollTask(button) {
  if (rollTimer) return;
  const eligible = tasks
    .map((task, index) => ({ task, index }))
    .filter(({ task }) => taskType === "all" || task.type === taskType);
  $("#task-card small").textContent = "命运机器转起来了…";
  $("#task-card strong").textContent = "咕噜咕噜";
  $("#task-card a")?.remove();
  document
    .querySelectorAll(
      '[data-action="roll"], [data-action="task-done"], [data-action="share-task"], [data-action="task-filter"]',
    )
    .forEach((entry) => {
      entry.disabled = true;
    });
  animateOnce($("#fortune-machine"), "machine-shake", 680);
  const wasMain = button.closest(".fortune-intro");
  rollTimer = setTimeout(
    () => {
      taskIndex = pick(
        eligible.filter(({ index }) => index !== taskIndex),
      ).index;
      taskDone = false;
      rollTimer = null;
      render();
      $(
        wasMain
          ? '.fortune-intro [data-action="roll"]'
          : '.fortune-actions [data-action="roll"]',
      ).focus({ preventScroll: true });
    },
    saved.motion || matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 100
      : 650,
  );
}

const actions = {
  hello(button) {
    const lines = [
      "你好？",
      "你真的很无聊吗？",
      "别点我了。",
      "？？？？？",
      "好吧。这个彩蛋是给你的。",
    ];
    const line = lines[Math.min(pressesOnHome++, lines.length - 1)];
    $("#home-reply").textContent = line;
    animateOnce(button, "word-bump", 400);
    if (pressesOnHome === 5) {
      animateOnce($(".poster"), "machine-shake", 450);
      announce("发现彩蛋：你好循环。");
    }
  },
  bored() {
    announce("恭喜你，成功抓住无聊。");
  },
  mascot() {
    animateOnce($(".hero-mascot"), "word-bump", 400);
    $("#home-reply").textContent = pick([
      "我先替你发个呆。",
      "我刚想到一个东西……算了，忘了。",
      "今天也不想太正经。",
    ]);
  },
  secret() {
    navigate("/random?id=secret");
  },
  search() {
    showDialog(
      "搜点无聊的",
      '<label class="search-form"><span class="sr-only">搜索内容</span><input type="search" id="search" placeholder="试试土豆、星星或按钮…" autofocus></label><div id="search-results"></div>',
    );
    searchResults("");
  },
  close() {
    dialog.close();
  },
  motion() {
    saved.motion = !saved.motion;
    save();
    updateMotion();
    announce(saved.motion ? "已减少动画。" : "已恢复动画设置。");
  },
  next() {
    const next = nextExperience(category);
    navigate(
      "/random?id=" +
        next.id +
        (category === "全部" ? "" : "&type=" + encodeURIComponent(category)),
    );
  },
  retry() {
    clearTimeout(interactionTimer);
    activity = {};
    render();
    $('.random-copy input, .random-copy [data-action="experience"]')?.focus();
  },
  favorite(button) {
    const exists = saved.favorites.includes(item.id);
    saved.favorites = exists
      ? saved.favorites.filter((id) => id !== item.id)
      : [...saved.favorites, item.id];
    save();
    button.textContent = exists ? "☆ 收藏这个" : "★ 已收藏";
    button.setAttribute("aria-pressed", String(!exists));
    announce(exists ? "已移出收藏。" : "收进你的无聊档案了。");
  },
  "share-item"() {
    share(item.title + " · 无聊宇宙", "/random?id=" + item.id);
  },
  "potato-example"() {
    const answer = pick([
      "努力赚钱。",
      "每天吃到好吃的东西。",
      "午睡醒来刚好有太阳。",
    ]);
    $("#idea-answer").value = answer;
    potatoReply(answer);
  },
  experience: playExperience,
  "lab-press": pressLab,
  hat(button) {
    saved.hat = Number(button.dataset.id);
    save();
    const cap = $(".moon-hat");
    cap.className = "moon-hat hat-" + saved.hat;
    cap.textContent = hats[saved.hat].mark;
    document
      .querySelectorAll(".hat-option")
      .forEach((option) =>
        option.setAttribute("aria-pressed", String(option === button)),
      );
    announce("月亮戴上了" + hats[saved.hat].name + "。");
  },
  star(button) {
    collectStar(button.dataset.id);
  },
  "space-sound": toggleAmbient,
  jar: showJar,
  "release-star"(button) {
    saved.stars = saved.stars.filter((id) => id !== button.dataset.id);
    save();
    syncStarCount();
    showJar();
    $('[data-action="close"]', dialog).focus();
  },
  roll: rollTask,
  "task-filter"(button) {
    taskType = taskType === button.dataset.id ? "all" : button.dataset.id;
    document
      .querySelectorAll('[data-action="task-filter"]')
      .forEach((option) =>
        option.setAttribute(
          "aria-pressed",
          String(option.dataset.id === taskType),
        ),
      );
  },
  "task-done"(button) {
    if (taskIndex === null || taskDone) return;
    taskDone = true;
    saved.tasks++;
    save();
    button.textContent = "✓ 已完成，我真棒！";
    button.disabled = true;
    announce("任务完成！命运机器给你亮了一盏灯。");
  },
  "share-task"() {
    if (taskIndex !== null)
      share(tasks[taskIndex].text, "/fortune?task=" + taskIndex);
  },
  "collection-filter"(button) {
    category = button.dataset.id;
    history.replaceState(
      null,
      "",
      "/collection" +
        (category === "全部" ? "" : "?type=" + encodeURIComponent(category)),
    );
    render();
    [...document.querySelectorAll('[data-action="collection-filter"]')]
      .find((option) => option.dataset.id === category)
      ?.focus();
  },
  certificate,
  print: () => window.print(),
};

let labSound = false;
document.addEventListener("click", (event) => {
  scheduleIdle(true);
  const button = event.target.closest("[data-action]");
  if (button) actions[button.dataset.action]?.(button);
  const link = event.target.closest("a[href]");
  if (
    !link ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey ||
    link.target
  )
    return;
  if (
    link.origin !== location.origin ||
    link.getAttribute("href").startsWith("#")
  )
    return;
  event.preventDefault();
  navigate(link.pathname + link.search + link.hash);
});
$(".menu-toggle").addEventListener("click", (event) => {
  const expanded = $("#nav").classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(expanded));
  event.currentTarget.setAttribute(
    "aria-label",
    expanded ? "关闭导航" : "展开导航",
  );
});
document.addEventListener("input", (event) => {
  if (event.target.id === "search") searchResults(event.target.value);
});
document.addEventListener("change", (event) => {
  const control = event.target;
  if (control.dataset.change === "lab-sound") labSound = control.checked;
  if (control.dataset.change === "random-filter") {
    category = control.value;
    actions.next();
  }
  if (control.dataset.change === "collection-order") {
    order = control.value;
    render();
    $('[data-change="collection-order"]').focus();
  }
});
document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!form.dataset.form) return;
  event.preventDefault();
  const data = new FormData(form);
  if (form.dataset.form === "planet") {
    saved.planet = data.get("name").trim();
    save();
    $("#planet-name").value = saved.planet;
    announce(
      saved.planet
        ? "这颗星球现在叫「" + saved.planet + "」。"
        : "星球恢复了无名状态。",
    );
  }
  if (form.dataset.form === "experience") {
    const answer = data.get("answer").trim();
    if (!answer) return $("#idea-answer").focus();
    if (item.id === "potato") potatoReply(answer);
    else reply(pick(item.replies.filter((line) => line !== activity.result)));
  }
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
document.addEventListener("visibilitychange", () => scheduleIdle(true));
document.addEventListener("keydown", () => scheduleIdle(true));
document.addEventListener("pointerover", (event) => {
  const word = event.target.closest(".bored");
  if (
    !word ||
    event.pointerType !== "mouse" ||
    saved.motion ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  if (word.dataset.dodged) return;
  word.dataset.dodged = "true";
  animateOnce(word, "word-dodge", 650);
});
document.addEventListener("pointermove", () => scheduleIdle(true), {
  passive: true,
});
document.addEventListener("pointerdown", (event) => {
  const star = event.target.closest(".space-star");
  if (!star || !event.isPrimary || event.button !== 0) return;
  drag = {
    star,
    pointer: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    moved: false,
  };
  pickedStar = null;
  star.setPointerCapture(event.pointerId);
});
document.addEventListener("pointermove", (event) => {
  if (!drag || drag.pointer !== event.pointerId) return;
  if (
    !drag.moved &&
    Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 8
  )
    return;
  const rect = $("#space-stage").getBoundingClientRect();
  const x = Math.max(
    4,
    Math.min(96, ((event.clientX - rect.left) / rect.width) * 100),
  );
  const y = Math.max(
    25,
    Math.min(91, ((event.clientY - rect.top) / rect.height) * 100),
  );
  drag.moved = true;
  drag.star.classList.add("dragging");
  drag.star.style.setProperty("--x", x + "%");
  drag.star.style.setProperty("--y", y + "%");
  spacePositions[drag.star.dataset.id] = { x, y };
});
function endDrag(event) {
  if (!drag || drag.pointer !== event.pointerId) return;
  drag.star.classList.remove("dragging");
  if (drag.moved) {
    pickedStar = drag.star.dataset.id;
    setTimeout(() => {
      pickedStar = null;
    }, 100);
  }
  drag = null;
}
document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", endDrag);
window.addEventListener("popstate", () => openRoute());
setInterval(() => {
  if (!document.hidden) {
    saved.seconds += 15;
    save();
  }
}, 15000);
openRoute();
