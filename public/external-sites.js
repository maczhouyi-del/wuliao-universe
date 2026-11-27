export const externalSites = [
  {
    id: "why-zero",
    title: "Why Zero",
    url: "https://why.zero.university/",
    description: "滚动、解锁入口、探索地图，参与 Zero 的沉浸式互动叙事。",
    category: "沉浸体验",
    tags: ["互动叙事", "3D探索", "互动地图"],
    source: "Awwwards",
    sourceUrl: "https://www.awwwards.com/sites/why-zero",
    deviceHint: "建议桌面端体验",
    motif: "portal",
    status: "published",
  },
  {
    id: "messenger",
    title: "Messenger",
    url: "https://messenger.abeto.co/",
    description: "一颗小小的星球，一份送信的差事。出发看看下一封信要送到哪儿。",
    category: "互动游戏",
    tags: ["3D探索", "小星球", "任务游戏"],
    source: "Awwwards 案例",
    sourceUrl: "https://www.awwwards.com/messenger.html",
    deviceHint: "建议桌面端体验",
    motif: "orbit",
    status: "published",
  },
  {
    id: "ponpon-mania",
    title: "Ponpon Mania",
    url: "https://ponpon-mania.com/",
    description: "跟着一只想让世界跳舞的羊，把漫画读成一场可以参与的动画。",
    category: "互动故事",
    tags: ["互动漫画", "动画", "分章阅读"],
    source: "Justine Soulié 与 Patrick Heng",
    sourceUrl: "https://ponpon-mania.com/about",
    deviceHint: "建议桌面端看完整画面",
    motif: "panels",
    status: "published",
  },
  {
    id: "bruno-simon",
    title: "Bruno Simon",
    url: "https://bruno-simon.com/",
    description: "开着小车逛一份 3D 作品集，沿途看看有哪些地标和秘密。",
    category: "3D探索",
    tags: ["3D驾驶", "世界探索", "隐藏彩蛋"],
    source: "Bruno Simon",
    sourceUrl: "https://bruno-simon.com/",
    deviceHint: "支持键盘与触屏驾驶",
    motif: "road",
    status: "published",
  },
  {
    id: "grids",
    title: "Grids",
    url: "https://grids.obys.agency/",
    description: "看网格怎样组织版面，再用 Crazy Mode 看它换一种样子。",
    category: "视觉实验",
    tags: ["视觉设计", "创意排版", "Crazy Mode"],
    source: "Obys",
    sourceUrl: "https://obys.agency/work/grids",
    deviceHint: "建议在较宽的屏幕查看版式",
    motif: "grid",
    status: "published",
  },
  {
    id: "the-tie-break",
    title: "The Tie-break",
    url: "https://thetiebreak.merci-michel.com/",
    description: "把 3D 网球和品牌视觉放进同一个可玩的球场。",
    category: "互动游戏",
    tags: ["3D游戏", "网球", "品牌互动"],
    source: "Global Web Design Awards",
    sourceUrl: "https://globalwebdesignawards.com/sites/the-tie-break",
    deviceHint: "建议桌面端体验",
    motif: "court",
    status: "published",
  },
];

export function publishedExternalSites(sites = externalSites) {
  return sites.filter((site) => {
    if (site.status !== "published") return false;
    try {
      const url = new URL(site.url);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  });
}

export const publishedSites = publishedExternalSites();

export function getExternalSite(id) {
  return publishedSites.find((site) => site.id === id);
}
