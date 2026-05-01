import { useEffect, useState } from "react";
import { CardImage } from "../../card";
import type { RectPlain } from "./types";

const DURATION_MS = 450;
const CROP_DURATION_MS = 200;
const EASING = "ease-in";
const END_IMAGE_TRANSFORM = "translateY(25%) scale(1.55)";

export const LootCardGhost = ({
  ghost,
  onDone,
}: {
  ghost: {
    fromRect: RectPlain;
    toRect: RectPlain;
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

  const left = mounted ? ghost.toRect.left : ghost.fromRect.left;
  const top = mounted ? ghost.toRect.top : ghost.fromRect.top;
  const width = mounted ? ghost.toRect.width : ghost.fromRect.width;
  const height = mounted ? ghost.toRect.height : ghost.fromRect.height;

  return (
    <div
      style={{
        position: "fixed",
        left,
        top,
        width,
        height,
        opacity: 1,
        borderRadius: "0.375rem",
        border: "0.15em solid rgb(68 68 68 / 1)",
        backgroundColor: "rgb(28 25 23 / 0.5)",
        transition: `left ${DURATION_MS}ms ${EASING}, top ${DURATION_MS}ms ${EASING}, width ${DURATION_MS}ms ${EASING}, height ${DURATION_MS}ms ${EASING}`,
        willChange: "left, top, width, height",
        overflow: "hidden",
      }}
      onTransitionEnd={(e) => {
        if (
          e.propertyName === "left" ||
          e.propertyName === "top" ||
          e.propertyName === "width" ||
          e.propertyName === "height"
        ) {
          onDone();
        }
      }}>
      <CardImage
        card={{ slug: ghost.slug }}
        className="h-full w-full"
        style={{
          transform: mounted ? END_IMAGE_TRANSFORM : "translateY(0) scale(1)",
          transformOrigin: "center center",
          transition: `transform ${CROP_DURATION_MS}ms ${EASING}`,
        }}
      />
    </div>
  );
};
