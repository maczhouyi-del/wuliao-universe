import { comicEndings } from "./catalog.js";

export const mondayStory = {
  wake: {
    title: "日历少了一格",
    scene: "wake",
    art: "loro",
    speaker: "聊绒",
    text: "早餐还在，拖鞋还在。可日历从星期日直接跳到了星期二。",
    next: "star",
  },
  star: {
    title: "一颗关掉灯的星星",
    scene: "star",
    art: "star",
    speaker: "星星",
    text: "我没有看见星期一。我今天连自己都懒得照亮。你问问那朵云吧。",
    next: "crossroad",
  },
  crossroad: {
    title: "没有下一场雨",
    scene: "cloud",
    art: "cloud",
    speaker: "不下雨的云",
    text: "星期一从我这里经过了。它说想歇一歇。去土豆家？还是到月亮家问问那个钟？",
    choices: [
      ["去土豆家", "potato"],
      ["去月亮家", "clock"],
    ],
  },
  potato: {
    title: "没有早班的土豆",
    scene: "potato",
    art: "potato",
    speaker: "退休土豆",
    text: "嘘，日历小纸片在我的枕头底下。它头一回没被闹钟叫醒。",
    next: "nap-end",
  },
  clock: {
    title: "一直问时间的钟",
    scene: "clock",
    art: "clock",
    speaker: "月亮的钟",
    text: "现在几点？我问了整晚。星期一借走了五分钟，还给我留了张借条。",
    next: "clock-end",
  },
  "nap-end": {
    title: comicEndings.nap,
    scene: "nap",
    art: "loro",
    speaker: "聊绒",
    text: "我把日历轻轻合上。等星期一睡饱了，再请它回来。",
    ending: "nap",
  },
  "clock-end": {
    title: comicEndings.clock,
    scene: "moon",
    art: "moon",
    speaker: "聊绒",
    text: "明天，我也想向日历借五分钟。用来看看月亮到底有没有准时。",
    ending: "clock",
  },
};

export function comicNext(id, choice) {
  const frame = mondayStory[id];
  if (!frame) return null;
  if (frame.choices)
    return frame.choices.some(([, next]) => next === choice) ? choice : null;
  return frame.next ?? null;
}

const illustrations = {
  star: '<span class="comic-star" aria-hidden="true">★</span>',
  cloud: '<span class="comic-cloud" aria-hidden="true"></span>',
  clock: '<span class="comic-clock" aria-hidden="true"></span>',
};

export function render() {
  return `<article class="comic-reader">
    <div class="comic-reader-title"><h2>聊绒和失踪的星期一</h2><p data-comic-progress></p></div>
    <div data-comic-panel></div>
    <p class="sr-only" data-comic-status role="status"></p>
  </article>`;
}

export function mount(root, { signal, complete, log, secret }) {
  const panel = root.querySelector("[data-comic-panel]");
  const progress = root.querySelector("[data-comic-progress]");
  const status = root.querySelector("[data-comic-status]");
  const finished = new Set();
  let trail = [];

  function show(focus = false) {
    const frame = mondayStory[trail.at(-1)];
    const image =
      illustrations[frame.art] ??
      `<img src="/assets/${frame.art}.webp" width="502" height="530" alt="">`;
    const picture = `<div class="comic-picture" aria-hidden="true"><i></i><i></i><span class="comic-spark">✦</span>${image}<b>✧</b></div>`;
    const art = frame.next
      ? `<button type="button" data-comic="next" class="comic-art" aria-label="点击画面继续">${picture}</button>`
      : `<div class="comic-art">${picture}</div>`;
    progress.textContent = `分镜 ${trail.length} / 5`;
    panel.innerHTML = `<div class="comic-frame comic-${frame.scene}">
      ${art}
      <div class="comic-caption"><h3 tabindex="-1">${frame.title}</h3>
      <p><strong>${frame.speaker}</strong> ${frame.text}</p></div>
    </div>
    <div class="comic-actions">
      ${trail.length > 1 ? '<button type="button" class="text-button" data-comic="back">上一格</button>' : ""}
      ${frame.next ? '<button type="button" class="pill pink" data-comic="next">继续</button>' : ""}
      ${frame.choices?.map(([label, next]) => `<button type="button" class="pill blue" data-comic="choice" data-next="${next}">${label}</button>`).join("") ?? ""}
      ${frame.ending ? '<button type="button" class="pill lime" data-comic="reset">从头再读</button><a class="text-link" href="/archive#world-records">查看已读结局</a>' : ""}
    </div>`;
    status.textContent = frame.ending
      ? "已读完结局：" + frame.title
      : progress.textContent + "，" + frame.title;
    if (focus) panel.querySelector("h3").focus();
    if (frame.ending && !finished.has(frame.ending)) {
      finished.add(frame.ending);
      complete(frame.ending);
      if (log.comicEndings.length === Object.keys(comicEndings).length)
        secret("monday-both");
    }
  }

  function reset(focus = false) {
    trail = ["wake"];
    finished.clear();
    show(focus);
  }

  root.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("[data-comic]");
      if (!button) return;
      const action = button.dataset.comic;
      if (action === "reset") return reset(true);
      if (action === "back" && trail.length > 1) trail.pop();
      else {
        const next = comicNext(trail.at(-1), button.dataset.next);
        if (!next) return;
        trail.push(next);
      }
      show(true);
    },
    { signal },
  );

  reset();
  return { reset: () => reset(true) };
}
