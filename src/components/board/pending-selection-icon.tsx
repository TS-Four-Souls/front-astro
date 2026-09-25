import type { pendingSelectionDetail } from "@/shared/api";
import { Card } from "./card";
import { usePopoverContext } from "./contexts/popover-context";
import { useRevealGesture } from "./use-reveal-gesture";
import { useLanguageContext } from "../contexts/language-context";

interface Props {
  pendingSelection: pendingSelectionDetail;
  player: { name: string; color: string };
}

export const PendingSelectionIcon = (props: Props) => {
  const { ts, t } = useLanguageContext();
  const { setPopover, closePopover } = usePopoverContext();
  const { pendingSelection, player } = props;
  const revealProps = useRevealGesture((target) => {
    setPopover({
      anchor: target.getBoundingClientRect(),
      anchorElement: target,
      content: (
        <div className="flex max-w-64 flex-col items-center gap-3">
          <PopoverIcon {...props} />
          <div className="px-2 text-center leading-tight text-taupe-400">
            <span className="font-bold" style={{ color: player.color }}>
              {player.name}
            </span>{" "}
            {t("gameStep.stack.stackElement.isBusyWith")}
            <br />
            <span className="font-bold text-white">
              {ts(pendingSelection.description)}
            </span>
          </div>
        </div>
      ),
    });
  }, closePopover);

  return (
    <div
      {...revealProps}
      className="flex shrink-0 items-center justify-center transition-transform hover:scale-110">
      <Icon pendingSelection={pendingSelection} player={player} />
    </div>
  );
};

const PopoverIcon = ({ pendingSelection }: Props) => {
  switch (pendingSelection.reason) {
    case "miniDraft":
      return (
        <img
          src="/pending-selections/mini-draft.png"
          className="size-24 shrink-0 rounded-[20%] bg-taupe-700"
          draggable={false}
        />
      );
    case "mulliganCharacters":
      return (
        <img
          src="/pending-selections/mulligan-characters.png"
          className="size-24 shrink-0 rounded-[20%] bg-taupe-700"
          draggable={false}
        />
      );
    case "coinGift":
      return (
        <img
          src="/pending-selections/coin-gift.png"
          className="size-24 shrink-0 rounded-[20%] bg-taupe-700"
          draggable={false}
        />
      );
    case "maxHandSize":
      return (
        <img
          src="/pending-selections/max-hand-size.png"
          className="size-24 shrink-0 rounded-[20%] bg-taupe-700"
          draggable={false}
        />
      );
    case "death":
      return (
        <img
          src="/pending-selections/death.png"
          alt="death"
          className="size-24 shrink-0 rounded-[20%] bg-taupe-700"
          draggable={false}
        />
      );
    default: {
      const { card, visualEffectBox } = pendingSelection.reason;
      return (
        <Card
          card={card}
          visualEffectBox={visualEffectBox}
          orientation={card.orientation}
          size={22}
        />
      );
    }
  }
};

const Icon = ({
  pendingSelection,
  player,
}: {
  player: { name: string; color: string };
  pendingSelection: pendingSelectionDetail;
}) => {
  const { reason } = pendingSelection;

  switch (reason) {
    case "miniDraft":
      return (
        <img
          src="/pending-selections/mini-draft.png"
          className="size-10 shrink-0 rounded-[20%] border-[0.15em] bg-taupe-700"
          style={{ borderColor: player.color }}
          draggable={false}
        />
      );
    case "mulliganCharacters":
      return (
        <img
          src="/pending-selections/mulligan-characters.png"
          className="size-10 shrink-0 rounded-[20%] border-[0.15em] bg-taupe-700"
          style={{ borderColor: player.color }}
          draggable={false}
        />
      );
    case "coinGift":
      return (
        <img
          src="/pending-selections/coin-gift.png"
          className="size-10 shrink-0 rounded-[20%] border-[0.15em] bg-taupe-700"
          style={{ borderColor: player.color }}
          draggable={false}
        />
      );
    case "death":
      return (
        <img
          src="/pending-selections/death.png"
          className="size-10 shrink-0 rounded-[20%] border-[0.15em] bg-taupe-700"
          style={{ borderColor: player.color }}
          draggable={false}
        />
      );
    case "maxHandSize":
      return (
        <img
          src="/pending-selections/max-hand-size.png"
          className="size-10 shrink-0 rounded-[20%] border-[0.15em] bg-taupe-700"
          style={{ borderColor: player.color }}
          draggable={false}
        />
      );
    default: {
      return (
        <Card
          containerClassName="size-10 border-[0.15em] bg-taupe-700"
          containerStyle={{ borderColor: player.color }}
          card={reason.card}
          orientation={reason.card.orientation}
          icon
        />
      );
    }
  }
};
