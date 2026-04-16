import type { Player } from "@/shared/api";
import { PlayerStats } from "../player-stats";
import { cn } from "@/utils/cn";
import { Pile } from "../pile";
import { HandPile } from "../hand-pile";

interface LeftPlayerProps {
  player: Player;
}

const MAX_ROWS = 3;

export const LeftPlayer = ({ player }: LeftPlayerProps) => {
  // Create an array of arrays of 8 elements each, fill with undefined if needed
  const grid = Array.from(
    { length: Math.ceil(player.inPlay.length / MAX_ROWS) },
    () => Array(MAX_ROWS).fill(undefined),
  );
  // Fill the grid with the cards
  for (let i = 0; i < player.inPlay.length; i++) {
    grid[Math.floor(i / MAX_ROWS)][i % MAX_ROWS] = player.inPlay[i];
  }

  // Turn back into a flat array
  const cards = grid.reverse().flat();

  return (
    <div
      key={player.name}
      className={
        "col-start-1 row-span-3 row-start-1 flex flex-col place-content-center place-items-end gap-8 transform-3d"
      }>
      <div
        className={cn(
          "flex flex-col place-content-center place-items-center gap-8 transform-3d",
          player.inPlay.length > 3 && "flex-row-reverse",
        )}>
        <PlayerStats
          name={player.name}
          color={player.color}
          coins={player.coins}
          souls={player.souls}
          soulCards={player.soulCards}
          className={"flex-col gap-4 px-6 py-4"}
        />
        {player.handSize > 0 && <HandPile player={player} />}
      </div>
      <div
        className={
          "flex flex-col place-content-center place-items-center gap-8 transform-3d"
        }>
        <div
          className={cn("grid gap-2 transform-3d", "grid-flow-col")}
          style={{
            gridTemplateRows: `repeat(${Math.min(player.inPlay.length, MAX_ROWS)}, 1fr)`,
          }}>
          {cards.map((card, index) => {
            if (card === undefined) {
              return <div key={`empty-${index}`} className="h-full w-full" />;
            }

            return (
              <Pile
                globalId={card.globalId}
                key={card.slug}
                cards={[
                  {
                    slug: card.slug,
                    charged: card.charged,
                    eternal: card.eternal,
                    engagedInCombat:
                      player.inPlay[0].slug === card.slug &&
                      player.isEngagedInCombat,
                    engagedInPurchase:
                      player.inPlay[0].slug === card.slug &&
                      player.isEngagedInPurchase,
                    effects:
                      player.inPlay[0].slug === card.slug
                        ? player.temporaryEffect
                        : undefined,
                    counter: card.counter,
                    stats:
                      player.inPlay[0].slug === card.slug
                        ? {
                            healthPoints: player.currentHealthPoints,
                            attackPoints: player.currentAttackPoints,
                          }
                        : undefined,
                  },
                ]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
