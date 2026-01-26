import type { TemporaryEffect } from "@/shared/api";
import { useState } from "react";
import { CardImage } from "./card";
import { cn } from "@/utils/cn";

interface TemporaryEffectCardProps {
  effect: TemporaryEffect;
  size?: number;
  className?: string;
}

const TemporaryEffectCard = ({ effect, size = 32, className }: TemporaryEffectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardSize = size / 16;

  return (
    <div
      className="relative transform-3d"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {/* Tiny card */}
      <div className={cn("cursor-pointer overflow-hidden rounded-[20%] transition-transform scale-100 hover:scale-110", className)} style={{ width: cardSize + "em", height: cardSize + "em" }}>
        <CardImage card={effect.card} className="translate-y-[5%] scale-155" />
      </div>

      {/* Expanded card on hover */}
      {isHovered && (
        <div className="pointer-events-none absolute top-0 left-0 z-50 -translate-x-1/2 -translate-y-1/1 translate-z-25">
          <div className="flex flex-col gap-2 rounded-lg bg-stone-900 p-3 shadow-xl">
            <div className="h-100 w-70 overflow-hidden rounded-lg">
              <CardImage card={effect.card} />
            </div>
            <div className="text-2xs text-stone-300">
              <p className="font-bold">{effect.card.name}</p>
              <p className="text-stone-400">{effect.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export { TemporaryEffectCard };
