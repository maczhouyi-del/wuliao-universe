import { publishedExternalSites, publishedSites } from "./external-sites.js";

export const recentDrawLimit = 5;

export function randomHref(id) {
  return id ? "/random?" + new URLSearchParams({ site: id }) : "/random";
}

export function drawExternalSite(recent = [], random = Math.random, sites) {
  const catalog = sites ? publishedExternalSites(sites) : publishedSites;
  if (!catalog.length) return null;
  const eligibleIds = new Set(catalog.map(({ id }) => id));
  const count = Math.min(recentDrawLimit, catalog.length - 1);
  const excluded = count
    ? [...new Set(recent.filter((id) => eligibleIds.has(id)).reverse())].slice(
        0,
        count,
      )
    : [];
  const candidates = catalog.filter(({ id }) => !excluded.includes(id));
  return candidates[Math.floor(random() * candidates.length)];
}
