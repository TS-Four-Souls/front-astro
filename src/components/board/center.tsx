import type { Card, DetailedState } from "@/shared/api";
import { Pile } from "./pile";
import { CardImage, CardType } from "./card";
import { Stack } from "./stack";
import { socket } from "@/utils/socket";
import { useGameContext } from "./contexts/game-context";
import { useToastContext } from "./contexts/toast-context";
import { usePromptContext } from "./contexts/prompt-context";
import { tooltip } from "@/utils/tooltip";

interface CenterProps {
  state: DetailedState;
}

export const Center = ({ state }: CenterProps) => {
  const { issuer } = useGameContext();
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();

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

  const displayPileDetails = (cards: Card[]) => {
    const promptId = `pile-details-${Date.now()}`;
    addPrompt({
      promptId,
      isUnique: false,
      prompt: "Pile details",
      options: cards.map((card) => ({
        type: "card",
        payload: card,
      })),
      minCount: 0,
      maxCount: 0,
      onSubmit: () => {
        removePrompt(promptId);
      },
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
    (requirement) => requirement.monster === "top",
  );

  return (
    <div className="flex translate-z-1 place-items-center gap-12 rounded-xl bg-stone-700/10 p-8 shadow-md inset-shadow-xs inset-shadow-stone-700 transform-3d">
      <Stack />
      <div className="flex shrink-0 flex-col place-items-center gap-2 transform-3d">
        {state.bonusSouls.map((soul) => (
          <Pile key={soul.slug} cards={soul.granted ? [] : [soul]} size={105} />
        ))}
      </div>
      <div className="flex flex-col place-items-center gap-2 transform-3d">
        <Pile
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
            cards={Array.from({ length: state.treasure.deckSize }).map(
              (_, index) =>
                index === state.treasure.deckSize - 1
                  ? (state.firstCardTreasureDeck ?? CardType.TreasureCard)
                  : CardType.TreasureCard,
            )}
            disabled={state.me.capabilities.buyTreasure !== true}
            onClickTopCard={() =>
              block(
                "Cannot buy this card",
                state.me.capabilities.buyTreasure,
                () => purchaseTreasure("top"),
              )
            }
            tooltip={tooltip(
              "Cannot buy this card",
              state.me.capabilities.buyTreasure,
            )}
          />
          {state.treasure.inPlay.map((card, index) => (
            <Pile
              key={card.slug}
              cards={[card]}
              disabled={state.me.capabilities.buyTreasure !== true}
              onClickTopCard={() =>
                block(
                  "Cannot buy this card",
                  state.me.capabilities.buyTreasure,
                  () => purchaseTreasure(index),
                )
              }
              tooltip={tooltip(
                "Cannot buy this card",
                state.me.capabilities.buyTreasure,
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
            cards={Array.from({ length: state.monsters.deckSize }).map(
              (_, index) => ({
                type: CardType.MonsterCard,
                isRequiredAttack:
                  index === state.monsters.deckSize - 1 &&
                  state.me.attackRequirements.some(
                    (requirement) => requirement.monster === "top",
                  ),
              }),
            )}
            disabled={state.monsters.capabilities.targetableDeck !== true}
            onHoverPopover={
              monsterDeckAttackRequirement
                ? () => (
                    <>
                      <CardImage
                        card={monsterDeckAttackRequirement.source}
                        className="w-64"
                      />
                      <p className="mt-3 max-w-64 text-center leading-tight text-stone-400">
                        You are required to attack the top of the monster deck
                        this turn.
                      </p>
                    </>
                  )
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
            tooltip={tooltip(
              "Cannot attack this card",
              state.monsters.capabilities.targetableDeck,
            )}
          />
          {state.monsters.inPlay.map((card, index) => {
            const targetable =
              card.top.stats?.capabilities.targetable ??
              "This is not a monster card.";

            const attackRequirement = state.me.attackRequirements.find(
              (requirement) =>
                requirement.monster !== "top" &&
                requirement.monster.slug === card.top.slug,
            );
            return (
              <Pile
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
                onHoverPopover={
                  attackRequirement
                    ? () => (
                        <>
                          <CardImage
                            card={attackRequirement.source}
                            className="w-64"
                          />
                          <p className="mt-3 max-w-64 text-center leading-tight text-stone-400">
                            You are required to attack this monster this turn.
                          </p>
                        </>
                      )
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
                tooltip={tooltip("Cannot attack this card", targetable)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
