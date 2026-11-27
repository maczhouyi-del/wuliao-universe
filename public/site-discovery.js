import {
  externalIllustration,
  externalMotif,
  renderExternalCard,
} from "./external-card.js";

import { motion } from "./page-motion.js";

export const rotationDelay = 6000;
export const capsuleDuration = 1760;
const manualDelay = 8000;

export function slideDirection(from, to, count) {
  const forward = (to - from + count) % count;
  return forward === 0 ? 0 : forward <= count / 2 ? 1 : -1;
}

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
        <div class="site-rail" data-site-rail><div class="site-film">
          <button class="site-neighbor" type="button" data-step="-1"></button>
          <div class="site-center" data-site-center></div>
          <button class="site-neighbor" type="button" data-step="1"></button>
        </div></div>
        <div class="site-controls">
          <button type="button" class="icon-button" data-step="-1" aria-label="上一个网站">←</button>
          <button type="button" class="icon-button" data-step="1" aria-label="下一个网站">→</button>
          <button type="button" class="text-button carousel-toggle" data-carousel-toggle>暂停轮播</button>
        </div>
        <div class="carousel-dots" role="group" aria-label="切换网站" data-carousel-dots></div>
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
  const film = find(".site-film");
  const center = find("[data-site-center]");
  const neighbors = rail.querySelectorAll("[data-step]");
  const dots = find("[data-carousel-dots]");
  const toggle = find("[data-carousel-toggle]");
  const machine = find("[data-machine]");
  const spin = find("[data-spin]");
  const status = find("[data-machine-status]");
  const counter = find("[data-carousel-count]");
  const slideStatus = find("[data-slide-status]");
  dots.innerHTML = sites
    .map(
      ({ title }, index) =>
        `<button type="button" data-slide="${index}" aria-label="${index + 1}，${esc(title)}" tabindex="-1"></button>`,
    )
    .join("");
  const dotButtons = [...dots.children];
  let index = Math.max(
    0,
    sites.findIndex(({ id }) => id === initial),
  );
  let autoplay = true;
  let hovered = false;
  let nextDelay = rotationDelay;
  let timer;
  let reveal;
  let prize;
  let gesture;
  let dragFrame;
  let ignoreClickUntil = 0;
  let outgoing;
  let slideAnimations = [];

  function schedule() {
    clearTimeout(timer);
    if (
      autoplay &&
      !reduced() &&
      !hovered &&
      !document.hidden &&
      !gesture &&
      !carousel.querySelector(":focus-visible") &&
      !prize &&
      sites.length > 1
    ) {
      timer = setTimeout(() => changeBy(1, false), nextDelay);
    }
  }

  function clearSlide() {
    for (const animation of slideAnimations) animation.cancel();
    slideAnimations = [];
    outgoing?.remove();
    outgoing = null;
  }

  function slide(previous, direction, dragX) {
    const offset = direction * 46;
    const timing = { duration: motion.slow - 100, easing: motion.smooth };
    outgoing = previous;
    previous.classList.add("site-exit");
    previous.inert = true;
    previous.setAttribute("aria-hidden", "true");
    previous.removeAttribute("aria-labelledby");
    previous.querySelector("[id]")?.removeAttribute("id");
    rail.append(previous);
    const arrive = center.animate(
      [
        {
          transform: `translateX(calc(${offset}% + ${dragX}px)) scale(.9)`,
          opacity: 0.38,
        },
        { transform: "translateX(0) scale(1)", opacity: 1 },
      ],
      timing,
    );
    const depart = previous.animate(
      [
        { transform: `translateX(${dragX}px) scale(1)`, opacity: 1 },
        { transform: `translateX(${-offset}%) scale(.9)`, opacity: 0 },
      ],
      timing,
    );
    depart.onfinish = () => {
      previous.remove();
      if (outgoing === previous) outgoing = null;
    };
    slideAnimations = [
      arrive,
      depart,
      ...Array.from(neighbors, (neighbor) =>
        neighbor.animate(
          [
            { translate: `${direction * 17}px`, opacity: 0.48 },
            { translate: "0", opacity: 0.88 },
          ],
          timing,
        ),
      ),
    ];
  }

  function show({ manual = false, direction = 0, dragX = 0 } = {}) {
    clearSlide();
    const site = sites[index];
    const previous =
      direction && !reduced() && !document.hidden
        ? center.firstElementChild?.cloneNode(true)
        : null;
    if (previous) previous.style.width = center.offsetWidth + "px";
    const focusInCard = center.contains(document.activeElement);
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
    for (const [position, button] of dotButtons.entries()) {
      const active = position === index;
      button.tabIndex = active ? 0 : -1;
      if (active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    }
    const activeDot = dotButtons[index];
    dots.scrollTo({
      left:
        activeDot.offsetLeft - (dots.clientWidth - activeDot.offsetWidth) / 2,
      behavior: !reduced() && manual ? "smooth" : "instant",
    });
    if (focusInCard) activeDot.focus({ preventScroll: true });
    counter.textContent = `${index + 1} / ${sites.length}`;
    if (manual) slideStatus.textContent = site.title;
    select(site.id);
    if (previous) slide(previous, direction, dragX);
    nextDelay = manual ? manualDelay : rotationDelay;
    schedule();
  }

  function moveTo(
    next,
    manual = true,
    direction = slideDirection(index, next, sites.length),
    dragX = 0,
  ) {
    if (prize || next === index) {
      nextDelay = manualDelay;
      schedule();
      return;
    }
    index = next;
    show({ manual, direction, dragX });
  }

  function changeBy(direction, manual = true, dragX = 0) {
    moveTo(
      (index + direction + sites.length) % sites.length,
      manual,
      direction,
      dragX,
    );
  }

  function updateToggle() {
    toggle.hidden = sites.length < 2 || reduced();
    toggle.textContent = autoplay ? "暂停轮播" : "播放轮播";
    schedule();
  }

  function finish() {
    if (!prize) return;
    clearTimeout(reveal);
    machine.classList.remove("is-shaking");
    machine.classList.add("has-prize");
    spin.removeAttribute("aria-disabled");
    const next = sites.findIndex(({ id }) => id === prize.id);
    record(prize.id);
    status.textContent = "抽到了「" + prize.title + "」。";
    prize = null;
    moveTo(next);
  }

  root.addEventListener(
    "click",
    (event) => {
      if (
        event.detail &&
        performance.now() < ignoreClickUntil &&
        rail.contains(event.target)
      ) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.target.closest("[data-external-site]")) {
        autoplay = false;
        updateToggle();
      }
      const control = event.target.closest(
        "[data-step], [data-slide], [data-carousel-toggle], [data-spin]",
      );
      if (!control) return;
      if (control.dataset.step) return changeBy(Number(control.dataset.step));
      if (control.dataset.slide !== undefined)
        return moveTo(Number(control.dataset.slide));
      if (control.hasAttribute("data-carousel-toggle")) {
        if (!reduced()) autoplay = !autoplay;
        updateToggle();
        return;
      }
      if (prize) return;
      prize = draw();
      if (!prize) return;
      schedule();
      spin.setAttribute("aria-disabled", "true");
      status.textContent = "扭蛋正在掉下来……";
      machine.classList.remove("has-prize");
      if (reduced() || document.hidden) return finish();
      machine.classList.add("is-shaking");
      reveal = setTimeout(finish, capsuleDuration);
    },
    { signal },
  );

  carousel.addEventListener(
    "keydown",
    (event) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
      )
        return;
      // Let users scroll the page with Home/End except when they are using the dots.
      if (["Home", "End"].includes(event.key) && !dots.contains(event.target))
        return;
      event.preventDefault();
      if (event.key === "Home") moveTo(0);
      if (event.key === "End") moveTo(sites.length - 1);
      if (event.key === "ArrowLeft") changeBy(-1);
      if (event.key === "ArrowRight") changeBy(1);
      if (dots.contains(event.target))
        dotButtons[index].focus({ preventScroll: true });
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
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        clearSlide();
        finish();
      }
      schedule();
    },
    { signal },
  );

  rail.addEventListener(
    "pointerdown",
    (event) => {
      if (!event.isPrimary || event.button !== 0 || prize || sites.length < 2)
        return;
      ignoreClickUntil = 0;
      gesture = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        dx: 0,
        engaged: false,
      };
      schedule();
    },
    { signal },
  );
  rail.addEventListener(
    "pointermove",
    (event) => {
      if (gesture?.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!gesture.engaged) {
        if (Math.abs(dx) < 11 || Math.abs(dx) < Math.abs(dy)) return;
        gesture.engaged = true;
        clearSlide();
        rail.setPointerCapture(event.pointerId);
      }
      gesture.dx = dx;
      if (!reduced() && !dragFrame)
        dragFrame = requestAnimationFrame(() => {
          dragFrame = 0;
          if (gesture)
            film.style.setProperty(
              "--rail-drag",
              `${Math.max(-140, Math.min(140, gesture.dx * 0.58))}px`,
            );
        });
    },
    { signal },
  );
  rail.addEventListener(
    "touchmove",
    (event) => {
      if (!gesture || event.touches.length !== 1 || !event.cancelable) return;
      const touch = event.touches[0];
      const dx = Math.abs(touch.clientX - gesture.x);
      const dy = Math.abs(touch.clientY - gesture.y);
      if (dx > 12 && dx > dy) event.preventDefault();
    },
    { signal, passive: false },
  );

  function endGesture(event) {
    if (gesture?.id !== event.pointerId) return;
    const { dx, engaged } = gesture;
    const dragX = parseFloat(film.style.getPropertyValue("--rail-drag")) || 0;
    gesture = null;
    cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    film.style.removeProperty("--rail-drag");
    if (engaged && event.type === "pointerup") {
      ignoreClickUntil = performance.now() + 420;
      if (Math.abs(dx) > 38) return changeBy(dx < 0 ? 1 : -1, true, dragX);
    }
    if (dragX && !reduced()) {
      slideAnimations.push(
        film.animate(
          [
            { transform: `translateX(${dragX}px)` },
            { transform: "translateX(0)" },
          ],
          { duration: motion.fast, easing: motion.smooth },
        ),
      );
    }
    schedule();
  }

  for (const event of ["pointerup", "pointercancel"]) {
    window.addEventListener(event, endGesture, { signal });
  }
  rail.addEventListener("lostpointercapture", (event) => {
    // Touch initially captures on the touched child before we capture the rail.
    if (event.target === rail) endGesture(event);
  }, { signal });

  if (sites.length < 2) {
    for (const button of root.querySelectorAll(
      "[data-step], [data-carousel-dots]",
    ))
      button.hidden = true;
  }
  show();
  updateToggle();
  return {
    motionChanged() {
      if (reduced()) {
        clearSlide();
        finish();
      }
      updateToggle();
    },
    stop() {
      lifecycle.abort();
      clearTimeout(timer);
      clearTimeout(reveal);
      cancelAnimationFrame(dragFrame);
      clearSlide();
    },
  };
}
