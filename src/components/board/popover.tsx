import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={cn("pointer-events-none fixed -translate-x-1/2 -translate-y-full transition-opacity duration-200 delay-100 opacity-0", isVisible && "opacity-100")}
      style={{
        top: anchor.top - 10 + "px",
        left: anchor.left + anchor.width / 2 + "px",
      }}>
      <div className={cn("rounded-3xl border-3 border-stone-700 bg-stone-950 p-3", className)}>
        {children}
      </div>
    </div>
  );
};
