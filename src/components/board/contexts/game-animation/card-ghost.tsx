import { useEffect, useRef, useState } from "react";
import { CardImage, CardType } from "../../card";
import type { RectPlain } from "./types";

const DEFAULT_FLIGHT_MS = 450;
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
  /** Layout flight duration in ms (default 450). */
  flightDurationMs?: number;
  /**
   * If set, after the flight finishes the inner card scales to 0 over this many ms (e.g. monster soul → counter).
   * Omit for flights that finish as soon as layout settles (loot → stack, etc.).
   */
  shrinkAfterFlightMs?: number;
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
  const [shrinking, setShrinking] = useState(false);
  const shrinkAfterFlightRef = useRef(false);
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

  const flightMs = ghost.flightDurationMs ?? DEFAULT_FLIGHT_MS;
  const shrinkMs = ghost.shrinkAfterFlightMs;
  const hasShrink = shrinkMs != null && shrinkMs > 0;

  useEffect(() => {
    const extra = hasShrink ? shrinkMs! : 0;
    const t = setTimeout(finish, (ghost.delayMs ?? 0) + flightMs + extra + 200);
    return () => clearTimeout(t);
  }, [ghost.delayMs, flightMs, shrinkMs, hasShrink]);

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

  const cardImage = (
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
  );

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
        transition: `left ${flightMs}ms ${EASING}, top ${flightMs}ms ${EASING}, width ${flightMs}ms ${EASING}, height ${flightMs}ms ${EASING}`,
        willChange: "left, top, width, height",
        overflow: "hidden",
      }}
      onTransitionEnd={(e) => {
        const layoutDone =
          e.propertyName === "left" ||
          e.propertyName === "top" ||
          e.propertyName === "width" ||
          e.propertyName === "height";
        if (!layoutDone) return;

        if (hasShrink) {
          if (shrinking || shrinkAfterFlightRef.current) return;
          shrinkAfterFlightRef.current = true;
          setShrinking(true);
          return;
        }
        finish();
      }}>
      {hasShrink ? (
        <div
          className="h-full w-full"
          style={{
            transform: shrinking ? "scale(0)" : "scale(1)",
            transformOrigin: "center center",
            transition: `transform ${shrinkMs}ms ${EASING}`,
          }}
          onTransitionEnd={(e) => {
            if (e.propertyName === "transform" && shrinking) {
              finish();
            }
          }}>
          {cardImage}
        </div>
      ) : (
        cardImage
      )}
    </div>
  );
};
