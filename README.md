# 无聊宇宙 V3.0 · 随机玩意

一个收集奇怪念头、陪人发呆的中文游乐场。首页的「你好」「无聊」和聊绒都可以直接互动。每日推荐按浏览器本地日期更新，也可以换一组或恢复当天的默认推荐。

## 本地运行

使用 Node.js 24。

```sh
npm ci
npm run check
npm test
npm run dev
```

打开 http://localhost:3000。生产站点使用同一套路由与静态资源。

| 路由 | 内容 |
| --- | --- |
| `/` | 聊绒初次见面、首页互动计数、每日推荐和隐藏发现进度 |
| `/random` | 随机抽取原创体验或外部网站，支持按类型筛选和直接打开最近抽到的卡片 |
| `/lab` | 按钮里程碑、证书和精选实验 |
| `/space-daze` | 拖动、收藏星星，布置星球，为月亮换装，以及手动开启的环境音 |
| `/fortune` | 30 个命运任务，按类型抽取、完成和分享 |
| `/archive` | 活跃时长、游戏成绩、原创收藏、外部网站收藏与历史、隐藏发现和念头罐 |

在星空可以拖动星星，也可以给星星聚焦后用方向键移动。点击星星或按回车、空格，可以收藏或放回。抓聊绒支持触屏和键盘。金鱼投篮可以按时机投球，或移动力度滑块手动瞄准。手动瞄准偏好会记住。网页或系统开启减少动画时会使用手动瞄准，系统偏好与手动选择分别管理。设置位于桌面页眉或手机导航菜单。

## 随机玩意

默认从原创体验和外部网站中抽取，两种内容都可用时约四次有一次抽到外部网站。筛选条件和当前卡片都记录在地址里。例如 `/random?type=original` 仅抽原创体验，`/random?type=internet` 仅抽外部网站，`/random?id=catch` 可直接打开抓住聊绒，`/random?site=why-zero` 可直接打开 Why Zero 的推荐卡片。旧 `/collection` 地址会转到随机玩意，旧原创类型或外站选项会转换为对应的筛选条件。

点击「进入原网站」会在当前标签页前往原网站，浏览器返回可恢复推荐卡片。在我的档案可以重新打开收藏或最近遇到的网站。外部条目在 `public/external-sites.js` 维护，混合概率在 `public/random-explore.js` 调整。[链接核验与维护](docs/external-sites.md) · [开发与测试报告](docs/random-exploration.md)

## 内容和存档

体验、剧情、任务、发现和每日推荐在 `public/content.js` 中管理。命运分享链接使用任务数组下标，新任务应追加到末尾。打开或刷新分享链接会开启对应任务的一次新尝试，在分配局抽到的任务会通过本地存档恢复。小游戏控制器在 `public/games.js`，聊绒的状态和对话在 `public/mascot.js`，页面渲染与导航在 `public/app.js`。

存档仍使用 `wuliao-universe-v1`。升级时验证各字段，保留原有计数、收藏和装扮，并从可证明的旧计数恢复已达成的彩蛋。V2.1 新增的 `homeCounters`、`tipsSeen` 和 `settings.fishManual` 也通过同一个迁移入口校验。首页计数从升级后开始累计，原有彩蛋保留；只有旧计数、缺少时间的彩蛋会标记为旧版记录。V2 活跃时长从升级后开始计量，仅在页面可见且最近 60 秒有交互时累积。实验室提示音默认关闭，开启后会记住选择。环境音需在宇宙页主动开启，离开时停止。

外部网站使用独立的 `externalFavorites`、`externalVisited` 和 `externalSeen` 字段。档案展示最近遇到的至多 12 个网站，抽取时优先考虑此前未遇到的条目。

插画与字体在 `public/assets/`，字体许可见 `licenses/`。本地测试覆盖存档迁移、活跃计时、每日推荐换组与跨日重置、星星收藏、彩蛋解锁和任务链接。

## Cloudflare

每次项目改动完成后，先运行 `npm run check` 和 `npm test`，再提交并推送到 GitHub 的 `main` 分支，部署到 Cloudflare 并验证线上版本。

`wrangler.jsonc` 将静态资源发布为 Cloudflare Worker，并给子域名 `wuliao.tianyuanai.top` 配置自定义域。部署账号需要能管理该 Worker 和 `tianyuanai.top` 区域。

```sh
npx wrangler login --device
npm run deploy
```
