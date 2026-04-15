import type { InPlayCard, Player } from "@/shared/api";
import { PlayerStats } from "../player-stats";
import { Pile } from "../pile";
import { cn } from "@/utils/cn";
import { HandPile } from "../hand-pile";

interface TopPlayerProps {
  player: Player;
}

const MAX_COLUMNS = 8;

export const TopPlayer = ({ player }: TopPlayerProps) => {
  // Create an array of arrays of 8 elements each, fill with undefined if needed
  const grid: InPlayCard[][] = Array.from(
    { length: Math.ceil(player.inPlay.length / MAX_COLUMNS) },
    () => Array(Math.min(player.inPlay.length, MAX_COLUMNS)).fill(undefined),
  );

  // Fill the grid with the cards
  for (let i = 0; i < player.inPlay.length; i++) {
    grid[Math.floor(i / MAX_COLUMNS)][i % MAX_COLUMNS] = player.inPlay[i];
  }

  // Turn back into a flat array
  const cards = grid.reverse().flat();

  return (
    <div
      key={player.name}
      className={
        "col-start-2 row-start-1 flex flex-col-reverse place-content-center place-items-center gap-6 transform-3d"
      }>
      <PlayerStats
        name={player.name}
        color={player.color}
        coins={player.coins}
        souls={player.souls}
        soulCards={player.soulCards}
        className={"flex-row gap-12 px-8 py-3"}
      />
      <div
        className={
          "flex place-content-center place-items-center gap-8 transform-3d"
        }>
        {player.handSize > 0 && <HandPile player={player} />}
        <div
          className={cn("grid grid-flow-row gap-2 transform-3d")}
          style={{
            gridTemplateColumns: `repeat(${Math.min(player.inPlay.length, MAX_COLUMNS)}, 1fr)`,
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
