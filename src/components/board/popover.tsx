import { cn } from "@/utils/cn";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface PopoverProps {
  children: React.ReactNode;
  anchor: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  className?: string;
}

export const Popover = ({ children, anchor, className }: PopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useLayoutEffect(() => {
    const element = popoverRef.current;
    if (!element) {
      return;
    }

    const VIEWPORT_PADDING = 8;
    const ANCHOR_GAP = 10;

    const popoverWidth = element.offsetWidth;
    const popoverHeight = element.offsetHeight;

    const centeredLeft = anchor.left + anchor.width / 2 - popoverWidth / 2;
    const clampedLeft = Math.max(
      VIEWPORT_PADDING,
      Math.min(
        centeredLeft,
        window.innerWidth - VIEWPORT_PADDING - popoverWidth,
      ),
    );

    const topPosition = anchor.top - ANCHOR_GAP - popoverHeight;
    const bottomPosition = anchor.top + anchor.height + ANCHOR_GAP;
    const canPlaceOnTop = topPosition >= VIEWPORT_PADDING;

    const unclampedTop = canPlaceOnTop ? topPosition : bottomPosition;
    const clampedTop = Math.max(
      VIEWPORT_PADDING,
      Math.min(
        unclampedTop,
        window.innerHeight - VIEWPORT_PADDING - popoverHeight,
      ),
    );

    setPosition({ top: clampedTop, left: clampedLeft });
  }, [anchor, children]);

  return (
    <div
      ref={popoverRef}
      className={cn(
        "pointer-events-none fixed z-50 w-max opacity-0 transition-opacity delay-100 duration-200",
        isVisible && "opacity-100",
      )}
      style={{
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
      }}>
      <div
        className={cn(
          "rounded-3xl border-3 border-stone-700 bg-stone-950 p-3",
          className,
        )}>
        {children}
      </div>
    </div>
  );
};
