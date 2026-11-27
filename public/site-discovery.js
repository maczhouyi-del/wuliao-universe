import {
  externalIllustration,
  externalMotif,
  renderExternalCard,
} from "./external-card.js";

export const rotationDelay = 5500;

export function renderSiteDiscovery(count) {
  return `<section class="body-section random-page discovery-page" data-discovery>
    <div class="section-heading discovery-heading"><div><h1 class="display"><span class="marker lime">随机玩意</span></h1><p>从互联网摇一颗没见过的玩意。</p></div>
      <a href="/archive" class="text-link">我的档案</a>
    </div>
    ${
      count
        ? `<div class="discovery-layout">
      <section class="site-carousel" aria-labelledby="site-carousel-heading">
        <div class="site-carousel-bar"><h2 id="site-carousel-heading">奇妙互联网</h2><p data-carousel-count>${count} 个网站</p></div>
        <div class="site-rail" data-site-rail>
          <button class="site-neighbor" type="button" data-step="-1"></button>
          <div class="site-center" data-site-center></div>
          <button class="site-neighbor" type="button" data-step="1"></button>
        </div>
        <div class="site-controls">
          <button type="button" class="icon-button" data-step="-1" aria-label="上一个网站">←</button>
          <button type="button" class="icon-button" data-step="1" aria-label="下一个网站">→</button>
          <button type="button" class="text-button carousel-toggle" data-carousel-toggle>暂停轮播</button>
        </div>
        <p class="sr-only" role="status" data-slide-status></p>
      </section>
      <aside class="capsule-stall" aria-labelledby="capsule-title">
        <h2 id="capsule-title">互联网扭蛋机</h2>
        <div class="capsule-machine" data-machine aria-hidden="true">
          <div class="capsule-window">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
          <span class="capsule-lever"></span>
          <div class="capsule-slot"><span class="capsule-prize"><i></i><i></i></span></div>
        </div>
        <button class="pill pink capsule-spin" type="button" data-spin>摇一颗 <span aria-hidden="true">✦</span></button>
        <p data-machine-status role="status">抽到的网站会出现在轮播里。</p>
      </aside>
    </div>`
        : '<p class="random-empty">扭蛋机暂时空了，过会儿再来看看。</p>'
    }
  </section>`;
}

export function mountSiteDiscovery(
  root,
  { sites, initial, esc, saved, reduced, select, draw, record },
) {
  if (!sites.length) return null;
  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  const find = (selector) => root.querySelector(selector);
  const carousel = find(".site-carousel");
  const rail = find("[data-site-rail]");
  const center = find("[data-site-center]");
  const neighbors = rail.querySelectorAll("[data-step]");
  const toggle = find("[data-carousel-toggle]");
  const machine = find("[data-machine]");
  const spin = find("[data-spin]");
  const status = find("[data-machine-status]");
  let index = Math.max(
    0,
    sites.findIndex(({ id }) => id === initial),
  );
  let autoplay = !reduced();
  let hovered = false;
  let timer;
  let reveal;
  let prize;
  let start;

  function schedule() {
    clearTimeout(timer);
    if (
      autoplay &&
      !hovered &&
      !document.hidden &&
      (!carousel.contains(document.activeElement) ||
        document.activeElement === toggle) &&
      !prize &&
      sites.length > 1
    ) {
      timer = setTimeout(() => move(1, false), rotationDelay);
    }
  }

  function show(manual) {
    const site = sites[index];
    center.innerHTML = renderExternalCard(
      site,
      esc,
      saved.externalFavorites.includes(site.id),
    );
    for (const button of neighbors) {
      const neighbor =
        sites[
          (index + Number(button.dataset.step) + sites.length) % sites.length
        ];
      button.dataset.motif = externalMotif(neighbor);
      button.innerHTML = `<div class="external-art" aria-hidden="true">${externalIllustration(neighbor)}</div><span>${esc(neighbor.title)}</span>`;
      button.setAttribute(
        "aria-label",
        (button.dataset.step === "-1" ? "上一个网站，" : "下一个网站，") +
          neighbor.title,
      );
    }
    find("[data-carousel-count]").textContent =
      `${index + 1} / ${sites.length}`;
    if (manual) find("[data-slide-status]").textContent = site.title;
    select(site.id);
    schedule();
  }

  function move(direction, manual = true) {
    index = (index + direction + sites.length) % sites.length;
    show(manual);
  }

  function updateToggle() {
    toggle.textContent = autoplay ? "暂停轮播" : "播放轮播";
    schedule();
  }

  function finish() {
    if (!prize) return;
    clearTimeout(reveal);
    machine.classList.remove("is-shaking");
    machine.classList.add("has-prize");
    spin.removeAttribute("aria-disabled");
    index = sites.findIndex(({ id }) => id === prize.id);
    record(prize.id);
    status.textContent = "抽到了「" + prize.title + "」。";
    prize = null;
    show(true);
  }

  root.addEventListener(
    "click",
    (event) => {
      if (event.target.closest("[data-external-site]")) {
        autoplay = false;
        updateToggle();
      }
      const step = event.target.closest("[data-step]");
      if (step && !prize) move(Number(step.dataset.step));
      if (event.target.closest("[data-carousel-toggle]")) {
        autoplay = !autoplay;
        updateToggle();
      }
      if (!event.target.closest("[data-spin]") || prize) return;
      const result = draw();
      if (!result) return;
      prize = result;
      autoplay = false;
      updateToggle();
      spin.setAttribute("aria-disabled", "true");
      status.textContent = "扭蛋正在掉下来……";
      machine.classList.remove("has-prize");
      if (reduced()) return finish();
      machine.classList.add("is-shaking");
      reveal = setTimeout(finish, 990);
    },
    { signal },
  );

  carousel.addEventListener(
    "pointerenter",
    (event) => {
      if (event.pointerType === "mouse") hovered = true;
      schedule();
    },
    { signal },
  );
  carousel.addEventListener(
    "pointerleave",
    () => {
      hovered = false;
      schedule();
    },
    { signal },
  );
  carousel.addEventListener("focusin", schedule, { signal });
  carousel.addEventListener(
    "focusout",
    () =>
      queueMicrotask(() => {
        if (!signal.aborted) schedule();
      }),
    { signal },
  );
  document.addEventListener("visibilitychange", schedule, { signal });

  rail.addEventListener(
    "pointerdown",
    (event) => {
      if (
        !event.isPrimary ||
        event.button !== 0 ||
        event.target.closest("a, button")
      )
        return;
      start = { id: event.pointerId, x: event.clientX, y: event.clientY };
      rail.setPointerCapture(event.pointerId);
    },
    { signal },
  );
  rail.addEventListener(
    "touchmove",
    (event) => {
      if (!start || event.touches.length !== 1 || !event.cancelable) return;
      const touch = event.touches[0];
      const dx = Math.abs(touch.clientX - start.x);
      const dy = Math.abs(touch.clientY - start.y);
      // Keep a horizontal swipe from being interpreted as a scroll fling.
      if (dx > 12 && dx > dy) event.preventDefault();
    },
    { signal, passive: false },
  );
  rail.addEventListener(
    "pointerup",
    (event) => {
      if (start?.id !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (!prize && Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy))
        move(dx < 0 ? 1 : -1);
    },
    { signal },
  );
  rail.addEventListener(
    "lostpointercapture",
    () => {
      start = null;
    },
    { signal },
  );

  if (sites.length < 2) {
    for (const button of root.querySelectorAll(
      "[data-step], [data-carousel-toggle]",
    ))
      button.hidden = true;
  }
  show(false);
  updateToggle();
  return {
    motionChanged() {
      if (reduced()) {
        autoplay = false;
        finish();
      }
      updateToggle();
    },
    stop() {
      lifecycle.abort();
      clearTimeout(timer);
      clearTimeout(reveal);
    },
  };
}
