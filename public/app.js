import {
  categories,
  experiences,
  taskCategories,
  tasks,
  taskReplies,
  stars,
  hats,
  moonExtras,
  planetColors,
  planetSizes,
  planetDecor,
  discoveries,
  thoughts,
  getDailyRecommendation,
  rotateDailyRecommendation,
  pageTips,
  helloReplies,
  labMilestones,
} from "./content.js";
import {
  createActiveClock,
  fortuneFromLink,
  limitStar,
  readSave,
  recordDiscovery,
  recordHomeInteraction,
  toggleStarCollection,
  writeSave,
} from "./state.js";
import { createGame, renderGame } from "./games.js";
import { attachMascot, mascotLine, setMascot } from "./mascot.js";
import { internetSection, isInternetCollection } from "./external-sites.js";
import {
  renderInternetCollection,
  updateInternetCollection,
} from "./internet-collection.js";

const $ = (selector, root = document) => root.querySelector(selector);
const main = $("#main");
const dialog = $("#dialog");
const assets = "/assets/";
const saved = readSave();
const save = () => writeSave(saved);
const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
const reduced = () => saved.settings.motion || motionQuery.matches;
const unlocked = (id) => Object.hasOwn(saved.discoveries, id);
const available = (experience) =>
  !experience.unlock || unlocked(experience.unlock);
const activityClock = createActiveClock(
  () => performance.now(),
  (seconds) => {
    saved.activeSeconds += seconds;
  },
);
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
const artSizes = {
  button: [520, 437],
  door: [506, 488],
  loro: [502, 530],
  machine: [510, 532],
  moon: [400, 389],
  planet: [510, 405],
  potato: [518, 430],
};
function art(name, css = "", lazy = false) {
  const [width, height] = artSizes[name];
  return `<img class="${css}" src="${assets}${name}.webp" width="${width}" height="${height}" alt="" draggable="false"${lazy ? ' loading="lazy" decoding="async"' : ""}>`;
}
const pageNames = {
  "/": "互联网发呆游乐场",
  "/random": "随机玩意",
  "/lab": "没用的东西研究所",
  "/space-daze": "宇宙发呆中心",
  "/fortune": "随机命运分配局",
  "/collection": "奇怪合集",
  "/archive": "无聊档案",
};
let currentPath;
let item;
let category = "全部";
let order = "推荐";
let dailyView = getDailyRecommendation();
let chaseCount = 0;
let chaseCaught = false;
let boredPress;
let chaseCooldown = 0;
let lastPointerSample = 0;
let lastLoroPeek = -Infinity;
let labMessage = "试试看。反正按钮自己也很好奇。";
let game;
let idleTimer;
let idleMode = 0;
let idleDeadline = -Infinity;
let notificationTimer;
let rollTimer;
let taskType = saved.fortune.type;
let taskIndex = saved.fortune.index;
let taskDone = saved.fortune.done;
let soundSession;
let drag;
let ignoredStarClick;
let dialogTrigger;
const animations = new Map();

const mascotArt = (css = "") => art("loro", css + " mascot-art");
const mascotGuide = (page, line) =>
  `<div class="mascot-guide"><button type="button" data-action="guide" data-id="${page}" data-mascot aria-label="和聊绒说句话">${mascotArt()}</button><p class="guide-line" role="status">${line}</p></div>`;

function posterMark() {
  return '<span class="poster-mark" aria-hidden="true">✳</span>';
}

function artPanel(experience, lazy = false) {
  return experience.art
    ? art(experience.art, "", lazy)
    : '<span aria-hidden="true">' + experience.icon + "</span>";
}

function card(experience) {
  return `<a class="experience-card ${experience.color}" href="/random?id=${experience.id}">
    <div class="card-art">${artPanel(experience, true)}</div>
    <div class="card-copy"><small>${experience.type} · ${experience.time}</small><h3>${experience.title}</h3><p>${experience.intro}</p></div>
    <span class="card-arrow" aria-hidden="true">↗</span>
  </a>`;
}

function home() {
  return `${
    saved.greeted
      ? ""
      : `<aside class="welcome-note" id="welcome-note" aria-label="和聊绒第一次见面">
      ${mascotArt()}<div><strong>嗨，我是聊绒。</strong><p>我也不知道自己为什么在这里。不过，既然你来了，要不要一起浪费点时间？</p></div>
      <button class="pill lime" type="button" data-action="greet">知道了</button>
    </aside>`
  }
  <section class="home-scene" aria-labelledby="hero-title">
    <div class="poster">
      <div class="poster-top">
        <span><i aria-hidden="true"></i> 点一下「你好」试试</span>
        <span class="home-counters"><span id="hello-count">已说你好 ×${saved.homeCounters.hello}</span><span id="bored-count">已抓住无聊 ×${saved.homeCounters.bored}</span></span>
      </div>
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
      <aside class="home-aside">试试抓住「无聊」。<br>它很快就会投降。<span aria-hidden="true">↝</span></aside>
      <div class="hero-center">
        <button class="hero-mascot" type="button" data-action="mascot" data-mascot aria-label="拍拍聊绒">${mascotArt()}</button>
        <div class="speech" id="hero-speech"><h1 id="hero-title">你在干嘛？</h1><span aria-hidden="true"></span></div>
        <a href="/random" class="pill pink hero-cta">我无聊死了 <b aria-hidden="true">✹</b></a>
        <p class="hero-caption" id="home-reply" aria-live="polite">${saved.greeted ? mascotLine("home")[1] : "点击看看会发生什么…？"}</p>
      </div>
      <a class="side-cta" href="/random">再来一个<br>奇怪的东西 <span aria-hidden="true">↗</span></a>
      <a class="scroll-cue" href="#playground" aria-label="往下看看">⌄</a>
    </div>
  </section>
  <section id="playground" class="body-section playground">
    <div class="section-heading"><div><p class="eyeline">✦ 随便点一点</p><h2>今天想浪费一点什么？</h2></div><a class="text-link" href="/collection">逛逛奇怪合集</a></div>
    ${dailySection()}
    <a class="discovery-link text-link" href="/archive#discoveries">你已经发现 ${discoveryCount()} / ${discoveryTotal} 个隐藏彩蛋。</a>
    <div class="portal-grid">
      <a class="portal pink" href="/lab"><small>无聊实验</small>${art("button", "", true)}<h3>没用的东西研究所</h3><p>这里的实验，一个比一个没用。</p></a>
      <a class="portal purple" href="/space-daze"><small>慢慢来</small>${art("planet", "", true)}<h3>宇宙发呆中心</h3><p>什么都不用做，也挺好的。</p></a>
      <a class="portal lime" href="/fortune"><small>随机挑战</small>${art("machine", "", true)}<h3>随机命运分配局</h3><p>抽一件微不足道又挺有意思的事。</p></a>
    </div>
  </section>`;
}

function dailyLinks(daily) {
  return `
    <a href="/random?id=${daily.game}"><small>今日小游戏</small><strong>${getItem(daily.game).title}</strong></a>
    <a href="/random?id=${daily.question[1]}"><small>今日奇怪问题</small><strong>${daily.question[0]}</strong></a>
    <a href="/fortune?task=${daily.task}"><small>今日随机任务</small><strong>${tasks[daily.task].text}</strong></a>
    <div><small>聊绒今日心情</small><strong>${daily.mood}</strong></div>`;
}

function dailySection() {
  dailyView = getDailyRecommendation(new Date(), dailyView);
  return `<section class="daily-board" aria-labelledby="daily-title">
    <div class="daily-heading">
      <h3 id="daily-title">聊绒今天推荐</h3>
      <div class="daily-controls">
        <button class="text-button" type="button" data-action="daily-reset" ${dailyView.rotation ? "" : "hidden"}>恢复今日推荐</button>
        <button class="pill plain" type="button" data-action="daily-next">换一组</button>
      </div>
    </div>
    <p class="daily-mode" role="status">${dailyView.rotation ? "今日备用推荐" : ""}</p>
    <div class="daily-links">${dailyLinks(dailyView)}</div>
  </section>`;
}

function updateDaily(next, message) {
  dailyView = next;
  $(".daily-links").innerHTML = dailyLinks(next);
  const reset = $('[data-action="daily-reset"]');
  if (!next.rotation && document.activeElement === reset) {
    $('[data-action="daily-next"]').focus({ preventScroll: true });
  }
  reset.hidden = !next.rotation;
  $(".daily-mode").textContent = next.rotation ? "今日备用推荐" : "";
  if (message) announce(message);
}

function refreshDaily() {
  if (currentPath !== "/" || document.hidden) return;
  const next = getDailyRecommendation(new Date(), dailyView);
  if (next.day !== dailyView.day) updateDaily(next);
}

function pageTip(id) {
  if (!saved.greeted || saved.tipsSeen[id]) return "";
  const tip = pageTips[id];
  return `<aside class="page-tip" aria-label="${tip.title}使用提示">
    ${mascotArt()}<p>${tip.lines.join(" ")}</p>
    <button class="pill lime" type="button" data-action="dismiss-tip" data-id="${id}">知道了</button>
  </aside>`;
}

function lab() {
  return `<section class="body-section lab-page">
    ${pageTip("lab")}
    <div class="lab-grid">
      <div class="lab-intro">
        <p class="eyeline">⚗ 无聊实验</p>
        <h1 class="display tilted"><span class="marker lime">没用的东西</span><br><span class="marker pink">研究所</span></h1>
        <p>专门研究「没用但超有意思」的东西。</p>
        <div class="post-it checklist">☑ 没有功能<br>☑ 也许什么都不会发生<br>☑ 但就是很想按！</div>
      </div>
      <div class="lab-machine" id="lab-machine">
        <div class="lab-mascot" data-mascot>${mascotArt()}</div>
        <span class="doodle lab-spark" aria-hidden="true">✷</span>
        <button class="machine-button" type="button" data-action="lab-press">${art("button")}<span>千万不要按</span></button>
        <span class="machine-plate">没用的东西研究所 · 实验 001</span>
      </div>
      <aside class="lab-notes">
        <div class="lab-counter">你已经按了 <strong id="press-count">${saved.presses}</strong> 次</div>
        <div class="scrap"><h2>按下后可能发生</h2><ul><li>✧ 按钮尝试躲开你</li><li>♫ 听见聊绒说「叮」</li><li>✸ 解锁一张奇怪证书</li><li>☉ 又或者只是次数 +1</li></ul></div>
        <label class="sound-check"><input type="checkbox" data-change="lab-sound" ${saved.settings.labSound ? "checked" : ""}>允许按钮发出提示音</label>
      </aside>
    </div>
    <div class="experiment-status" role="status" id="lab-status">${esc(labMessage)}</div>
    <div class="section-heading lab-heading"><h2><span class="marker lime">精选实验</span></h2><a class="text-link" href="/collection?type=无聊实验">查看实验合集</a></div>
    <div class="card-grid lab-cards">${["potato", "door", "fish", "cloud", "refuse", "waste", "calculator"].map((id) => card(getItem(id))).join("")}
      <div id="lab-echo" class="lab-unlock" ${unlocked("lab-echo") ? "" : "hidden"}>${card(getItem("echo"))}</div>
    </div>
  </section>`;
}

function selectOptions(options, selected) {
  return Object.entries(options)
    .map(
      ([id, option]) =>
        `<option value="${id}" ${id === selected ? "selected" : ""}>${option.label || option}</option>`,
    )
    .join("");
}

function space() {
  const style = saved.planetStyle;
  return `<section class="space-scene" aria-labelledby="space-title">
    ${pageTip("space")}
    <div class="space-stage" id="space-stage">
      <header class="space-title"><h1 id="space-title">宇宙发呆中心</h1><p>什么都不用做。</p></header>
      <aside class="star-note"><strong>星星怎么玩</strong><small>点一下：收藏 / 放回<br>拖一下：移动星星<br>方向键：微调位置</small></aside>
      ${stars
        .map((star) => {
          const position = saved.starPositions[star.id] || star;
          const collected = saved.stars.includes(star.id);
          return `<button class="space-star" type="button" data-action="star" data-id="${star.id}" aria-label="${star.label}" aria-pressed="${collected}" aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight" style="--x:${position.x}%;--y:${position.y}%;--star-hue:${star.color}"><span aria-hidden="true">${star.symbol}</span><small aria-hidden="true">✓</small></button>`;
        })
        .join("")}
      <div class="planet-station">
        <div class="planet-view" data-size="${style.size}" style="--planet-hue:${planetColors[style.color].hue}deg">${art("planet")}<span class="planet-decoration" aria-hidden="true">${planetSymbol(style.decor)}</span></div>
        <form data-form="planet"><label for="planet-name">给星球取个名字</label><div><input id="planet-name" name="name" maxlength="14" placeholder="它叫…？" value="${esc(saved.planet)}"><button type="submit" aria-label="保存星球名字">✎</button></div></form>
        <button type="button" class="space-dress" data-action="planet-style">布置星球</button>
      </div>
      <div class="moon-station"><p>给月亮戴帽子</p><div class="moon-art" aria-hidden="true"><span class="moon-hat hat-${saved.hat}">${hats[saved.hat].mark}</span>${art("moon", "moon-face")}
        ${moonExtras.map((extra) => `<span class="moon-extra moon-${extra.id}" ${saved.moonExtras.includes(extra.id) ? "" : "hidden"}>${extra.mark}</span>`).join("")}</div>
        <div class="hat-list" role="group" aria-label="月亮的帽子">${hats.map((hat, index) => `<button class="hat-option hat-${index}" type="button" data-action="hat" data-id="${index}" aria-label="${hat.name}" aria-pressed="${saved.hat === index}">${hat.mark}</button>`).join("")}</div>
        <button type="button" class="space-dress" data-action="wardrobe">更多装扮</button>
      </div>
      <div class="space-companion">
        <button type="button" class="space-loro" data-action="guide" data-id="space" data-mascot aria-label="拍拍云上的聊绒">${mascotArt()}</button>
        <p class="guide-line" role="status" id="space-line">聊绒在云上留了个位置。</p>
      </div>
      <div class="space-player">
        <button type="button" class="pill pink" data-action="space-sound" aria-pressed="${Boolean(soundSession?.ambient)}"><span class="ambient-indicator" aria-hidden="true"></span><span class="ambient-label">${soundSession?.ambient ? "Ⅱ 暂停环境音" : "▷ 播放发呆环境音"}</span></button>
        <button type="button" class="jar-link" data-action="jar">星星收藏罐 <span id="star-count">${saved.stars.length}</span></button>
      </div>
    </div>
  </section>`;
}

function planetSymbol(decoration) {
  return { none: "", spark: "✧", flag: "⚑" }[decoration];
}

function fortune() {
  const selected = tasks[taskIndex];
  const type =
    taskCategories.find((entry) => entry.id === selected?.type) ||
    taskCategories[0];
  return `<section class="body-section fortune-page">
    ${pageTip("fortune")}
    <div class="fortune-grid">
      <div class="fortune-intro">
        <p class="eyeline">✷ 随机命运分配局</p>
        <h1 class="display tilted"><span class="marker lime">今天你应该</span><br><span class="marker pink">干什么？</span></h1>
        <p>把今天交给命运。它说，做一点小事就好。</p>
        <button class="pill pink" type="button" data-action="roll">给我安排点事做 <span aria-hidden="true">✹</span></button>
      </div>
      <div class="fortune-machine" id="fortune-machine">
        ${art("machine")}
        <button class="fortune-loro" data-action="guide" data-id="fortune" data-mascot aria-label="问问任务管理员" type="button">${mascotArt()}</button>
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
    <p class="task-feedback" id="task-feedback" role="status">${taskDone ? taskReplies[selected.type] : ""}</p>
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
      <div class="random-copy"><small>${item.type} · ${item.time} · ${item.difficulty}</small><h2>${item.title}</h2><p>${item.intro}</p>
        ${renderGame(item, reduced() || saved.settings.fishManual, unlocked)}
        <p class="result" id="activity-result" role="status"></p>
      </div>
    </article>
    <div class="random-actions">
      <button class="pill pink" type="button" data-action="next">再来一个奇怪的东西 <span aria-hidden="true">✦</span></button>
      ${available(item) && item.replay ? '<button type="button" class="pill plain" data-action="retry">再玩一次</button>' : ""}
      ${available(item) && item.favorite ? `<button type="button" class="pill plain" data-action="favorite" data-id="${item.id}" aria-pressed="${saved.favorites.includes(item.id)}">${saved.favorites.includes(item.id) ? "★ 已收藏" : "☆ 收藏这个"}</button>` : ""}
      ${available(item) && item.share ? '<button type="button" class="text-button" data-action="share-item">分享给朋友</button>' : ""}
      <a class="text-link" href="/collection">看全部体验</a>
    </div>
  </section>`;
}

function collectionExperiences() {
  const shown = experiences.filter(
    (entry) =>
      available(entry) && (category === "全部" || entry.type === category),
  );
  if (order === "热门") shown.sort((a, b) => b.rank - a.rank);
  if (order === "上新顺序") shown.sort((a, b) => b.sequence - a.sequence);
  return `${mascotGuide("collection", "看到喜欢的，就点星星把它收起来。")}
    <div class="card-grid">${shown
      .map((entry) => {
        const held = saved.favorites.includes(entry.id);
        return `<div class="collection-tile">${card(entry)}<button type="button" class="favorite-star" data-action="favorite" data-id="${entry.id}" aria-label="${held ? "取消收藏" : "收藏"}${entry.title}" aria-pressed="${held}">${held ? "★" : "☆"}</button></div>`;
      })
      .join("")}</div>`;
}

function collection() {
  const params = new URLSearchParams(location.search);
  const internet = isInternetCollection(params);
  const active = internet ? internetSection : category;
  const sort = `<label class="select-label">排序<select data-change="collection-order">${["推荐", "热门", "上新顺序"].map((name) => `<option ${name === order ? "selected" : ""}>${name}</option>`).join("")}</select></label>`;
  return `<section class="body-section collection-page">
    <div class="section-heading"><div><p class="eyeline">✸ 脑洞存放处</p><h1 class="display"><span class="marker lime">奇怪合集</span></h1><p>收留没有地方可去的奇怪念头。</p></div><a class="pill plain" href="/archive#favorites">看我的收藏</a></div>
    <div class="collection-controls"><div class="chips" role="group" aria-label="按类型筛选">${categories.map((name) => `<button type="button" data-action="collection-filter" data-id="${name}" aria-pressed="${active === name}">${name}</button>`).join("")}
    <button class="collection-internet-tab" type="button" data-action="collection-filter" data-id="${internetSection}" aria-pressed="${internet}">奇妙互联网</button></div>${internet ? "" : sort}</div>
    ${internet ? renderInternetCollection(params, esc) : collectionExperiences()}
  </section>`;
}

function archive() {
  const favoriteItems = saved.favorites.map(getItem).filter(Boolean);
  const duration =
    saved.activeSeconds < 60
      ? saved.activeSeconds + " 秒"
      : Math.floor(saved.activeSeconds / 60) +
        " 分钟 " +
        (saved.activeSeconds % 60) +
        " 秒";
  const count = discoveryCount();
  const stats = [
    [saved.presses, "按过按钮"],
    [saved.potatoes, "帮过土豆"],
    [saved.rooms, "发现秘密房间"],
    [saved.tasks, "完成命运任务"],
    [saved.stars.length, "收藏星星"],
    [duration, "活跃时长"],
    [saved.games.catchBest, "抓聊绒最高分"],
    [saved.games.fishBest + " / 5", "金鱼投篮最好成绩"],
    [count, "隐藏发现"],
  ];
  return `<section class="body-section archive-page">
    <div class="section-heading"><div><p class="eyeline">✦ 聊绒的记录本</p><h1 class="display"><span class="marker pink">我的无聊档案</span></h1><p>你花在奇怪念头上的时间，都记在这个浏览器里。</p></div></div>
    ${mascotGuide("archive", archiveLine())}
    <div class="stat-grid">${stats.map(([count, label]) => `<div><strong>${count}</strong><span>${label}</span></div>`).join("")}</div>
    <div class="certificate-strip"><div><h2>${saved.presses >= 28 ? "优秀按钮按压员" : "国际无聊组织认证证书"}</h2><p>今天也给无聊留了一点位置。</p></div><button type="button" class="pill pink" data-action="certificate">领取我的证书</button></div>
    ${archiveTips()}
    ${archiveDiscoveries()}
    ${archiveThoughts()}
    <section id="favorites" class="archive-section"><div class="section-heading"><h2>我的收藏</h2><a href="/collection" class="text-link">去逛合集</a></div>
      ${favoriteItems.length ? '<div class="card-grid">' + favoriteItems.map(card).join("") + "</div>" : '<p class="empty-note">这里还空着。下次玩到喜欢的东西，就把它收进来。</p>'}
    </section>
  </section>`;
}

function archiveLine() {
  if (Object.keys(saved.discoveries).length >= 4)
    return "这本档案快容不下你的发现了，我得换个大本子。";
  if (saved.rooms) return "原来你也去过门背后。我们就当作没见过吧。";
  if (saved.potatoes) return "有颗土豆托我问候你。它现在挺忙的，忙着生活。";
  return "谁说无聊没东西可记录？先记下一页。";
}

const discoveryTotal = Object.keys(discoveries).length;
const discoveryCount = () => Object.keys(saved.discoveries).length;

function archiveTips() {
  const tips = Object.entries(pageTips);
  const seen = tips.filter(([id]) => saved.tipsSeen[id]).length;
  return `<section class="tip-progress" aria-labelledby="tips-title"><h2 id="tips-title">新手引导已完成 ${seen} / ${tips.length}</h2>
    <ul>${tips.map(([id, tip]) => `<li>${tip.title} · ${saved.tipsSeen[id] ? "已看过" : "待查看"}</li>`).join("")}</ul></section>`;
}

function archiveDiscoveries() {
  const records = Object.entries(saved.discoveries).sort((a, b) => b[1] - a[1]);
  const pending = discoveryTotal - records.length;
  const date = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `<section class="archive-section" id="discoveries"><div class="section-heading"><h2>隐藏发现</h2></div>
    <label class="discovery-progress">你已经发现 ${records.length} / ${discoveryTotal} 个秘密
      <progress value="${records.length}" max="${discoveryTotal}"></progress>
    </label>
    ${pending ? '<p class="discovery-hint">还有一些奇怪的秘密等你发现。</p>' : ""}
    <ul class="record-grid">
      ${records
        .map(
          ([
            id,
            time,
          ]) => `<li><strong>${discoveries[id].title}</strong><p>${discoveries[id].reward}</p>
      <small>${time ? `<time datetime="${new Date(time).toISOString()}">${date.format(time)}</time>` : "旧版存档未记录时间"}</small>
      ${id === "lab-echo" ? '<a class="text-link" href="/random?id=echo">收听电台</a>' : ""}
      ${id === "door-person" ? '<a class="text-link" href="/random?id=door">回门边看看</a>' : ""}</li>`,
        )
        .join("")}
      ${Array.from({ length: pending }, () => '<li class="unknown-discovery"><span aria-hidden="true">?</span><strong>未发现的秘密</strong></li>').join("")}
    </ul>
  </section>`;
}

function archiveThoughts() {
  const records = Object.entries(saved.thoughts).sort((a, b) => b[1] - a[1]);
  const day = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `<section class="archive-section" id="thoughts"><div class="section-heading"><h2>聊绒的念头罐</h2></div>
    ${records.length ? `<ul class="record-grid">${records.map(([id, time]) => `<li><strong>${thoughts[id].title}</strong><p>${thoughts[id].text}</p><small>${thoughts[id].source} · <time datetime="${new Date(time).toISOString()}">${day.format(time)}</time></small></li>`).join("")}</ul>` : '<p class="empty-note">念头罐是空的。帮土豆做个选择，或者给云朵写句话吧。</p>'}
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
    (entry) => available(entry) && (filter === "全部" || filter === entry.type),
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
  for (const animation of animations.values()) {
    cancelAnimationFrame(animation.frame);
    clearTimeout(animation.timer);
  }
  animations.clear();
  game?.stop();
  game = null;
  main.innerHTML = (pages[currentPath] || missing)();
  document.documentElement.dataset.page =
    currentPath === "/space-daze" ? "space" : "";
  document.title = "无聊宇宙 · " + (pageNames[currentPath] || "迷路了");
  document.querySelectorAll(".nav a, .archive-link").forEach((link) => {
    if (link.pathname === currentPath)
      link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  attachMascot(
    $("[data-mascot]", main),
    currentPath === "/space-daze" ? "companion" : "idle",
  );
  if (currentPath === "/random" && item && available(item)) {
    game = createGame({
      item,
      root: main,
      saved,
      save,
      finish: markCompleted,
      discover,
      thought: rememberThought,
      reduceMotion: reduced,
      feedback: animateOnce,
    });
  }
  updateMotion();
  resetIdle();
}

function openRoute(fromNavigation = false) {
  const path = location.pathname.replace(/\/$/, "") || "/";
  if (currentPath === "/space-daze" && path !== currentPath) stopAmbient();
  currentPath = path;
  const params = new URLSearchParams(location.search);
  category = categories.includes(params.get("type"))
    ? params.get("type")
    : "全部";
  clearTimeout(rollTimer);
  rollTimer = null;
  clearTimeout(idleTimer);
  idleTimer = null;
  drag = null;
  ignoredStarClick = null;
  boredPress = null;
  if (currentPath === "/") {
    chaseCount = 0;
    chaseCaught = false;
    chaseCooldown = 0;
  }
  if (currentPath === "/random") {
    item = getItem(params.get("id")) || nextExperience(category);
    if (item && available(item)) {
      saved.visited = [
        ...saved.visited.filter((id) => id !== item.id).slice(-5),
        item.id,
      ];
      save();
    }
  }
  if (currentPath === "/fortune") {
    const linked = fortuneFromLink(saved.fortune, params.get("task"));
    if (linked !== saved.fortune) {
      taskIndex = linked.index;
      taskDone = linked.done;
      saveFortune();
    }
  }
  if (dialog.open) dialog.close();
  clearTimeout(notificationTimer);
  $("#toast").classList.remove("visible");
  closeMenu();
  activityClock.sample();
  render();
  if (location.hash) {
    const section = document.getElementById(location.hash.slice(1));
    if (section) section.scrollIntoView();
  } else if (fromNavigation) {
    window.scrollTo({ top: 0, behavior: "instant" });
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

function resetIdle(now = performance.now()) {
  idleMode = 0;
  idleDeadline = now + 15_000;
  if (
    !idleTimer &&
    !document.hidden &&
    ["/", "/space-daze"].includes(currentPath)
  ) {
    idleTimer = setTimeout(checkIdle, 15_000);
  }
}

function checkIdle() {
  idleTimer = null;
  if (document.hidden || !["/", "/space-daze"].includes(currentPath)) return;
  const wait = idleDeadline - performance.now();
  if (wait > 0) {
    idleTimer = setTimeout(checkIdle, wait);
    return;
  }
  const home = currentPath === "/";
  const lines = home
    ? [
        ["curious", "喂。"],
        ["thinking", "你还在吗？"],
        ["companion", "算了，我们一起发呆吧。"],
      ]
    : [
        ["sleepy", "聊绒眼睛快睁不开了……"],
        ["companion", "聊绒在云上翻了个身。"],
      ];
  const [mood, text] = lines[idleMode++];
  if (!home && mood === "companion")
    animateOnce($(".space-loro"), "companion-roll", 720);
  $(home ? "#home-reply" : "#space-line").textContent = text;
  setMascot(mood, home ? 2000 : 4500);
  if (idleMode < lines.length) {
    idleDeadline = performance.now() + (home ? 4500 : 6500);
    idleTimer = setTimeout(checkIdle, home ? 4500 : 6500);
  }
}

function activityInput(now = performance.now()) {
  activityClock.input(now);
  resetIdle(now);
}

function updateMotion() {
  document.documentElement.classList.toggle(
    "reduce-motion",
    saved.settings.motion,
  );
  $('[data-action="motion"]').setAttribute(
    "aria-pressed",
    String(saved.settings.motion),
  );
  if (reduced() && currentPath === "/") {
    document.querySelectorAll(".bored[data-dodge-x]").forEach((word) => {
      delete word.dataset.dodgeX;
      delete word.dataset.dodgeY;
      word.style.removeProperty("--word-x");
      word.style.removeProperty("--word-y");
      word.style.removeProperty("--word-turn");
    });
  }
  const settingsMotion = $('[data-change="settings-motion"]', dialog);
  if (settingsMotion) {
    settingsMotion.checked = saved.settings.motion;
    $("#system-motion", dialog).textContent = motionQuery.matches
      ? "系统已开启减少动画。"
      : "系统动画偏好为默认。";
  }
  game?.motionChanged();
}

function setMotionPreference(enabled) {
  saved.settings.motion = enabled;
  save();
  updateMotion();
}

function setLabSoundPreference(enabled) {
  saved.settings.labSound = enabled;
  save();
  document.querySelectorAll('[data-change="lab-sound"]').forEach((control) => {
    control.checked = enabled;
  });
}

function animateOnce(element, name, duration) {
  if (!element || reduced()) return;
  const previous = animations.get(element);
  if (previous) {
    cancelAnimationFrame(previous.frame);
    clearTimeout(previous.timer);
    element.classList.remove(previous.name);
    if (previous.name === name) void element.offsetWidth;
  }
  const animation = { name };
  animations.set(element, animation);
  animation.frame = requestAnimationFrame(() => {
    if (!element.isConnected) {
      animations.delete(element);
      return;
    }
    element.classList.add(name);
    animation.timer = setTimeout(() => {
      element.classList.remove(name);
      animations.delete(element);
    }, duration);
  });
}

function showDiscovery(id) {
  const link = $(".discovery-link");
  if (link)
    link.textContent = `你已经发现 ${discoveryCount()} / ${discoveryTotal} 个隐藏彩蛋。`;
  announce("发现彩蛋 · " + discoveries[id].title);
}

function discover(id) {
  if (!recordDiscovery(saved, id)) return false;
  save();
  showDiscovery(id);
  return true;
}

function updateHomeCount(id, counter) {
  const element = $("#" + id + "-count");
  element.textContent =
    (id === "hello" ? "已说你好 ×" : "已抓住无聊 ×") + counter.count;
  animateOnce(element, "count-tick", 260);
}
function rememberThought(id) {
  if (!Object.hasOwn(thoughts, id) || Object.hasOwn(saved.thoughts, id)) return;
  saved.thoughts[id] = Date.now();
  save();
  announce("念头入罐 · " + thoughts[id].title);
}

function markCompleted(id) {
  if (!saved.completed.includes(id)) saved.completed.push(id);
  if (saved.completed.length >= 6 && !unlocked("inspiration")) {
    rememberThought("inspiration");
    discover("inspiration");
  }
  save();
}

function pressLab() {
  const count = ++saved.presses;
  $("#press-count").textContent = count;
  const milestone = labMilestones[count];
  labMessage =
    milestone?.[0] ||
    pick(
      [
        "好吧，只是次数 +1。",
        "刚刚按钮偷偷眨了一下眼。",
        "又一个奇怪念头被弹了出去。",
        "如果不按，它就会一直待在那里。",
      ].filter((line) => line !== labMessage),
    );
  $("#lab-status").textContent = labMessage;
  setMascot(milestone?.[1] || "scared", milestone ? 2000 : 500);
  animateOnce($(".machine-button"), milestone?.[2] || "button-squish", 420);
  markCompleted("button");
  if (count === 28 && discover("button-researcher")) certificate();
  if (count === 50) {
    discover("lab-echo");
    $("#lab-echo").hidden = false;
  }
  if (saved.settings.labSound) playChime();
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
    if (currentPath !== "/lab" || !saved.settings.labSound) return;
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
    updateAmbientControl(button, false);
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
    updateAmbientControl(button, true);
  } catch {
    announce("这个浏览器暂时放不了发呆音。");
  } finally {
    button.disabled = false;
  }
}

function updateAmbientControl(button, playing) {
  $(".ambient-label", button).textContent = playing
    ? "Ⅱ 暂停环境音"
    : "▷ 播放发呆环境音";
  button.setAttribute("aria-pressed", String(playing));
}

function stopAmbient() {
  const ambient = soundSession?.ambient;
  if (!ambient) return;
  const time = soundSession.context.currentTime;
  ambient.volume.gain.cancelScheduledValues(time);
  ambient.volume.gain.setTargetAtTime(0, time, 0.09);
  ambient.tones.forEach((tone) => tone.stop(time + 0.52));
  ambient.tones[0].addEventListener(
    "ended",
    () => ambient.volume.disconnect(),
    { once: true },
  );
  soundSession.ambient = null;
}

function showDialog(title, html, trigger = document.activeElement) {
  if (!dialog.open) dialogTrigger = trigger;
  dialog.innerHTML = `<div class="dialog-top"><h2 id="dialog-title">${title}</h2><button class="icon-button" type="button" data-action="close" aria-label="关闭">×</button></div>${html}`;
  if (!dialog.open) dialog.showModal();
}

function highlightedTitle(title, query) {
  if (!query) return esc(title);
  const literal = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = title.matchAll(new RegExp(literal, "giu"));
  let cursor = 0;
  let output = "";
  for (const match of matches) {
    output +=
      esc(title.slice(cursor, match.index)) +
      "<mark>" +
      esc(match[0]) +
      "</mark>";
    cursor = match.index + match[0].length;
  }
  return output + esc(title.slice(cursor));
}

function searchResults(value) {
  const query = value.trim().toLowerCase();
  const results = [
    ...Object.entries(pageNames)
      .slice(1)
      .map(([href, title]) => ({ href, title, subtitle: "游乐场" })),
    ...experiences.filter(available).map((entry) => ({
      href: "/random?id=" + entry.id,
      title: entry.title,
      subtitle: entry.type,
      intro: entry.intro,
    })),
  ]
    .filter(
      (entry) =>
        !query ||
        [entry.title, entry.subtitle, entry.intro].some((text) =>
          text?.toLowerCase().includes(query),
        ),
    )
    .slice(0, 8);

  const panel = $("#search-results");
  $("#search-status").textContent = results.length
    ? `${results.length} 个结果`
    : "没找到这个奇怪的东西。";
  if (results.length) {
    panel.innerHTML = results
      .map(
        (entry) =>
          `<a href="${esc(entry.href)}"><strong>${highlightedTitle(entry.title, query)}</strong><small>${esc(entry.subtitle)}</small></a>`,
      )
      .join("");
    return;
  }
  const keywords = ["土豆", "星星", "按钮", "金鱼"];
  const popular = ["potato", "star", "fish"]
    .map(getItem)
    .filter((entry) => entry && available(entry));
  panel.innerHTML = `<div class="search-empty"><p>没找到这个奇怪的东西。</p><p>试试这些关键词：</p>
    <div class="chips">${keywords.map((word) => `<button type="button" data-action="search-keyword" data-id="${esc(word)}">${esc(word)}</button>`).join("")}</div>
    <div class="search-suggestions" aria-label="热门体验">${popular.map((entry) => `<a href="/random?id=${esc(entry.id)}"><strong>${esc(entry.title)}</strong></a>`).join("")}</div>
  </div>`;
}

function showSettings(trigger) {
  showDialog(
    "设置",
    `<div class="settings-options">
    <label class="sound-check"><input type="checkbox" data-change="settings-motion">减少动画</label>
    <p id="system-motion"></p>
    <label class="sound-check"><input type="checkbox" data-change="lab-sound" ${saved.settings.labSound ? "checked" : ""}>实验室提示音</label>
  </div>`,
    trigger,
  );
  updateMotion();
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
  const source = location.href;
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
    if (location.href === source) announce("分享文案已复制。");
  } catch {
    if (location.href !== source) return;
    showDialog(
      "分享给朋友",
      `<label class="share-copy">复制这段话<textarea readonly rows="4" autofocus>${esc(text + " " + url)}</textarea></label>`,
    );
    $(".share-copy textarea").select();
  }
}

function syncStars() {
  $("#star-count").textContent = saved.stars.length;
  document.querySelectorAll(".space-star").forEach((star) => {
    star.setAttribute(
      "aria-pressed",
      String(saved.stars.includes(star.dataset.id)),
    );
  });
}

function changeStarCollection(id, button) {
  const result = toggleStarCollection(saved, id);
  if (!result) return;
  syncStars();
  if (result.collected) {
    announce("把这颗星星收进罐子了。");
    animateOnce(button, "star-pop", 420);
    setMascot("happy");
    markCompleted("star");
  } else {
    announce("这颗星星回到夜空了。");
    save();
  }
  if (result.unlocked) showDiscovery("constellation");
}

function collectStar(button, event) {
  const id = button.dataset.id;
  if (event?.detail > 0 && ignoredStarClick === id) {
    ignoredStarClick = null;
    return;
  }
  changeStarCollection(id, button);
}

function saveFortune() {
  saved.fortune = { type: taskType, index: taskIndex, done: taskDone };
  save();
}

function rollTask(button) {
  if (rollTimer) return;
  const eligible = tasks
    .map((task, index) => ({ task, index }))
    .filter(({ task }) => taskType === "all" || task.type === taskType);
  const alternatives = eligible.filter(({ index }) => index !== taskIndex);
  const next = pick(alternatives.length ? alternatives : eligible);
  if (!next) {
    $("#task-feedback").textContent = "这个任务池暂时空着。试试别的口味。";
    return;
  }
  $("#task-feedback").textContent = "聊绒握紧了操纵杆。";
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
  setMascot("scared", 800);
  animateOnce($("#fortune-machine"), "machine-shake", 650);
  const wasMain = button.closest(".fortune-intro");
  rollTimer = setTimeout(
    () => {
      taskIndex = next.index;
      taskDone = false;
      saveFortune();
      history.replaceState(null, "", "/fortune");
      rollTimer = null;
      render();
      $("#task-feedback").textContent = "聊绒把任务递给了你。";
      setMascot("happy");
      $(
        wasMain
          ? '.fortune-intro [data-action="roll"]'
          : '.fortune-actions [data-action="roll"]',
      ).focus({ preventScroll: true });
    },
    reduced() ? 100 : 650,
  );
}

function showPlanetStyle() {
  const { color, size, decor } = saved.planetStyle;
  showDialog(
    "布置星球",
    `<form class="space-settings" data-form="planet-style">
    <label>颜色<select name="color">${selectOptions(planetColors, color)}</select></label>
    <label>大小<select name="size">${selectOptions(planetSizes, size)}</select></label>
    <label>装饰<select name="decor">${selectOptions(planetDecor, decor)}</select></label>
    <button type="submit" class="pill lime">保存布置</button></form>`,
  );
}

function showWardrobe() {
  showDialog(
    "月亮的装扮",
    `<div class="wardrobe">${moonExtras
      .map(
        (extra) =>
          `<button class="pill ${saved.moonExtras.includes(extra.id) ? "lime" : "plain"}" type="button" data-action="moon-extra" data-id="${extra.id}" aria-pressed="${saved.moonExtras.includes(extra.id)}">
      <span aria-hidden="true">${extra.mark}</span> ${extra.label}</button>`,
      )
      .join(
        "",
      )}</div><p class="game-hint">再点一次，就能摘下这件装扮。</p><p class="wardrobe-result" role="status"></p>`,
  );
}

function overlaps(a, b) {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}

function tryDodge(event, now) {
  if (
    currentPath !== "/" ||
    reduced() ||
    event.pointerType !== "mouse" ||
    chaseCount >= 3 ||
    chaseCaught ||
    now < chaseCooldown
  )
    return;
  if (
    !event.target.closest(".poster") ||
    event.target.closest("a, button:not(.bored)")
  )
    return;
  const words = [...document.querySelectorAll(".bored")];
  const nearest = words.find((word) => {
    if (document.activeElement === word) return false;
    const rect = word.getBoundingClientRect();
    return (
      event.clientX > rect.left - 19 &&
      event.clientX < rect.right + 19 &&
      event.clientY > rect.top - 19 &&
      event.clientY < rect.bottom + 19
    );
  });
  if (!nearest) return;
  const poster = $(".poster").getBoundingClientRect();
  const rect = nearest.getBoundingClientRect();
  const wordBounds = ({ left, right, top, bottom, height }) => ({
    left,
    right,
    top: top + height * 0.18,
    bottom: bottom - height * 0.18,
  });
  const nearbyWords = words
    .filter((word) => word !== nearest)
    .map((word) => wordBounds(word.getBoundingClientRect()));
  const obstacles = [
    $(".hero-cta"),
    $(".hero-mascot"),
    $(".speech"),
    $(".home-note"),
    $(".side-cta"),
  ].map((element) => element.getBoundingClientRect());
  const fromX = Number(nearest.dataset.dodgeX || 0);
  const fromY = Number(nearest.dataset.dodgeY || 0);
  const candidates = [
    [-34, -28],
    [35, -22],
    [-39, 19],
    [39, 22],
    [0, -40],
    [0, 36],
    [-22, 0],
    [21, 0],
  ];
  const safe = candidates.filter(([x, y]) => {
    const moved = {
      left: rect.left + x,
      right: rect.right + x,
      top: rect.top + y,
      bottom: rect.bottom + y,
    };
    return (
      Math.abs(fromX + x) <= 66 &&
      Math.abs(fromY + y) <= 52 &&
      moved.left >= poster.left + 8 &&
      moved.right <= poster.right - 8 &&
      moved.top >= poster.top + 37 &&
      moved.bottom <= poster.bottom - 8 &&
      !obstacles.some((other) => overlaps(moved, other)) &&
      !nearbyWords.some((other) =>
        overlaps(wordBounds({ ...moved, height: rect.height }), other),
      )
    );
  });
  if (!safe.length) return;
  const [x, y] = pick(safe);
  nearest.dataset.dodgeX = fromX + x;
  nearest.dataset.dodgeY = fromY + y;
  nearest.style.setProperty("--word-x", fromX + x + "px");
  nearest.style.setProperty("--word-y", fromY + y + "px");
  nearest.style.setProperty(
    "--word-turn",
    (x > 0 ? 1 : -1) * (3 + chaseCount * 2) + "deg",
  );
  $("#home-reply").textContent = ["抓不到我！", "你别追了！", "救命！"][
    chaseCount++
  ];
  chaseCooldown = now + 440;
  setMascot("naughty", 850);
}

function observeHome(event, now) {
  const mascot = event.target.closest(".hero-mascot");
  if (!mascot || event.pointerType !== "mouse" || reduced()) return;
  const { left, width } = mascot.getBoundingClientRect();
  const turn = Math.round(((event.clientX - left) / width - 0.5) * 10);
  const rotation = turn + "deg";
  if (mascot.style.getPropertyValue("--loro-gaze") !== rotation) {
    mascot.style.setProperty("--loro-gaze", rotation);
  }
  if (now - lastLoroPeek >= 4500) {
    lastLoroPeek = now;
    setMascot(Math.random() < 0.25 ? "naughty" : "curious", 700);
  }
}

function starPosition(button, { x, y }) {
  button.style.setProperty("--x", x + "%");
  button.style.setProperty("--y", y + "%");
}

function canPlaceStar(x, y, field, obstacles) {
  const left = field.left + (field.width * x) / 100;
  const top = field.top + (field.height * y) / 100;
  const rect = {
    left: left - 20,
    right: left + 20,
    top: top - 20,
    bottom: top + 20,
  };
  return !obstacles.some((other) => overlaps(other, rect));
}

function starArea(star) {
  const field = $("#space-stage").getBoundingClientRect();
  const obstacles = [
    ...document.querySelectorAll(
      ".space-title, .planet-station form, .space-dress, .hat-list, .space-player, .space-loro, .space-star",
    ),
  ]
    .filter((element) => element !== star)
    .map((element) => element.getBoundingClientRect());
  return { field, obstacles };
}

const actions = {
  hello(button) {
    const counter = recordHomeInteraction(saved, "hello");
    const reaction = helloReplies[counter.count - 1];
    const [mood, line, animation] = reaction || [
      ...mascotLine("home"),
      "word-pop",
    ];
    $("#home-reply").textContent = line;
    setMascot(mood);
    animateOnce(button, animation, 440);
    updateHomeCount("hello", counter);
    if (counter.count === helloReplies.length) markCompleted("hello");
    else save();
    if (counter.unlocked) showDiscovery(counter.unlocked);
  },
  bored(button, event) {
    const touch =
      event.detail > 0 && boredPress?.button === button && boredPress.released;
    boredPress = null;
    if (touch && !reduced() && !chaseCaught && chaseCount < 2) {
      $("#home-reply").textContent = ["抓不到我！再点一次。", "你别追了！"][
        chaseCount++
      ];
      animateOnce(button, "hello-flinch", 320);
      setMascot("naughty", 700);
      return;
    }
    $("#home-reply").textContent = chaseCount
      ? "啊！居然被你抓到了！"
      : "你趁我发呆的时候抓住了！";
    chaseCount = 0;
    chaseCaught = true;
    setMascot("happy");
    animateOnce(button, "hello-spark", 440);
    const counter = recordHomeInteraction(saved, "bored");
    updateHomeCount("bored", counter);
    markCompleted("bored");
    if (counter.unlocked) showDiscovery(counter.unlocked);
  },
  "dismiss-tip"(button) {
    const id = button.dataset.id;
    saved.tipsSeen[id] = true;
    save();
    const next = {
      lab: '[data-action="lab-press"]',
      space: ".space-star",
      fortune: '.fortune-intro [data-action="roll"]',
    };
    button.closest(".page-tip").remove();
    $(next[id])?.focus({ preventScroll: true });
  },
  "daily-next"() {
    updateDaily(rotateDailyRecommendation(dailyView), "已换一组推荐。");
  },
  "daily-reset"() {
    updateDaily(getDailyRecommendation(), "已恢复今日推荐。");
  },
  greet() {
    saved.greeted = true;
    save();
    $(".hero-mascot").focus({ preventScroll: true });
    $("#welcome-note").remove();
    $("#home-reply").textContent = "那就随便点一点吧。";
    setMascot("happy");
  },
  mascot() {
    const [mood, line] = mascotLine("home");
    $("#home-reply").textContent = line;
    setMascot(mood);
  },
  guide(button) {
    const page = button.dataset.id;
    const [mood, line] =
      page === "archive" ? ["thinking", archiveLine()] : mascotLine(page);
    setMascot(mood);
    const status =
      button.parentElement.querySelector(".guide-line") || $("#task-feedback");
    if (status) status.textContent = line;
  },
  secret() {
    navigate("/random?id=secret");
  },
  search(button) {
    showDialog(
      "搜点无聊的",
      '<label class="search-form"><span class="sr-only">搜索内容</span><input type="search" id="search" placeholder="试试土豆、星星或按钮…" autofocus></label><p class="sr-only" id="search-status" role="status"></p><div id="search-results"></div>',
      button,
    );
    searchResults("");
  },
  "search-keyword"(button) {
    const input = $("#search");
    input.value = button.dataset.id;
    input.focus();
    searchResults(input.value);
  },
  settings: showSettings,
  close() {
    dialog.close();
  },
  motion() {
    setMotionPreference(!saved.settings.motion);
    announce(reduced() ? "当前已减少动画。" : "已恢复动画设置。");
  },
  next() {
    const next = nextExperience(category) || nextExperience("全部");
    if (!next) return;
    navigate(
      "/random?id=" +
        next.id +
        (category === "全部" ? "" : "&type=" + encodeURIComponent(category)),
    );
  },
  retry() {
    render();
    $(".random-copy [data-game], .random-copy input, .random-copy a")?.focus({
      preventScroll: true,
    });
  },
  favorite(button) {
    const target = getItem(button.dataset.id);
    if (!target?.favorite || !available(target)) return;
    const id = target.id;
    const exists = saved.favorites.includes(id);
    saved.favorites = exists
      ? saved.favorites.filter((entry) => entry !== id)
      : [...saved.favorites, id];
    save();
    button.setAttribute("aria-pressed", String(!exists));
    if (button.classList.contains("favorite-star")) {
      button.textContent = exists ? "☆" : "★";
      button.setAttribute(
        "aria-label",
        (exists ? "收藏" : "取消收藏") + target.title,
      );
    } else {
      button.textContent = exists ? "☆ 收藏这个" : "★ 已收藏";
    }
    if (!exists) setMascot("happy");
    announce(exists ? "已移出收藏。" : "收进你的无聊档案了。");
  },
  "share-item"() {
    share(item.title + " · 无聊宇宙", "/random?id=" + item.id);
  },
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
    setMascot("curious");
    rememberThought("moon");
    markCompleted("wardrobe");
  },
  wardrobe: showWardrobe,
  "moon-extra"(button) {
    const id = button.dataset.id;
    const extra = moonExtras.find((entry) => entry.id === id);
    const worn = saved.moonExtras.includes(id);
    saved.moonExtras = worn
      ? saved.moonExtras.filter((entry) => entry !== id)
      : [...saved.moonExtras, id];
    button.setAttribute("aria-pressed", String(!worn));
    button.classList.toggle("lime", !worn);
    button.classList.toggle("plain", worn);
    $(".moon-" + id).hidden = worn;
    $(".wardrobe-result").textContent =
      (worn ? "月亮摘下了" : "月亮戴上了") + extra.label + "。";
    rememberThought("moon");
    markCompleted("wardrobe");
    setMascot("happy");
  },
  "planet-style": showPlanetStyle,
  star: collectStar,
  "space-sound": toggleAmbient,
  jar: showJar,
  "release-star"(button) {
    const id = button.dataset.id;
    if (saved.stars.includes(id)) changeStarCollection(id);
    showJar();
    $('[data-action="close"]', dialog).focus();
  },
  roll: rollTask,
  "task-filter"(button) {
    taskType = button.dataset.id;
    saveFortune();
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
    saveFortune();
    button.textContent = "✓ 已完成，我真棒！";
    button.disabled = true;
    $("#task-feedback").textContent = taskReplies[tasks[taskIndex].type];
    setMascot("happy");
    rememberThought("task");
    markCompleted("fortune");
  },
  "share-task"() {
    if (taskIndex !== null)
      share(
        tasks[taskIndex].text + " · 无聊宇宙",
        "/fortune?task=" + taskIndex,
      );
  },
  "collection-filter"(button) {
    const next = button.dataset.id;
    const internet = isInternetCollection(new URLSearchParams(location.search));
    if (next === internetSection) {
      if (internet) return;
      navigate(`/collection?section=${internetSection}`);
    } else {
      const href =
        "/collection" +
        (next === "全部" ? "" : "?type=" + encodeURIComponent(next));
      if (internet) navigate(href);
      else {
        category = next;
        history.replaceState(null, "", href);
        render();
      }
    }
    [...document.querySelectorAll('[data-action="collection-filter"]')]
      .find((option) => option.dataset.id === next)
      ?.focus();
  },
  certificate,
  print: () => window.print(),
};

function closeMenu() {
  $("#nav").classList.remove("open");
  $(".menu-toggle").setAttribute("aria-expanded", "false");
  $(".menu-toggle").setAttribute("aria-label", "展开导航");
}

document.addEventListener("click", (event) => {
  activityInput();
  const control = event.target.closest("[data-action], [data-game]");
  if (control?.dataset.game) game?.handle(control);
  if (control?.dataset.action)
    actions[control.dataset.action]?.(control, event);
  const link = event.target.closest("a[href]");
  if (
    !link ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey ||
    link.target ||
    link.origin !== location.origin ||
    link.getAttribute("href").startsWith("#")
  )
    return;
  event.preventDefault();
  navigate(link.pathname + link.search + link.hash);
});

$(".menu-toggle").addEventListener("click", (event) => {
  if ($("#nav").classList.contains("open")) {
    closeMenu();
  } else {
    $("#nav").classList.add("open");
    event.currentTarget.setAttribute("aria-expanded", "true");
    event.currentTarget.setAttribute("aria-label", "关闭导航");
  }
});

document.addEventListener("input", (event) => {
  activityInput();
  const { id, value } = event.target;
  if (id === "search") searchResults(value);
  if (id === "internet-name" && !event.isComposing)
    updateInternetCollection(event.target.form, esc);
  if (id === "fish-power") $("#fish-power-value").value = value;
  if (id === "echo-knob") $("#echo-frequency").value = value;
});

document.addEventListener("change", (event) => {
  const control = event.target;
  if (control.form?.id === "internet-filters" && control.name !== "q")
    updateInternetCollection(control.form, esc);
  if (control.dataset.change === "lab-sound")
    setLabSoundPreference(control.checked);
  if (control.dataset.change === "settings-motion")
    setMotionPreference(control.checked);
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
  if (form.id === "internet-filters") {
    event.preventDefault();
    updateInternetCollection(form, esc);
    return;
  }
  if (!form.dataset.form) return;
  event.preventDefault();
  const data = new FormData(form);
  if (form.dataset.form === "planet") {
    saved.planet = data.get("name").trim();
    $("#planet-name").value = saved.planet;
    announce(
      saved.planet
        ? "这颗星球现在叫「" + saved.planet + "」。"
        : "星球恢复了无名状态。",
    );
    setMascot("inspired");
    markCompleted("planet");
  } else if (form.dataset.form === "planet-style") {
    saved.planetStyle = {
      color: data.get("color"),
      size: data.get("size"),
      decor: data.get("decor"),
    };
    const view = $(".planet-view");
    view.dataset.size = saved.planetStyle.size;
    view.style.setProperty(
      "--planet-hue",
      planetColors[saved.planetStyle.color].hue + "deg",
    );
    $(".planet-decoration", view).textContent = planetSymbol(
      saved.planetStyle.decor,
    );
    markCompleted("planet");
    dialog.close();
    announce("星球换了个样子。");
    setMascot("happy");
  } else {
    game?.submit(form);
  }
});

function keepFocusedFieldVisible() {
  const field = document.activeElement;
  if (
    !field?.matches(
      'textarea, input:not([type]), input[type="text"], input[type="search"], input[type="number"]',
    )
  )
    return;

  const viewport = window.visualViewport;
  const top = viewport?.offsetTop ?? 0;
  const bottom = top + (viewport?.height ?? window.innerHeight);
  const rect = field.getBoundingClientRect();
  if (rect.top >= top + 8 && rect.bottom <= bottom - 8) return;

  field.scrollIntoView({
    block: "center",
    inline: "nearest",
    behavior: "instant",
  });
  // Some touch browsers resize only the visual viewport when the keyboard appears.
  if (!dialog.contains(field)) {
    const { top: fieldTop, bottom: fieldBottom } =
      field.getBoundingClientRect();
    if (fieldBottom > bottom - 8)
      window.scrollBy({ top: fieldBottom - bottom + 12, behavior: "instant" });
    else if (fieldTop < top + 8)
      window.scrollBy({ top: fieldTop - top - 12, behavior: "instant" });
  }
}

(window.visualViewport || window).addEventListener(
  "resize",
  keepFocusedFieldVisible,
);

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener("keydown", (event) => {
  // Search fields handle Escape themselves while filled. Close the dialog on that key.
  if (
    event.key !== "Escape" ||
    event.isComposing ||
    !event.target.matches('input[type="search"]')
  )
    return;
  event.preventDefault();
  event.stopPropagation();
  dialog.close();
});
dialog.addEventListener("close", () => {
  if (dialog.open) return;
  const trigger = dialogTrigger;
  dialogTrigger = null;
  if (
    document.activeElement !== document.body &&
    !dialog.contains(document.activeElement)
  )
    return;
  if (trigger?.isConnected && trigger.getClientRects().length)
    trigger.focus({ preventScroll: true });
});

document.addEventListener("visibilitychange", () => {
  activityClock.visibility(!document.hidden);
  save();
  clearTimeout(idleTimer);
  idleTimer = null;
  if (!document.hidden) {
    resetIdle();
    refreshDaily();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.repeat &&
    event.target.matches('[data-game="catch-hit"]') &&
    [" ", "Enter"].includes(event.key)
  ) {
    event.preventDefault();
  }
  activityInput();
  if (
    event.key === "Escape" &&
    !dialog.open &&
    $("#nav").classList.contains("open")
  ) {
    closeMenu();
    $(".menu-toggle").focus();
  }
  const directions = {
    ArrowLeft: [-4, 0],
    ArrowRight: [4, 0],
    ArrowUp: [0, -4],
    ArrowDown: [0, 4],
  };
  const star = event.target.closest(".space-star");
  if (!star || !Object.hasOwn(directions, event.key)) return;
  event.preventDefault();
  const [x, y] = directions[event.key];
  const id = star.dataset.id;
  const current =
    saved.starPositions[id] || stars.find((entry) => entry.id === id);
  const next = limitStar(current.x + x, current.y + y);
  const { field, obstacles } = starArea(star);
  if (!canPlaceStar(next.x, next.y, field, obstacles)) return;
  saved.starPositions[id] = next;
  starPosition(star, next);
  save();
});

document.addEventListener("pointerdown", (event) => {
  activityInput();
  if (!event.isPrimary || event.button !== 0) return;
  const bored = event.target.closest(".bored");
  boredPress =
    bored && event.pointerType === "touch"
      ? { button: bored, pointer: event.pointerId, released: false }
      : null;
  const star = event.target.closest(".space-star");
  if (!star) return;
  drag = {
    star,
    pointer: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    original:
      saved.starPositions[star.dataset.id] ||
      stars.find((entry) => entry.id === star.dataset.id),
    ...starArea(star),
  };
  ignoredStarClick = null;
  star.setPointerCapture(event.pointerId);
});

document.addEventListener(
  "pointermove",
  (event) => {
    const now = performance.now();
    if (drag?.pointer === event.pointerId) {
      if (
        !drag.moved &&
        Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= 8
      ) {
        drag.moved = true;
        drag.star.classList.add("dragging");
        $("#space-line").textContent = "聊绒跟着这颗星星挪了挪。";
        const loro = $(".space-loro");
        const bounds = loro.getBoundingClientRect();
        const dx = event.clientX - (bounds.left + bounds.width / 2);
        const dy = event.clientY - (bounds.top + bounds.height / 2);
        const distance = Math.max(1, Math.hypot(dx, dy));
        loro.style.setProperty(
          "--loro-run-x",
          Math.round((dx / distance) * 32) + "px",
        );
        loro.style.setProperty(
          "--loro-run-y",
          Math.round((dy / distance) * 32) + "px",
        );
        setMascot("running", 900);
      }
      if (drag.moved) {
        const { field, obstacles } = drag;
        const next = limitStar(
          ((event.clientX - field.left) / field.width) * 100,
          ((event.clientY - field.top) / field.height) * 100,
        );
        if (canPlaceStar(next.x, next.y, field, obstacles)) {
          drag.position = next;
          starPosition(drag.star, next);
        }
      }
    }
    if (now - lastPointerSample >= 75) {
      lastPointerSample = now;
      // Touch scrolling and mouse movement both count as interaction. Hit tests run only on the home poster.
      activityInput(now);
      if (currentPath === "/") {
        observeHome(event, now);
        tryDodge(event, now);
      }
    }
  },
  { passive: true },
);

document.addEventListener(
  "wheel",
  () => {
    const now = performance.now();
    if (now - lastPointerSample < 75) return;
    lastPointerSample = now;
    activityInput(now);
  },
  { passive: true },
);

function endDrag(event) {
  if (!drag || drag.pointer !== event.pointerId) return;
  const { star, moved, position, original } = drag;
  const id = star.dataset.id;
  const released = event.type === "pointerup";
  drag = null;
  star.classList.remove("dragging");
  ignoredStarClick = released && moved ? id : null;
  if (!moved) return;
  if (
    released &&
    position &&
    (position.x !== original.x || position.y !== original.y)
  ) {
    saved.starPositions[id] = position;
    save();
  } else {
    starPosition(star, original);
  }
  setMascot("curious");
}

function endPointer(event) {
  if (boredPress?.pointer === event.pointerId) {
    if (event.type === "pointerup" && boredPress.button.contains(event.target))
      boredPress.released = true;
    else boredPress = null;
  }
  endDrag(event);
}

document.addEventListener("pointerup", endPointer);
document.addEventListener("pointercancel", endPointer);
document.addEventListener("lostpointercapture", endDrag);
window.addEventListener("popstate", () => openRoute());
window.addEventListener("pagehide", () => {
  activityClock.visibility(false);
  clearTimeout(idleTimer);
  idleTimer = null;
  clearTimeout(rollTimer);
  rollTimer = null;
  game?.stop();
  stopAmbient();
  attachMascot(null);
  save();
});
window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  activityClock.visibility(!document.hidden);
  openRoute();
});
motionQuery.addEventListener("change", updateMotion);
setInterval(() => {
  const before = saved.activeSeconds;
  activityClock.sample();
  if (before !== saved.activeSeconds) save();
  refreshDaily();
}, 5000);
activityClock.visibility(!document.hidden);
openRoute();
