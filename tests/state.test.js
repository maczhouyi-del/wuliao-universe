import assert from "node:assert/strict";
import test from "node:test";
import {
  doorEvents,
  experiences,
  getDailyRecommendation,
  potatoStory,
  tasks,
} from "../public/content.js";
import { createActiveClock, normalizeSave } from "../public/state.js";

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
  assert.deepEqual(data.settings, { motion: false, labSound: true });
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
