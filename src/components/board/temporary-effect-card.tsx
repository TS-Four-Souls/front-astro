import type { TemporaryEffect } from "@/shared/api";
import { CardImage } from "./card";
import { cn } from "@/utils/cn";
import { usePopoverContext } from "./contexts/popover-context";
import { ts } from "../../utils/translate";

interface TemporaryEffectCardProps {
  effect: TemporaryEffect;
  size?: number;
  className?: string;
}

export const TemporaryEffectCard = ({
  effect,
  size = 32,
  className,
}: TemporaryEffectCardProps) => {
  const { setPopover, closePopover } = usePopoverContext();

  const cardSize = size / 16;

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.target as HTMLElement;
    setPopover({
      anchor: element.getBoundingClientRect(),
      content: (
        <div className="flex flex-col place-items-center gap-2">
          <CardImage card={effect.card} className="w-64" />
          <div className="flex w-64 flex-col gap-4 text-center text-taupe-300">
            <p className="text-lg font-bold">{ts(effect.card.nameKey)}</p>
            <p className="leading-tight text-taupe-400">{effect.description}</p>
          </div>
        </div>
      ),
    });
  };

  return (
    <div
      className={cn(
        "scale-100 overflow-hidden rounded-[20%] transition-transform hover:scale-110",
        className,
      )}
      style={{ width: cardSize + "em", height: cardSize + "em" }}
      onMouseEnter={onHover}
      onMouseLeave={closePopover}>
      <CardImage card={effect.card} className="translate-y-[5%] scale-155" />
    </div>
  );
};
