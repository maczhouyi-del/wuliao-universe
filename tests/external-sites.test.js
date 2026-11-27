import assert from "node:assert/strict";
import test from "node:test";
import { categories, experiences } from "../public/content.js";
import {
  externalSites,
  filterExternalSites,
  internetTags,
  isInternetCollection,
  publishedExternalSites,
  readInternetFilters,
} from "../public/external-sites.js";
import { renderInternetCollection } from "../public/internet-collection.js";

const params = (value = "") => new URLSearchParams(value);

test("the external catalogue is independent of the random experience catalogue", () => {
  assert(externalSites.length > 0);
  assert.equal(
    new Set(externalSites.map((site) => site.id)).size,
    externalSites.length,
  );
  assert(!categories.includes("奇妙互联网"));
  for (const site of externalSites) {
    assert(!experiences.some((experience) => experience.id === site.id));
    assert.equal(new URL(site.url).protocol, "https:");
    assert.equal(new URL(site.sourceUrl).protocol, "https:");
  }
  assert(isInternetCollection(params("section=internet")));
  assert(!isInternetCollection(params({ type: "脑洞问题" })));
  assert(!isInternetCollection(params({ type: "internet" })));
});

test("only explicitly published, valid HTTPS links appear in curator order", () => {
  const records = [
    {
      id: "second",
      url: "https://second.example/",
      sortOrder: 2,
      status: "published",
    },
    {
      id: "unverified",
      url: "https://pending.example/",
      sortOrder: 1,
      status: "pending",
    },
    {
      id: "first",
      url: "https://first.example/",
      sortOrder: 1,
      status: "published",
    },
    {
      id: "insecure",
      url: "http://insecure.example/",
      sortOrder: 0,
      status: "published",
    },
    { id: "invalid", url: "not-a-url", sortOrder: 0, status: "published" },
    {
      id: "misleading",
      url: "https://other.example@here.example/",
      sortOrder: 0,
      status: "published",
    },
  ];
  assert.deepEqual(
    publishedExternalSites(records).map(({ id }) => id),
    ["first", "second"],
  );
});

test("title, category, and exact tag filters combine and round-trip from the URL", () => {
  const filter = readInternetFilters(
    params({
      section: "internet",
      kind: "沉浸体验",
      tag: "互动地图",
      q: " ＷＨＹ ",
    }),
  );
  assert.deepEqual(
    filterExternalSites(filter).map(({ title }) => title),
    ["Why Zero"],
  );
  assert.deepEqual(filterExternalSites({ ...filter, q: "map" }), []);
  assert.deepEqual(filterExternalSites({ ...filter, tag: "疯狂模式" }), []);
  assert.deepEqual(
    readInternetFilters(params({ kind: "无聊实验", tag: "外部", q: " x " })),
    { kind: "", tag: "", q: " x " },
  );
  assert.equal(
    readInternetFilters(params({ q: "x".repeat(100) })).q.length,
    80,
  );
});

test("rendered cards have only native external links and hide pending catalogue entries", () => {
  const rendered = renderInternetCollection(
    params("section=internet"),
    (value) => String(value),
  );
  const matches = [
    ...rendered.matchAll(/<a class="internet-card-link" href="([^"]+)"[^>]*>/g),
  ];
  assert.equal(matches.length, publishedExternalSites().length);
  for (const [anchor, url] of matches) {
    assert(publishedExternalSites().some((site) => site.url === url));
    assert.doesNotMatch(anchor, /target=|onclick=/i);
  }
  for (const pending of externalSites.filter(
    (site) => site.status === "pending",
  )) {
    assert(!rendered.includes(pending.url));
    for (const tag of pending.tags.filter(
      (tag) => !internetTags.includes(tag),
    )) {
      assert(!rendered.includes(`<option value="${tag}"`));
    }
  }
  assert.doesNotMatch(rendered, /<iframe|window\.open\s*\(/i);
});
