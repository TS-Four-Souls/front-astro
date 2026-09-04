import type { Player } from "@/shared/api";
import { PlayerStats } from "../player-stats";
import { cn } from "@/utils/cn";
import { Pile } from "../pile";
import { HandPile } from "../hand-pile";
import { CardHoverPreview } from "../card-hover-preview";
import { useGameAnimation } from "../contexts/game-animation";
import { useLanguageContext } from "@/components/contexts/language-context";
import { useToastContext } from "../contexts/toast-context";
import { socket } from "@/utils/socket";

interface LeftPlayerProps {
  player: Player;
}

const MAX_ROWS = 3;

export const LeftPlayer = ({ player }: LeftPlayerProps) => {
  const { registerInPlayCardEl } = useGameAnimation();
  const { t, translateError } = useLanguageContext();
  const { toast, block } = useToastContext();

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
                        player.character.slug === card.slug &&
                        player.isEngagedInPurchase,
                      effects: card.stats?.temporaryEffect,
                      counter: card.counter,
                      stats: card.stats
                        ? {
                            healthPoints: card.stats.healthPoints,
                            attackPoints: card.stats.attackPoints,
                            ...(card.stats.evasionPoints === undefined
                              ? {}
                              : { evasionPoints: card.stats.evasionPoints }),
                          }
                        : undefined,
                    },
                  ]}
                  disabled={
                    !card.stats || card.stats.capabilities.targetable !== true
                  }
                  onHoverPopover={() => (
                    <CardHoverPreview
                      card={card}
                      stats={
                        card.stats
                          ? {
                              healthPoints: card.stats.healthPoints,
                              attackPoints: card.stats.attackPoints,
                              ...(card.stats.evasionPoints === undefined
                                ? {}
                                : { evasionPoints: card.stats.evasionPoints }),
                            }
                          : undefined
                      }
                      effects={card.stats?.temporaryEffect}
                      counter={card.counter}
                      isEternal={card.eternal}
                    />
                  )}
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
                  onClickTopCard={() =>
                    card.stats
                      ? block(
                          t("gameStep.attack.blockedTooltip.title"),
                          card.stats.capabilities.targetable,
                          () => {
                            console.log("Attacking monster with card:", card);
                            socket.emit(
                              "attackMonster",
                              { card },
                              (response) => {
                                if (response.status === 400)
                                  toast(
                                    "error",
                                    t("gameStep.attack.errorToast.title"),
                                    translateError(response.error),
                                  );
                              },
                            );
                          },
                        )
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
