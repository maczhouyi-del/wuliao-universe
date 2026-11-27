# 奇妙互联网维护与测试

栏目位于 `/collection?section=internet`。网站条目保存在 `public/external-sites.js`，依照 `sortOrder` 推荐。站点介绍、交互标签和插图由无聊宇宙编辑，作品体验由原站提供。

## 首批链接核验

核验日期为 2026-11-27（北京时间）。六个官方入口均通过 HTTPS GET 返回 200，浏览器页面与各作品或创作者资料一致。核验期间未观察到异常下载或跳转到无关域名。

| 作品 | 官方地址 | 内容与分类 | 原始来源 | 状态与备注 |
| --- | --- | --- | --- | --- |
| Why Zero | [官方网站](https://why.zero.university/) | 滚动叙事、解锁和地图探索。沉浸体验。 | [Awwwards 作品页](https://www.awwwards.com/sites/why-zero) | `published`。原站标题现为 “Zero — Human Infrastructure to Get Hired”，互动场景仍在原网址加载。 |
| Messenger | [官方网站](https://messenger.abeto.co/) | 在微型星球上探索和送信。互动游戏。 | [Awwwards 案例](https://www.awwwards.com/messenger.html) | `published`。浏览器加载了场景和界面资源，场景初始化需要等待。 |
| Ponpon Mania | [官方网站](https://ponpon-mania.com/) | 按章节阅读并参与动画。互动故事。 | [作者说明](https://ponpon-mania.com/about) | `published`。原站的阅读入口、章节和语言选项均可见。 |
| Bruno Simon | [官方网站](https://bruno-simon.com/) | 驾驶探索创作者的 3D 作品集。3D探索。 | [创作者作品集](https://bruno-simon.com/) | `published`。原站说明了键盘、触屏和手柄控制。 |
| Grids | [官方网站](https://grids.obys.agency/) | 浏览网格、排版和设计案例。视觉实验。 | [Obys 作品说明](https://obys.agency/work/grids) | `published`。章节、网格示例与原站入口匹配。 |
| The Tie-break | [官方网站](https://thetiebreak.merci-michel.com/) | 3D 网球体验与品牌视觉。互动游戏。 | [Global Web Design Awards 作品页](https://globalwebdesignawards.com/sites/the-tie-break) | `published`。浏览器从入口切换至同源 `/eu/en/`，点击 `Start` 后进入对阵引导。 |

## 新增或复核链接

1. 确认原始网址和创作者或作品来源，新增一条 `externalSites` 记录。记录标题、类别、简介、交互标签、设备建议和排序。设备与奖项信息以可核实的依据为准。
2. 对官方地址发起 HTTPS GET，检查响应内容、最终地址、跨域跳转及下载响应头。再用浏览器打开并核对标题、作品内容以及脚本触发的导航。自动化访问受限或内容无法确认时，标记 `pending`。
3. 核验通过后更新记录和日期，将 `status` 设为 `published`。栏目只展示有效的 `published` HTTPS 记录，访客打开栏目时无需等待第三方可用性检查。

单个网址可用下列命令检查 HTTP 响应链。页面脚本的跳转和交互入口由浏览器复核。

```sh
curl --silent --show-error --location --max-time 20 \
  --proto '=https' --proto-redir '=https' --dump-header - --output /dev/null \
  --write-out 'final=%{url_effective} status=%{http_code}\n' \
  https://why.zero.university/
```

## 测试结果

| 检查 | 结果 |
| --- | --- |
| `npm run check` 与 `npm test` | 通过。共 17 项测试，其中 4 项覆盖外部目录隔离、链接状态、筛选和原生链接渲染。 |
| Chromium、Firefox、WebKit | 合集入口、原分类地址、分类与标签组合搜索、筛选后刷新、浏览器前进和返回均通过。卡片显示的信息与目录记录一致，打开栏目时没有请求第三方资源。 |
| 同标签页导航 | 在 Chromium 点击 Why Zero 的插图和 Ponpon Mania 的「进去看看」，均到达真实原站。当时只有一个标签页，浏览器返回后恢复了搜索结果。 |
| 待核验记录 | 在测试环境将 The Tie-break 临时标为 `pending`，卡片及其独有标签均不可见。正式目录保留实际核验结果。 |
| 响应式与键盘可访问性 | Chromium 检查 320、375、390、430 和 720 像素宽度，Firefox 和 WebKit 检查 320 与 390 像素。未发现横向溢出。390 像素模拟触屏可切换栏目与分类，键盘回车和方向键也能切换。axe 在桌面和 320 像素布局的所测 WCAG A/AA 规则中无报告。 |
| 原功能回归 | 原有 17 个体验入口、全站搜索、收藏、存档和分享的 Chromium 回归流程通过。 |

移动端使用浏览器模拟，未使用实体设备。第三方验证覆盖地址、页面和访问入口，互动作品没有逐一通关。
