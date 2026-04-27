import { useEffect, useState } from "react";
import { CardImage } from "../../card";
import type { Point2D, RectPlain } from "./types";

const DURATION_MS = 450;
const END_SCALE = 0.4;
const EASING = "ease-in";

export const LootCardGhost = ({
  ghost,
  onDone,
}: {
  ghost: {
    fromRect: RectPlain;
    toPoint: Point2D;
    slug: string;
  };
  onDone: () => void;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const t = setTimeout(onDone, DURATION_MS + 100);
    return () => clearTimeout(t);
  }, [onDone]);

  const dx = ghost.toPoint.x - (ghost.fromRect.left + ghost.fromRect.width / 2);
  const dy = ghost.toPoint.y - (ghost.fromRect.top + ghost.fromRect.height / 2);

  return (
    <div
      style={{
        position: "fixed",
        left: ghost.fromRect.left,
        top: ghost.fromRect.top,
        width: ghost.fromRect.width,
        height: ghost.fromRect.height,
        transform: mounted
          ? `translate(${dx}px, ${dy}px) scale(${END_SCALE})`
          : "translate(0, 0) scale(1)",
        opacity: mounted ? 0 : 1,
        transition: `transform ${DURATION_MS}ms ${EASING}, opacity ${DURATION_MS}ms ${EASING}`,
        willChange: "transform, opacity",
      }}
      onTransitionEnd={(e) => {
        if (e.propertyName === "transform") onDone();
      }}>
      <CardImage card={{ slug: ghost.slug }} className="h-full w-full" />
    </div>
  );
};
