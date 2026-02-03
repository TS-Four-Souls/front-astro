import type { Player } from "@/shared/api";
import { PlayerStats } from "../player-stats";
import { Pile } from "../pile";
import { cn } from "@/utils/cn";
import { CardType } from "../card";

interface TopPlayerProps {
  player: Player;
}

const MAX_COLUMNS = 8;

export const TopPlayer = ({ player }: TopPlayerProps) => {
  // Create an array of arrays of 8 elements each, fill with undefined if needed
  const grid = Array.from(
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
        coins={player.coins}
        souls={player.souls}
        soulCards={player.soulCards}
        isEngagedInCombat={player.isEngagedInCombat}
        isEngagedInPurchase={player.isEngagedInPurchase}
        className={"flex-row gap-12 px-8 py-3"}
      />
      <div
        className={
          "flex place-content-center place-items-center gap-8 transform-3d"
        }>
        {player.handSize > 0 && (
          <div className="relative place-items-center transform-3d">
            <Pile
              cards={Array.from({ length: player.handSize }).map(
                () => CardType.LootCard,
              )}
              tooltip={{
                enabled: true,
                content: `${player.name} has ${player.handSize} cards in their hand.`,
              }}
              size={120}
            />
            <p
              className={cn(
                "absolute bottom-[0.1em] left-1/2 -translate-x-1/2 translate-z-1 text-center font-statblock text-5xl text-stone-950 text-shadow-amber-50 text-shadow-lg pointer-events-none",
                player.handSize >= 10 && "translate-z-2 text-5xl",
              )}>
              {player.handSize}
            </p>
          </div>
        )}
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
                key={card.slug}
                cards={[
                  {
                    slug: card.slug,
                    charged: card.charged,
                    eternal: card.eternal,
                    effects: index === 0 ? player.temporaryEffect : undefined,
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
