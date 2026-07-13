import type { Player } from "@/shared/api";
import { PlayerStats } from "../player-stats";
import { cn } from "@/utils/cn";
import { Pile } from "../pile";
import { HandPile } from "../hand-pile";
import { CardHoverPreview } from "../card-hover-preview";
import { useGameAnimation } from "../contexts/game-animation";

interface RightPlayerProps {
  player: Player;
}

const MAX_ROWS = 3;

export const RightPlayer = ({ player }: RightPlayerProps) => {
  const { registerInPlayCardEl } = useGameAnimation();
  return (
    <div
      key={player.name}
      className={
        "col-start-3 row-span-3 flex flex-col place-content-center place-items-start gap-8"
      }>
      <div
        className={cn(
          "flex flex-col place-content-center place-items-center gap-8",
          player.inPlay.length + 1 > MAX_ROWS && "flex-row",
        )}>
        <PlayerStats player={player} className={"flex-col gap-4 px-6 py-4"} />
        {player.handSize > 0 && <HandPile player={player} />}
      </div>
      <div
        className={cn(
          "flex flex-col place-content-center place-items-center gap-8",
        )}>
        <div
          className={cn("grid gap-2", "grid-flow-col")}
          style={{
            gridTemplateRows: `repeat(${Math.min(player.inPlay.length + 1, MAX_ROWS)}, 1fr)`,
          }}>
          {[player.character, ...player.inPlay].map((card) => {
            const isCharacter = card === player.character;
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
