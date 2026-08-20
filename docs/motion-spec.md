# Alva Mobile Motion System v1

> 适用范围：alva-mobile-demo（Alva 移动端 demo）全部页面与后续新增内容。
> 本规范不是发明，而是裁剪：token 架构取自 Material Design 3 Motion
> (m3.material.io/styles/motion)，手势与空间连续性原则取自 Apple HIG
> (developer.apple.com/design/human-interface-guidelines/motion)，
> 克制与数据完整性原则取自成熟金融产品（Robinhood / Cash App / Revolut）的
> 公开设计实践。所有现有页面动效已收编为 token；新增内容默认引用 token，
> 不允许出现字面量时长/曲线。

## 1. 原则（决策优先级从上到下）

1. **动效是反馈，不是装饰**（HIG）。每个动画必须回答：什么变了 / 我在哪 /
   我能做什么。回答不了就删。
2. **空间连续性**（HIG）。前进从右入，返回向右出；抽屉从左，Sheet 从下；
   动画方向永远与手势方向一致，不许反向。
3. **快优先于炫**。触控反馈 ≤100ms（Nielsen 响应时间三阈值 / Google INP
   "good" < 200ms），页面转场 ≤400ms（M3 long1 上限），全屏覆盖层 ≤500ms。
4. **进场减速，出场加速**（M3 easing 原则）。进入视口的元素用
   decelerate 家族，离开的用 accelerate 家族。
5. **一屏一主角**。同一时刻只允许一个 emphasized 动效（页面转场/Sheet），
   其余元素用 standard/micro 级别，禁止多个大动效并发。
6. **金融数据完整性**（行业约束）。数字与图表可以有入场绘制动效，但禁止
   用动效暗示未发生的数据变化；实时数字变更必须即时呈现，动效只做
   200ms 内的颜色/位移提示（Robinhood ticker 模式）。
7. **尊重 reduced motion**（WCAG 2.3.3 / HIG）。所有非必要动效在
   `prefers-reduced-motion: reduce` 下关闭——本项目已有全局块，新增动画
   类必须同步登记。
8. **60fps 纪律**。只允许动画 `transform` / `opacity`（合成器属性）；
   禁止动画 layout 属性（width/height/top/margin）。加载循环类动画除外
   （skeleton 的 background-position）。

## 2. Token（唯一真源：`src/styles.css` `:root` + `src/motion.ts`）

### 2.1 时长（role-based，对应 M3 duration 档位）

| Token | 值 | 用途 | M3 对应档 |
|---|---|---|---|
| `--motion-dur-feedback` | 80ms | 按压/开关等即时反馈 | short1–2 |
| `--motion-dur-micro` | 140ms | 图标、chip、hover、小型淡入淡出 | short3 |
| `--motion-dur-content` | 180ms | 页内内容进场、tab 切换、消息、backdrop | short4 |
| `--motion-dur-back` | 240ms | 返回导航、modal、浮层动作条 | medium1 |
| `--motion-dur-push` | 260ms | 前进导航 | medium1–2 |
| `--motion-dur-sheet` | 280ms | 底部 Sheet、抽屉遮罩 | medium2 |
| `--motion-dur-hero` | 320ms | 登录→主页等身份级转场、抽屉纵深层 | medium3 |
| `--motion-dur-drawer` | 380ms | 侧边抽屉 | medium4–long1 |
| `--motion-dur-loop` | 900ms | typing 点、skeleton 等循环 | — |

规则：新动效**必须**从上表取值。找不到合适档位 = 先改规范再写码。

### 2.2 缓动

| Token | 值 | 用途 |
|---|---|---|
| `--motion-ease-out` | `ease-out` | 180ms 以下微动效 |
| `--motion-ease-enter` | `cubic-bezier(0.22, 1, 0.36, 1)` | 页面/内容进场（本产品主曲线） |
| `--motion-ease-soft` | `cubic-bezier(0.18, 0.86, 0.18, 1)` | 抽屉、Sheet、纵深层 |
| `--motion-ease-exit` | `cubic-bezier(0.5, 0, 0.78, 0.24)` | 离场（加速） |
| `--motion-ease-hero` | `cubic-bezier(0.2, 0.9, 0.2, 1)` | 身份级转场（带轻微越出） |
| `--motion-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | 属性过渡（颜色/透明度），M3 standard |

### 2.3 位移距离

`--motion-shift-xs: 8px`（消息/内容）· `--motion-shift-s: 12px`（hero）·
`--motion-shift-m: 18px`（动作条）· `--motion-shift-l: 28px`（页面推入）·
`--motion-shift-xl: 34px`（Sheet）。进场位移不超过 34px——超过就是"飞"，
不是"落位"（M3：短距离、快落位）。

## 3. 模式库（新增内容按场景对号入座）

| 场景 | 类/做法 | 组成 |
|---|---|---|
| 前进导航 | `.enter-push` | push + enter |
| 返回导航 | `.enter-back` | back + enter |
| 身份转场（splash→login→app） | `.enter-auth` | hero + hero |
| 侧边抽屉 | drawer 三层体系（enter/exit/backdrop） | drawer/hero/sheet + soft/exit |
| 底部 Sheet | `.ask-sheet` 模式 | sheet + soft，配 `.overlay-backdrop` |
| 居中 Modal | `.info-modal` 模式 | back + enter |
| Tab 内容切换 | `.tab-content-motion` | content + enter |
| 消息/流式内容 | `message-in` | content + ease-out，`both` 填充 |
| 列表批量进场 | `.m-stagger` | 子项 content 时长、24ms 步进、≤6 项 |
| 通用内容进场 | `.m-enter-up` / `.m-enter-fade` | content + enter |
| 按压反馈 | 全局 `:active`（见 §4） | feedback + scale(0.96–0.985) |
| 图表绘入 | `.mini-chart` 自带 scaleY 生长 | content + enter + 步进延迟 |
| 数字变更 | `motion.ts # animateNumber` | ≤200ms，只在用户触发的刷新中使用 |
| 加载循环 | skeleton / `typing-dot` | loop 时长 |

## 4. 默认行为（不写代码就应该发生的）

- 所有可点击行/按钮**默认**有按压反馈（全局 `:active` 规则，鼠标与触控
  一致），新组件不需要手写。
- 所有 route 级切换**默认**经过 `App.tsx` 的 motion 体系（`motionFor`），
  新 Screen 只需在 `navigation.ts` 里归类，不许自带转场。
- 所有新增 `@keyframes` 必须：只动 transform/opacity、引用 token、
  在 `prefers-reduced-motion` 块登记。

## 5. 落地校验

`npm run qa:score` 会静态扫描：字面量时长/曲线、非合成器属性动画、
reduced-motion 覆盖缺口、时长越界（<80ms 或 >600ms 且非 loop）。
不过评分门槛见 `docs/experience-scorecard.md`。
