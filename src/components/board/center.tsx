import type { Card, DetailedState } from "@/shared/api";
import { Pile } from "./pile";
import { CardImage, CardType } from "./card";
import { Stack } from "./stack";
import { History } from "./history";
import { socket } from "@/utils/socket";
import { useGameContext } from "./contexts/game-context";
import { useToastContext } from "./contexts/toast-context";
import { usePromptContext } from "./contexts/prompt-context";
import { usePileDetails } from "./use-pile-details";
import { SpecialGlobalIds } from "./contexts/board-selection-context";
import { CardHoverPreview } from "./card-hover-preview";

interface CenterProps {
  state: DetailedState;
}

export const Center = ({ state }: CenterProps) => {
  const { issuer } = useGameContext();
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();
  const { displayPileDetails } = usePileDetails();

  const purchaseTreasure = (index: number | "top") => {
    socket.emit("purchase", { issuer, index }, (response) => {
      switch (response.status) {
        case 200:
          break;
        case 400:
          toast("error", "Failed to purchase", response.error);
          break;
      }
    });
  };

  const selectMonsterToAttack = (
    index: number | "top",
    replaceIndex?: number,
  ) => {
    if (index === "top") {
      if (replaceIndex === undefined) {
        type ReplaceIndexOption = {
          type: "card";
          payload: Card;
          index: number;
        };

        const promptId = `select-replace-monster-${index}`;
        addPrompt<ReplaceIndexOption>({
          promptId,
          isUnique: false,
          prompt: "Select a monster to cover",
          options: state.monsters.inPlay.map((card, index) => ({
            type: "card",
            payload: card.top,
            index,
          })),
          minCount: 1,
          maxCount: 1,
          onSubmit: function (selections): void {
            selectMonsterToAttack("top", selections[0].index);
            removePrompt(promptId);
          },
          onCancel: () => {
            removePrompt(promptId);
          },
        });
        return;
      }

      socket.emit(
        "attackMonster",
        { issuer, index: "top", replaceIndex },
        (response) => {
          if (response.status === 200) {
            toast(
              "success",
              "Selected monster to attack",
              "You have selected a monster to attack",
            );
          } else {
            toast(
              "error",
              "Failed to select monster to attack",
              response.error,
            );
          }
        },
      );

      return;
    }

    socket.emit("attackMonster", { issuer, index }, (response) => {
      if (response.status === 200) {
        toast(
          "success",
          "Selected monster to attack",
          "You have selected a monster to attack",
        );
      } else {
        toast("error", "Failed to select monster to attack", response.error);
      }
    });
  };

  const monsterDeckAttackRequirement = state.me.attackRequirements.find(
    (requirement) => requirement.target === "topDeck",
  );

  const targetableMonsters = [
    ...(state.monsters.capabilities.targetableDeck === true ? ["top"] : []),
    ...state.monsters.inPlay
      .filter((card) => card.top.stats?.capabilities.targetable === true)
      .map((card) => card.top.slug),
  ].slice(0, 9);

  const targetableTreasures = (
    state.me.isEngagedInPurchase
      ? ["top", ...state.treasure.inPlay.map((card) => card.slug)]
      : []
  ).slice(0, 9);

  return (
    <div className="flex translate-z-1 place-items-center gap-6 rounded-xl bg-stone-700/10 p-8 shadow-md inset-shadow-xs inset-shadow-stone-700 transform-3d">
      <Stack />
      <History />
      <div className="flex shrink-0 flex-col place-items-center gap-2 transform-3d">
        {state.bonusSouls.map((soul) => (
          <Pile
            key={soul.slug}
            cards={soul.granted ? [] : [soul]}
            size={105}
            onHoverPopover={() => <CardHoverPreview card={soul} />}
          />
        ))}
      </div>
      <div className="flex flex-col place-items-center gap-2 transform-3d">
        <Pile
          globalId={SpecialGlobalIds.Loot}
          cards={Array.from({ length: state.loot.deckSize }).map(
            () => CardType.LootCard,
          )}
        />
        <Pile
          cards={state.loot.discard}
          onClickTopCard={() =>
            block(
              "Cannot view loot discard",
              state.loot.discard.length === 0
                ? "The loot discard pile is empty"
                : true,
              () => displayPileDetails(state.loot.discard.toReversed()),
            )
          }
          onPileDetailsClick={
            state.loot.discard.length > 1
              ? () => displayPileDetails(state.loot.discard.toReversed())
              : undefined
          }
          disabled={state.loot.discard.length === 0}
        />
      </div>
      <div className="flex flex-col gap-6 transform-3d">
        <div className="flex place-items-center gap-2 transform-3d">
          <Pile
            cards={state.treasure.discard}
            onClickTopCard={() =>
              block(
                "Cannot view treasure discard",
                state.treasure.discard.length === 0
                  ? "The treasure discard pile is empty"
                  : true,
                () => displayPileDetails(state.treasure.discard.toReversed()),
              )
            }
            disabled={state.treasure.discard.length === 0}
            onPileDetailsClick={
              state.treasure.discard.length > 1
                ? () => displayPileDetails(state.treasure.discard.toReversed())
                : undefined
            }
          />
          <Pile
            globalId={SpecialGlobalIds.Treasure}
            cards={Array.from({ length: state.treasure.deckSize }).map(
              (_, index) =>
                index === state.treasure.deckSize - 1
                  ? (state.firstCardTreasureDeck ?? CardType.TreasureCard)
                  : CardType.TreasureCard,
            )}
            onClickTopCardHotkey={
              targetableTreasures.includes("top")
                ? `${targetableTreasures.indexOf("top") + 1}`
                : undefined
            }
            disabled={state.me.capabilities.buyTreasure !== true}
            onClickTopCard={() =>
              block(
                "Cannot buy this card",
                state.me.capabilities.buyTreasure,
                () => purchaseTreasure("top"),
              )
            }
            tooltip={{
              capable: state.me.capabilities.buyTreasure,
              title: "Cannot buy this card",
            }}
          />
          {state.treasure.inPlay.map((card, index) => (
            <Pile
              globalId={card.globalId}
              key={card.slug}
              cards={[card]}
              disabled={state.me.capabilities.buyTreasure !== true}
              onClickTopCardHotkey={
                targetableTreasures.includes(card.slug)
                  ? `${targetableTreasures.indexOf(card.slug) + 1}`
                  : undefined
              }
              onClickTopCard={() =>
                block(
                  "Cannot buy this card",
                  state.me.capabilities.buyTreasure,
                  () => purchaseTreasure(index),
                )
              }
              onHoverPopover={() => (
                <CardHoverPreview
                  card={card}
                  tooltip={{
                    capable: state.me.capabilities.buyTreasure,
                    title: "Cannot buy this card",
                  }}
                />
              )}
            />
          ))}
        </div>
        <div className="flex place-items-center gap-2 transform-3d">
          <Pile
            cards={state.monsters.discard.map((card) => ({
              slug: card.slug,
              face: "front",
            }))}
            onPileDetailsClick={
              state.monsters.discard.length > 1
                ? () => displayPileDetails(state.monsters.discard.toReversed())
                : undefined
            }
            disabled={state.monsters.discard.length === 0}
            onClickTopCard={() =>
              block(
                "Cannot view monster discard",
                state.monsters.discard.length === 0
                  ? "The monster discard pile is empty"
                  : true,
                () => displayPileDetails(state.monsters.discard.toReversed()),
              )
            }
          />
          <Pile
            globalId={SpecialGlobalIds.Monster}
            cards={Array.from({ length: state.monsters.deckSize }).map(
              (_, index) => ({
                type: CardType.MonsterCard,
                isRequiredAttack:
                  index === state.monsters.deckSize - 1 &&
                  state.me.attackRequirements.some(
                    (requirement) => requirement.target === "topDeck",
                  ),
              }),
            )}
            disabled={state.monsters.capabilities.targetableDeck !== true}
            onHoverPopover={
              monsterDeckAttackRequirement
                ? () => (
                    <CardHoverPreview
                        card={monsterDeckAttackRequirement.source}
                        tooltip={[
                        {
                          capable: state.monsters.capabilities.targetableDeck,
                          title: "Cannot attack this card",
                        },
                        {
                          enabled: true,
                          title: "Attack required",
                          content: `You must attack this monster because of ${monsterDeckAttackRequirement.source.name}.`,
                        },
                      ]}
                    />
                  )
                : undefined
            }
            onClickTopCardHotkey={
              targetableMonsters.includes("topDeck")
                ? `${targetableMonsters.indexOf("topDeck") + 1}`
                : undefined
            }
            onClickTopCard={() =>
              block(
                "Cannot attack this card",
                state.monsters.capabilities.targetableDeck,
                () => {
                  selectMonsterToAttack("top");
                },
              )
            }
            tooltip={{
              capable: state.monsters.capabilities.targetableDeck,
              title: "Cannot attack this card",
            }}
          />
          {state.monsters.inPlay.map((card, index) => {
            const targetable =
              card.top.stats?.capabilities.targetable ??
              "This is not a monster card.";

            const attackRequirement = state.me.attackRequirements.find(
              (requirement) =>
                requirement.target !== "topDeck" &&
                requirement.target.slug === card.top.slug,
            );
            return (
              <Pile
                globalId={card.top.globalId}
                key={card.top.slug}
                cards={[
                  ...card.covered,
                  {
                    slug: card.top.slug,
                    stats: card.top.stats,
                    effects: card.top.stats?.temporaryEffect,
                    engagedInCombat: card.top.stats?.isEngagedInCombat ?? false,
                    isRequiredAttack: attackRequirement !== undefined,
                  },
                ]}
                disabled={targetable !== true}
                onClickTopCardHotkey={
                  targetableMonsters.includes(card.top.slug)
                    ? `${targetableMonsters.indexOf(card.top.slug) + 1}`
                    : undefined
                }
                onClickTopCard={() =>
                  block("Cannot attack this card", targetable, () =>
                    selectMonsterToAttack(index),
                  )
                }
                onPileDetailsClick={
                  card.covered.length > 0
                    ? () => {
                        displayPileDetails([
                          card.top,
                          ...card.covered.toReversed(),
                        ]);
                      }
                    : undefined
                }
                onHoverPopover={() => (
                  <CardHoverPreview
                    card={card.top}
                    tooltip={[
                      {
                        capable: targetable,
                        title: "Cannot attack this card",
                      },
                      {
                        enabled: attackRequirement !== undefined,
                        title: "Attack required",
                        content: `You must attack this monster because of ${attackRequirement?.source.name}.`,
                      },
                    ]}
                  />
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
