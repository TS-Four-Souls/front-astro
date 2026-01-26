import type { Player } from "@/shared/api";
import { PlayerStats } from "../player-stats";
import { cn } from "@/utils/cn";
import { Pile } from "../pile";
import { CardType } from "../card";

interface RightPlayerProps {
  player: Player;
}

export const RightPlayer = ({ player }: RightPlayerProps) => {
  return (
    <div
      key={player.name}
      className={
        "col-start-3 row-span-3 flex flex-col place-content-center place-items-start gap-8 transform-3d"
      }>
      <div
        className={cn(
          "flex flex-col place-content-center place-items-center gap-8 transform-3d",
          player.inPlay.length > 3 && "flex-row",
        )}>
        <PlayerStats
          name={player.name}
          coins={player.coins}
          souls={player.souls}
          isEngagedInCombat={player.isEngagedInCombat}
          isEngagedInPurchase={player.isEngagedInPurchase}
          className={"flex-col gap-4 px-6 py-4"}
        />
        {player.handSize > 0 && (
          <div className="relative place-items-center transform-3d">
            <Pile
              cards={Array.from({ length: player.handSize }).map(
                () => CardType.LootCard,
              )}
              tooltip={`${player.name} has ${player.handSize} cards in their hand.`}
              size={120}
            />
            <p
              className={cn(
                "absolute bottom-[0.1em] left-1/2 -translate-x-1/2 translate-z-1 text-center font-statblock text-5xl text-stone-950 text-shadow-amber-50 text-shadow-lg",
                player.handSize >= 10 && "translate-z-2 text-5xl",
              )}>
              {player.handSize}
            </p>
          </div>
        )}
      </div>
      <div
        className={cn(
          "flex flex-col place-content-center place-items-center gap-8 transform-3d",
        )}>
        <div
          className={cn("grid gap-2 transform-3d", "grid-flow-col")}
          style={{
            gridTemplateRows: `repeat(${Math.min(player.inPlay.length, 3)}, 1fr)`,
          }}>
          {player.inPlay.map((card, index) => (
            <Pile
              key={card.slug}
              cards={[
                {
                  slug: card.slug,
                  charged: card.charged,
                  eternal: card.eternal,
                  effects: index === 0 ? player.temporaryEffect : undefined,
                  stats:
                    index === 0
                      ? {
                          healthPoints: player.currentHealthPoints,
                          attackPoints: player.currentAttackPoints,
                        }
                      : undefined,
                },
              ]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
