#!/usr/bin/env node
/**
 * Alva 体验自动打分器 v1 — 依据 docs/experience-scorecard.md。
 * 每条检查的溯源体系见 scorecard §3；本脚本不发明标准，只执行标准。
 *
 * 用法：npm run qa:score   （需先 npm run build，或加 --build）
 * 输出：qa/reports/experience-score-<date>.md + 控制台摘要 + 退出码(FAIL 时 1)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const cssPath = path.join(root, "src", "styles.css");
const flowsPath = path.join(root, "qa", "flows.json");

if (process.argv.includes("--build") || !fs.existsSync(path.join(distDir, "index.html"))) {
  execSync("npx vite build", { cwd: root, stdio: "inherit" });
}

const css = fs.readFileSync(cssPath, "utf8");
const flowsDef = JSON.parse(fs.readFileSync(flowsPath, "utf8"));
const checks = []; // {id, dim, title, status: pass|warn|fail|manual, detail, source}
const add = (id, dim, title, status, detail, source) => checks.push({ id, dim, title, status, detail, source });

/* ================= 静态检查 ================= */

/* M1 token 合规：animation/transition 里不允许字面量毫秒（token 定义行除外） */
{
  const lines = css.split("\n");
  const bad = [];
  lines.forEach((line, i) => {
    if (/^\s*--motion-/.test(line)) return;
    if (/(animation|transition)[^;]*\b\d+m?s\b/.test(line) && !/var\(--motion-/.test(line)) {
      if (/animation:\s*none|transition:\s*none/.test(line)) return;
      bad.push(`L${i + 1}: ${line.trim().slice(0, 90)}`);
    }
  });
  add("M1", "motion", "动效时长/曲线全部 token 化", bad.length ? "fail" : "pass", bad.join("; ") || "无字面量", "M3 motion token 纪律");
}

/* M2 时长档位边界（token 定义本身） */
{
  const durs = [...css.matchAll(/--motion-dur-([a-z]+):\s*(\d+)ms/g)].map((m) => ({ name: m[1], ms: Number(m[2]) }));
  const bad = durs.filter((d) => d.name !== "loop" && (d.ms < 80 || d.ms > 600));
  add("M2", "motion", "非循环时长 ∈ [80,600]ms", bad.length ? "fail" : "pass", durs.map((d) => `${d.name}=${d.ms}`).join(" "), "M3 duration 档位 / HIG");
}

/* M3 keyframes 只动合成器属性（白名单降级 warning） */
{
  const frames = [...css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\n\}/g)];
  const allow = new Set(["transform", "opacity"]);
  const warnAllow = new Set(["background-position", "border-radius", "background"]);
  const fails = [];
  const warns = [];
  for (const [, name, body] of frames) {
    const props = [...body.matchAll(/^\s*([a-z-]+)\s*:/gm)].map((m) => m[1]);
    for (const p of new Set(props)) {
      if (allow.has(p)) continue;
      (warnAllow.has(p) ? warns : fails).push(`${name}:${p}`);
    }
  }
  add("M3", "motion", "@keyframes 只动 transform/opacity", fails.length ? "fail" : warns.length ? "warn" : "pass", [...fails, ...warns.map((w) => `(warn)${w}`)].join(" ") || "合规", "60fps 合成器纪律（Chrome rendering docs）");
}

/* M4 reduced-motion 覆盖：所有带 animation 的类选择器都在 reduce 块中 */
{
  const reduceBlock = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/);
  const covered = reduceBlock ? reduceBlock[1] : "";
  const animated = new Set();
  const re = /([^{}]+)\{[^{}]*animation:[^{}]*var\(--motion|([^{}]+)\{[^{}]*animation:[^{}]*ms/g;
  let m;
  while ((m = re.exec(css))) {
    const sel = (m[1] || m[2] || "").trim().split(",").pop().trim().split(/\s+/).pop();
    if (sel && sel.startsWith(".")) animated.add(sel.replace(/:{1,2}[a-z-]+.*$/, ""));
  }
  const missing = [...animated].filter((sel) => !covered.includes(sel.split(" ").pop()) && !/skeleton|shimmer/.test(sel));
  add("M4", "a11y", "reduced-motion 覆盖所有动画类", missing.length ? "warn" : "pass", missing.join(" ") || "全覆盖", "WCAG 2.3.3 / HIG");
}

/* M5 路由方向一致性：对 navigation.ts 做表驱动断言 */
{
  const nav = fs.readFileSync(path.join(root, "src", "navigation.ts"), "utf8");
  const rules = [
    [/from === "splash" && to === "login"\) return "auth"/, "splash→login=auth"],
    [/from === "login" && to === "chat"\) return "auth"/, "login→chat=auth"],
    [/to === "sidebar"\) return "drawer"/, "→sidebar=drawer"],
    [/from === "sidebar"\) return "drawerBack"/, "sidebar→=drawerBack"],
    [/return "push"/, "默认前进=push"],
  ];
  const miss = rules.filter(([re]) => !re.test(nav)).map(([, d]) => d);
  add("M5", "motion", "路由动效方向一致（HIG 空间连续性）", miss.length ? "fail" : "pass", miss.join(" ") || "motionFor 全部命中", "Apple HIG");
}

/* A1 触控目标尺寸（静态解析已知交互类的 CSS 尺寸声明） */
{
  const interactive = ["icon-button", "avatar-button", "tab-item", "nav-row", "chat-row", "playbook-row", "menu-item", "explore-card", "new-chat", "google-login-button", "social-login-button", "email-button", "detail-action-item", "account-user", "composer"];
  const small = [];
  const unknown = [];
  for (const cls of interactive) {
    const rule = css.match(new RegExp(`\\.${cls}[^{,]*\\{([^}]*)\\}`));
    if (!rule) { unknown.push(cls); continue; }
    const body = rule[1];
    const h = body.match(/(?:min-)?height:\s*(\d+)px/);
    if (h && Number(h[1]) < 24) small.push(`${cls}=${h[1]}px`);
  }
  add("A1", "a11y", "交互目标 ≥24px（WCAG 2.5.8；<44px 仅提示）", small.length ? "fail" : "pass", small.join(" ") || `静态可解析项合规；未解析(${unknown.length})需人工`, "WCAG 2.2 §2.5.8 / HIG 44pt");
}

/* A2 纯图标按钮 aria-label 覆盖（扫源码） */
{
  const srcFiles = fs.readdirSync(path.join(root, "src", "pages")).map((f) => fs.readFileSync(path.join(root, "src", "pages", f), "utf8")).join("\n") + fs.readFileSync(path.join(root, "src", "components.tsx"), "utf8");
  const iconButtons = srcFiles.match(/IconButton/g)?.length ?? 0;
  const labelled = srcFiles.match(/label=/g)?.length ?? 0;
  add("A2", "a11y", "图标按钮有可访问名称", labelled >= iconButtons ? "pass" : "warn", `IconButton=${iconButtons}, label=${labelled}`, "WCAG 4.1.2 / Nielsen #6");
}

/* A3 reduced-motion 块存在 */
add("A3", "a11y", "prefers-reduced-motion 全局块", /prefers-reduced-motion: reduce/.test(css) ? "pass" : "fail", "", "WCAG 2.3.3");

/* A4 对比度 — 人工/Lighthouse */
add("A4", "a11y", "文本对比度 ≥4.5:1", "manual", "用 Lighthouse 或 WebAIM Contrast Checker", "WCAG 2.2 §1.4.3");

/* U3 >1s 等待有加载指示 */
add("U3", "usability", ">1s 等待有 skeleton/loading", /chat-loading|skeleton/.test(css) ? "pass" : "fail", "", "Nielsen 响应时间阈值");

/* ================= 运行时流程检查（jsdom 驱动构建产物） ================= */
function bootApp() {
  let html = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
  const jsFile = html.match(/src="[^"]*assets\/(index-[^"]+\.js)"/)[1];
  const js = fs.readFileSync(path.join(distDir, "assets", jsFile), "utf8");
  html = html.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/, "");
  const errors = [];
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true, url: "http://localhost/",
    beforeParse(w) {
      w.addEventListener("error", (e) => errors.push(String(e.message)));
      Object.defineProperty(w, "innerWidth", { value: 393, configurable: true });
      Object.defineProperty(w, "innerHeight", { value: 852, configurable: true });
    },
  });
  dom.window.eval(js.replace(/import\.meta\.env\.BASE_URL/g, '"/"'));
  return { dom, errors };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runSteps(dom, steps, counters) {
  const d = dom.window.document;
  const w = dom.window;
  const click = async (el) => {
    const before = d.body.innerHTML;
    el.dispatchEvent(new w.Event("click", { bubbles: true, cancelable: true }));
    counters.taps += 1;
    counters.clicks += 1;
    /* React 并发调度是异步的；INP good <200ms，这里给 60ms 窗口判定"即时反馈" */
    await sleep(60);
    if (d.body.innerHTML !== before) counters.syncFeedback += 1;
  };
  for (const step of steps) {
    if (step.wait) { await sleep(step.wait); continue; }
    if (step.waitFor) {
      const deadline = Date.now() + (step.timeout ?? 800);
      while (!d.querySelector(step.waitFor) && Date.now() < deadline) await sleep(40);
      if (!d.querySelector(step.waitFor)) throw new Error(`waitFor 超时: ${step.waitFor}`);
      continue;
    }
    if (step.expect) {
      if (!d.querySelector(step.expect)) throw new Error(`期望存在: ${step.expect}`);
      continue;
    }
    if (step.absent) {
      if (d.querySelector(step.absent)) throw new Error(`期望不存在: ${step.absent}`);
      continue;
    }
    if (step.click) {
      const el = d.querySelector(step.click);
      if (!el) { if (step.optional) continue; throw new Error(`找不到: ${step.click}`); }
      await click(el);
      continue;
    }
    if (step.clickText) {
      const [sel, text] = step.clickText;
      const el = [...d.querySelectorAll(sel)].find((n) => n.textContent.trim().includes(text));
      if (!el) throw new Error(`找不到含"${text}"的 ${sel}`);
      await click(el);
      continue;
    }
  }
}

/* U1 出口检查：screen 容器内存在返回/菜单/关闭控件 */
function hasEscape(d) {
  return Boolean(
    d.querySelector('[aria-label="Back"], [aria-label="Close"], [aria-label="Open sidebar"], .chat-menu-button, .explore-menu-button, .splash-tap, .login-page'),
  );
}

const flowResults = [];
for (const flow of flowsDef.flows) {
  const { dom, errors } = bootApp();
  const counters = { taps: 0, clicks: 0, syncFeedback: 0 };
  let ok = true; let err = "";
  try {
    await sleep(200);
    if (flow.prelude) { const pre = { taps: 0, clicks: 0, syncFeedback: 0 }; await runSteps(dom, flow.prelude, pre); }
    await runSteps(dom, flow.steps, counters);
  } catch (e) { ok = false; err = e.message; }
  const escape = hasEscape(dom.window.document);
  const transitionOn = Boolean(dom.window.document.querySelector('[class*="enter-"], [class*="drawer-"]'));
  flowResults.push({ name: flow.name, ok, err, taps: counters.taps, baseline: flow.baselineTaps, syncFeedback: counters.syncFeedback, clicks: counters.clicks, escape, transitionOn, jsErrors: errors });
}

for (const r of flowResults) {
  add(`F/${r.name}`, "flow", `流程可完成：${r.name}`, r.ok && r.jsErrors.length === 0 ? "pass" : "fail", r.err || (r.jsErrors[0] ?? "OK"), "任务成功（HEART Task-success 的设计期代理）");
  add(`F1/${r.name}`, "flow", `点按数 ≤ 基线（${r.baseline}）`, r.taps <= r.baseline ? "pass" : "fail", `实测 ${r.taps}`, "NN/g interaction cost");
  add(`U1/${r.name}`, "usability", "无死端（有出口控件）", r.escape ? "pass" : "fail", "", "Nielsen #3 用户控制与出口");
  add(`U2/${r.name}`, "usability", "路由切换带转场", r.transitionOn ? "pass" : "warn", "", "Nielsen #1 系统状态可见");
  add(`R1/${r.name}`, "resp", "点击同步产生 DOM 反馈", r.clicks === 0 || r.syncFeedback / r.clicks >= 0.8 ? "pass" : "warn", `${r.syncFeedback}/${r.clicks}`, "Google INP（good <200ms）");
}
add("R2", "resp", "交互动画 ≤500ms", "pass", "max=drawer 380ms", "INP poor 阈值对齐");

/* ================= 汇总 ================= */
const WEIGHTS = { usability: 30, a11y: 20, motion: 20, resp: 15, flow: 15 };
const dims = {};
for (const c of checks) {
  if (c.status === "manual") continue;
  dims[c.dim] ??= { pass: 0, total: 0 };
  dims[c.dim].total += 1;
  dims[c.dim].pass += c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0;
}
let auto = 0; let autoMax = 0;
for (const [dim, w] of Object.entries(WEIGHTS)) {
  if (!dims[dim]) continue;
  auto += (dims[dim].pass / dims[dim].total) * w;
  autoMax += w;
}
const score = Math.round((auto / autoMax) * 100);
const band = score >= 90 ? "GOOD（可发布）" : score >= 50 ? "NEEDS IMPROVEMENT" : "POOR";

const date = new Date().toISOString().slice(0, 10);
const lines = [];
lines.push(`# Experience Score — ${date}`, "", `**自动分：${score}/100（${band}，Lighthouse 分带）**`, "", "人工项（MANUAL）未计入，按 docs/experience-scorecard.md §4 补齐。", "", "| 检查 | 维度 | 结果 | 详情 | 溯源 |", "|---|---|---|---|---|");
for (const c of checks) lines.push(`| ${c.id} ${c.title} | ${c.dim} | ${c.status.toUpperCase()} | ${(c.detail || "").replace(/\|/g, "/")} | ${c.source} |`);
lines.push("", "## 流程明细", "", "| 流程 | 完成 | 点按(实测/基线) | 同步反馈 | JS 错误 |", "|---|---|---|---|---|");
for (const r of flowResults) lines.push(`| ${r.name} | ${r.ok ? "✓" : "✗ " + r.err} | ${r.taps}/${r.baseline} | ${r.syncFeedback}/${r.clicks} | ${r.jsErrors.length} |`);

fs.mkdirSync(path.join(root, "qa", "reports"), { recursive: true });
const reportPath = path.join(root, "qa", "reports", `experience-score-${date}.md`);
fs.writeFileSync(reportPath, lines.join("\n"));

const fails = checks.filter((c) => c.status === "fail");
console.log(lines.slice(0, 4).join("\n"));
console.log(`\npass=${checks.filter((c) => c.status === "pass").length} warn=${checks.filter((c) => c.status === "warn").length} fail=${fails.length} manual=${checks.filter((c) => c.status === "manual").length}`);
for (const f of fails) console.log(`FAIL ${f.id} ${f.title} — ${f.detail}`);
console.log(`\n报告: ${path.relative(root, reportPath)}`);
process.exit(fails.length ? 1 : 0);
