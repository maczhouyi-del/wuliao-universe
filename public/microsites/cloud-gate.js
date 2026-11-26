import { cloudRooms } from "./catalog.js";

export const cloudThreshold = 270;
export function strokeDistance(from, to) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

export function chooseCloudRoom(previous, random = Math.random) {
  const choices = cloudRooms.filter((room) => room.id !== previous);
  return choices[Math.floor(random() * choices.length)];
}

export function render() {
  return `<div class="gate-scene" data-stage="drawing">
    <div class="gate-paper">
      <div class="gate-sky" aria-hidden="true"><span>✧</span><span>·</span><span>✧</span><i></i></div>
      <button type="button" class="gate-door" data-gate="door" aria-label="打开云朵之门" disabled><img src="/assets/door.webp" width="506" height="488" alt=""></button>
      <canvas width="900" height="460" aria-hidden="true"></canvas>
      <p class="gate-label">用一条线叫醒这扇门</p>
    </div>
    <div class="gate-prompt">
      <label>云朵进度 <progress max="100" value="0"></progress></label>
      <p class="world-feedback" role="status">你能画出一朵云吗？画什么形状都可以。</p>
      <div class="world-actions">
        <button type="button" class="pill blue" data-gate="open" hidden>进入房间</button>
        <button type="button" class="pill plain" data-gate="skip">跳过绘画，直接开门</button>
        <button type="button" class="text-button" data-gate="clear">重新绘画</button>
      </div>
    </div>
    <section class="gate-room" hidden aria-labelledby="gate-room-title">
      <div class="gate-room-art" aria-hidden="true"></div>
      <div><h2 id="gate-room-title" tabindex="-1"></h2><p class="gate-room-line"></p><p class="gate-room-note" role="status"></p>
        <div class="world-actions">
          <button type="button" class="pill lime" data-gate="look">仔细看看</button>
          <a class="text-link" href="/little-worlds">返回奇怪小站</a>
        </div>
      </div>
    </section>
  </div>`;
}

export function mount(root, { signal, complete, secret }) {
  const $ = (selector) => root.querySelector(selector);
  const scene = $(".gate-scene");
  const canvas = $("canvas");
  const ink = canvas.getContext("2d");
  const progress = $("progress");
  const note = $(".world-feedback");
  const enter = $('[data-gate="open"]');
  const door = $('[data-gate="door"]');
  const skip = $('[data-gate="skip"]');
  const look = $('[data-gate="look"]');
  let stroke;
  let total = 0;
  let previousRoom;
  let room;

  function point(event, rect) {
    return {
      x: Math.max(
        0,
        Math.min(
          canvas.width,
          ((event.clientX - rect.left) / rect.width) * canvas.width,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          canvas.height,
          ((event.clientY - rect.top) / rect.height) * canvas.height,
        ),
      ),
    };
  }

  function showProgress(length) {
    progress.value = Math.min(100, Math.round((length / cloudThreshold) * 100));
  }

  function ready(moveFocus = false) {
    scene.dataset.stage = "ready";
    stroke = null;
    progress.value = 100;
    skip.hidden = true;
    enter.hidden = false;
    door.disabled = false;
    note.textContent = "线条收拢成了一扇门。进去看看？";
    if (moveFocus) enter.focus({ preventScroll: true });
  }

  function reset() {
    scene.dataset.stage = "drawing";
    stroke = null;
    total = 0;
    room = null;
    ink?.clearRect(0, 0, canvas.width, canvas.height);
    showProgress(0);
    $(".gate-room").hidden = true;
    $(".gate-paper").hidden = false;
    $(".gate-prompt").hidden = false;
    enter.hidden = true;
    door.disabled = true;
    skip.hidden = false;
    look.hidden = false;
    $(".gate-room-note").textContent = "";
    note.textContent = "你能画出一朵云吗？画什么形状都可以。";
  }

  if (ink) {
    ink.lineCap = "round";
    ink.lineJoin = "round";
    ink.strokeStyle = "#7551bd";
    ink.lineWidth = 6;
    ink.shadowBlur = 7;
    ink.shadowColor = "#bea6fa";

    canvas.addEventListener(
      "pointerdown",
      (event) => {
        if (
          !event.isPrimary ||
          event.button !== 0 ||
          scene.dataset.stage !== "drawing"
        )
          return;
        const rect = canvas.getBoundingClientRect();
        stroke = {
          id: event.pointerId,
          rect,
          from: point(event, rect),
          length: 0,
        };
        canvas.setPointerCapture(event.pointerId);
      },
      { signal },
    );

    canvas.addEventListener(
      "pointermove",
      (event) => {
        if (stroke?.id !== event.pointerId) return;
        const to = point(event, stroke.rect);
        const travel = strokeDistance(stroke.from, to);
        if (travel < 2) return;
        ink.beginPath();
        ink.moveTo(stroke.from.x, stroke.from.y);
        ink.lineTo(to.x, to.y);
        ink.stroke();
        stroke.from = to;
        stroke.length += travel;
        showProgress(total + stroke.length);
      },
      { signal },
    );

    // Keep the drawing gesture from suppressing the next tap on the door.
    canvas.addEventListener(
      "touchmove",
      (event) => {
        if (stroke && event.cancelable) event.preventDefault();
      },
      { signal, passive: false },
    );

    function endStroke(event) {
      if (stroke?.id !== event.pointerId) return;
      if (event.type === "pointerup") total += stroke.length;
      stroke = null;
      showProgress(total);
      if (total >= cloudThreshold) ready();
      else if (total > 0)
        note.textContent = "云朵还差一点。接着画，或直接开门。";
    }

    for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
      canvas.addEventListener(name, endStroke, { signal });
    }
  } else {
    note.textContent = "画布暂时不可用，你可以直接开门。";
  }

  root.addEventListener(
    "click",
    (event) => {
      const action = event.target.closest("[data-gate]")?.dataset.gate;
      if (action === "skip") ready(true);
      if (action === "clear") reset();
      if (
        (action === "open" || action === "door") &&
        scene.dataset.stage === "ready"
      ) {
        room = chooseCloudRoom(previousRoom);
        previousRoom = room.id;
        scene.dataset.stage = "room";
        $(".gate-paper").hidden = true;
        $(".gate-prompt").hidden = true;
        $(".gate-room").hidden = false;
        $(".gate-room").dataset.room = room.art;
        const title = $("#gate-room-title");
        title.textContent = room.name;
        $(".gate-room-line").textContent = room.line;
        $(".gate-room-art").innerHTML =
          room.art === "star"
            ? "<span>★</span>"
            : `<img src="/assets/${room.art}.webp" width="502" height="530" alt="">`;
        complete(room.id);
        $(".gate-room-note").textContent =
          "你刚刚画出来的，是一扇通往无聊的门。";
        title.focus({ preventScroll: true });
      }
      if (action === "look" && room) {
        $(".gate-room-note").textContent = room.detail;
        look.disabled = true;
        if (room.secret) secret(room.secret);
      }
    },
    { signal },
  );

  return {
    reset() {
      reset();
      look.disabled = false;
    },
  };
}
