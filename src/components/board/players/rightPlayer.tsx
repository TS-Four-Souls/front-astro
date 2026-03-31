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

interface RightPlayerProps {
  player: Player;
}

const MAX_ROWS = 3;

const getInPlayStats = (player: Player, index: number) => {
  if (index !== 0) {
    return undefined;
  }

  return {
    healthPoints: player.currentHealthPoints,
    attackPoints: player.currentAttackPoints,
  };
};

export const RightPlayer = ({ player }: RightPlayerProps) => {
  const {
    getTargetSelectionState,
    getTargetSelectionHotkey,
    selectTarget,
    cancelBoardSelection,
    activeRequestId,
  } = useBoardSelectionContext();

  const inPlayRows = Math.min(player.inPlay.length, MAX_ROWS);

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
        className={cn(
          "flex flex-col place-content-center place-items-center gap-8 transform-3d",
        )}>
        <div
          className={cn("grid gap-2 transform-3d", "grid-flow-col")}
          style={{
            gridTemplateRows: `repeat(${inPlayRows}, 1fr)`,
          }}>
          {player.inPlay.map((card, index) => {
            const targetId = boardSelectionTargetId.playerInPlay(
              player.name,
              index,
              card.slug,
            );
            const entityTargetId =
              index === 0
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
              stats: getInPlayStats(player, index),
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
