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

export function renderExternalCard(site, esc) {
  const motif = Object.hasOwn(motifs, site.motif) ? site.motif : "grid";
  return `<article class="random-card external-card" data-motif="${motif}" aria-labelledby="random-title">
    <div class="external-art" aria-hidden="true">
      <svg viewBox="0 0 260 130" fill="none" focusable="false">${motifs[motif]}</svg>
    </div>
    <div class="random-copy external-copy">
      <p class="external-kind">奇妙互联网 <span>· ${esc(site.category)}</span></p>
      <h2 id="random-title" lang="en">${esc(site.title)}</h2>
      <p class="external-description">${esc(site.description)}</p>
      <ul class="external-tags">${site.tags.map((tag) => `<li>${esc(tag)}</li>`).join("")}</ul>
      <div class="external-notes">
        ${site.source ? `<p>来源 · ${esc(site.source)}</p>` : ""}
        ${site.deviceHint ? `<p>${esc(site.deviceHint)}</p>` : ""}
      </div>
      <div class="external-visit">
        <a class="pill lime" href="${esc(site.url)}" data-external-site="${esc(site.id)}">进入原网站 <span aria-hidden="true">↗</span></a>
        <p>即将离开无聊宇宙，前往原网站。</p>
      </div>
    </div>
  </article>`;
}
