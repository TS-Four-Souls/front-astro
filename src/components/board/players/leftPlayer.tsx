import type { Player } from "@/shared/api";
import { PlayerStats } from "../player-stats";
import { cn } from "@/utils/cn";
import { Pile } from "../pile";
import { HandPile } from "../hand-pile";
import { CardHoverPreview } from "../card-hover-preview";
import { useGameAnimation } from "../contexts/game-animation";

interface LeftPlayerProps {
  player: Player;
}

const MAX_ROWS = 3;

export const LeftPlayer = ({ player }: LeftPlayerProps) => {
  const { registerInPlayCardEl } = useGameAnimation();
  // Create an array of arrays of 8 elements each, fill with undefined if needed
  const grid = Array.from(
    { length: Math.ceil((player.inPlay.length + 1) / MAX_ROWS) },
    () => Array(MAX_ROWS).fill(undefined),
  );
  // Fill the grid with the cards
  grid[0][0] = player.character;
  for (let i = 1; i < player.inPlay.length + 1; i++) {
    grid[Math.floor(i / MAX_ROWS)][i % MAX_ROWS] = player.inPlay[i - 1];
  }

  // Turn back into a flat array
  const cards = grid.toReversed().flat();

  return (
    <div
      key={player.name}
      className={
        "col-start-1 row-span-3 row-start-1 flex flex-col place-content-center place-items-end gap-8"
      }>
      <div
        className={cn(
          "flex flex-col place-content-center place-items-center gap-8",
          player.inPlay.length + 1 > MAX_ROWS && "flex-row-reverse",
        )}>
        <PlayerStats player={player} className={"flex-col gap-4 px-6 py-4"} />
        {player.handSize > 0 && <HandPile player={player} />}
      </div>
      <div
        className={
          "flex flex-col place-content-center place-items-center gap-8"
        }>
        <div
          className={cn("grid gap-2", "grid-flow-col")}
          style={{
            gridTemplateRows: `repeat(${Math.min(player.inPlay.length + 1, MAX_ROWS)}, 1fr)`,
          }}>
          {cards.map((card, index) => {
            if (card === undefined) {
              return <div key={`empty-${index}`} className="h-full w-full" />;
            }
            const isCharacter = player.character.slug === card.slug;
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
                      engagedInCombat: isCharacter && player.isEngagedInCombat,
                      engagedInPurchase:
                        isCharacter && player.isEngagedInPurchase,
                      effects: isCharacter ? player.temporaryEffect : undefined,
                      counter: card.counter,
                      stats: isCharacter
                        ? {
                            healthPoints: player.currentHealthPoints,
                            attackPoints: player.currentAttackPoints,
                          }
                        : undefined,
                    },
                  ]}
                  onHoverPopover={() => (
                    <CardHoverPreview
                      card={card}
                      stats={
                        isCharacter
                          ? {
                              healthPoints: player.currentHealthPoints,
                              attackPoints: player.currentAttackPoints,
                            }
                          : undefined
                      }
                      effects={isCharacter ? player.temporaryEffect : undefined}
                      counter={card.counter}
                      isEternal={card.eternal}
                    />
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
