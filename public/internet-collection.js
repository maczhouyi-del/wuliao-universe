import {
  filterExternalSites,
  internetKinds,
  internetSection,
  internetTags,
  readInternetFilters,
} from "./external-sites.js";

const motifs = {
  portal: `<path d="M33 107 80 83h101l47 24M54 127l39-44m106 44-36-44M129 83v43" class="motif-faint"/>
    <path d="M83 106V37l37-20 47 9 12 80Z" class="motif-paper"/>
    <path d="M108 105V47l23-14 23 7 5 65Z" class="motif-fill"/>
    <path d="m134 42 4 58m-35-55 5 3M33 59l18-7m-8-7 5 20m148-18 14-7m-10-4 6 16M53 103l-18 8"/>`,
  orbit: `<path d="M35 37h14m-7-7v14m167 50h17m-9-8v16m-8-61 8-4m-155 74 7-4"/>
    <circle cx="133" cy="69" r="38" class="motif-paper"/>
    <path d="M101 58c15-16 47-18 61-9m-65 23c18-16 47-12 72-9m-64 25c16 3 30 3 49-8" class="motif-faint"/>
    <ellipse cx="132" cy="69" rx="73" ry="16" transform="rotate(-21 132 69)"/>
    <path d="m180 43 34-8-21 25-1-10z" class="motif-fill"/>`,
  panels: `<g transform="rotate(-9 128 65)"><path d="M55 25h144l-5 82H58z" class="motif-paper"/>
    <path d="M109 26v80m0-40h86"/>
    <path d="M68 66c0-12 9-20 20-20s17 9 16 16c-1 11-15 15-24 13l-9 9 2-12z" class="motif-fill"/>
    <path d="m129 54 15-15m-8 22 22-13m-14 44 5-12 7 10 12 2-10 6m-60-38h-1m-8 0h-1m-8 0h-1"/></g>
    <path d="m217 29 10-10m-7 17 15-2m-203 63-12 8"/>`,
  road: `<path d="M26 112c41-8 30-36 57-40 24-4 32 16 61 15 41-2 51-55 91-57m-217 72c39-7 30-36 62-40 30-4 38 16 63 14 31-3 47-54 91-58" class="motif-faint"/>
    <path d="m81 75 14-22 45-7 22 14 19 3 8 17-10 9-86 10-11-7z" class="motif-paper"/>
    <path d="m105 58-9 14 53-7-12-10z" class="motif-fill"/>
    <circle cx="104" cy="94" r="10" class="motif-fill"/><circle cx="169" cy="86" r="10" class="motif-fill"/>
    <path d="M44 41l18-10 18 10M62 32v23m142 39 17-2m-13 10 11 5"/>`,
  grid: `<g transform="rotate(-5 131 66)"><path d="M65 20h130v92H65z" class="motif-paper"/>
    <path d="M92 20v92m27-92v92m23-92v92m24-92v92M65 43h130M65 66h130M65 89h130" class="motif-faint"/>
    <path d="M65 20h54v46H65zM142 66h53v46h-53z" class="motif-fill"/>
    <circle cx="154" cy="43" r="16"/><path d="m80 88 26-11 23 23-42 3z"/></g>
    <path d="M37 51l14 6m156 38 17 7m-7-11-4 18"/>`,
  court: `<path d="M45 31h168l23 68H20z" class="motif-paper"/><path d="M95 31 80 99m87-68 15 68M32 66h192m-96-32v30"/>
    <circle cx="139" cy="58" r="26" class="motif-fill"/><path d="M121 39q27 10 5 42m31-42q-23 20 0 39"/>`,
};

function siteCard(site, esc) {
  const motif = Object.hasOwn(motifs, site.motif) ? site.motif : "grid";
  return `<article class="internet-card" data-motif="${motif}">
    <a class="internet-card-link" href="${esc(site.url)}">
      <div class="internet-card-art" aria-hidden="true">
        <svg viewBox="0 0 260 130" fill="none" focusable="false">${motifs[motif]}</svg>
      </div>
      <div class="internet-card-copy">
        <p class="internet-card-kind">${esc(site.category)}</p>
        <h3 lang="en">${esc(site.title)}</h3>
        <p class="internet-card-description">${esc(site.description)}</p>
        <ul class="internet-card-tags">${site.tags.map((tag) => `<li>${esc(tag)}</li>`).join("")}</ul>
        <div class="internet-card-notes"><p>${esc(site.deviceHint)}</p>${site.source ? `<p>来源 · ${esc(site.source)}</p>` : ""}</div>
        <span class="internet-visit">进去看看 <span aria-hidden="true">↗</span></span>
      </div>
    </a>
  </article>`;
}

function resultCards(sites, esc) {
  return sites.length
    ? sites.map((site) => siteCard(site, esc)).join("")
    : `<p class="internet-empty">没找到符合条件的网站。试试换个名字，或选「全部」和「全部标签」。</p>`;
}

export function renderInternetCollection(params, esc) {
  const filters = readInternetFilters(params);
  const sites = filterExternalSites(filters);
  return `<section class="internet-collection" aria-labelledby="internet-heading">
    <header class="internet-intro">
      <div>
        <p class="internet-kicker">互联网这么大，总有一些奇怪又好玩的网站值得进去看看。</p>
        <h2 id="internet-heading" class="display">互联网这么大，<br>当然要随便逛逛。</h2>
        <p class="internet-intro-copy">这里收集了一些别人认真做出来的奇怪网站。有的能玩，有的能探索，有的看起来根本不知道在干嘛。</p>
      </div>
      <div class="internet-sticker" aria-hidden="true">
        <span>✦</span><img src="/assets/loro.webp" alt="" width="502" height="530"><span>↗</span>
      </div>
    </header>
    <p class="internet-instructions">点击卡片，直接去原网站。想回来时按浏览器返回键就好。</p>
    <form id="internet-filters" class="internet-filters" action="/collection" method="get" role="search" aria-label="筛选奇妙互联网">
      <input type="hidden" name="section" value="${internetSection}">
      <fieldset class="internet-kinds">
        <legend class="sr-only">按网站类型筛选</legend>
        ${["", ...internetKinds].map((kind) => `<label><input class="sr-only" type="radio" name="kind" value="${esc(kind)}"${filters.kind === kind ? " checked" : ""}><span>${esc(kind || "全部")}</span></label>`).join("")}
      </fieldset>
      <div class="internet-filter-fields">
        <div><label for="internet-name">网站名称</label><input type="search" id="internet-name" name="q" value="${esc(filters.q)}" maxlength="80" placeholder="搜一个网站名称"></div>
        <div><label for="internet-tag">交互标签</label><select id="internet-tag" name="tag">
          <option value="">全部标签</option>${internetTags.map((tag) => `<option value="${esc(tag)}"${filters.tag === tag ? " selected" : ""}>${esc(tag)}</option>`).join("")}
        </select></div>
      </div>
    </form>
    <p class="internet-count" role="status" id="internet-count">${sites.length} 个网站</p>
    <div class="internet-grid" id="internet-results">${resultCards(sites, esc)}</div>
  </section>`;
}

export function updateInternetCollection(form, esc) {
  const data = new FormData(form);
  const filters = readInternetFilters(data);
  const url = new URL(location.href);
  for (const [name, value] of Object.entries(filters)) {
    if (value.trim()) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
  }
  if (url.href !== location.href) history.replaceState(null, "", url);
  const sites = filterExternalSites(filters);
  document.getElementById("internet-count").textContent =
    `${sites.length} 个网站`;
  document.getElementById("internet-results").innerHTML = resultCards(
    sites,
    esc,
  );
}
