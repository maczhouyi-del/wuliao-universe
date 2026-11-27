import assert from "node:assert/strict";
import test from "node:test";
import { categories, experiences } from "../public/content.js";
import { renderExternalCard } from "../public/external-card.js";
import {
  externalSites,
  publishedExternalSites,
} from "../public/external-sites.js";
import {
  drawRandomContent,
  legacyCollectionHref,
  randomHref,
  randomResultFromLink,
  readRandomFilter,
} from "../public/random-explore.js";
import {
  normalizeSave,
  recordExternalVisit,
  toggleExternalFavorite,
} from "../public/state.js";

const params = (value) => new URLSearchParams(value);
const available = (entry) => !entry.unlock;
const original = (id) => ({ kind: "experience", id });
const external = (id) => ({ kind: "external-site", id });

test("the external catalogue remains independent of games and uses reviewed HTTPS addresses", () => {
  assert(externalSites.length > 0);
  assert.equal(
    new Set(externalSites.map((site) => site.id)).size,
    externalSites.length,
  );
  assert(!categories.includes("奇妙互联网"));
  for (const site of externalSites) {
    assert(!experiences.some((entry) => entry.id === site.id));
    assert.equal(new URL(site.url).protocol, "https:");
    assert.equal(new URL(site.sourceUrl).protocol, "https:");
  }
  const records = [
    { id: "verified", url: "https://live.example/", status: "published" },
    { id: "unverified", url: "https://pending.example/", status: "pending" },
    { id: "archived", url: "https://archived.example/", status: "archived" },
    { id: "insecure", url: "http://insecure.example/", status: "published" },
    { id: "invalid", url: "not-a-url", status: "published" },
    {
      id: "misleading",
      url: "https://other.example@here.example/",
      status: "published",
    },
  ];
  assert.deepEqual(
    publishedExternalSites(records).map(({ id }) => id),
    ["verified"],
  );
  assert.deepEqual(
    drawRandomContent(
      { filter: "internet", available, sites: records },
      () => 0,
    ),
    external("verified"),
  );
  assert.equal(
    drawRandomContent({
      filter: "internet",
      available,
      sites: records.slice(1),
    }),
    null,
  );
});

test("the mixed deck draws both kinds at the configured 25 percent default", () => {
  const draws = Array.from({ length: 100 }, (_, index) =>
    drawRandomContent({ available }, () => index / 100),
  );
  assert.equal(
    draws.filter((entry) => entry.kind === "external-site").length,
    25,
  );
  assert.equal(draws.filter((entry) => entry.kind === "experience").length, 75);
  assert.equal(
    drawRandomContent({ available, chance: 1 }, () => 0.99).kind,
    "external-site",
  );
  assert.equal(
    drawRandomContent({ filter: "original", available }, () => 0).kind,
    "experience",
  );
  assert.equal(
    drawRandomContent({ filter: "internet", available }, () => 0.99).kind,
    "external-site",
  );
});

test("draws exclude the current result, prefer unseen sites, and avoid the three most recent when possible", () => {
  const ids = publishedExternalSites().map(({ id }) => id);
  const [first, second, third, fourth] = ids;
  assert.deepEqual(
    drawRandomContent(
      {
        filter: "internet",
        available,
        current: external(first),
        externalVisited: [third, fourth],
        externalSeen: ids.filter((id) => id !== second),
      },
      () => 0.99,
    ),
    external(second),
  );
  assert.deepEqual(
    drawRandomContent(
      {
        filter: "internet",
        available,
        current: external(first),
        externalSeen: ids,
        externalVisited: [second, third, fourth],
      },
      () => 0,
    ),
    external(ids[4]),
  );
  assert.equal(
    drawRandomContent({ filter: "隐藏彩蛋", available: () => false }),
    null,
  );
  const only = {
    filter: "internet",
    available,
    current: external(first),
    sites: [publishedExternalSites()[0]],
  };
  assert.deepEqual(drawRandomContent(only), external(first));
  for (let draw = 0; draw < 30; draw++) {
    const result = drawRandomContent(
      { filter: "original", available },
      () => draw / 30,
    );
    assert(
      experiences.some((entry) => entry.id === result.id && !entry.unlock),
    );
  }
});

test("random URLs restore the result and the filter, and old collection addresses resolve into random", () => {
  assert.equal(
    randomHref(external("why-zero"), "internet"),
    "/random?site=why-zero&type=internet",
  );
  assert.deepEqual(
    randomResultFromLink(params("site=why-zero"), "internet"),
    external("why-zero"),
  );
  assert.equal(randomResultFromLink(params("site=why-zero"), "original"), null);
  assert.equal(
    randomResultFromLink(params("site=https://unreviewed.example/"), ""),
    null,
  );
  assert.equal(randomResultFromLink(params("id=missing"), ""), null);
  assert.deepEqual(
    randomResultFromLink(params("id=echo"), ""),
    original("echo"),
  );
  assert.equal(readRandomFilter("不存在"), "");
  assert.equal(readRandomFilter("脑洞问题"), "脑洞问题");
  assert.equal(legacyCollectionHref(params("")), "/random");
  assert.equal(
    legacyCollectionHref(params("section=internet")),
    "/random?type=internet",
  );
  assert.equal(
    legacyCollectionHref(params({ type: "无聊实验" })),
    randomHref(null, "无聊实验"),
  );
});

test("website history and favorites survive save normalization without changing original records", () => {
  const save = normalizeSave({
    favorites: ["potato", "catch"],
    visited: ["potato"],
    games: { catchBest: 9 },
    discoveries: { hello: 10 },
    externalFavorites: ["why-zero", "why-zero", "invalid"],
    externalVisited: ["grids", "messenger", "grids", "invalid"],
  });
  assert.deepEqual(save.externalFavorites, ["why-zero"]);
  assert.deepEqual(save.externalVisited, ["messenger", "grids"]);
  assert(recordExternalVisit(save, "messenger"));
  assert(!recordExternalVisit(save, "messenger"));
  assert(!recordExternalVisit(save, "invalid"));
  assert.equal(toggleExternalFavorite(save, "invalid"), null);
  assert.equal(toggleExternalFavorite(save, "ponpon-mania"), true);
  assert.equal(toggleExternalFavorite(save, "why-zero"), false);
  const reopened = normalizeSave(JSON.parse(JSON.stringify(save)));
  assert.deepEqual(reopened.externalFavorites, ["ponpon-mania"]);
  assert.deepEqual(reopened.externalVisited, ["grids", "messenger"]);
  assert.deepEqual(reopened.favorites, ["potato", "catch"]);
  assert.deepEqual(reopened.visited, ["potato"]);
  assert.equal(reopened.games.catchBest, 9);
  assert.equal(reopened.discoveries.hello, 10);
  assert.deepEqual(normalizeSave({ favorite: ["potato"] }).externalVisited, []);
});

test("the website card provides a native external anchor and no game controls", () => {
  for (const site of publishedExternalSites()) {
    const rendered = renderExternalCard(site, String);
    const anchor = rendered.match(/<a [^>]+>/)?.[0] || "";
    assert(anchor.includes(`href="${site.url}"`));
    assert(anchor.includes(`data-external-site="${site.id}"`));
    assert.doesNotMatch(
      rendered,
      /target=|onclick=|<iframe|window\.open\s*\(|data-game=/i,
    );
    for (const text of [
      site.title,
      site.description,
      ...site.tags,
      site.category,
    ]) {
      assert(rendered.includes(text));
    }
  }
});
