"use client";
import { useEffect, useRef, useState } from "react";
export function ScoreRing({ score }: { score: number }) {
  const previous = useRef(score);
  const [display, setDisplay] = useState(score);
  useEffect(() => {
    const start = performance.now(),
      from = previous.current;
    previous.current = score;
    let frame: number;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const tick = (now: number) => {
      const elapsed = reduced ? 1 : Math.min((now - start) / 200, 1);
      setDisplay(Math.round(from + (score - from) * elapsed));
      if (elapsed < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);
  return (
    <div
      className="score-ring"
      role="progressbar"
      aria-label="Готовность задачи"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring-track" cx="60" cy="60" r="52" />
        <circle
          className="ring-value"
          cx="60"
          cy="60"
          r="52"
          pathLength="100"
          strokeDasharray={`${score} 100`}
        />
      </svg>
      <div>
        <strong>{display}</strong>
        <span>из 100 баллов</span>
      </div>
    </div>
  );
}
