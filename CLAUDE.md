# m.baby — 工作约定（每次会话先读）

1. **动效**：一律使用 Alva Motion System token（`docs/motion-spec.md`）。
   新增动画不允许字面量时长/曲线；新 `@keyframes` 只动 transform/opacity，
   并在 `prefers-reduced-motion` 块登记。新 screen 的转场只在
   `src/navigation.ts # motionFor` 归类，不自带转场。
2. **新增页面/流程**：先在 `qa/flows.json` 登记流程与点按基线，再开发
   （`docs/experience-scorecard.md` §5）。
3. **提交门槛**：`npm run build` 通过 + `npm run qa:score` 无 FAIL 且
   自动分 ≥90。评分维度与打分方法只允许引用 scorecard §1 列出的成熟体系
   （Nielsen / WCAG 2.2 / HIG / M3 / INP / NN/g / HEART / Lighthouse 分带），
   不自创标准。
4. **还原度**：一切视觉细节以 Figma 设计稿为准（Mobile 文件
   `A4jIwN4EMWr0fJVVGmCIsr`），素材用 Figma 导出原件，不手绘近似物。
5. **PC 展示**：桌面端（≥521px）自动套 iPhone mockup（App.tsx 的
   device-frame），状态栏/Home 指示条用设计稿组件 SVG，不要另画。
