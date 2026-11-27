# 奇妙互联网链接维护

在随机玩意选择「奇妙互联网」（`/random?type=internet`），可以抽到已核验的外部网站。网站条目保存在 `public/external-sites.js`。站点介绍、交互标签和插图由无聊宇宙编辑，作品体验由原站提供。

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

1. 确认原始网址和创作者或作品来源，新增一条 `externalSites` 记录。记录标题、类别、简介、交互标签和设备建议。设备与奖项信息以可核实的依据为准。
2. 对官方地址发起 HTTPS GET，检查响应内容、最终地址、跨域跳转及下载响应头。再用浏览器打开并核对标题、作品内容以及脚本触发的导航。自动化访问受限或内容无法确认时，标记 `pending`。
3. 核验通过后更新记录和日期，将 `status` 设为 `published`。随机玩意只抽取有效的 `published` HTTPS 记录。可用性检查在编辑维护时完成。

单个网址可用下列命令检查 HTTP 响应链。页面脚本的跳转和交互入口由浏览器复核。

```sh
curl --silent --show-error --location --max-time 20 \
  --proto '=https' --proto-redir '=https' --dump-header - --output /dev/null \
  --write-out 'final=%{url_effective} status=%{http_code}\n' \
  https://why.zero.university/
```

[随机玩意开发与测试报告](random-exploration.md)
