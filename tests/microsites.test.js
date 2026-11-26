import assert from "node:assert/strict";
import test from "node:test";
import { experiences } from "../public/content.js";
import {
  asteroidDuration,
  cloudRooms,
  comicEndings,
  shapeLimit,
  shapeTypes,
  worldByPath,
  worldPath,
  worlds,
} from "../public/microsites/catalog.js";
import { moveOnAsteroid } from "../public/microsites/asteroid.js";
import {
  chooseCloudRoom,
  cloudThreshold,
  strokeDistance,
} from "../public/microsites/cloud-gate.js";
import { comicNext, mondayStory } from "../public/microsites/comic.js";
import { shuffledShape } from "../public/microsites/shape-lab.js";
import {
  normalizeSave,
  normalizeShapeLayout,
  recordWorldCompletion,
  recordWorldSecret,
  recordWorldVisit,
} from "../public/state.js";

test("each little world has a distinct deep link and is available to the experience catalog", () => {
  assert.equal(worlds.length, 4);
  for (const world of worlds) {
    assert.equal(worldByPath(worldPath(world.id)), world);
    const item = experiences.find(({ id }) => id === world.id);
    assert.equal(item.route, worldPath(world.id));
    assert.equal(item.mode, "link");
    assert.equal(item.type, "微型小站");
    assert.equal(item.favorite, true);
  }
  assert.equal(worldByPath("/little-worlds"), undefined);
});

test("little-world migration preserves old counters, settings, stars, favorites and discoveries", () => {
  const data = normalizeSave({
    presses: 30,
    homeCounters: { hello: 4 },
    settings: { fishManual: true },
    favorites: ["potato", "comic", "invalid"],
    stars: ["first"],
    discoveries: { hello: 15 },
    microsites: {
      visits: { asteroid: -1, comic: 2, bad: 19 },
      completions: { "cloud-gate": "1" },
    },
  });
  assert.equal(data.presses, 30);
  assert.equal(data.homeCounters.hello, 4);
  assert.equal(data.settings.fishManual, true);
  assert.deepEqual(data.favorites, ["potato", "comic"]);
  assert.deepEqual(data.stars, ["first"]);
  assert.equal(data.discoveries.hello, 15);
  assert.deepEqual(data.microsites.visits, {
    "cloud-gate": 0,
    asteroid: 0,
    comic: 2,
    "shape-lab": 0,
  });
  assert.equal(data.microsites.completions["cloud-gate"], 0);
  assert.equal(data.microsites.shapeLayout, null);
});

test("little-world achievements save unique room and secret IDs with cumulative visits and completions", () => {
  const data = normalizeSave(null);
  const [room] = cloudRooms;
  recordWorldVisit(data, "cloud-gate");
  recordWorldVisit(data, "cloud-gate");
  recordWorldVisit(data, "invalid");
  assert.equal(recordWorldCompletion(data, "cloud-gate", "invalid"), false);
  recordWorldCompletion(data, "cloud-gate", room.id);
  recordWorldCompletion(data, "cloud-gate", room.id);
  assert.equal(recordWorldSecret(data, "cloud-box", 10), true);
  assert.equal(recordWorldSecret(data, "cloud-box", 20), false);
  assert.equal(recordWorldSecret(data, "not-cataloged", 20), false);
  const { microsites } = normalizeSave(JSON.parse(JSON.stringify(data)));
  assert.equal(microsites.visits["cloud-gate"], 2);
  assert.equal(microsites.completions["cloud-gate"], 2);
  assert.deepEqual(microsites.cloudRooms, [room.id]);
  assert.deepEqual(microsites.secrets, { "cloud-box": 10 });
});

test("cloud ink responds to line length and opening consecutive rooms avoids immediate repeats", () => {
  const start = { x: 0, y: 0 };
  assert.equal(strokeDistance(start, start), 0);
  assert(strokeDistance(start, { x: 100, y: 100 }) < cloudThreshold);
  assert(strokeDistance(start, { x: 320, y: 210 }) > cloudThreshold);
  let last;
  for (let i = 0; i < 6; i++) {
    const next = chooseCloudRoom(last, () => 0);
    assert(next.id !== last);
    last = next.id;
  }
});

test("asteroid movement stays in the stage and best scores rank by stars, then time", () => {
  assert.deepEqual(moveOnAsteroid({ x: 50, y: 50 }, -200, 300), {
    x: 8,
    y: 87,
  });
  const data = normalizeSave(null);
  assert.equal(
    recordWorldCompletion(data, "asteroid", { stars: 5, ms: 50 }),
    false,
  );
  for (const [stars, ms] of [
    [1, 200],
    [2, 1000],
    [1, 120],
    [2, 900],
    [2, asteroidDuration + 3000],
  ]) {
    recordWorldCompletion(data, "asteroid", { stars, ms });
  }
  assert.deepEqual(data.microsites.asteroidBest, { stars: 2, ms: 900 });
  assert.equal(data.microsites.completions.asteroid, 5);
});

test("the first comic has seven scenes, two valid branches, and both endings can be recovered", () => {
  assert.equal(Object.keys(mondayStory).length, 7);
  assert.equal(comicNext("wake"), "star");
  assert.equal(comicNext("star"), "crossroad");
  assert.equal(comicNext("crossroad", "invalid"), null);
  const data = normalizeSave(null);
  for (const branch of ["potato", "clock"]) {
    const chapter = comicNext("crossroad", branch);
    const ending = mondayStory[comicNext(chapter)].ending;
    assert(ending in comicEndings);
    assert(recordWorldCompletion(data, "comic", ending));
  }
  assert.deepEqual(normalizeSave(data).microsites.comicEndings, [
    "nap",
    "clock",
  ]);
});

test("shape layouts normalize unsafe data and saving detaches the drawing from the active canvas", () => {
  const circle = {
    type: "circle",
    x: -10,
    y: 180,
    size: 99,
    angle: -999,
    color: "not-listed",
  };
  const normalized = normalizeShapeLayout({
    name: "  月亮  ",
    shapes: [circle, { ...circle, type: "__proto__" }, { ...circle, x: NaN }],
  });
  assert.deepEqual(normalized, {
    name: "月亮",
    shapes: [
      { type: "circle", x: 5, y: 95, size: 42, angle: -180, color: "pink" },
    ],
  });
  assert.equal(
    normalizeShapeLayout({ shapes: Array(shapeLimit + 1).fill(circle) }).shapes
      .length,
    shapeLimit,
  );
  assert.equal(normalizeShapeLayout({ shapes: "bogus" }), null);
  const data = normalizeSave(null);
  const shapes = [circle];
  assert.equal(
    recordWorldCompletion(data, "shape-lab", { name: "太空点", shapes }),
    true,
  );
  shapes[0].x = 35;
  assert.equal(data.microsites.shapeLayout.shapes[0].x, 5);
  assert.equal(Object.keys(shapeTypes).length, 8);
  const moved = shuffledShape({ ...circle, color: "blue" }, () => 0.5);
  assert.equal(moved.color, "blue");
  assert.equal(moved.type, "circle");
  assert.equal(moved.angle, 0);
});
