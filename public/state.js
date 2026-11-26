import {
  asteroidDuration, cloudRooms, comicEndings, shapeColors, shapeLimit, shapeTypes, worlds, worldSecrets,
} from "./microsites/catalog.js";
import {
  discoveries,
  experiences,
  hats,
  moonExtras,
  pageTips,
  planetColors,
  planetDecor,
  planetSizes,
  stars,
  taskCategories,
  tasks,
  thoughts,
} from "./content.js";

export const storageKey = "wuliao-universe-v1";
const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const count = (value) =>
  Number.isSafeInteger(value) && value >= 0 ? value : 0;
const exists = (record, key) =>
  typeof key === "string" && Object.hasOwn(record, key);
const member = (value, options, fallback) =>
  options.includes(value) ? value : fallback;
const ids = (value, options) =>
  Array.isArray(value)
    ? [...new Set(value.filter((id) => options.includes(id)))]
    : [];
const starIds = stars.map(({ id }) => id);
const experienceIds = experiences.map(({ id }) => id);
const activityIds = [
  ...experienceIds,
  "hello",
  "bored",
  "fortune",
  "wardrobe",
  "planet",
];
const taskTypes = ["all", ...taskCategories.map(({ id }) => id)];
const homeMilestones = {
  hello: { count: 5, discovery: "hello" },
  bored: { count: 3, discovery: "bored-chaser" },
};

export const clamp = (value, lower, upper) =>
  Math.max(lower, Math.min(upper, value));
export const limitStar = (x, y) => ({
  x: Math.round(clamp(x, 8, 92) * 100) / 100,
  y: Math.round(clamp(y, 28, 86) * 100) / 100,
});

function timestamps(value, catalog) {
  return Object.fromEntries(
    Object.entries(object(value)).filter(
      ([id, time]) =>
        exists(catalog, id) &&
        Number.isSafeInteger(time) &&
        time >= 0 &&
        time <= 8640000000000000,
    ),
  );
}

export function normalizeSave(input) {
  const data = object(input);
  const space = object(data.starPositions);
  const planet = object(data.planetStyle);
  const record = object(data.games);
  const fortune = object(data.fortune);
  const settings = object(data.settings);
  const homeCounters = object(data.homeCounters);
  const tipsSeen = object(data.tipsSeen);
  const result = {
    presses: count(data.presses),
    potatoes: count(data.potatoes),
    rooms: count(data.rooms),
    tasks: count(data.tasks),
    seconds: count(data.seconds),
    activeSeconds: count(data.activeSeconds),
    stars: ids(data.stars, starIds),
    starPositions: Object.fromEntries(
      starIds.flatMap((id) => {
        const { x, y } = object(space[id]);
        return Number.isFinite(x) && Number.isFinite(y)
          ? [[id, limitStar(x, y)]]
          : [];
      }),
    ),
    favorites: ids(data.favorites, experienceIds),
    visited: ids(data.visited, experienceIds).slice(-6),
    microsites: normalizeWorldSave(data.microsites),
    planet:
      typeof data.planet === "string" ? data.planet.trim().slice(0, 14) : "",
    planetStyle: {
      color: exists(planetColors, planet.color) ? planet.color : "original",
      size: exists(planetSizes, planet.size) ? planet.size : "regular",
      decor: exists(planetDecor, planet.decor) ? planet.decor : "none",
    },
    hat:
      Number.isInteger(data.hat) && data.hat >= 0 && data.hat < hats.length
        ? data.hat
        : 0,
    moonExtras: ids(
      data.moonExtras,
      moonExtras.map(({ id }) => id),
    ),
    homeCounters: {
      hello: count(homeCounters.hello),
      bored: count(homeCounters.bored),
    },
    tipsSeen: Object.fromEntries(
      Object.keys(pageTips).map((id) => [id, tipsSeen[id] === true]),
    ),
    settings: {
      fishManual: settings.fishManual === true,
      motion:
        typeof settings.motion === "boolean"
          ? settings.motion
          : data.motion === true,
      labSound:
        typeof settings.labSound === "boolean"
          ? settings.labSound
          : data.labSound === true,
    },
    greeted: data.greeted === true,
    discoveries: timestamps(data.discoveries, discoveries),
    thoughts: timestamps(data.thoughts, thoughts),
    completed: ids(data.completed, activityIds),
    games: {
      catchBest: count(record.catchBest),
      catchRounds: count(record.catchRounds),
      fishBest: Math.min(5, count(record.fishBest)),
      fishRounds: count(record.fishRounds),
    },
    fortune: {
      type: member(fortune.type, taskTypes, "all"),
      index:
        Number.isInteger(fortune.index) && tasks[fortune.index]
          ? fortune.index
          : null,
      done: false,
    },
  };
  result.fortune.done = result.fortune.index !== null && fortune.done === true;

  // Legacy counters tell us what was earned, but do not contain an unlock date.
  if (result.presses >= 28) result.discoveries["button-researcher"] ??= 0;
  if (result.presses >= 50) result.discoveries["lab-echo"] ??= 0;
  if (result.rooms > 0) result.discoveries["door-person"] ??= 0;
  if (result.stars.length === stars.length)
    result.discoveries.constellation ??= 0;
  for (const [key, milestone] of Object.entries(homeMilestones)) {
    if (result.homeCounters[key] >= milestone.count)
      result.discoveries[milestone.discovery] ??= 0;
  }
  return result;
}

function worldCounts(input) {
  const values = object(input);
  return Object.fromEntries(worlds.map(({ id }) => [id, count(values[id])]));
}

export function normalizeShapeLayout(input) {
  const data = object(input);
  if (!Array.isArray(data.shapes)) return null;
  const shapes = data.shapes.slice(0, shapeLimit).flatMap((entry) => {
    const { type, x, y, size, angle, color } = object(entry);
    if (!exists(shapeTypes, type) || ![x, y, size, angle].every(Number.isFinite)) return [];
    return [{
      type, x: clamp(x, 5, 95), y: clamp(y, 5, 95),
      size: clamp(size, 9, 42), angle: clamp(angle, -180, 180),
      color: exists(shapeColors, color) ? color : "pink",
    }];
  });
  const name = typeof data.name === "string" ? data.name.trim().slice(0, 30) : "";
  return { name: name || "无题", shapes };
}

function asteroidScore(input) {
  const { stars, ms } = object(input);
  if (!Number.isSafeInteger(stars) || stars < 0 || stars > 3 || !Number.isFinite(ms) || ms < 0) return null;
  return { stars, ms: Math.min(asteroidDuration, Math.round(ms)) };
}

function normalizeWorldSave(input) {
  const data = object(input);
  return {
    visits: worldCounts(data.visits),
    completions: worldCounts(data.completions),
    secrets: timestamps(data.secrets, worldSecrets),
    cloudRooms: ids(data.cloudRooms, cloudRooms.map(({ id }) => id)),
    asteroidBest: asteroidScore(data.asteroidBest),
    comicEndings: ids(data.comicEndings, Object.keys(comicEndings)),
    shapeLayout: normalizeShapeLayout(data.shapeLayout),
  };
}

export function recordWorldVisit(save, id) {
  const counts = save.microsites.visits;
  if (Object.hasOwn(counts, id)) counts[id] = Math.min(Number.MAX_SAFE_INTEGER, counts[id] + 1);
}

export function recordWorldCompletion(save, id, result) {
  const log = save.microsites;
  if (!Object.hasOwn(log.completions, id)) return false;
  if (id === "cloud-gate") {
    if (!cloudRooms.some((room) => room.id === result)) return false;
    if (!log.cloudRooms.includes(result)) log.cloudRooms.push(result);
  } else if (id === "asteroid") {
    const score = asteroidScore(result);
    if (!score) return false;
    const best = log.asteroidBest;
    if (!best || score.stars > best.stars || (score.stars === best.stars && score.ms < best.ms)) {
      log.asteroidBest = score;
    }
  } else if (id === "comic") {
    if (!exists(comicEndings, result)) return false;
    if (!log.comicEndings.includes(result)) log.comicEndings.push(result);
  } else {
    const layout = normalizeShapeLayout(result);
    if (!layout) return false;
    log.shapeLayout = layout;
  }
  log.completions[id] = Math.min(Number.MAX_SAFE_INTEGER, log.completions[id] + 1);
  return true;
}

export function recordWorldSecret(save, id, time = Date.now()) {
  if (!exists(worldSecrets, id) || Object.hasOwn(save.microsites.secrets, id)) return false;
  save.microsites.secrets[id] = time;
  return true;
}

export function recordDiscovery(data, id, time = Date.now()) {
  if (!Object.hasOwn(discoveries, id) || Object.hasOwn(data.discoveries, id))
    return false;
  data.discoveries[id] = time;
  return true;
}

export function recordHomeInteraction(data, key, time = Date.now()) {
  const milestone = homeMilestones[key];
  const count = Math.min(Number.MAX_SAFE_INTEGER, data.homeCounters[key] + 1);
  data.homeCounters[key] = count;
  return {
    count,
    unlocked:
      count === milestone.count &&
      recordDiscovery(data, milestone.discovery, time)
        ? milestone.discovery
        : null,
  };
}

export function toggleStarCollection(data, id, time = Date.now()) {
  if (!starIds.includes(id)) return null;
  const collected = !data.stars.includes(id);
  data.stars = collected
    ? [...data.stars, id]
    : data.stars.filter((star) => star !== id);
  return {
    collected,
    unlocked:
      data.stars.length === stars.length &&
      recordDiscovery(data, "constellation", time),
  };
}

export function fortuneFromLink(fortune, taskNumber) {
  if (typeof taskNumber !== "string" || !/^\d+$/.test(taskNumber))
    return fortune;
  const index = Number(taskNumber);
  return tasks[index] ? { ...fortune, index, done: false } : fortune;
}

export function readSave() {
  try {
    return normalizeSave(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    return normalizeSave(null);
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // The current session remains playable even when storage is blocked or full.
  }
}

export function createActiveClock(now, onSeconds, inactivity = 60_000) {
  let visible = false;
  let lastInput = -Infinity;
  let sampledAt = now();
  let remainder = 0;
  function sample(time = now()) {
    if (visible) {
      remainder += Math.max(
        0,
        Math.min(time, lastInput + inactivity) - Math.max(sampledAt, lastInput),
      );
      const seconds = Math.floor(remainder / 1000);
      if (seconds > 0) {
        remainder -= seconds * 1000;
        onSeconds(seconds);
      }
    }
    sampledAt = time;
  }
  return {
    sample,
    input(time = now()) {
      sample(time);
      lastInput = time;
    },
    visibility(next, time = now()) {
      sample(time);
      visible = next;
    },
  };
}
