export const motion = Object.freeze({
  fast: 180,
  normal: 320,
  slow: 600,
  smooth: "cubic-bezier(.22,.61,.36,1)",
  playful: "cubic-bezier(.2,.8,.2,1)",
  bounce: "cubic-bezier(.34,1.56,.64,1)",
});

const archiveSeen = new Set();

export function mountPageMotion(root, { reduced, enter }) {
  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  const animations = new Set();
  const counters = new Map();
  const transient = new Set();
  let counterFrame;
  let parallaxFrame;
  const poster = root.querySelector(".home-scene .poster");
  const active = () => !reduced() && !document.hidden;

  function play(element, frames, timing) {
    const animation = element.animate(frames, timing);
    animations.add(animation);
    animation.onfinish = animation.oncancel = () => {
      animations.delete(animation);
      if (transient.delete(element)) element.remove();
    };
  }

  function resetParallax() {
    cancelAnimationFrame(parallaxFrame);
    parallaxFrame = 0;
    for (const name of ["--scene-x", "--scene-y", "--loro-gaze"])
      poster?.style.removeProperty(name);
  }

  function stopEffects() {
    for (const animation of animations) animation.cancel();
    animations.clear();
    for (const element of transient) element.remove();
    transient.clear();
    cancelAnimationFrame(counterFrame);
    counterFrame = 0;
    for (const [element, counter] of counters)
      element.textContent = counter.value;
    counters.clear();
    resetParallax();
  }

  function countFrame(now) {
    counterFrame = 0;
    for (const [element, counter] of counters) {
      const progress = Math.max(
        0,
        Math.min(1, (now - counter.at) / motion.slow),
      );
      const value = Math.floor(counter.value * (1 - (1 - progress) ** 3));
      if (element.textContent !== String(value)) element.textContent = value;
      if (progress === 1) counters.delete(element);
    }
    if (counters.size) counterFrame = requestAnimationFrame(countFrame);
  }

  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            let stagger = 0;
            for (const entry of entries) {
              if (!entry.isIntersecting || !active()) continue;
              const element = entry.target;
              observer.unobserve(element);
              pending.delete(element);
              const delay = Math.min(stagger++, 4) * 46;
              const key = element.dataset.motionKey;
              if (key && archiveSeen.has(key)) continue;
              if (key) archiveSeen.add(key);
              if (element.dataset.statValue !== undefined) {
                const value = Number(element.dataset.statValue);
                if (value) {
                  element.textContent = 0;
                  counters.set(element, {
                    value,
                    at: performance.now() + delay,
                  });
                }
              } else if (element.hasAttribute("data-meter-fill")) {
                play(
                  element,
                  [
                    { transform: "scaleX(0)" },
                    { transform: `scaleX(${element.dataset.meterFill})` },
                  ],
                  { duration: motion.slow, easing: motion.smooth },
                );
              } else {
                play(
                  element,
                  [
                    { transform: "translateY(7px) scale(.985)", opacity: 0.48 },
                    { transform: "translateY(0) scale(1)", opacity: 1 },
                  ],
                  {
                    duration: motion.normal,
                    delay,
                    easing: motion.smooth,
                    fill: "backwards",
                  },
                );
              }
            }
            if (counters.size && !counterFrame)
              counterFrame = requestAnimationFrame(countFrame);
          },
          { threshold: 0.14 },
        )
      : null;
  const pending = new Set(
    root.querySelectorAll(
      "[data-reveal], [data-stat-value], [data-meter-fill], #favorites .experience-card, .archive-site-list li",
    ),
  );

  function observe() {
    if (!observer || !active()) return;
    for (const element of pending) observer.observe(element);
  }

  if (enter && active()) {
    play(
      root,
      [{ opacity: 0.65 }, { opacity: 1 }],
      { duration: motion.normal, easing: motion.smooth },
    );
  }
  observe();

  if (poster) {
    let pointer;
    poster.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType !== "mouse" || !active()) return;
        pointer = { x: event.clientX, y: event.clientY };
        if (parallaxFrame) return;
        parallaxFrame = requestAnimationFrame(() => {
          parallaxFrame = 0;
          const bounds = poster.getBoundingClientRect();
          const x = Math.max(
            -1,
            Math.min(1, ((pointer.x - bounds.left) / bounds.width - 0.5) * 2),
          );
          const y = Math.max(
            -1,
            Math.min(1, ((pointer.y - bounds.top) / bounds.height - 0.5) * 2),
          );
          poster.style.setProperty("--scene-x", `${(x * 7).toFixed(1)}px`);
          poster.style.setProperty("--scene-y", `${(y * 5).toFixed(1)}px`);
          poster.style.setProperty("--loro-gaze", `${(x * 3.5).toFixed(1)}deg`);
        });
      },
      { signal, passive: true },
    );
    poster.addEventListener("pointerleave", resetParallax, { signal });
  }

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        observer?.disconnect();
        stopEffects();
      } else observe();
    },
    { signal },
  );

  return {
    flyStar(source, target) {
      if (!source || !target || !active()) return;
      const from = source.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const x = from.left + from.width / 2;
      const y = from.top + from.height / 2;
      const dx = to.left + to.width / 2 - x;
      const dy = to.top + to.height / 2 - y;
      const spark = document.createElement("span");
      spark.className = "star-flight";
      spark.textContent = source.querySelector("span")?.textContent || "✦";
      spark.setAttribute("aria-hidden", "true");
      spark.style.left = x + "px";
      spark.style.top = y + "px";
      document.body.append(spark);
      transient.add(spark);
      play(
        spark,
        [
          { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
          {
            transform: `translate(calc(-50% + ${dx * 0.52}px), calc(-50% + ${dy * 0.42 - 34}px)) rotate(22deg) scale(.9)`,
            opacity: 1,
            offset: 0.52,
          },
          {
            transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(37deg) scale(.18)`,
            opacity: 0,
          },
        ],
        { duration: motion.slow - 100, easing: motion.playful, fill: "both" },
      );
    },
    motionChanged() {
      if (!reduced()) return observe();
      observer?.disconnect();
      stopEffects();
    },
    stop() {
      lifecycle.abort();
      observer?.disconnect();
      stopEffects();
    },
  };
}
