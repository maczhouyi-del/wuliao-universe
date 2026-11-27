import { categories, experiences } from "./content.js";
import { publishedExternalSites, getExternalSite } from "./external-sites.js";

export const originalsFilter = "original";
export const externalFilter = "internet";
export const externalChance = 0.25;

export function readRandomFilter(value) {
  if (value === originalsFilter || value === externalFilter) return value;
  return categories.slice(1).includes(value) ? value : "";
}

export function randomHref(result, filter = "") {
  const params = new URLSearchParams();
  if (result)
    params.set(result.kind === "external-site" ? "site" : "id", result.id);
  if (filter) params.set("type", filter);
  return params.size ? `/random?${params}` : "/random";
}

export function legacyCollectionHref(params) {
  const filter =
    params.get("section") === "internet"
      ? externalFilter
      : readRandomFilter(params.get("type"));
  return randomHref(null, filter);
}

const includesOriginal = (filter, entry) =>
  !filter || filter === originalsFilter || filter === entry.type;
const includesExternal = (filter) => !filter || filter === externalFilter;

export function randomResultFromLink(params, filter) {
  const site = params.get("site");
  if (site !== null) {
    return includesExternal(filter) && getExternalSite(site)
      ? { kind: "external-site", id: site }
      : null;
  }
  const id = params.get("id");
  const entry = experiences.find((experience) => experience.id === id);
  return entry && includesOriginal(filter, entry)
    ? { kind: "experience", id }
    : null;
}

export function sameRandomResult(first, second) {
  return first?.kind === second?.kind && first?.id === second?.id;
}

function choose(entries, seen, recent, random) {
  const newEntries = entries.filter(({ id }) => !seen.includes(id));
  const latest = recent.slice(-3);
  const olderEntries = entries.filter(({ id }) => !latest.includes(id));
  const candidates = newEntries.length
    ? newEntries
    : olderEntries.length
      ? olderEntries
      : entries;
  return candidates[Math.floor(random() * candidates.length)];
}

export function drawRandomContent(
  {
    filter = "",
    current,
    available,
    visited = [],
    externalVisited = [],
    externalSeen = externalVisited,
    sites,
    chance = externalChance,
  },
  random = Math.random,
) {
  const pools = [
    {
      kind: "experience",
      entries: experiences.filter(
        (entry) => includesOriginal(filter, entry) && available(entry),
      ),
      seen: visited,
      recent: visited,
    },
    {
      kind: "external-site",
      entries: includesExternal(filter) ? publishedExternalSites(sites) : [],
      seen: externalSeen,
      recent: externalVisited,
    },
  ];
  const alternatives = pools
    .map((pool) => ({
      ...pool,
      entries: pool.entries.filter(
        ({ id }) => !sameRandomResult(current, { kind: pool.kind, id }),
      ),
    }))
    .filter((pool) => pool.entries.length);
  if (!alternatives.length)
    return pools.some((pool) => pool.entries.length) ? current : null;
  const pool =
    alternatives.length === 2 && random() < chance
      ? alternatives[1]
      : alternatives[0];
  const { id } = choose(pool.entries, pool.seen, pool.recent, random);
  return { kind: pool.kind, id };
}
