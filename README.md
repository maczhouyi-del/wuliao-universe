# 无聊宇宙 V2.0

一个收集奇怪念头、陪人发呆的中文游乐场。首页的「你好」「无聊」和聊绒都可以直接互动。每日推荐按浏览器本地日期更新。

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
| `/` | 聊绒初次见面、你好循环、追逐无聊和每日推荐 |
| `/random` | 随机体验，也可直接打开 `/random?id=catch`、`/random?id=potato`、`/random?id=door` 或 `/random?id=fish` |
| `/lab` | 按钮里程碑、证书和精选实验 |
| `/space-daze` | 拖动、收藏星星，布置星球，为月亮换装，以及手动开启的环境音 |
| `/fortune` | 30 个命运任务，按类型抽取、完成和分享 |
| `/collection` | 分类、排序和内容收藏 |
| `/archive` | 活跃时长、游戏成绩、收藏、隐藏发现与聊绒的念头罐 |

在星空可以拖动星星，也可以给星星聚焦后用方向键移动。按回车或空格收集星星。抓聊绒支持触屏和键盘。金鱼投篮可以按时机投球，或移动力度滑块手动瞄准。网页的「减少动画」与系统设置都会切换到低动效玩法。

## 内容和存档

体验、剧情、任务、发现和每日推荐在 `public/content.js` 中管理。上新顺序来自体验目录的加入顺序。旧命运链接使用任务数组下标，新任务应追加到末尾。小游戏控制器在 `public/games.js`，聊绒的状态和对话在 `public/mascot.js`，页面渲染与导航在 `public/app.js`。

存档仍使用 `wuliao-universe-v1`。升级时验证各字段，保留原有计数、收藏和装扮，并从可证明的旧计数恢复已达成的彩蛋。V2 活跃时长从升级后开始计量，仅在页面可见且最近 60 秒有交互时累积。实验室提示音默认关闭，开启后会记住选择。环境音需在宇宙页主动开启，离开时停止。

插画与字体在 `public/assets/`，字体许可见 `licenses/`。本地测试覆盖存档迁移、活跃计时、每日推荐及内容配置。

## Cloudflare

`wrangler.jsonc` 将静态资源发布为 Cloudflare Worker，并给子域名 `wuliao.tianyuanai.top` 配置自定义域。部署账号需要能管理该 Worker 和 `tianyuanai.top` 区域。

```sh
npx wrangler login --device
npm run deploy
```
