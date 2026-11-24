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
  helloReplies,
  labMilestones,
} from "./content.js";
import { createActiveClock, limitStar, readSave, writeSave } from "./state.js";
import { createGame, renderGame } from "./games.js";
import { attachMascot, mascotLine, setMascot } from "./mascot.js";

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
function art(name, css = "") {
  const [width, height] = artSizes[name];
  return `<img class="${css}" src="${assets}${name}.webp" width="${width}" height="${height}" alt="" draggable="false">`;
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
let pressesOnHome = 0;
let chaseCount = 0;
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
const animations = new Map();

const mascotArt = (css = "") => art("loro", css + " mascot-art");
const mascotGuide = (page, line) =>
  `<div class="mascot-guide"><button type="button" data-action="guide" data-id="${page}" data-mascot aria-label="和聊绒说句话">${mascotArt()}</button><p class="guide-line" role="status">${line}</p></div>`;

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
    <div class="portal-grid">
      <a class="portal pink" href="/lab"><small>无聊实验</small>${art("button")}<h3>没用的东西研究所</h3><p>这里的实验，一个比一个没用。</p></a>
      <a class="portal purple" href="/space-daze"><small>慢慢来</small>${art("planet")}<h3>宇宙发呆中心</h3><p>什么都不用做，也挺好的。</p></a>
      <a class="portal lime" href="/fortune"><small>随机挑战</small>${art("machine")}<h3>随机命运分配局</h3><p>抽一件微不足道又挺有意思的事。</p></a>
    </div>
  </section>`;
}

function dailySection() {
  const daily = getDailyRecommendation();
  return `<section class="daily-board" data-day="${daily.day}" aria-labelledby="daily-title">
    <h3 id="daily-title">聊绒今天推荐</h3>
    <div class="daily-links">
      <a href="/random?id=${daily.game}"><small>今日小游戏</small><strong>${getItem(daily.game).title}</strong></a>
      <a href="/random?id=${daily.question[1]}"><small>今日奇怪问题</small><strong>${daily.question[0]}</strong></a>
      <a href="/fortune?task=${daily.task}"><small>今日随机任务</small><strong>${tasks[daily.task].text}</strong></a>
      <div><small>聊绒今日心情</small><strong>${daily.mood}</strong></div>
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
    <div class="space-stage" id="space-stage">
      <header class="space-title"><h1 id="space-title">宇宙发呆中心</h1><p>什么都不用做。</p></header>
      <aside class="star-note"><strong>拖动星星</strong><small>点星星收藏。方向键也能移动。</small></aside>
      ${stars
        .map((star) => {
          const position = saved.starPositions[star.id] || star;
          const collected = saved.stars.includes(star.id);
          return `<button class="space-star" type="button" data-action="star" data-id="${star.id}" aria-label="${star.label}" aria-pressed="${collected}" style="--x:${position.x}%;--y:${position.y}%;--star-hue:${star.color}"><span aria-hidden="true">${star.symbol}</span><small aria-hidden="true">✓</small></button>`;
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
        <button type="button" class="pill pink" data-action="space-sound" aria-pressed="${Boolean(soundSession?.ambient)}">${soundSession?.ambient ? "Ⅱ 暂停发呆音" : "▷ 一起发呆"}</button>
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
        ${renderGame(item, reduced(), unlocked)}
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

function collection() {
  const shown = experiences.filter(
    (entry) =>
      available(entry) && (category === "全部" || entry.type === category),
  );
  if (order === "热门") shown.sort((a, b) => b.rank - a.rank);
  if (order === "上新顺序") shown.sort((a, b) => b.sequence - a.sequence);
  return `<section class="body-section collection-page">
    <div class="section-heading"><div><p class="eyeline">✸ 脑洞存放处</p><h1 class="display"><span class="marker lime">奇怪合集</span></h1><p>收留没有地方可去的奇怪念头。</p></div><a class="pill plain" href="/archive#favorites">看我的收藏</a></div>
    <div class="collection-controls"><div class="chips" aria-label="按类型筛选">${categories.map((name) => `<button type="button" data-action="collection-filter" data-id="${name}" aria-pressed="${category === name}">${name}</button>`).join("")}</div>
    <label class="select-label">排序<select data-change="collection-order">${["推荐", "热门", "上新顺序"].map((name) => `<option ${name === order ? "selected" : ""}>${name}</option>`).join("")}</select></label></div>
    ${mascotGuide("collection", "看到喜欢的，就点星星把它收起来。")}
    <div class="card-grid">${shown
      .map((entry) => {
        const held = saved.favorites.includes(entry.id);
        return `<div class="collection-tile">${card(entry)}<button type="button" class="favorite-star" data-action="favorite" data-id="${entry.id}" aria-label="${held ? "取消收藏" : "收藏"}${entry.title}" aria-pressed="${held}">${held ? "★" : "☆"}</button></div>`;
      })
      .join("")}</div>
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
  const count = Object.keys(saved.discoveries).length;
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

function archiveDiscoveries() {
  const records = Object.entries(saved.discoveries).sort((a, b) => b[1] - a[1]);
  return `<section class="archive-section" id="discoveries"><div class="section-heading"><h2>隐藏发现</h2></div>
    ${
      records.length
        ? `<ul class="record-grid">${records
            .map(
              ([
                id,
              ]) => `<li><strong>${discoveries[id].title}</strong><p>${discoveries[id].reward}</p>
      ${id === "lab-echo" ? '<a class="text-link" href="/random?id=echo">收听电台</a>' : ""}
      ${id === "door-person" ? '<a class="text-link" href="/random?id=door">回门边看看</a>' : ""}</li>`,
            )
            .join("")}</ul>`
        : '<p class="empty-note">试试多点几次「你好」，聊绒好像藏了一句话。</p>'
    }
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
  if (currentPath === "/") {
    pressesOnHome = 0;
    chaseCount = 0;
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
    const shared = params.get("task");
    if (
      shared !== null &&
      /^\d+$/.test(shared) &&
      tasks[Number(shared)] &&
      taskIndex !== Number(shared)
    ) {
      taskIndex = Number(shared);
      taskDone = false;
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
  game?.motionChanged();
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

function discover(id) {
  if (unlocked(id)) return false;
  saved.discoveries[id] = Date.now();
  save();
  announce("发现彩蛋 · " + discoveries[id].title);
  return true;
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
  ambient.tones[0].addEventListener(
    "ended",
    () => ambient.volume.disconnect(),
    { once: true },
  );
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

function collectStar(button, event) {
  const id = button.dataset.id;
  if (event?.detail > 0 && ignoredStarClick === id) {
    ignoredStarClick = null;
    return;
  }
  const star = stars.find((entry) => entry.id === id);
  if (saved.stars.includes(id)) {
    announce(star.label + "已经在罐子里了。");
    return;
  }
  saved.stars.push(id);
  syncStars();
  announce("把「" + star.label + "」收进了罐子。");
  animateOnce(button, "star-pop", 420);
  setMascot("happy");
  markCompleted("star");
  if (saved.stars.length === stars.length) discover("constellation");
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
      history.replaceState(null, "", "/fortune?task=" + taskIndex);
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
    const [mood, line, animation] =
      helloReplies[Math.min(pressesOnHome++, helloReplies.length - 1)];
    $("#home-reply").textContent = line;
    setMascot(mood);
    animateOnce(button, animation, 440);
    if (pressesOnHome === 5) {
      discover("hello");
      markCompleted("hello");
    }
  },
  bored(button, event) {
    const touch = event.detail > 0 && event.pointerType === "touch";
    if (touch && !reduced() && chaseCount < 2) {
      const line = ["抓不到我！再点一次。", "你别追了！"][chaseCount++];
      $("#home-reply").textContent = line;
      animateOnce(button, "hello-flinch", 320);
      setMascot("running", 700);
      return;
    }
    chaseCount = 3;
    $("#home-reply").textContent = "啊！居然被你抓到了！";
    setMascot("happy");
    animateOnce(button, "hello-spark", 440);
    markCompleted("bored");
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
    saved.settings.motion = !saved.settings.motion;
    save();
    updateMotion();
    announce(reduced() ? "已减少动画。" : "已恢复动画设置。");
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
    saved.stars = saved.stars.filter((id) => id !== button.dataset.id);
    save();
    syncStars();
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
  if (id === "fish-power") $("#fish-power-value").value = value;
  if (id === "echo-knob") $("#echo-frequency").value = value;
});

document.addEventListener("change", (event) => {
  const control = event.target;
  if (control.dataset.change === "lab-sound") {
    saved.settings.labSound = control.checked;
    save();
  }
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

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

document.addEventListener("visibilitychange", () => {
  activityClock.visibility(!document.hidden);
  save();
  clearTimeout(idleTimer);
  idleTimer = null;
  if (!document.hidden) resetIdle();
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
  const star = event.target.closest(".space-star");
  if (!star || !event.isPrimary || event.button !== 0) return;
  drag = {
    star,
    pointer: event.pointerId,
    x: event.clientX,
    y: event.clientY,
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
  const { star, moved, position } = drag;
  const id = star.dataset.id;
  star.classList.remove("dragging");
  if (moved) {
    ignoredStarClick = id;
    if (event.type === "pointerup" && position) {
      saved.starPositions[id] = position;
      save();
    } else {
      starPosition(
        star,
        saved.starPositions[id] || stars.find((entry) => entry.id === id),
      );
    }
    setMascot("curious");
  }
  drag = null;
}

document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", endDrag);
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
  if (currentPath === "/" && !document.hidden) {
    const board = $(".daily-board");
    if (Number(board.dataset.day) !== getDailyRecommendation().day)
      board.outerHTML = dailySection();
  }
}, 5000);
activityClock.visibility(!document.hidden);
openRoute();
