import assert from "node:assert/strict";
import test from "node:test";
import {
  discoveries,
  doorEvents,
  experiences,
  getDailyRecommendation,
  rotateDailyRecommendation,
  potatoStory,
  stars,
  tasks,
} from "../public/content.js";
import {
  createActiveClock,
  fortuneFromLink,
  normalizeSave,
  recordHomeInteraction,
  toggleStarCollection,
} from "../public/state.js";

test("legacy counters, favorites, hats and preferences survive migration", () => {
  const data = normalizeSave({
    presses: 51,
    rooms: 2,
    potatoes: 7,
    tasks: 4,
    seconds: 900,
    hat: 2,
    motion: true,
    planet: "奶油星",
    favorites: ["door", "fish"],
    stars: ["first", "second", "third", "fourth", "fifth"],
  });
  assert.equal(data.presses, 51);
  assert.equal(data.rooms, 2);
  assert.equal(data.potatoes, 7);
  assert.equal(data.tasks, 4);
  assert.equal(data.hat, 2);
  assert.equal(data.planet, "奶油星");
  assert.deepEqual(data.favorites, ["door", "fish"]);
  assert.equal(data.settings.motion, true);
  assert.equal(data.settings.labSound, false);
  assert.equal(data.seconds, 900);
  assert.equal(data.activeSeconds, 0);
  assert.deepEqual(data.discoveries, {
    "button-researcher": 0,
    "lab-echo": 0,
    "door-person": 0,
    constellation: 0,
  });
});

test("malformed fields reset independently and star coordinates stay within bounds", () => {
  assert.deepEqual(normalizeSave(null), normalizeSave(["invalid"]));
  const data = normalizeSave({
    presses: -6,
    potatoes: 18,
    hat: 99,
    favorites: ["fish", "fish", "missing"],
    stars: ["third", null],
    settings: { motion: false, labSound: true },
    motion: true,
    fortune: { type: "none", index: 200, done: true },
    discoveries: { hello: 42, unknown: 64, constellation: "bad" },
    thoughts: { banana: 88, moon: -1 },
    starPositions: { first: { x: -10, y: 500 }, second: { x: 20, y: "20" } },
    moonExtras: ["glasses", "glasses", "scarf", "unknown"],
    planetStyle: { color: "__proto__", size: "large", decor: "spark" },
    games: { catchBest: 7, fishBest: 100, fishRounds: 2 },
  });
  assert.equal(data.presses, 0);
  assert.equal(data.potatoes, 18);
  assert.equal(data.hat, 0);
  assert.deepEqual(data.favorites, ["fish"]);
  assert.deepEqual(data.stars, ["third"]);
  assert.deepEqual(data.settings, {
    motion: false,
    labSound: true,
    fishManual: false,
  });
  assert.deepEqual(data.fortune, { type: "all", index: null, done: false });
  assert.deepEqual(data.discoveries, { hello: 42 });
  assert.deepEqual(data.thoughts, { banana: 88 });
  assert.deepEqual(data.starPositions, { first: { x: 8, y: 86 } });
  assert.deepEqual(data.moonExtras, ["glasses", "scarf"]);
  assert.deepEqual(data.planetStyle, {
    color: "original",
    size: "large",
    decor: "spark",
  });
  assert.deepEqual(data.games, {
    catchBest: 7,
    catchRounds: 0,
    fishBest: 5,
    fishRounds: 2,
  });
});

test("the active clock counts recent visible activity and caps idle accumulation", () => {
  let now = 0;
  let seconds = 0;
  const clock = createActiveClock(
    () => now,
    (delta) => {
      seconds += delta;
    },
  );
  clock.visibility(true);
  now = 100_000;
  clock.sample();
  assert.equal(seconds, 0);
  clock.input();
  now += 12_600;
  clock.visibility(false);
  assert.equal(seconds, 12);
  now += 120_000;
  clock.visibility(true);
  now += 5_000;
  clock.sample();
  assert.equal(seconds, 12);
  clock.input();
  now += 200_000;
  clock.sample();
  assert.equal(seconds, 72);
  clock.input();
  now += 600;
  clock.sample();
  assert.equal(seconds, 73);
});

test("daily content is stable within a local calendar day and changes the next day", () => {
  const morning = getDailyRecommendation(new Date(2026, 10, 24, 1));
  assert.deepEqual(morning, getDailyRecommendation(new Date(2026, 10, 24, 23)));
  const tomorrow = getDailyRecommendation(new Date(2026, 10, 25, 1));
  for (const key of ["game", "question", "task", "mood"])
    assert.notDeepEqual(morning[key], tomorrow[key]);
});

test("content IDs and sorting are stable, task pools are balanced, and story links resolve", () => {
  assert.deepEqual(
    Object.entries(Object.groupBy(tasks, ({ type }) => type)).map(
      ([type, items]) => [type, items.length],
    ),
    [
      ["real", 10],
      ["idea", 10],
      ["site", 10],
    ],
  );
  assert.match(tasks[8].route, /space-daze/);
  assert.equal(
    new Set(experiences.map(({ id }) => id)).size,
    experiences.length,
  );
  assert.deepEqual(
    experiences.map(({ sequence }) => sequence),
    experiences.map((_, index) => index + 1),
  );
  assert.ok(
    experiences.every(
      ({ mode, difficulty, favorite, share }) =>
        mode && difficulty && favorite && share,
    ),
  );
  assert.equal(doorEvents.length, 5);
  for (const scene of Object.values(potatoStory)) {
    for (const [, next] of scene.choices || [])
      assert.ok(Object.hasOwn(potatoStory, next));
  }
  assert.ok(
    Object.values(potatoStory).filter(({ title }) => title).length >= 3,
  );
});

test("home counters accept only nonnegative safe integers and default independently", () => {
  assert.deepEqual(normalizeSave({ presses: 27 }).homeCounters, {
    hello: 0,
    bored: 0,
  });
  for (const value of [
    -1,
    "9",
    0.5,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
    null,
  ]) {
    const data = normalizeSave({
      homeCounters: { hello: value, bored: 2 },
      presses: 11,
    });
    assert.deepEqual(data.homeCounters, { hello: 0, bored: 2 });
    assert.equal(data.presses, 11);
  }
  const extreme = normalizeSave({
    homeCounters: { hello: Number.MAX_SAFE_INTEGER },
  });
  assert.equal(
    recordHomeInteraction(extreme, "hello").count,
    Number.MAX_SAFE_INTEGER,
  );
});

test("page tips migrate independently and accept only real booleans", () => {
  assert.deepEqual(normalizeSave({ greeted: true }).tipsSeen, {
    lab: false,
    space: false,
    fortune: false,
  });
  const save = normalizeSave({
    greeted: true,
    tipsSeen: { lab: true, space: "true", fortune: 1, other: true },
  });
  assert.deepEqual(save.tipsSeen, { lab: true, space: false, fortune: false });
  assert.equal(save.greeted, true);
  assert.deepEqual(normalizeSave({ tipsSeen: true }).tipsSeen, {
    lab: false,
    space: false,
    fortune: false,
  });
});

test("manual aim saves separately from motion, and malformed preferences fall back", () => {
  assert.equal(normalizeSave({ motion: true }).settings.fishManual, false);
  assert.equal(
    normalizeSave({ settings: { fishManual: "true", motion: true } }).settings
      .fishManual,
    false,
  );
  const data = normalizeSave({
    settings: { fishManual: true, motion: false, labSound: true },
  });
  assert.deepEqual(normalizeSave(JSON.parse(JSON.stringify(data))).settings, {
    fishManual: true,
    motion: false,
    labSound: true,
  });
});

test("the third catch unlocks bored-chaser once and keeps its timestamp after migration", () => {
  const data = normalizeSave(null);
  assert.equal(recordHomeInteraction(data, "bored", 10).unlocked, null);
  assert.equal(recordHomeInteraction(data, "bored", 20).unlocked, null);
  assert.deepEqual(recordHomeInteraction(data, "bored", 30), {
    count: 3,
    unlocked: "bored-chaser",
  });
  assert.equal(recordHomeInteraction(data, "bored", 40).unlocked, null);
  assert.equal(discoveries["bored-chaser"].title, "无聊追逐者");
  const restored = normalizeSave(JSON.parse(JSON.stringify(data)));
  assert.equal(restored.homeCounters.bored, 4);
  assert.equal(restored.discoveries["bored-chaser"], 30);
  assert.equal(
    normalizeSave({ homeCounters: { bored: 3 } }).discoveries["bored-chaser"],
    0,
  );
  const oldHello = normalizeSave({
    homeCounters: { hello: 4 },
    discoveries: { hello: 7 },
  });
  assert.equal(recordHomeInteraction(oldHello, "hello", 50).unlocked, null);
  assert.equal(oldHello.discoveries.hello, 7);
});

test("daily alternate groups change safely and leave the default intact", () => {
  const day = new Date(2026, 10, 24, 9);
  const original = getDailyRecommendation(day);
  const publicIds = new Set(
    experiences
      .filter((entry) => !entry.unlock && entry.type !== "隐藏彩蛋")
      .map(({ id }) => id),
  );
  let current = original;
  for (let i = 0; i < 32; i++) {
    const next = rotateDailyRecommendation(current, day);
    for (const key of ["game", "question", "task", "mood"])
      assert.notDeepEqual(next[key], current[key]);
    assert(
      publicIds.has(next.game) &&
        publicIds.has(next.question[1]) &&
        tasks[next.task],
    );
    current = next;
  }
  assert.deepEqual(getDailyRecommendation(day), original);
});

test("the next calendar day resets alternate groups to the new default", () => {
  const evening = new Date(2026, 10, 24, 23, 59);
  const alternate = rotateDailyRecommendation(
    getDailyRecommendation(evening),
    evening,
  );
  assert.equal(alternate.rotation, 1);
  assert.deepEqual(
    getDailyRecommendation(new Date(2026, 10, 24, 23, 59, 59), alternate),
    alternate,
  );
  const midnight = new Date(2026, 10, 25);
  assert.deepEqual(
    getDailyRecommendation(midnight, alternate),
    getDailyRecommendation(midnight),
  );
  assert.deepEqual(
    rotateDailyRecommendation(alternate, midnight),
    getDailyRecommendation(midnight),
  );
});

test("stars toggle both ways without revoking the constellation discovery", () => {
  const data = normalizeSave(null);
  const [first, ...rest] = stars;
  assert.deepEqual(toggleStarCollection(data, first.id, 10), {
    collected: true,
    unlocked: false,
  });
  assert.deepEqual(toggleStarCollection(data, first.id, 20), {
    collected: false,
    unlocked: false,
  });
  assert.deepEqual(data.stars, []);
  for (const { id } of rest) toggleStarCollection(data, id, 30);
  assert.deepEqual(toggleStarCollection(data, first.id, 40), {
    collected: true,
    unlocked: true,
  });
  assert.deepEqual(toggleStarCollection(data, first.id, 50), {
    collected: false,
    unlocked: false,
  });
  assert.deepEqual(toggleStarCollection(data, first.id, 60), {
    collected: true,
    unlocked: false,
  });
  assert.equal(normalizeSave(data).discoveries.constellation, 40);
  assert.equal(toggleStarCollection(data, "unknown"), null);
});

test("reopening an unchanged shared task resets completion while a plain route preserves it", () => {
  const saved = { type: "site", index: 8, done: true };
  assert.deepEqual(fortuneFromLink(saved, "8"), {
    type: "site",
    index: 8,
    done: false,
  });
  assert.deepEqual(fortuneFromLink(saved, "0"), {
    type: "site",
    index: 0,
    done: false,
  });
  for (const invalid of [null, "-1", "1e0", "30", "length"])
    assert.equal(fortuneFromLink(saved, invalid), saved);
  assert.equal(saved.done, true);
});
