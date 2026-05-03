import { useEffect, useRef, useState } from "react";
import { CardImage, CardType } from "../../card";
import type { RectPlain } from "./types";

const DURATION_MS = 450;
const CROP_DURATION_MS = 200;
const EASING = "ease-in";
const END_IMAGE_TRANSFORM = "translateY(25%) scale(1.55)";

/** What to render inside the flying card shell (loot backs, treasure fronts, etc.). */
export type CardGhostFace =
  | {
      kind: "front";
      slug: string;
      /** End-of-flight image zoom/crop; defaults true for loot → stack. Set false for treasure purchase flights. */
      cropEnd?: boolean;
    }
  | { kind: "back"; cardType: CardType };

export type CardGhostPayload = {
  fromRect: RectPlain;
  toRect: RectPlain;
  face: CardGhostFace;
  delayMs?: number;
};

export const CardGhost = ({
  ghost,
  onDone,
}: {
  ghost: CardGhostPayload;
  onDone: () => void;
}) => {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const [mounted, setMounted] = useState(false);
  const doneRef = useRef(false);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  };

  useEffect(() => {
    const start = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMounted(true));
      });
    }, ghost.delayMs ?? 0);
    return () => clearTimeout(start);
  }, [ghost.delayMs]);

  useEffect(() => {
    const t = setTimeout(
      finish,
      (ghost.delayMs ?? 0) + DURATION_MS + 150,
    );
    return () => clearTimeout(t);
  }, [ghost.delayMs]);

  const left = mounted ? ghost.toRect.left : ghost.fromRect.left;
  const top = mounted ? ghost.toRect.top : ghost.fromRect.top;
  const width = mounted ? ghost.toRect.width : ghost.fromRect.width;
  const height = mounted ? ghost.toRect.height : ghost.fromRect.height;

  const cardProp =
    ghost.face.kind === "back"
      ? ghost.face.cardType
      : { slug: ghost.face.slug };

  const cropEffect =
    ghost.face.kind === "front" && ghost.face.cropEnd !== false;

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
          finish();
        }
      }}>
      <CardImage
        card={cardProp}
        className="h-full w-full"
        style={
          cropEffect
            ? {
                transform: mounted
                  ? END_IMAGE_TRANSFORM
                  : "translateY(0) scale(1)",
                transformOrigin: "center center",
                transition: `transform ${CROP_DURATION_MS}ms ${EASING}`,
              }
            : {
                transform: "translateY(0) scale(1)",
                transformOrigin: "center center",
              }
        }
      />
    </div>
  );
};
