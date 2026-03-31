import type { Player } from "@/shared/api";
import { PlayerStats } from "../player-stats";
import { cn } from "@/utils/cn";
import { Pile } from "../pile";
import { CardType } from "../card";
import { HotkeyScope } from "@/utils/hotkey";
import {
  boardSelectionTargetId,
  useBoardSelectionContext,
} from "../contexts/board-selection-context";
import {
  getSelectionClassName,
  resolveActiveSelectionTarget,
} from "../selection-class";

interface LeftPlayerProps {
  player: Player;
}

const MAX_ROWS = 3;

const getInPlayStats = (player: Player, cardSlug: string) => {
  const isCharacterCard = player.inPlay[0]?.slug === cardSlug;

  if (!isCharacterCard) {
    return undefined;
  }

  return {
    healthPoints: player.currentHealthPoints,
    attackPoints: player.currentAttackPoints,
  };
};

export const LeftPlayer = ({ player }: LeftPlayerProps) => {
  const {
    getTargetSelectionState,
    getTargetSelectionHotkey,
    selectTarget,
    cancelBoardSelection,
    activeRequestId,
  } = useBoardSelectionContext();

  // Create an array of arrays of 8 elements each, fill with undefined if needed
  const grid = Array.from(
    { length: Math.ceil(player.inPlay.length / MAX_ROWS) },
    () => Array(MAX_ROWS).fill(undefined),
  );
  // Fill the grid with the cards
  for (let i = 0; i < player.inPlay.length; i++) {
    grid[Math.floor(i / MAX_ROWS)][i % MAX_ROWS] = {
      card: player.inPlay[i],
      originalIndex: i,
    };
  }

  // Turn back into a flat array
  const cards = grid.reverse().flat();
  const inPlayRows = Math.min(player.inPlay.length, MAX_ROWS);

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
          coins={player.coins}
          souls={player.souls}
          soulCards={player.soulCards}
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
              tooltip={{
                enabled: true,
                content: `${player.name} has ${player.handSize} cards in their hand.`,
              }}
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
        )}
      </div>
      <div
        className={
          "flex flex-col place-content-center place-items-center gap-8 transform-3d"
        }>
        <div
          className={cn("grid gap-2 transform-3d", "grid-flow-col")}
          style={{
            gridTemplateRows: `repeat(${inPlayRows}, 1fr)`,
          }}>
          {cards.map((entry, index) => {
            const card = entry?.card;
            if (card === undefined) {
              return <div key={`empty-${index}`} className="h-full w-full" />;
            }

            const targetId = boardSelectionTargetId.playerInPlay(
              player.name,
              entry.originalIndex,
              card.slug,
            );
            const entityTargetId =
              entry.originalIndex === 0
                ? boardSelectionTargetId.playerEntity(player.name, card.slug)
                : undefined;

            const {
              targetId: activeTargetId,
              selectionState,
              selectionHotkey,
            } = resolveActiveSelectionTarget({
              targetIds: [targetId, entityTargetId],
              fallbackTargetId: targetId,
              getTargetSelectionState,
              getTargetSelectionHotkey,
            });

            const topCard = {
              slug: card.slug,
              charged: card.charged,
              eternal: card.eternal,
              effects: index === 0 ? player.temporaryEffect : undefined,
              counter: card.counter,
              stats: getInPlayStats(player, card.slug),
            };

            return (
              <Pile
                key={card.slug}
                cards={[topCard]}
                disabled={selectionState.selectable ? false : undefined}
                topCardClassName={getSelectionClassName(selectionState)}
                onClickTopCard={
                  selectionState.selectable
                    ? () => selectTarget(activeTargetId)
                    : activeRequestId
                      ? () => cancelBoardSelection()
                      : undefined
                }
                onClickTopCardHotkey={selectionHotkey}
                onClickTopCardHotkeyScope={[HotkeyScope.Selection]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
