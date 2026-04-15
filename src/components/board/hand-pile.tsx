import type { Player } from "@/shared/api";
import { Pile } from "./pile";
import { usePileDetails } from "./use-pile-details";
import { CardType } from "./card";
import { cn } from "@/utils/cn";

interface HandPileProps {
  player: Player;
}

export const HandPile = ({ player }: HandPileProps) => {
  const { displayPileDetails } = usePileDetails();
  return (
    <div className="relative place-items-center transform-3d">
      <Pile
        cards={
          player.hand !== undefined
            ? player.hand.map((c) => ({
                slug: c.slug,
                globalId: c.globalId,
              }))
            : Array.from({ length: player.handSize }).map(
                () => CardType.LootCard,
              )
        }
        tooltip={{
          enabled: true,
          content: `${player.name} has ${player.handSize} cards in their hand.`,
        }}
        onPileDetailsClick={
          player.hand !== undefined
            ? () => displayPileDetails(player.hand)
            : undefined
        }
        size={120}
      />
      <p
        className={cn(
          "pointer-events-none absolute bottom-[0.1em] left-1/2 -translate-x-1/2 translate-z-1 text-center font-statblock text-5xl text-stone-950 text-shadow-amber-50 text-shadow-lg",
          player.handSize >= 10 && "translate-z-2 text-5xl",
        )}>
        {player.handSize}
      </p>
    </div>
  );
};
