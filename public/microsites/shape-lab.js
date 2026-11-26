import { shapeColors, shapeLimit, shapeTypes } from "./catalog.js";

const types = Object.keys(shapeTypes);
const colors = Object.keys(shapeColors);
const critiques = [
  "你创造了一个非常没有意义的作品。",
  "这幅作品让我想起一颗土豆。",
  "艺术的边界被你打乱了。",
];
const clampPosition = (value) =>
  Math.max(5, Math.min(95, Math.round(value * 10) / 10));

export function shuffledShape(shape, random = Math.random) {
  return {
    ...shape,
    x: 13 + Math.round(random() * 74),
    y: 15 + Math.round(random() * 70),
    size: 13 + Math.round(random() * 22),
    angle: Math.floor(random() * 241) - 120,
  };
}

function shapeGlyph(type) {
  const entry = shapeTypes[type];
  return entry.art
    ? `<img src="/assets/${entry.art}.webp" width="32" height="32" alt="">`
    : `<span aria-hidden="true">${entry.symbol}</span>`;
}

export function render() {
  return `<div class="shape-studio">
    <div class="shape-palette" role="group" aria-label="添加形状">
      ${types.map((type) => `<button type="button" data-add-shape="${type}" aria-label="添加${shapeTypes[type].name}">${shapeGlyph(type)}<small>${shapeTypes[type].name}</small></button>`).join("")}
    </div>
    <div class="shape-workbench">
      <div>
        <div class="shape-board" role="group" aria-label="图形画布">
          <canvas width="900" height="560" aria-hidden="true"></canvas>
          <div data-shape-handles></div>
        </div>
        <p class="world-feedback" role="status">聊绒说：今天没有任务，你可以随便乱摆。</p>
      </div>
      <aside class="shape-tools" aria-label="作品工具">
        <label for="work-title">作品名</label><input id="work-title" maxlength="30" placeholder="给作品取个名字">
        <fieldset disabled>
          <legend>选中形状</legend>
          <label>大小 <output data-size-value></output><input type="range" min="9" max="42" data-shape-property="size"></label>
          <label>角度 <output data-angle-value></output><input type="range" min="-180" max="180" data-shape-property="angle"></label>
          <label>颜色<select data-shape-property="color">${colors.map((id) => `<option value="${id}">${shapeColors[id].name}</option>`).join("")}</select></label>
          <div class="world-actions"><button class="text-button" type="button" data-shape="duplicate">复制</button><button class="text-button" type="button" data-shape="delete">删除</button></div>
        </fieldset>
        <div class="shape-file-actions">
          <button class="pill pink" type="button" data-shape="save">保存作品</button>
          <button class="text-button" type="button" data-shape="restore">恢复上次作品</button>
          <button class="text-button" type="button" data-shape="export">导出 PNG</button>
        </div>
      </aside>
    </div>
    <div class="world-actions shape-actions">
      <button class="pill lime" type="button" data-shape="shuffle">胡乱排列</button>
      <button class="pill plain" type="button" data-shape="generate">随机生成新作品</button>
      <button class="text-button" type="button" data-shape="clear">清空画布</button>
    </div>
  </div>`;
}

function drawShape(context, shape, images) {
  const { width, height } = context.canvas;
  const radius = ((shape.size / 100) * width) / 2;
  const color = shapeColors[shape.color].value;
  context.save();
  context.translate((shape.x / 100) * width, (shape.y / 100) * height);
  context.rotate((shape.angle * Math.PI) / 180);
  context.scale(radius, radius);
  context.fillStyle = color;
  context.strokeStyle = "#241c2c";
  context.lineWidth = 3 / radius;
  context.lineJoin = context.lineCap = "round";
  context.beginPath();
  if (
    shape.type === "circle" ||
    shape.type === "loro" ||
    shape.type === "potato"
  ) {
    context.arc(0, 0, 0.91, 0, 2 * Math.PI);
  } else if (shape.type === "square") {
    context.rect(-0.72, -0.72, 1.44, 1.44);
  } else if (shape.type === "triangle") {
    context.moveTo(0, -0.94);
    context.lineTo(0.94, 0.75);
    context.lineTo(-0.94, 0.75);
  } else if (shape.type === "star") {
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 ? 0.45 : 0.96;
      context.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
  } else if (shape.type === "cloud") {
    context.moveTo(-0.69, 0.42);
    context.bezierCurveTo(-1.14, 0.42, -1.12, -0.21, -0.68, -0.24);
    context.bezierCurveTo(-0.62, -0.66, -0.11, -0.71, 0.02, -0.4);
    context.bezierCurveTo(0.39, -0.75, 0.78, -0.43, 0.78, -0.14);
    context.bezierCurveTo(1.19, -0.08, 1.08, 0.47, 0.66, 0.42);
  } else {
    context.moveTo(-0.9, 0.35);
    context.bezierCurveTo(-0.55, -1.1, -0.1, 1.05, 0.34, 0.12);
    context.quadraticCurveTo(0.63, -0.56, 0.9, -0.3);
    context.strokeStyle = color;
    context.lineWidth = 0.16;
    context.stroke();
    context.restore();
    return;
  }
  context.closePath();
  context.fill();
  context.stroke();
  const image = images.get(shape.type);
  if (image) {
    const width = 1.42;
    const height = (width * image.naturalHeight) / image.naturalWidth;
    context.drawImage(image, -width / 2, -height / 2, width, height);
  }
  context.restore();
}

export function mount(root, { signal, complete, log }) {
  const $ = (selector) => root.querySelector(selector);
  const note = $(".world-feedback");
  const board = $(".shape-board");
  const canvas = $("canvas");
  const context = canvas.getContext("2d");
  const handles = $("[data-shape-handles]");
  const title = $("#work-title");
  const tool = (name) => $("[data-shape-property=" + name + "]");
  const images = new Map();
  let shapes = [];
  let chosen = -1;
  let drag;
  let previousCritique = -1;
  let paintFrame;
  const imagesReady = Promise.all(
    ["potato", "loro"].map(
      (id) =>
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => {
            images.set(id, image);
            if (!signal.aborted) schedulePaint();
            resolve();
          };
          image.onerror = resolve;
          image.src = "/assets/" + shapeTypes[id].art + ".webp";
        }),
    ),
  );

  function paint() {
    if (!context) return;
    context.fillStyle = "#fffcf3";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#d9cdbb";
    for (let x = 17; x < canvas.width; x += 28) {
      for (let y = 17; y < canvas.height; y += 28) context.fillRect(x, y, 2, 2);
    }
    for (const shape of shapes) drawShape(context, shape, images);
  }

  function schedulePaint() {
    if (paintFrame !== undefined) return;
    paintFrame = requestAnimationFrame(() => {
      paintFrame = undefined;
      paint();
    });
  }

  function positionHandle(handle, shape) {
    handle.style.left = shape.x + "%";
    handle.style.top = shape.y + "%";
    handle.style.width = shape.size + "%";
    handle.style.rotate = shape.angle + "deg";
  }

  function choose(index) {
    chosen = index;
    const selected = shapes[index];
    $("fieldset").disabled = !selected;
    for (const [id, handle] of [...handles.children].entries()) {
      handle.setAttribute("aria-pressed", String(index === id));
    }
    if (selected) {
      for (const property of ["size", "angle", "color"])
        tool(property).value = selected[property];
      $("[data-size-value]").textContent = Math.round(selected.size) + "%";
      $("[data-angle-value]").textContent = selected.angle + "°";
    }
  }

  function sync() {
    handles.innerHTML = shapes
      .map(
        ({ type }, index) =>
          `<button class="shape-handle" type="button" data-handle="${index}" aria-label="${shapeTypes[type].name} ${index + 1}"></button>`,
      )
      .join("");
    for (const [index, shape] of shapes.entries())
      positionHandle(handles.children[index], shape);
    choose(chosen);
    schedulePaint();
  }

  function reset() {
    drag = null;
    shapes = [];
    title.value = "";
    chosen = -1;
    sync();
    note.textContent = "聊绒说：今天没有任务，你可以随便乱摆。";
  }

  function add(shape) {
    if (shapes.length >= shapeLimit) {
      note.textContent = "画布摆满了。删掉一个形状再试试。";
      return;
    }
    shapes.push(shape);
    chosen = shapes.length - 1;
    sync();
    handles.children[chosen].focus({ preventScroll: true });
    note.textContent = "加入了" + shapeTypes[shape.type].name + "。";
  }

  function critique() {
    previousCritique =
      (previousCritique +
        1 +
        Math.floor(Math.random() * (critiques.length - 1))) %
      critiques.length;
    note.textContent = critiques[previousCritique];
  }

  function removeSelected() {
    if (chosen < 0) return;
    shapes.splice(chosen, 1);
    chosen = Math.min(chosen, shapes.length - 1);
    sync();
    (handles.children[chosen] || $("[data-add-shape]")).focus({
      preventScroll: true,
    });
    note.textContent = "拿掉了一个形状。";
  }

  function updatePosition(index, x, y) {
    const shape = shapes[index];
    shape.x = clampPosition(x);
    shape.y = clampPosition(y);
    positionHandle(handles.children[index], shape);
    schedulePaint();
  }

  async function exportPng(button) {
    if (!shapes.length) return (note.textContent = "先放进一个形状再导出吧。");
    if (!context) return (note.textContent = "这个浏览器的画布暂时无法导出。");
    button.disabled = true;
    await imagesReady;
    if (signal.aborted) return;
    paint();
    const name = (title.value.trim() || "无题").replace(
      /[^\p{Letter}\p{Number}_-]/gu,
      "-",
    );
    canvas.toBlob((blob) => {
      if (signal.aborted) return;
      button.disabled = false;
      if (!blob) return (note.textContent = "图片没有导出成功。");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name + ".png";
      root.append(link);
      link.click();
      link.remove();
      const releaseUrl = () => {
        clearTimeout(cleanup);
        URL.revokeObjectURL(url);
        signal.removeEventListener("abort", releaseUrl);
      };
      const cleanup = setTimeout(releaseUrl, 800);
      signal.addEventListener("abort", releaseUrl, { once: true });
      note.textContent = "作品已导出为 PNG。";
    });
  }

  root.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const type = button.dataset.addShape;
      if (type) {
        const placements = [
          [42, 43],
          [64, 43],
          [50, 72],
          [24, 63],
          [24, 24],
          [55, 23],
          [78, 69],
          [79, 22],
          [16, 82],
        ];
        const [x, y] = placements[shapes.length % placements.length];
        const shift = Math.floor(shapes.length / placements.length) * 2;
        add({
          type,
          x: x + shift,
          y: y + shift,
          size: 20,
          angle: 0,
          color: colors[shapes.length % colors.length],
        });
      }
      if (button.dataset.handle !== undefined)
        choose(Number(button.dataset.handle));
      const action = button.dataset.shape;
      if (action === "clear") reset();
      if (action === "delete") removeSelected();
      if (action === "duplicate" && chosen >= 0) {
        const shape = shapes[chosen];
        add({
          ...shape,
          x: clampPosition(shape.x + 7),
          y: clampPosition(shape.y + 7),
        });
      }
      if (action === "shuffle") {
        if (!shapes.length)
          return (note.textContent = "先放几个形状，再来胡乱排列。");
        shapes = shapes.map((shape) => shuffledShape(shape));
        sync();
        critique();
      }
      if (action === "generate") {
        reset();
        shapes = types.map((type, i) =>
          shuffledShape({ type, color: colors[i % colors.length] }),
        );
        chosen = 0;
        sync();
        critique();
      }
      if (action === "save") {
        if (!shapes.length)
          return (note.textContent = "先放进一个形状再保存吧。");
        complete({ name: title.value, shapes });
        title.value = log.shapeLayout.name;
        $('[data-shape="restore"]').disabled = false;
        note.textContent = "《" + log.shapeLayout.name + "》已经收进小站足迹。";
      }
      if (action === "restore" && log.shapeLayout) {
        shapes = log.shapeLayout.shapes.map((shape) => ({ ...shape }));
        title.value = log.shapeLayout.name;
        chosen = shapes.length ? 0 : -1;
        sync();
        note.textContent = "上次的作品回来了。";
      }
      if (action === "export") void exportPng(button);
    },
    { signal },
  );

  root.addEventListener(
    "input",
    (event) => {
      const property = event.target.dataset.shapeProperty;
      if (!property || chosen < 0) return;
      shapes[chosen][property] =
        property === "color" ? event.target.value : Number(event.target.value);
      choose(chosen);
      positionHandle(handles.children[chosen], shapes[chosen]);
      schedulePaint();
    },
    { signal },
  );

  handles.addEventListener(
    "focusin",
    (event) => {
      if (event.target.dataset.handle !== undefined)
        choose(Number(event.target.dataset.handle));
    },
    { signal },
  );

  handles.addEventListener(
    "pointerdown",
    (event) => {
      const handle = event.target.closest("[data-handle]");
      if (!handle || !event.isPrimary || event.button !== 0) return;
      const index = Number(handle.dataset.handle);
      const { x, y } = shapes[index];
      const { width, height } = board.getBoundingClientRect();
      drag = {
        index,
        x,
        y,
        width,
        height,
        startX: event.clientX,
        startY: event.clientY,
        id: event.pointerId,
      };
      choose(index);
      handle.setPointerCapture(event.pointerId);
    },
    { signal },
  );

  handles.addEventListener(
    "pointermove",
    (event) => {
      if (drag?.id !== event.pointerId) return;
      const { index, x, y, width, height, startX, startY } = drag;
      updatePosition(
        index,
        x + ((event.clientX - startX) * 100) / width,
        y + ((event.clientY - startY) * 100) / height,
      );
    },
    { signal },
  );

  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
    handles.addEventListener(
      name,
      (event) => {
        if (drag?.id !== event.pointerId) return;
        if (name !== "pointerup") updatePosition(drag.index, drag.x, drag.y);
        drag = null;
      },
      { signal },
    );
  }

  const keys = {
    ArrowUp: [0, -2],
    ArrowDown: [0, 2],
    ArrowLeft: [-2, 0],
    ArrowRight: [2, 0],
  };
  handles.addEventListener(
    "keydown",
    (event) => {
      if (Object.hasOwn(keys, event.key)) {
        event.preventDefault();
        const { x, y } = shapes[chosen];
        const [dx, dy] = keys[event.key];
        updatePosition(chosen, x + dx, y + dy);
      } else if (event.key === "Delete") {
        event.preventDefault();
        removeSelected();
      }
    },
    { signal },
  );

  $('[data-shape="restore"]').disabled = !log.shapeLayout;
  signal.addEventListener("abort", () => cancelAnimationFrame(paintFrame), {
    once: true,
  });
  reset();
  return { reset };
}
