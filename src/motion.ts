/**
 * Alva Motion System v1 — JS 侧唯一真源（与 styles.css :root token 同步）。
 * 规范与用法：docs/motion-spec.md
 */

export const MOTION = {
  dur: {
    feedback: 80,
    micro: 140,
    content: 180,
    back: 240,
    push: 260,
    sheet: 280,
    hero: 320,
    drawer: 380,
    loop: 900,
  },
  ease: {
    enter: "cubic-bezier(0.22, 1, 0.36, 1)",
    soft: "cubic-bezier(0.18, 0.86, 0.18, 1)",
    exit: "cubic-bezier(0.5, 0, 0.78, 0.24)",
    hero: "cubic-bezier(0.2, 0.9, 0.2, 1)",
    standard: "cubic-bezier(0.2, 0, 0, 1)",
  },
} as const;

/** 抽屉换层时机：纵深层动画（hero 档）结束后切换真实 screen */
export const DRAWER_TRANSITION_MS = MOTION.dur.hero;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 金融数字变更提示（motion-spec §1.6 / §3）：
 * 只在用户主动触发的刷新中使用；≤200ms（INP good 阈值内），数据即时到位，
 * 动效只是从旧值到新值的短促补间。reduced-motion 下直接落终值。
 */
export function animateNumber(el: HTMLElement, from: number, to: number, format: (v: number) => string, duration = MOTION.dur.content) {
  if (prefersReducedMotion() || from === to) {
    el.textContent = format(to);
    return;
  }
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
