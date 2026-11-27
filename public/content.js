export const categories = [
  "全部",
  "无聊实验",
  "奇怪小游戏",
  "脑洞问题",
  "趣味生成器",
  "隐藏彩蛋",
  "奇怪故事",
];

const originalExperiences = [
  {
    id: "button",
    title: "千万不要按",
    type: "无聊实验",
    time: "随时",
    art: "button",
    icon: "●",
    color: "pink",
    intro: "一个完全没有必要按下去的粉色按钮。",
    route: "/lab",
    rank: 10,
  },
  {
    id: "potato",
    title: "土豆人生模拟器",
    type: "无聊实验",
    time: "约30秒",
    art: "potato",
    icon: "🥔",
    color: "lime",
    intro: "给土豆选一条路，看看它会过上什么样的日子。",
    rank: 9,
  },
  {
    id: "door",
    title: "永远也关不上的门",
    type: "无聊实验",
    time: "一小会儿",
    art: "door",
    icon: "🚪",
    color: "blue",
    intro: "它又开了。你确定还想试一次吗？",
    rank: 8,
  },
  {
    id: "star",
    title: "收下一颗星星",
    type: "奇怪小游戏",
    time: "随时",
    icon: "✦",
    color: "blue",
    intro: "给最心仪的一颗星星找个家。",
    route: "/space-daze",
    rank: 6,
  },
  {
    id: "duck",
    title: "跟鸭子比耐心",
    type: "奇怪小游戏",
    time: "约5秒",
    icon: "🦆",
    color: "blue",
    intro: "等鸭子先开口，再回应它。",
    action: "准备好了",
    rank: 7,
  },
  {
    id: "cloud",
    title: "给云朵写日记",
    type: "脑洞问题",
    time: "一小会儿",
    icon: "☁",
    color: "pink",
    intro: "如果你是一朵云，今天会记下什么？",
    placeholder: "今天我飘过了……",
    replies: [
      "云朵把这页夹在了晚霞里。",
      "云朵读完，轻轻下了一场小雨。",
      "云朵决定明天再飘慢一点。",
    ],
    rank: 5,
  },
  {
    id: "nickname",
    title: "领一个奇怪外号",
    type: "趣味生成器",
    time: "约5秒",
    icon: "✎",
    color: "lime",
    intro: "从今天起，你可以用这个名字发呆。",
    action: "给我取名",
    replies: [
      "土豆保卫科编外人员",
      "凌晨两点的脆脆鲨",
      "懒得自转的小行星",
      "一口吃掉星期三的人",
      "没睡醒的云端巡逻员",
    ],
    rank: 4,
  },
  {
    id: "fish",
    title: "教金鱼打篮球",
    type: "奇怪小游戏",
    time: "一小会儿",
    icon: "🐟",
    color: "pink",
    intro: "瞄准刻线，帮金鱼完成五次投篮。",
    rank: 3,
  },
  {
    id: "banana",
    title: "和香蕉严肃对话",
    type: "脑洞问题",
    time: "一小会儿",
    icon: "🍌",
    color: "lime",
    intro: "这根香蕉已准备好接受采访。",
    placeholder: "请问你……",
    replies: [
      "香蕉说：“请不要对我指指点点，我本来就是弯的。”",
      "香蕉拒绝回答有关果皮的问题。",
      "它请你先严肃地看它五秒。",
    ],
    rank: 2,
  },
  {
    id: "secret",
    title: "聊绒的小秘密",
    type: "隐藏彩蛋",
    time: "约5秒",
    icon: "★",
    art: "loro",
    color: "pink",
    intro: "聊绒的念头标签里，好像藏着什么。",
    action: "翻开标签",
    replies: [
      "聊绒偷偷把星期一藏进了口袋。",
      "聊绒存了三颗星星。第四颗准备留给你。",
      "标签背面写着：今天商量好了，什么也不做。",
    ],
    rank: 1,
  },
  {
    id: "story",
    title: "一厘米长的失踪案",
    type: "奇怪故事",
    time: "约5秒",
    icon: "✧",
    color: "blue",
    intro: "昨晚，有一厘米从尺子上溜走了。",
    action: "读结局",
    replies: [
      "它溜去了裁缝店，在聊绒的袖口安了家。",
      "侦探找了半天，最后发现自己矮了一厘米。",
      "一厘米寄来明信片：“我正在木星度假。”",
    ],
    rank: 0,
  },
  {
    id: "excuse",
    title: "发呆借口生成器",
    type: "趣味生成器",
    time: "约5秒",
    icon: "⌁",
    color: "lime",
    intro: "下一次被问在干嘛，就告诉他们……",
    action: "找个借口",
    replies: [
      "正在等待宇宙更新。",
      "我在和一朵云开会。",
      "刚才脑袋在整理桌面。",
      "我正在监督地球自转。",
    ],
    rank: 0,
  },
];

export const taskCategories = [
  {
    id: "real",
    name: "现实任务",
    icon: "⌂",
    color: "pink",
    description: "观察身边的小东西",
  },
  {
    id: "idea",
    name: "脑洞任务",
    icon: "✸",
    color: "lime",
    description: "让想象力散个步",
  },
  {
    id: "site",
    name: "网站任务",
    icon: "▣",
    color: "blue",
    description: "在无聊宇宙里逛逛",
  },
];

export const tasks = [
  { type: "real", text: "请在 10 秒内找到最像鸭子的东西", icon: "🦆" },
  { type: "idea", text: "给自己取一个很难听的外号", icon: "✶" },
  { type: "real", text: "严肃地凝视一根香蕉", icon: "🍌" },
  { type: "real", text: "找一件和天空差不多颜色的东西", icon: "☁" },
  { type: "real", text: "用十秒听听离你最远的声音", icon: "♫" },
  { type: "idea", text: "想一个适合月球便利店的名字", icon: "☾" },
  { type: "idea", text: "给昨天的梦画一个很潦草的封面", icon: "✎" },
  { type: "idea", text: "给自己的左手起一个艺名", icon: "✦" },
  {
    type: "site",
    text: "去宇宙里给月亮换一顶帽子",
    icon: "☾",
    route: "/space-daze",
  },
  {
    type: "site",
    text: "帮一颗土豆思考人生",
    icon: "🥔",
    route: "/random?id=potato",
  },
  {
    type: "site",
    text: "读一读聊绒藏在标签里的秘密",
    icon: "✧",
    route: "/random?id=secret",
  },
];

const newExperiences = [
  {
    id: "catch",
    title: "抓住聊绒",
    type: "奇怪小游戏",
    time: "约15秒",
    art: "loro",
    icon: "✦",
    color: "lime",
    intro: "聊绒会到处跑。15 秒里，你能抓住它几次？",
    rank: 9,
    difficulty: "反应挑战",
  },
  {
    id: "refuse",
    title: "一个会拒绝你的按钮",
    type: "无聊实验",
    time: "一小会儿",
    icon: "✋",
    color: "pink",
    intro: "它说今天不想工作。你准备怎么回答？",
    rank: 4,
  },
  {
    id: "waste",
    title: "自动浪费时间机器",
    type: "无聊实验",
    time: "一小会儿",
    icon: "⌛",
    color: "blue",
    intro: "开机、暂停，看看八秒钟最后去了哪里。",
    rank: 3,
  },
  {
    id: "calculator",
    title: "没有意义的计算器",
    type: "无聊实验",
    time: "一小会儿",
    icon: "±",
    color: "purple",
    intro: "它真的会计算，只是单位很可疑。",
    rank: 2,
  },
  {
    id: "echo",
    title: "纸箱里的回声电台",
    type: "隐藏彩蛋",
    time: "一小会儿",
    icon: "♫",
    color: "purple",
    intro: "扭到正确的频率，听听纸箱里有什么。",
    rank: 1,
    unlock: "lab-echo",
  },
];

const gameTypes = {
  potato: "potato",
  door: "door",
  fish: "fish",
  duck: "duck",
  cloud: "journal",
  banana: "journal",
  catch: "catch",
  refuse: "refuse",
  waste: "waste",
  calculator: "calculator",
  echo: "echo",
};

export const experiences = [...originalExperiences, ...newExperiences].map(
  (entry, index) => ({
    difficulty: "轻松",
    mode: entry.route ? "link" : gameTypes[entry.id] || "reveal",
    favorite: true,
    replay: !entry.route,
    share: true,
    sequence: index + 1,
    ...entry,
  }),
);

// Existing shared URLs use a zero-based task number. Append entries to keep those URLs valid.
const extraTasks = [
  ["real", "找找附近最圆的物件", "◉"],
  ["real", "数数此刻视线里有几种绿色", "✿"],
  ["real", "看看桌面上哪件东西的影子最长", "◒"],
  ["real", "观察一只杯子，给它找出一个小细节", "☕"],
  ["real", "从身边找一件去年也在用的东西", "⌛"],
  ["real", "找一样你今天第一次注意到的东西", "✧"],
  ["idea", "给一只起晚了的闹钟编个借口", "◴"],
  ["idea", "发明一种适合下雨天的云朵口味", "☁"],
  ["idea", "想一个土豆上任市长后的第一条规定", "🥔"],
  ["idea", "想象你遇见了五分钟后的自己，会说什么？", "✎"],
  ["idea", "给一条丢了搭档的袜子起个电影名", "★"],
  ["idea", "设计一个上班第一天就放假的职位", "✶"],
  ["site", "抓住一次到处乱跑的聊绒", "✦", "/random?id=catch"],
  ["site", "去研究所按一次不该按的按钮", "●", "/lab"],
  ["site", "帮金鱼投完一轮篮球", "🐟", "/random?id=fish"],
  ["site", "在奇怪合集中找到一件想收藏的东西", "☆", "/collection"],
  ["site", "给路过的云写一句日记", "☁", "/random?id=cloud"],
  ["site", "给一颗无名星球起个名字", "◉", "/space-daze"],
  ["site", "在门后找到一个新房间", "🚪", "/random?id=door"],
];
tasks.push(
  ...extraTasks.map(([type, text, icon, route]) => ({
    type,
    text,
    icon,
    route,
  })),
);

export const taskReplies = {
  real: "观察报告已收到。命运机器认可你的努力。",
  idea: "脑洞已登记。这项任务的意义尚未被发现。",
  site: "探索完成。今天至少完成了一件没用的事。",
};

export const stars = [
  { id: "first", x: 22, y: 36, label: "奶油星", symbol: "★", color: "#ffe9a0" },
  {
    id: "second",
    x: 35,
    y: 44,
    label: "发呆星",
    symbol: "✦",
    color: "#ebbfff",
  },
  { id: "third", x: 64, y: 69, label: "好奇星", symbol: "★", color: "#a7e9ff" },
  {
    id: "fourth",
    x: 83,
    y: 71,
    label: "晚安星",
    symbol: "✦",
    color: "#ff9dd7",
  },
  {
    id: "fifth",
    x: 8,
    y: 53,
    label: "慢吞吞星",
    symbol: "✧",
    color: "#dfff8a",
  },
];

export const hats = [
  { name: "睡帽", mark: "♡" },
  { name: "魔法帽", mark: "✦" },
  { name: "圣诞帽", mark: "❋" },
  { name: "奇怪的帽子", mark: "？" },
];

export const moonExtras = [
  { id: "glasses", label: "星星眼镜", mark: "✦—✦" },
  { id: "scarf", label: "围巾", mark: "围" },
  { id: "headphones", label: "小耳机", mark: "♫" },
];

export const planetColors = {
  original: { label: "晚霞原色", hue: 0 },
  mint: { label: "薄荷绿", hue: 130 },
  honey: { label: "蜂蜜金", hue: 68 },
  violet: { label: "星云紫", hue: 320 },
};

export const planetSizes = {
  small: "小小的",
  regular: "刚刚好",
  large: "大一圈",
};
export const planetDecor = { none: "无装饰", spark: "小星屑", flag: "小旗子" };

export const discoveries = {
  hello: { title: "你好循环", reward: "聊绒承认它也很无聊。" },
  "bored-chaser": {
    title: "无聊追逐者",
    reward: "你已经成功抓住无聊三次。",
  },
  "button-researcher": { title: "按钮研究员", reward: "优秀按钮按压员证书" },
  constellation: {
    title: "星星收藏家",
    reward: "星星全到齐了。你是夜空的临时管理员。",
  },
  "door-person": { title: "门后的人", reward: "门后房间档案" },
  "loro-secret": {
    title: "聊绒的秘密",
    reward: "念头「聊绒把星期一放哪儿了？」",
  },
  inspiration: {
    title: "灵感收集者",
    reward: "完成六类互动，解锁聊绒的灵感纸条。",
  },
  "lab-echo": { title: "按钮的回声", reward: "隐藏实验「纸箱里的回声电台」" },
};

export const thoughts = {
  banana: {
    title: "香蕉为什么是弯的？",
    source: "和香蕉严肃对话",
    text: "香蕉说，它只是不擅长把话说直。",
  },
  moon: {
    title: "月亮会不会打喷嚏？",
    source: "给月亮试装",
    text: "也许那就是星星抖了一下的原因。",
  },
  potato: {
    title: "土豆也有梦想",
    source: "土豆人生模拟器",
    text: "梦想有大有小，有些只想晒晒太阳。",
  },
  task: {
    title: "今天不想上班",
    source: "随机命运分配局",
    text: "命运机器给你批了十秒钟的假。",
  },
  cloud: {
    title: "如果云朵有朋友圈",
    source: "给云朵写日记",
    text: "它一定会拍很多自己路过时的照片。",
  },
  secret: {
    title: "聊绒把星期一放哪儿了？",
    source: "聊绒的小秘密",
    text: "据说标签内侧还有一个很小的口袋。",
  },
  inspiration: {
    title: "灵感正在绕路",
    source: "灵感收集者",
    text: "路边有一家只在发呆时营业的小店。",
  },
};

export const dailyRecommendations = {
  games: ["catch", "duck", "fish", "star", "potato"],
  questions: [
    ["如果云朵会写日记，会怎么记今天？", "cloud"],
    ["香蕉为什么总显得很严肃？", "banana"],
    ["对一颗土豆来说，什么算好日子？", "potato"],
    ["一厘米会去哪里度假？", "story"],
    ["月亮今天想戴什么？", "star"],
  ],
  moods: [
    "一点点好奇",
    "醒着，但没完全醒",
    "想去月亮上散步",
    "想跟你说悄悄话",
    "悄悄开心",
  ],
};

export const mascotLines = {
  home: [
    ["curious", "你怎么又来了？"],
    ["companion", "我先替你发个呆。"],
    ["naughty", "今天也不想太正经。"],
    ["thinking", "我刚想到一个东西……算了，忘了。"],
  ],
  space: [
    ["companion", "这朵云有点软。你也坐一会儿？"],
    ["curious", "你有没有觉得这颗星星长得像土豆？"],
    ["sleepy", "如果我睡着了，麻烦你帮我听一会儿星星。"],
  ],
  lab: [
    ["curious", "这次实验的变量是你的好奇心。"],
    ["thinking", "我正在研究按钮为什么这么好按。"],
  ],
  fortune: [
    ["curious", "要不要让机器替你做个小决定？"],
    ["naughty", "我没有偷偷调过概率。大概。"],
  ],
  collection: [
    ["curious", "试试看能不能翻到一件想带走的东西。"],
    ["naughty", "里面有见不得人的奇怪借口。"],
  ],
};

export const pageTips = {
  lab: {
    title: "研究所",
    lines: ["这里有个不该按的按钮。", "你确定要试试吗？"],
  },
  space: {
    title: "宇宙发呆中心",
    lines: [
      "点一下星星可以收藏。",
      "拖一下就能移动，方向键也可以。",
      "想听环境音的话，点下面的粉色按钮。",
    ],
  },
  fortune: {
    title: "命运分配局",
    lines: ["不知道做什么？让机器替你安排一件小事吧。"],
  },
};

export const helloReplies = [
  ["curious", "你已经和宇宙打了个招呼。再点一次看看会不会更无聊。", "word-pop"],
  ["thinking", "你真的很无聊吗？", "hello-nod"],
  ["scared", "别点我了。", "hello-flinch"],
  ["naughty", "？？？？？", "hello-wiggle"],
  ["inspired", "好吧，这个彩蛋是给你的。", "hello-spark"],
];

export const labMilestones = {
  1: ["你按了。", "curious", "button-squish"],
  2: ["你又按了。", "scared", "button-squish"],
  3: ["你是不是没事干？", "naughty", "lab-glow"],
  5: ["按钮开始怀疑人生。", "thinking", "lab-glow"],
  10: ["按钮要求休息。它提议发个呆。", "sleepy", "lab-dim"],
  15: ["聊绒偷偷探出头，已经看了一会儿了。", "naughty", "lab-glow"],
  20: ["按钮往旁边挪了一点。还是逃不掉。", "scared", "lab-sidestep"],
  28: ["恭喜你获得「优秀按钮按压员」称号！", "happy", "lab-glow"],
  50: ["按钮里传出了回声。隐藏实验开放了。", "inspired", "lab-glow"],
};

export const potatoStory = {
  start: {
    text: "土豆问：我应该去做什么？",
    choices: [
      ["去创业", "business"],
      ["去旅行", "trip"],
      ["躺着", "rest"],
      ["思考人生", "thought"],
    ],
  },
  business: {
    text: "土豆租下一个花盆当办公室。第一件商品要卖什么？",
    choices: [
      ["贩卖阳光", "ceo"],
      ["贩卖休息", "nap"],
    ],
  },
  trip: {
    text: "土豆坐着小推车来到岔路口。往哪走？",
    choices: [
      ["沿着泥土小路走", "traveler"],
      ["停下来晒一会儿", "nap"],
    ],
  },
  rest: {
    text: "土豆裹好被子，发现今天没有待办事项。",
    choices: [
      ["认真享受休息", "retired"],
      ["继续睡一会儿", "nap"],
    ],
  },
  thought: {
    text: "土豆想了半天：岩石会不会也觉得自己是土豆？",
    choices: [
      ["写一本推理著作", "philosopher"],
      ["问一问枕头", "nap"],
    ],
  },
  ceo: {
    title: "土豆企业家",
    text: "它卖出了三缕阳光，全部收入用来给办公室添一块地毯。",
    icon: "♛",
    color: "lime",
  },
  traveler: {
    title: "泥土旅行家",
    text: "它绕了花盆一圈，寄出一张写着「世界真大」的明信片。",
    icon: "☀",
    color: "blue",
  },
  retired: {
    title: "退休土豆",
    text: "它把日程交给窗边的风，决定以后每周放七天假。",
    icon: "☕",
    color: "purple",
  },
  philosopher: {
    title: "哲学土豆",
    text: "它的巨著《我土故我在》只写了一页。留白也是一种思想。",
    icon: "✎",
    color: "pink",
  },
  nap: {
    title: "人生的意义就是午睡",
    text: "土豆成功闭上了眼睛。这可能是今天最大的发现。",
    icon: "☾",
    color: "blue",
  },
};

export const doorEvents = [
  {
    id: "ordinary",
    title: "普通房间",
    icon: "⌂",
    color: "blue",
    text: "一盏台灯正照着一张空椅子。它看起来下班了。",
  },
  {
    id: "upside-down",
    title: "倒过来的房间",
    icon: "↻",
    color: "pink",
    text: "天花板上的拖鞋都摆得很整齐。",
  },
  {
    id: "visitor",
    title: "聊绒的临时办公室",
    art: "loro",
    color: "lime",
    text: "聊绒假装正在写报告，纸上只有一颗土豆。",
  },
  {
    id: "note",
    title: "无人认领的便条",
    icon: "✉",
    color: "purple",
    text: "便条写着：「听见门响三次，就再试一次。」",
  },
  {
    id: "secret",
    title: "秘密房间",
    icon: "✦",
    color: "lime",
    text: "一排发光的小脚印通到尽头。墙上写着：「门只是想留条缝透气。」",
  },
];

export const journalRules = [
  [/开心|快乐|高兴|好开心|喜悦/, "云朵决定今天变成一朵彩虹云。", "🌈", "pink"],
  [/难过|累|伤心|疲惫|疲倦/, "云朵轻轻下了一场小雨。", "☂", "blue"],
  [/工作|上班|加班|通勤/, "云朵决定申请一天假期。", "☁", "purple"],
];

const publicExperienceIds = new Set(
  experiences
    .filter((entry) => !entry.unlock && entry.type !== "隐藏彩蛋")
    .map(({ id }) => id),
);
const dailyGames = dailyRecommendations.games.filter((id) =>
  publicExperienceIds.has(id),
);
const dailyQuestions = dailyRecommendations.questions.filter(([, id]) =>
  publicExperienceIds.has(id),
);

export function getDailyRecommendation(date = new Date(), previous) {
  const day = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000,
  );
  const rotation = previous?.day === day ? previous.rotation : 0;
  const dailyIndex = (length, offset) =>
    (((day + offset + rotation) % length) + length) % length;
  return {
    day,
    rotation,
    game: dailyGames[dailyIndex(dailyGames.length, 1)],
    question: dailyQuestions[dailyIndex(dailyQuestions.length, 3)],
    task: dailyIndex(tasks.length, 5),
    mood: dailyRecommendations.moods[
      dailyIndex(dailyRecommendations.moods.length, 7)
    ],
  };
}

export function rotateDailyRecommendation(previous, date = new Date()) {
  return getDailyRecommendation(date, {
    day: previous.day,
    rotation: previous.rotation + 1,
  });
}
