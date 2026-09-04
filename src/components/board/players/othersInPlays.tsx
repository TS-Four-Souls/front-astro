import type { InPlayCard, Player } from "@/shared/api";
import { Pile } from "../pile";
import { useGameAnimation } from "../contexts/game-animation";
import { CardHoverPreview } from "../card-hover-preview";
import { useLanguageContext } from "@/components/contexts/language-context";
import { useToastContext } from "../contexts/toast-context";
import { socket } from "@/utils/socket";

interface OthersInPlaysProps {
  cards: InPlayCard[];
  player: Player;
}

export const OthersInPlays = ({ cards, player }: OthersInPlaysProps) => {
  const { registerInPlayCardEl } = useGameAnimation();
  const { t, translateError } = useLanguageContext();
  const { toast, block } = useToastContext();

  const onTargetableCardClick = (card: InPlayCard) => {
    console.log("Attacking monster with card:", card);
    socket.emit("attackMonster", { card }, (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("gameStep.attack.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  return cards.map((card, index) => {
    if (card === undefined) {
      return <div key={`empty-${index}`} className="h-full w-full" />;
    }
    return (
      <div
        key={card.globalId}
        ref={(el) => registerInPlayCardEl(card.globalId, el)}>
        <Pile
          globalId={card.globalId}
          cards={[
            {
              slug: card.slug,
              charged: card.charged,
              eternal: card.eternal,
              engagedInCombat: card.stats?.isEngagedInCombat === true,
              engagedInPurchase:
                card === player.character && player.isEngagedInPurchase,
              effects: card.stats?.temporaryEffect,
              counter: card.counter,
              stats: card.stats,
            },
          ]}
          disabled={
            card.stats ? card.stats.capabilities.targetable !== true : undefined
          }
          onHoverPopover={() => (
            <CardHoverPreview
              card={card}
              stats={card.stats}
              effects={card.stats?.temporaryEffect}
              counter={card.counter}
              isEternal={card.eternal}
              tooltip={
                card.stats
                  ? [
                      {
                        capable: card.stats.capabilities.targetable,
                        title: t("gameStep.attack.blockedTooltip.title"),
                      },
                    ]
                  : undefined
              }
            />
          )}
          onClickTopCard={
            card.stats
              ? () =>
                  block(
                    t("gameStep.attack.blockedTooltip.title"),
                    card.stats!.capabilities.targetable,
                    () => onTargetableCardClick(card),
                  )
              : undefined
          }
        />
      </div>
    );
  });
};
