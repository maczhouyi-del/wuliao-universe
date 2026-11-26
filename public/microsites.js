import {
  cloudRooms,
  comicEndings,
  worldPath,
  worlds,
  worldsPath,
  worldSecrets,
} from "./microsites/catalog.js";

const loaders = {
  "cloud-gate": () => import("./microsites/cloud-gate.js"),
  asteroid: () => import("./microsites/asteroid.js"),
  comic: () => import("./microsites/comic.js"),
  "shape-lab": () => import("./microsites/shape-lab.js"),
};

let stylesReady;
function loadWorldStyles() {
  stylesReady ??= new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/microsites/worlds.css";
    link.onload = resolve;
    link.onerror = () => {
      stylesReady = undefined;
      link.remove();
      reject(new Error("World stylesheet unavailable"));
    };
    document.head.append(link);
  });
  return stylesReady;
}

function illustration(world) {
  const art = world.art
    ? `<img src="/assets/${world.art}.webp" width="506" height="488" loading="lazy" decoding="async" alt="">`
    : "";
  return `<div class="world-cover cover-${world.id}" aria-hidden="true"><i></i>${art}<span>${world.icon}</span><b>✧</b></div>`;
}

function tiles() {
  return `<div class="world-tiles">${worlds
    .map(
      (world) => `
    <a class="world-tile ${world.color}" href="${worldPath(world.id)}">
      ${illustration(world)}
      <div class="world-tile-copy"><small>${world.action} · ${world.time}</small><h3>${world.title}</h3><p>${world.intro}</p></div>
    </a>`,
    )
    .join("")}</div>`;
}

export function homeWorlds() {
  return `<section class="home-worlds" aria-labelledby="home-worlds-title">
    <div class="section-heading"><div><p class="eyeline">ODD LITTLE WORLDS</p><h2 id="home-worlds-title">奇怪小站</h2></div>
      <a class="text-link" href="${worldsPath}">查看奇怪小站</a></div>${tiles()}</section>`;
}

export function worldHub() {
  return `<section class="body-section worlds-hub">
    <header class="worlds-banner">
      <div><p class="eyeline">ODD LITTLE WORLDS</p><h1 class="display">奇怪小站</h1>
      <p>这里有很多奇怪的小世界，每个都值得进去浪费一点时间。</p></div>
      <img src="/assets/loro.webp" width="502" height="530" alt="">
    </header>${tiles()}
  </section>`;
}

export function worldShell(world, saved) {
  const favorite = saved.favorites.includes(world.id);
  return `<section class="body-section world-page world-${world.id}" aria-labelledby="world-title">
    <div class="world-toolbar">
      <a class="text-link" href="${worldsPath}">返回奇怪小站</a>
      <button type="button" class="pill plain world-favorite" data-action="favorite" data-id="${world.id}" aria-pressed="${favorite}">${favorite ? "★ 已收藏" : "☆ 收藏这个"}</button>
    </div>
    <header class="world-title">
      <div><p class="eyeline">${world.english} · ${world.time}</p><h1 class="display" id="world-title">${world.title}</h1></div>
      <div class="world-guide"><button type="button" data-mascot data-action="guide" data-id="home" aria-label="拍拍聊绒"><img class="mascot-art" src="/assets/loro.webp" width="502" height="530" alt=""></button><p class="guide-line" role="status">${world.intro}</p></div>
    </header>
    <div class="world-experience" aria-busy="true" data-world-body><p role="status">聊绒正在开门……</p></div>
    <div class="world-footer">
      <button class="text-button" type="button" data-world-reset disabled>重新开始</button>
      <details><summary>操作帮助</summary><p>${world.help}</p></details>
    </div>
  </section>`;
}

export function startWorld(root, world, context) {
  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  const body = root.querySelector("[data-world-body]");
  const restart = root.querySelector("[data-world-reset]");
  let interaction;
  Promise.all([loaders[world.id](), loadWorldStyles()])
    .then(([module]) => {
      if (signal.aborted) return;
      body.innerHTML = module.render();
      body.setAttribute("aria-busy", "false");
      interaction = module.mount(body, { ...context, signal });
      if (!interaction) return;
      restart.disabled = false;
      restart.addEventListener("click", () => interaction.reset(), { signal });
    })
    .catch(() => {
      if (signal.aborted) return;
      body.setAttribute("aria-busy", "false");
      body.innerHTML =
        '<p role="status">小站暂时打不开。</p><button class="pill plain" type="button">重新加载</button>';
      body
        .querySelector("button")
        .addEventListener("click", () => location.reload(), { signal });
    });
  return {
    dispose() {
      lifecycle.abort();
    },
    motionChanged() {
      interaction?.motionChanged?.();
    },
  };
}

export function worldArchive(saved, esc) {
  const log = saved.microsites;
  const rooms = cloudRooms
    .filter(({ id }) => log.cloudRooms.includes(id))
    .map(({ name }) => name);
  const ends = log.comicEndings.map((id) => comicEndings[id]);
  const hidden = Object.keys(log.secrets).map((id) => worldSecrets[id]);
  const best = log.asteroidBest;
  const details = {
    "cloud-gate": rooms.join("、"),
    asteroid: best
      ? `最佳 ${best.stars} / 3 颗星 · ${(best.ms / 1000).toFixed(1)} 秒`
      : "",
    comic: ends.join("、"),
    "shape-lab": log.shapeLayout
      ? `已保存《${esc(log.shapeLayout.name)}》`
      : "",
  };
  return `<section class="archive-section" id="world-records">
    <div class="section-heading"><h2>小站足迹</h2><a class="text-link" href="${worldsPath}">逛逛奇怪小站</a></div>
    <ul class="record-grid">${worlds
      .map(
        ({
          id,
          title,
        }) => `<li><a class="text-link" href="${worldPath(id)}"><strong>${title}</strong></a>
      <p>到访 ${log.visits[id]} 次 · 完成 ${log.completions[id]} 次</p>${details[id] ? `<small>${details[id]}</small>` : ""}</li>`,
      )
      .join("")}</ul>
    ${hidden.length ? `<p class="world-found">小站秘密 · ${hidden.join("、")}</p>` : ""}
  </section>`;
}
