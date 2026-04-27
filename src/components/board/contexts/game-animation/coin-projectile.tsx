import { useEffect, useRef, useState } from "react";
import type { Point2D, RectPlain } from "./types";

const DURATION_MS = 500;
const COIN_PX = 24;
const EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";

const center = (r: RectPlain) => ({
  x: r.left + r.width / 2,
  y: r.top + r.height / 2,
});

export const CoinProjectile = ({
  fromRect,
  toPoint,
  delayMs = 0,
  onDone,
}: {
  fromRect: RectPlain;
  toPoint: Point2D;
  delayMs?: number;
  onDone: () => void;
}) => {
  const [flying, setFlying] = useState(false);
  const doneRef = useRef(false);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    const start = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setFlying(true));
      });
    }, delayMs);
    return () => clearTimeout(start);
  }, [delayMs]);

  useEffect(() => {
    if (!flying) return;
    const t = setTimeout(finish, DURATION_MS + 100);
    return () => clearTimeout(t);
  }, [flying]);

  const fromC = center(fromRect);
  const half = COIN_PX / 2;
  const startLeft = fromC.x - half;
  const startTop = fromC.y - half;
  const dx = toPoint.x - fromC.x;
  const dy = toPoint.y - fromC.y;

  return (
    <div
      className="pointer-events-none"
      style={{
        position: "fixed",
        left: startLeft,
        top: startTop,
        width: COIN_PX,
        height: COIN_PX,
        transform: flying
          ? `translate(${dx}px, ${dy}px) scale(0.85)`
          : "translate(0, 0) scale(1)",
        opacity: flying ? 0.75 : 1,
        transition: flying
          ? `transform ${DURATION_MS}ms ${EASING}, opacity ${DURATION_MS}ms ${EASING}`
          : "none",
        willChange: "transform, opacity",
      }}
      onTransitionEnd={(e) => {
        if (e.propertyName === "transform" && flying) finish();
      }}>
      <img
        src="/coin.png"
        className="size-6 max-h-none max-w-none rounded-full shadow-md/50 select-none"
        alt=""
        width={COIN_PX}
        height={COIN_PX}
        draggable={false}
      />
    </div>
  );
};
