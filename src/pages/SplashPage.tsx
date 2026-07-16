import { useEffect } from "react";
import { asset } from "../assets";
import { Page } from "../components";

const SPLASH_DURATION_MS = 2400;

export function SplashPage({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(onDone, SPLASH_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [onDone]);

  return (
    <Page className="splash-page">
      <button aria-label="Enter Alva" className="splash-tap" onClick={onDone} type="button">
        <img alt="Alva — Your AI Investing Agent" className="splash-art" src={asset("assets/figma/splash-bg.jpeg")} />
      </button>
    </Page>
  );
}
