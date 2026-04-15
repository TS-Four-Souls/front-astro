import type { Player } from "@/shared/api";
import { PlayerStats } from "../player-stats";
import { cn } from "@/utils/cn";
import { Pile } from "../pile";
import { HandPile } from "../hand-pile";

interface RightPlayerProps {
  player: Player;
}

export const RightPlayer = ({ player }: RightPlayerProps) => (
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
        soulCards={player.soulCards}
        isEngagedInCombat={player.isEngagedInCombat}
        isEngagedInPurchase={player.isEngagedInPurchase}
        className={"flex-col gap-4 px-6 py-4"}
      />
      {player.handSize > 0 && <HandPile player={player} />}
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
            globalId={card.globalId}
            key={card.slug}
            cards={[
              {
                slug: card.slug,
                charged: card.charged,
                eternal: card.eternal,
                effects: index === 0 ? player.temporaryEffect : undefined,
                counter: card.counter,
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
