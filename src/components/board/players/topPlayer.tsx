import type { InPlayCard, Player } from "@/shared/api";
import { PlayerStats } from "../player-stats";
import { Pile } from "../pile";
import { cn } from "@/utils/cn";
import { HandPile } from "../hand-pile";
import { CardHoverPreview } from "../card-hover-preview";
import { useGameAnimation } from "../contexts/game-animation";
import { useLanguageContext } from "@/components/contexts/language-context";
import { useToastContext } from "../contexts/toast-context";
import { socket } from "@/utils/socket";

interface TopPlayerProps {
  player: Player;
}

const MAX_COLUMNS = 8;

export const TopPlayer = ({ player }: TopPlayerProps) => {
  const { registerInPlayCardEl } = useGameAnimation();
  const { t, translateError } = useLanguageContext();
  const { toast, block } = useToastContext();

  // Create an array of arrays of 8 elements each, fill with undefined if needed
  const grid: InPlayCard[][] = Array.from(
    { length: Math.ceil((player.inPlay.length + 1) / MAX_COLUMNS) },
    () =>
      Array(Math.min(player.inPlay.length + 1, MAX_COLUMNS)).fill(undefined),
  );

  grid[0][0] = player.character;
  // Fill the grid with the cards
  for (let i = 1; i < player.inPlay.length + 1; i++) {
    grid[Math.floor(i / MAX_COLUMNS)][i % MAX_COLUMNS] = player.inPlay[i - 1];
  }

  // Turn back into a flat array
  const cards = grid.toReversed().flat();

  return (
    <div
      key={player.name}
      className={
        "col-start-2 row-start-1 flex flex-col-reverse place-content-center place-items-center gap-6"
      }>
      <PlayerStats player={player} className={"flex-row gap-12 px-8 py-3"} />
      <div className={"flex place-content-center place-items-center gap-8"}>
        {player.handSize > 0 && <HandPile player={player} />}
        <div
          className={cn("grid grid-flow-row gap-2")}
          style={{
            gridTemplateColumns: `repeat(${Math.min(player.inPlay.length + 1, MAX_COLUMNS)}, 1fr)`,
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
                        card === player.character && player.isEngagedInPurchase,
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
