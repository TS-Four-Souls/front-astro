import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import type { Point2D, RectPlain } from "./types";

const COIN_HALF_PX = 12; /* 24px coin, centered on path point */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const quadraticBezier = (
  start: number,
  control: number,
  end: number,
  t: number,
) => lerp(lerp(start, control, t), lerp(control, end, t), t);

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type CoinFlight = {
  id: string;
  start: Point2D;
  control: Point2D;
  end: Point2D;
  delay: number;
  duration: number;
  seed: number;
};

const createCoinFlight = (
  id: string,
  delayMs: number,
  sender: Point2D,
  recipient: Point2D,
): CoinFlight => {
  const angle = Math.random() * Math.PI * 2;
  const launchDistance = 20 + Math.random() * 22;
  const curveDistance = 70 + Math.random() * 90;
  const controlNoise = (Math.random() - 0.5) * 55;
  const controlX = sender.x + Math.cos(angle) * launchDistance;
  const controlY = sender.y + Math.sin(angle) * launchDistance;
  const towardX = recipient.x - sender.x;
  const towardY = recipient.y - sender.y;
  const distance = Math.max(1, Math.hypot(towardX, towardY));
  const normalizedX = towardX / distance;
  const normalizedY = towardY / distance;
  const perpendicularX = -normalizedY;
  const perpendicularY = normalizedX;

  return {
    id,
    start: { x: sender.x, y: sender.y },
    control: {
      x: controlX + normalizedX * curveDistance + perpendicularX * controlNoise,
      y: controlY + normalizedY * curveDistance + perpendicularY * controlNoise,
    },
    end: recipient,
    delay: delayMs,
    duration: 720 + Math.random() * 160,
    seed: Math.random(),
  };
};

const centerOfRect = (r: RectPlain) => ({
  x: r.left + r.width / 2,
  y: r.top + r.height / 2,
});

type ParticleState = { x: number; y: number; opacity: number; scale: number };

export const CoinProjectile = ({
  fromRect,
  toPoint,
  delayMs = 0,
  flightInstanceId,
  onDone,
}: {
  fromRect: RectPlain;
  toPoint: Point2D;
  delayMs?: number;
  /** Used to build a stable, unique `CoinFlight.id` (e.g. from provider burst id) */
  flightInstanceId: number;
  onDone: () => void;
}) => {
  const [flight] = useState(() =>
    createCoinFlight(
      `coin-${flightInstanceId}`,
      delayMs,
      centerOfRect(fromRect),
      { ...toPoint },
    ),
  );
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const [state, setState] = useState<ParticleState>({
    x: flight.start.x,
    y: flight.start.y,
    opacity: 0,
    scale: 0.7,
  });
  const doneRef = useRef(false);

  useEffect(() => {
    const flightRef = flight;
    let raf = 0;
    let cancelled = false;
    let startTime: number | null = null;

    const step = (time: number) => {
      if (cancelled) return;

      if (startTime === null) {
        startTime = time + flightRef.delay;
      }

      const elapsed = time - startTime;
      if (elapsed < 0) {
        raf = requestAnimationFrame(step);
        return;
      }

      const t = Math.min(elapsed / flightRef.duration, 1);
      const eased = easeOutCubic(t);
      const x = quadraticBezier(
        flightRef.start.x,
        flightRef.control.x,
        flightRef.end.x,
        eased,
      );
      const y = quadraticBezier(
        flightRef.start.y,
        flightRef.control.y,
        flightRef.end.y,
        eased,
      );
      const opacity = t < 0.08 ? t / 0.08 : t > 0.9 ? (1 - t) / 0.1 : 1;
      const scale = 0.72 + Math.sin(Math.PI * t) * 0.2;

      setState({ x, y, opacity, scale });

      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        if (!doneRef.current) {
          doneRef.current = true;
          onDoneRef.current();
        }
      }
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [flight]);

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{
        left: state.x - COIN_HALF_PX,
        top: state.y - COIN_HALF_PX,
        opacity: state.opacity,
        transform: `translate3d(0, 0, 0) scale(${state.scale})`,
      }}>
      <img
        src="/coin.png"
        className={cn(
          "size-6 max-h-none max-w-none select-none",
          "drop-shadow-[0_0_10px_rgba(250,204,21,0.55)]",
          flight.seed > 0.5 && "rotate-12",
        )}
        alt=""
        width={24}
        height={24}
        draggable={false}
      />
    </div>
  );
};
