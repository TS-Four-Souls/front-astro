import type { Player } from "@/shared/api";
import { CardHoverPreview } from "./card-hover-preview";
import { Pile } from "./pile";
import { usePileDetails } from "./use-pile-details";
import { CardType } from "./card";
import { cn } from "@/utils/cn";
import { useGameAnimation } from "./contexts/game-animation";
import { useLanguageContext } from "../contexts/language-context";
import { useGameContext } from "./contexts/game-context";

interface HandPileProps {
  player: Player;
}

export const HandPile = ({ player }: HandPileProps) => {
  const { displayPileDetails } = usePileDetails();
  const { t } = useLanguageContext();
  const { registerOpponentHandPile } = useGameAnimation();
  const { isSpectator } = useGameContext();
  const revealedHand =
    player.hand !== undefined && !isSpectator ? player.hand : undefined;
  const topCard = revealedHand?.[revealedHand.length - 1];
  
  return (
    <div ref={(el) => registerOpponentHandPile(player.name, el)}>
      <Pile
        cards={
          revealedHand
            ? revealedHand.map((c) => ({
                slug: c.slug,
                globalId: c.globalId,
              }))
            : Array.from({ length: player.handSize }).map(
                () => CardType.LootCard,
              )
        }
        onHoverPopover={() => (
          <CardHoverPreview
            card={topCard}
            orientation={topCard?.orientation}
            tooltip={{
              enabled: true,
              content: t("gameStep.hoverPlayerHand", {
                player: player.name,
                value: String(player.handSize),
              }),
            }}
          />
        )}
        onClickTopCard={
          revealedHand ? () => displayPileDetails(revealedHand) : undefined
        }
        onPileDetailsClick={
          revealedHand ? () => displayPileDetails(revealedHand) : undefined
        }
        size={120}>
        <p
          className={cn(
            "pointer-events-none absolute bottom-[0.1em] left-1/2 -translate-x-1/2 text-center font-statblock text-5xl text-taupe-950 text-shadow-amber-50 text-shadow-lg",
            player.handSize >= 10 && "text-5xl",
          )}>
          {player.handSize}
        </p>
      </Pile>
    </div>
  );
};
