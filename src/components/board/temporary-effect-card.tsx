import type { TemporaryEffect } from "@/shared/api";
import { Card, CardImage } from "./card";
import { cn } from "@/utils/cn";
import { usePopoverContext } from "./contexts/popover-context";
import { useLanguageContext } from "../contexts/language-context";

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
  const { ts, t } = useLanguageContext();

  const cardSize = size / 16;

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.target as HTMLElement;
    setPopover({
      anchor: element.getBoundingClientRect(),
      content: (
        <div className="flex flex-col place-items-center gap-2">
          <Card
            card={effect.card}
            orientation={effect.card.orientation}
            visualEffectBox={effect.visualEffectBox}
            size={22}
          />
          <div className="flex w-64 flex-col gap-4 text-center text-taupe-300">
            <p className="text-lg font-bold">{ts(effect.card.nameKey)}</p>
            <p className="leading-tight text-taupe-400">
              {t("common.temporaryEffect")}
            </p>
          </div>
        </div>
      ),
    });
  };

  return (
    <Card
      containerClassName={cn(className, "transition-transform hover:scale-110")}
      containerStyle={{ width: cardSize + "em", height: cardSize + "em" }}
      onMouseEnter={onHover}
      onMouseLeave={closePopover}
      card={effect.card}
      orientation={effect.card.orientation}
      icon
    />
  );
};
