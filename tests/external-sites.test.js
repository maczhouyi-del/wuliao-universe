import assert from "node:assert/strict";
import test from "node:test";
import { experiences } from "../public/content.js";
import {
  externalSites,
  publishedExternalSites,
  publishedSites,
} from "../public/external-sites.js";
import { renderExternalCard } from "../public/external-card.js";
import {
  drawExternalSite,
  randomHref,
  recentDrawLimit,
} from "../public/random-explore.js";
import {
  normalizeSave,
  recordExternalDraw,
  recordExternalVisit,
  toggleExternalFavorite,
} from "../public/state.js";
import {
  renderSiteDiscovery,
  rotationDelay,
} from "../public/site-discovery.js";

test("the reviewed library covers the six discovery categories and is independent of games", () => {
  const categories = [
    "互动小游戏",
    "3D沉浸世界",
    "荒诞趣味",
    "互动故事",
    "创意视觉实验",
    "艺术文化体验",
  ];
  assert.deepEqual(
    new Set(publishedSites.map((site) => site.category)),
    new Set(categories),
  );
  assert.equal(
    new Set(externalSites.map(({ id }) => id)).size,
    externalSites.length,
  );
  assert.equal(
    new Set(externalSites.map(({ url }) => url)).size,
    externalSites.length,
  );
  for (const site of externalSites) {
    assert(!experiences.some(({ id }) => id === site.id));
    assert.equal(new URL(site.url).protocol, "https:");
    assert(["published", "pending", "archived"].includes(site.status));
    assert(Number.isSafeInteger(site.sortOrder));
    assert.equal(typeof site.requiresSound, "boolean");
    assert(Object.hasOwn(site, "awwwardsUrl"));
    if (site.awwwardsUrl) assert.equal(new URL(site.awwwardsUrl).protocol, "https:");
  }
  assert.equal(rotationDelay, 5500);
  assert.equal(randomHref("why-zero"), "/random?site=why-zero");
  assert.equal(randomHref(), "/random");
});

test("only published sites with valid HTTPS destinations enter the draw", () => {
  const rows = [
    { id: "live", url: "https://live.example/", status: "published" },
    { id: "pending", url: "https://pending.example/", status: "pending" },
    { id: "archived", url: "https://archived.example/", status: "archived" },
    { id: "insecure", url: "http://insecure.example/", status: "published" },
    {
      id: "misleading",
      url: "https://other.example@live.example/",
      status: "published",
    },
  ];
  assert.deepEqual(
    publishedExternalSites(rows).map(({ id }) => id),
    ["live"],
  );
  assert.equal(drawExternalSite([], () => 0, rows).id, "live");
  assert.equal(
    drawExternalSite([], () => 0, rows.slice(1)),
    null,
  );
});

test("the five previous draws are excluded, and every remaining site has an equal slot", () => {
  let recent = [];
  for (let index = 0; index < 100; index++) {
    const picked = drawExternalSite(recent, () => 0);
    assert(!recent.includes(picked.id));
    recent = [...recent, picked.id].slice(-recentDrawLimit);
  }
  const eligible = publishedSites.filter((site) => !recent.includes(site.id));
  for (const [index, site] of eligible.entries()) {
    assert.equal(
      drawExternalSite(recent, () => (index + 0.5) / eligible.length).id,
      site.id,
    );
  }
  assert.equal(
    drawExternalSite(
      ["missing", publishedSites[1].id],
      () => 0,
      publishedSites.slice(0, 2),
    ).id,
    publishedSites[0].id,
  );
});

test("favorites, old visits, actual explorations and draws are saved independently", () => {
  const data = normalizeSave({
    favorites: ["potato"],
    games: { fishBest: 4 },
    externalFavorites: ["why-zero", "why-zero", "missing"],
    externalVisited: ["grids", "why-zero"],
  });
  assert.deepEqual(data.externalExplored, []);
  assert.equal(recordExternalVisit(data, "why-zero"), true);
  assert.equal(recordExternalVisit(data, "why-zero"), false);
  assert.equal(toggleExternalFavorite(data, "ponpon-mania"), true);
  assert.equal(recordExternalVisit(data, "grids"), true);
  for (const site of publishedSites.slice(0, 8))
    assert(recordExternalDraw(data, site.id));
  const reopened = normalizeSave(JSON.parse(JSON.stringify(data)));
  assert.deepEqual(reopened.externalFavorites, ["why-zero", "ponpon-mania"]);
  assert.deepEqual(reopened.externalVisited, ["why-zero", "grids"]);
  assert.deepEqual(reopened.externalExplored, ["why-zero", "grids"]);
  assert.equal(reopened.externalDraws.length, 5);
  assert.deepEqual(reopened.favorites, ["potato"]);
  assert.equal(reopened.games.fishBest, 4);
});

test("the discovery links are native, and the empty state has no active draw", () => {
  for (const site of publishedSites) {
    const rendered = renderExternalCard(site, String);
    assert(rendered.includes(`href="${site.url}"`));
    assert(rendered.includes(`data-external-site="${site.id}"`));
    if (site.award) {
      assert(rendered.includes(`href="${site.awwwardsUrl}"`));
      if (site.awardDate) assert(rendered.includes(site.awardDate));
    }
    assert.doesNotMatch(
      rendered,
      /target=|onclick=|<iframe|window\.open\s*\(|data-game=/i,
    );
  }
  assert.doesNotMatch(renderSiteDiscovery(0), /data-spin/);
  assert.match(renderSiteDiscovery(publishedSites.length), /data-spin/);
});
