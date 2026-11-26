# 无聊宇宙 V3.0 开发报告

## 四个小站

| 小站 | 场景与操作 | 结果 |
| --- | --- | --- |
| 云朵之门 | 在奶油色纸面用鼠标或手指画一条线，也可以跳过绘画。笔迹足够长时可以开门。 | 随机进入星星、土豆或聊绒房间。纸箱里还有一项秘密。 |
| 聊绒的小行星 | 在深蓝色俯视场景里，用方向键、WASD、屏幕方向键或点选地标移动。空格或「查看附近」会触发互动。探索一轮最长 60 秒，可以暂停或提前结算。 | 找回三颗星星，沿地标线索发现隐藏门。结算记录星数、用时和门的状态，档案保留最佳成绩。 |
| 聊绒漫画屋 | 点击带插画与气泡的分镜推进《聊绒和失踪的星期一》。在岔路选择去土豆家或月亮家。 | 七个分镜、两个可重复阅读的结局。读完两个结局会留下秘密记录。 |
| 没用的形状实验室 | 在浅色网格上拖放八类形状，可移动、缩放、旋转、改色、复制和删除。可清空画布、打乱已有形状或随机生成。 | 可以为作品命名，在当前浏览器保存并恢复最近一份布局，或导出 PNG。 |

首页、奇怪合集「微型小站」分类和随机玩意都能进入体验。集合页可以直接访问，各小站共用收藏、操作帮助、重新开始和返回入口。每次完成后，在无聊档案里可查看小站足迹。

## 交互研究

Why Zero 的进入动作启发了绘画开门。Messenger 和 Bruno Simon 启发了地标探索，The Tie-break 的体验结构启发了结算。Ponpon Mania 的分镜节奏用于构思漫画的推进方式，Grids 的可见网格启发了排版画布。详细观察、来源、技术取舍和复杂度见 [交互研究](awwwards-inspiration-research.md)。外部交互浏览器未能启动，参考观察依据公开页面、画面与创作者说明。

## 实现与文件

| 文件 | 改动 |
| --- | --- |
| `public/microsites.js`、`public/microsites/catalog.js` | 集合入口、四个地址、公共外壳、按需载入、收藏和档案展示 |
| `public/microsites/cloud-gate.js`、`public/microsites/shape-lab.js` | Canvas 2D 和 Pointer Events 驱动笔迹、图形编辑和 PNG 输出 |
| `public/microsites/asteroid.js`、`public/microsites/comic.js` | 单一动画循环与 DOM 位置控制、数据驱动的分镜和分支 |
| `public/microsites/worlds.css`、`public/style.css` | 四个独立场景、入口卡片、窄屏和减少动画样式 |
| `public/app.js`、`public/content.js` | 已有路由、首屏、随机入口、奇怪合集、搜索和档案接入 |
| `public/mascot.js` | 页面退出后，已移除的聊绒元素不再接收旧动画回调 |
| `public/state.js` | 在 `wuliao-universe-v1` 中校验并迁移 `microsites` |
| `tests/microsites.test.js`、`scripts/check.mjs`、`package.json` | 七项新增回归测试和模块语法检查 |
| `README.md`、`docs/awwwards-inspiration-research.md`、`docs/v3-development-report.md` | 运行、部署、研究和开发说明 |

继续使用原生 JavaScript、HTML、CSS 和项目现有原创插画。进入具体小站时才请求互动脚本和场景样式。切换路由时，中止小站的事件监听和探索动画循环。首页的入口图有原生延迟加载。

## 本地存档

| `microsites` 字段 | 内容 |
| --- | --- |
| `visits`、`completions` | 各小站到访和完成次数 |
| `secrets`、`cloudRooms` | 秘密的首次发现时间、已去过的云朵房间 |
| `asteroidBest` | 最佳星数及该轮用时，先比较星数，再比较用时 |
| `comicEndings` | 已解锁的漫画结局 |
| `shapeLayout` | 最近保存的作品名称和最多 40 个图形的布局 |

原有计数、设置、收藏和发现仍使用同一个本地存档。清空形状画布或重新开始后，仍可恢复最近一次保存的布局。

## 验证

- `npm ci`、`npm run check` 和 `npm test` 已通过。20 项测试包括 7 项小站回归测试，覆盖旧档迁移、房间、最佳成绩、漫画分支和形状布局校验。
- 使用 Playwright 在 Chromium、Firefox 和 WebKit 检查独立地址、刷新、键盘和鼠标输入、暂停与退出清理、秘密与收藏、漫画两个结局、形状编辑和 PNG 下载。Chromium 回归检查也覆盖原有 17 个体验入口。
- Chromium 在 320、375、390 和 430 像素宽度模拟触屏，检查绘画、方向控制、点选目标、拖动图形和漫画点击。检查的页面没有水平溢出。
- axe 扫描了桌面与 320 像素布局，在覆盖的 WCAG A/AA 规则中未报告问题。专项检查验证了系统和站内的减少动画偏好，以及离开宇宙发呆中心后环境音停止。
- 首页请求检查确认互动模块和场景样式按需载入。

移动端验证使用浏览器模拟触屏，未使用实体设备。六个参考作品的实时交互仍未通过本地浏览器复核，公开资料的验证范围见交互研究。
