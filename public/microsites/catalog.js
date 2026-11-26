export const worldsPath = "/little-worlds";

export const worlds = [
  {
    id: "cloud-gate",
    title: "云朵之门",
    english: "CLOUD GATE",
    action: "画一朵云",
    time: "约30秒",
    color: "blue",
    art: "door",
    icon: "☁",
    intro: "随便画一笔，看看门后面有什么。",
    help: "用鼠标或手指画线，画够长度后松开。也可以跳过绘画，直接开门。",
  },
  {
    id: "asteroid",
    title: "聊绒的小行星",
    english: "LORO ASTEROID",
    action: "探索星球",
    time: "约1分钟",
    color: "purple",
    art: "planet",
    icon: "✦",
    intro: "在小行星上找回三颗迷路的星星。",
    help: "用方向键或 WASD 移动，空格查看附近的东西。也可以点击地图或使用下方方向键。",
  },
  {
    id: "comic",
    title: "聊绒漫画屋",
    english: "LORO COMIC HOUSE",
    action: "读漫画",
    time: "约1分钟",
    color: "pink",
    art: "loro",
    icon: "☾",
    intro: "星期一不见了。聊绒想请你一起去找。",
    help: "点击画面或继续按钮读下一格。遇到岔路时，选一条自己想走的路。",
  },
  {
    id: "shape-lab",
    title: "没用的形状实验室",
    english: "USELESS SHAPE LAB",
    action: "摆弄形状",
    time: "随时",
    color: "lime",
    icon: "◒",
    intro: "拖动图形，随便创造点东西。",
    help: "点工具栏添加形状，拖动或者用方向键移动。选中形状可以调大小、角度和颜色。",
  },
];

export const worldById = (id) => worlds.find((world) => world.id === id);
export const worldPath = (id) => worldsPath + "/" + id;
export const worldByPath = (path) =>
  worlds.find((world) => worldPath(world.id) === path);

export const cloudRooms = [
  {
    id: "nameless-star",
    name: "星星房间",
    art: "star",
    line: "一颗没有名字的星星正努力照亮自己的脚尖。",
    detail: "星星把一小片光递给你。名字可以等一等。",
  },
  {
    id: "philosophy-potato",
    name: "土豆房间",
    art: "potato",
    line: "土豆躺得太久，开始怀疑地板是不是另一颗土豆。",
    detail: "它问你：「如果什么都不改变，是不是也算长大？」",
  },
  {
    id: "cardboard-loro",
    name: "聊绒房间",
    art: "loro",
    line: "屋里只有个旧纸箱。盖子好像动了一下。",
    detail: "聊绒把纸箱里的小云朵借给你。它说，这是它收藏的第一个秘密。",
    secret: "cloud-box",
  },
];

export const asteroidDuration = 60_000;
export const comicEndings = { nap: "星期一去午睡", clock: "星期一的借条" };
export const worldSecrets = {
  "cloud-box": "纸箱里的一片云",
  "asteroid-door": "小行星背面的房间",
  "monday-both": "星期一的两份结局",
};

export const shapeTypes = {
  circle: { name: "圆形", symbol: "●" },
  triangle: { name: "三角形", symbol: "▲" },
  square: { name: "方块", symbol: "■" },
  star: { name: "星星", symbol: "★" },
  curve: { name: "曲线", symbol: "∿" },
  potato: { name: "小土豆", art: "potato" },
  loro: { name: "聊绒", art: "loro" },
  cloud: { name: "云朵", symbol: "☁" },
};
export const shapeColors = {
  pink: { name: "亮粉", value: "#ff69af" },
  lime: { name: "青柠", value: "#d9f443" },
  blue: { name: "天蓝", value: "#79d1fa" },
  purple: { name: "浅紫", value: "#c5acf6" },
  ink: { name: "炭黑", value: "#211b25" },
  paper: { name: "奶油白", value: "#fff4cd" },
};
export const shapeLimit = 40;
