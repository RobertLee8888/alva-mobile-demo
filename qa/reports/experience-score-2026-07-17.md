# Experience Score — 2026-07-17

**自动分：98/100（GOOD（可发布），Lighthouse 分带）**

人工项（MANUAL）未计入，按 docs/experience-scorecard.md §4 补齐。

| 检查 | 维度 | 结果 | 详情 | 溯源 |
|---|---|---|---|---|
| M1 动效时长/曲线全部 token 化 | motion | PASS | 无字面量 | M3 motion token 纪律 |
| M2 非循环时长 ∈ [80,600]ms | motion | PASS | feedback=80 micro=140 content=180 back=240 push=260 sheet=280 hero=320 drawer=380 loop=900 | M3 duration 档位 / HIG |
| M3 @keyframes 只动 transform/opacity | motion | WARN | (warn)drawer-current-exit:border-radius | 60fps 合成器纪律（Chrome rendering docs） |
| M4 reduced-motion 覆盖所有动画类 | a11y | PASS | 全覆盖 | WCAG 2.3.3 / HIG |
| M5 路由动效方向一致（HIG 空间连续性） | motion | PASS | motionFor 全部命中 | Apple HIG |
| A1 交互目标 ≥24px（WCAG 2.5.8；<44px 仅提示） | a11y | PASS | 静态可解析项合规；未解析(0)需人工 | WCAG 2.2 §2.5.8 / HIG 44pt |
| A2 图标按钮有可访问名称 | a11y | PASS | IconButton=25, label=85 | WCAG 4.1.2 / Nielsen #6 |
| A3 prefers-reduced-motion 全局块 | a11y | PASS |  | WCAG 2.3.3 |
| A4 文本对比度 ≥4.5:1 | a11y | MANUAL | 用 Lighthouse 或 WebAIM Contrast Checker | WCAG 2.2 §1.4.3 |
| U3 >1s 等待有 skeleton/loading | usability | PASS |  | Nielsen 响应时间阈值 |
| F/first-run 流程可完成：first-run | flow | PASS | OK | 任务成功（HEART Task-success 的设计期代理） |
| F1/first-run 点按数 ≤ 基线（1） | flow | PASS | 实测 1 | NN/g interaction cost |
| U1/first-run 无死端（有出口控件） | usability | PASS |  | Nielsen #3 用户控制与出口 |
| U2/first-run 路由切换带转场 | usability | PASS |  | Nielsen #1 系统状态可见 |
| R1/first-run 点击同步产生 DOM 反馈 | resp | PASS | 1/1 | Google INP（good <200ms） |
| F/explore-to-detail 流程可完成：explore-to-detail | flow | PASS | OK | 任务成功（HEART Task-success 的设计期代理） |
| F1/explore-to-detail 点按数 ≤ 基线（3） | flow | PASS | 实测 3 | NN/g interaction cost |
| U1/explore-to-detail 无死端（有出口控件） | usability | PASS |  | Nielsen #3 用户控制与出口 |
| U2/explore-to-detail 路由切换带转场 | usability | PASS |  | Nielsen #1 系统状态可见 |
| R1/explore-to-detail 点击同步产生 DOM 反馈 | resp | PASS | 3/3 | Google INP（good <200ms） |
| F/detail-tabs 流程可完成：detail-tabs | flow | PASS | OK | 任务成功（HEART Task-success 的设计期代理） |
| F1/detail-tabs 点按数 ≤ 基线（3） | flow | PASS | 实测 3 | NN/g interaction cost |
| U1/detail-tabs 无死端（有出口控件） | usability | PASS |  | Nielsen #3 用户控制与出口 |
| U2/detail-tabs 路由切换带转场 | usability | PASS |  | Nielsen #1 系统状态可见 |
| R1/detail-tabs 点击同步产生 DOM 反馈 | resp | PASS | 3/3 | Google INP（good <200ms） |
| F/ask-alva 流程可完成：ask-alva | flow | PASS | OK | 任务成功（HEART Task-success 的设计期代理） |
| F1/ask-alva 点按数 ≤ 基线（2） | flow | PASS | 实测 2 | NN/g interaction cost |
| U1/ask-alva 无死端（有出口控件） | usability | PASS |  | Nielsen #3 用户控制与出口 |
| U2/ask-alva 路由切换带转场 | usability | PASS |  | Nielsen #1 系统状态可见 |
| R1/ask-alva 点击同步产生 DOM 反馈 | resp | PASS | 2/2 | Google INP（good <200ms） |
| F/profile 流程可完成：profile | flow | PASS | OK | 任务成功（HEART Task-success 的设计期代理） |
| F1/profile 点按数 ≤ 基线（3） | flow | PASS | 实测 3 | NN/g interaction cost |
| U1/profile 无死端（有出口控件） | usability | PASS |  | Nielsen #3 用户控制与出口 |
| U2/profile 路由切换带转场 | usability | PASS |  | Nielsen #1 系统状态可见 |
| R1/profile 点击同步产生 DOM 反馈 | resp | PASS | 3/3 | Google INP（good <200ms） |
| R2 交互动画 ≤500ms | resp | PASS | max=drawer 380ms | INP poor 阈值对齐 |

## 流程明细

| 流程 | 完成 | 点按(实测/基线) | 同步反馈 | JS 错误 |
|---|---|---|---|---|
| first-run | ✓ | 1/1 | 1/1 | 0 |
| explore-to-detail | ✓ | 3/3 | 3/3 | 0 |
| detail-tabs | ✓ | 3/3 | 3/3 | 0 |
| ask-alva | ✓ | 2/2 | 2/2 | 0 |
| profile | ✓ | 3/3 | 3/3 | 0 |