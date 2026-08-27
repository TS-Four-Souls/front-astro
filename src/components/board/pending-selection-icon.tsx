import type { pendingSelectionDetail } from "@/shared/api";
import { Card, CardImage, CardType } from "./card";
import { cn } from "@/utils/cn";
import { usePopoverContext } from "./contexts/popover-context";
import { useLanguageContext } from "../contexts/language-context";

interface Props {
  pendingSelection: pendingSelectionDetail;
  player: { name: string; color: string };
}

export const PendingSelectionIcon = (props: Props) => {
  const { ts, t } = useLanguageContext();
  const { setPopover, closePopover } = usePopoverContext();

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({
      anchor: rect,
      content: (
        <div className="flex flex-col items-center gap-3">
          <PopoverContent {...props} />
          <div className="flex max-w-64 flex-col place-content-center gap-2 px-2 text-center leading-tight">
            <span className="font-bold" style={{ color: player.color }}>
              {player.name}
            </span>
            <span className="text-taupe-400">
              {t("gameStep.stack.stackElement.isBusyWith")}
            </span>
            <span>{ts(pendingSelection.description)}</span>
          </div>
        </div>
      ),
    });
  };

  const { pendingSelection, player } = props;
  const { reason } = pendingSelection;

  switch (reason) {
    case "activation":
      return reason;
    case "miniDraft":
      return (
        <div
          className={cn(
            "h-11 max-w-11 shrink-0 overflow-hidden rounded-lg border-[0.15em] bg-taupe-700",
          )}
          onMouseEnter={onHover}
          onMouseLeave={closePopover}
          style={{ borderColor: player.color }}>
          <CardImage
            sizes="2.5em"
            card={CardType.TreasureCard}
            className="-translate-y-1 scale-200"
          />
        </div>
      );
    case "coinGift":
      return (
        <img
          src="/coin.png"
          onMouseEnter={onHover}
          onMouseLeave={closePopover}
          className={cn(
            "size-10 shrink-0 rounded-lg border-[0.15em] bg-taupe-700 p-0.5",
          )}
          style={{ borderColor: player.color }}
          draggable={false}
        />
      );
    case "death":
      return (
        <img
          src="/death.png"
          onMouseEnter={onHover}
          onMouseLeave={closePopover}
          className={cn(
            "size-10 shrink-0 rounded-lg border-[0.15em] bg-taupe-700 p-0.5",
          )}
          style={{ borderColor: player.color }}
          draggable={false}
        />
      );
    case "maxHandSize":
      return (
        <img
          src="/eot.png"
          onMouseEnter={onHover}
          onMouseLeave={closePopover}
          className={cn(
            "size-10 shrink-0 rounded-lg border-[0.15em] bg-taupe-700 p-0.5",
          )}
          style={{ borderColor: player.color }}
          draggable={false}
        />
      );
    default: {
      return (
        <div
          className={cn(
            "h-11 max-w-11 shrink-0 overflow-hidden rounded-lg border-[0.15em] bg-taupe-700",
          )}
          onMouseEnter={onHover}
          onMouseLeave={closePopover}
          style={{ borderColor: player.color }}>
          <CardImage
            sizes="2.5em"
            card={reason.card}
            className="translate-y-[5%] scale-155"
          />
        </div>
      );
    }
  }
};

const PopoverContent = ({ pendingSelection }: Props) => {
  switch (pendingSelection.reason) {
    case "activation":
      return pendingSelection.reason;
    case "miniDraft":
      return (
        <div className={cn("size-22 overflow-hidden rounded-lg")}>
          <CardImage
            sizes="6em"
            card={CardType.TreasureCard}
            className="-translate-y-1 scale-200"
          />
        </div>
      );
    case "coinGift":
      return (
        <img
          src="/coin.png"
          className={cn("size-22 shrink-0 rounded-lg")}
          draggable={false}
        />
      );
    case "maxHandSize":
      return (
        <img
          src="/eot.png"
          className={cn("size-22 shrink-0 rounded-lg")}
          draggable={false}
        />
      );
    case "death":
      return (
        <img
          src="/death.png"
          alt="death"
          className={cn("size-22 shrink-0 rounded-lg bg-taupe-700 p-2")}
          draggable={false}
        />
      );
    default: {
      const { card, visualEffectBox } = pendingSelection.reason;
      return <Card card={card} visualEffectBox={visualEffectBox} size={22} />;
    }
  }
};
