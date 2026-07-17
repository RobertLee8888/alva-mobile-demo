# Alva 移动端体验评价体系 v1（Experience Scorecard）

> 原则：**不自创评价维度**。每一项检查都溯源到一个公开、成熟的体系；
> 没有可溯源出处的检查不进入评分。打分入口：`npm run qa:score`
> （自动项）+ 本文档 §4（人工项，用 NN/g 严重度量表）。

## 1. 引用的体系（唯一允许的评分依据）

| 体系 | 用于 | 关键条目 |
|---|---|---|
| Nielsen 10 usability heuristics（NN/g） | 可用性 | 系统状态可见(#1)、用户控制与出口(#3)、一致性(#4)、防错(#5)、识别优于回忆(#6)、美学与极简(#8) |
| NN/g severity rating（0–4） | 人工问题定级 | 0 无问题 … 4 灾难必须修 |
| WCAG 2.2 AA | 可访问性 | 1.4.3 对比度、2.3.3 交互动画可关、2.4.7 焦点可见、2.5.8 目标尺寸 ≥24px |
| Apple HIG | 触控与动效 | 44pt 推荐触控目标、空间连续性、reduced motion |
| Material Design 3 Motion | 动效 | duration 档位、进场减速/出场加速、easing token 化 |
| Google Core Web Vitals / INP | 响应性 | 交互到下一帧 <200ms=good，>500ms=poor |
| Nielsen 响应时间三阈值 | 响应性/加载 | 0.1s 即时感、1s 心流上限、>1s 需要进度指示 |
| NN/g Interaction Cost / KLM | 流程效率 | 步数、点按数、决策点相对任务基线 |
| Google HEART | 结果层指标 | Happiness/Engagement/Adoption/Retention/Task-success（上线后接数据） |
| Lighthouse 分带 | 总分解释 | ≥90 好，50–89 待改进，<50 差 |

## 2. 评分模型（总分 100）

| 维度 | 权重 | 依据 | 打分方式 |
|---|---|---|---|
| 可用性（Usability） | 30 | Nielsen 10 条 | 自动：出口/返回可达性、导航一致性、加载状态存在；其余人工 §4 |
| 可访问性（A11y） | 20 | WCAG 2.2 AA | 自动：目标尺寸、reduced-motion 覆盖、aria-label 覆盖；对比度人工/工具 |
| 动效质量（Motion） | 20 | M3 + HIG | 自动：token 合规、时长档位、合成器属性纪律、方向一致性(路由层) |
| 响应性（Responsiveness） | 15 | INP + Nielsen 阈值 | 自动：交互后同帧出反馈、>1s 等待有 loading/skeleton |
| 流程效率（Flow） | 15 | NN/g interaction cost | 自动：实测点按数 ≤ 基线、无死端（每屏有出口） |

自动脚本只对**可自动测的子项**打分并折算权重；人工子项在报告里列为
`MANUAL`，按 §4 打完后填回总分。HEART 属结果层，不参与设计期打分，
上线后用真实数据替换。

**分带（Lighthouse 口径）**：≥90 可发布；50–89 修完 P1 再发；<50 打回。

## 3. 自动检查清单（qa/flow-score.mjs 实现，括号内为溯源）

**Motion（20 分）**
- M1 所有 `animation:`/`transition:` 引用 motion token，无字面量时长（M3 token 纪律）
- M2 非循环动效时长 ∈ [80ms, 600ms]（M3 duration 档；HIG"快而不抢"）
- M3 `@keyframes` 只动 transform/opacity（60fps 合成器纪律；skeleton 的
  background-position、抽屉圆角白名单降级为 warning）
- M4 每个带动画的类都被 `prefers-reduced-motion` 块覆盖（WCAG 2.3.3）
- M5 路由动效方向一致：push 右进、back 左回、drawer 左层、sheet 底部（HIG 空间连续性；对 `navigation.ts # motionFor` 做表驱动断言）

**A11y（20 分）**
- A1 交互控件 CSS 可解析尺寸 ≥24×24px（WCAG 2.5.8），<44px 记 warning（HIG）
- A2 纯图标按钮 100% 有 aria-label（WCAG 4.1.2 / Nielsen #6）
- A3 reduced-motion 全局块存在且非空（WCAG 2.3.3）
- A4 对比度：MANUAL（用 WebAIM Contrast Checker 或 Lighthouse 跑）

**Usability（30 分）**
- U1 无死端：每个 screen 渲染后存在返回/菜单/关闭控件（Nielsen #3）
- U2 route 切换 100% 有转场类（系统状态可见，Nielsen #1）
- U3 >1s 的等待有 skeleton/loading（Nielsen 响应阈值；chat 加载已有）
- U4–U6 语言一致性、防错、极简：MANUAL（§4）

**Responsiveness（15 分）**
- R1 点击后同一事件循环内 DOM 有可见变化（INP 反馈原则的静态代理）
- R2 交互动画时长不超过 500ms（INP poor 阈值对齐）

**Flow（15 分）**
- F1 实测点按数 ≤ `qa/flows.json` 基线（NN/g interaction cost）
- F2 流程可完成（目标屏可达，无 JS 错误）

## 4. 人工评审协议（每次大改跑一遍）

1. 按 `qa/flows.json` 的流程逐条走查，对照 Nielsen 10 条。
2. 每个问题记录：流程 / 违反的启发式编号 / NN/g 严重度 0–4 / 截图。
3. 扣分：严重度 3–4 每个 −5，严重度 2 每个 −2，严重度 1 每个 −0.5，
   扣在对应维度内，扣完为止。
4. 对比度用 Lighthouse 或 WebAIM 工具补 A4 结果。
5. 报告归档到 `qa/reports/`，与自动报告同名后缀 `-manual`。

## 5. 工作流约定

- 新增任何 screen/flow：先在 `qa/flows.json` 登记基线，再开发。
- `npm run qa:score` 是提交前门槛：自动分 <90 或出现新 FAIL 不提交。
- 规范变更（token、模式）必须同步 `docs/motion-spec.md` 与本文件。
