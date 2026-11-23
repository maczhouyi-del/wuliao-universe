# 无聊宇宙

一个收集奇怪念头、陪人发呆的中文游乐场。打开即可游玩。计数、收藏、星球名称、帽子和减少动画设置保存在当前浏览器。

## 本地运行

使用 Node.js 24。

```sh
npm ci
npm run check
npm run dev
```

在浏览器打开 http://localhost:3000。站点也支持直接打开 `/random`、`/lab`、`/space-daze`、`/fortune`、`/collection` 和 `/archive`。

内容目录和任务池定义在 `public/content.js`。插画与字体位于 `public/assets/`，字体许可见 `licenses/`。

## Cloudflare

`wrangler.jsonc` 将静态资源发布为 Cloudflare Worker，并给子域名 `wuliao.tianyuanai.top` 配置自定义域。部署账号需要能管理该 Worker 和 `tianyuanai.top` 区域。

```sh
npx wrangler login --device
npm run deploy
```
