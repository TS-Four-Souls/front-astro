import type { temporaryEffect } from "@/shared/api";
import { useState } from "react";
import { CardImage } from "./card";

const TemporaryEffectCard = ({ effect }: { effect: temporaryEffect; }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative transform-3d translate-z-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tiny card */}
      <div className="size-8 cursor-pointer overflow-hidden rounded-md transition-transform hover:scale-110">
        <CardImage card={effect.card} className="translate-y-[5%] scale-155" />
      </div>

      {/* Expanded card on hover */}
      {isHovered && (
        <div className="pointer-events-none absolute left-0 top-0 z-50 -translate-x-1/2 -translate-y-1/1 translate-z-20">
          <div className="flex flex-col gap-2 rounded-lg bg-stone-900 p-3 shadow-xl">
            <div className="h-100 w-70 overflow-hidden rounded-lg">
              <CardImage card={effect.card} />
            </div>
            <div className="max-w-28 text-2xs text-stone-300">
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
