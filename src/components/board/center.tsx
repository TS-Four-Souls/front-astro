import type {
  Card,
  DetailedState,
  InPlayMeCard,
  SelectionItem,
} from "@/shared/api";
import { socket } from "@/utils/socket";
import { CardType } from "./card";
import { CardHoverPreview } from "./card-hover-preview";
import { SpecialGlobalIds } from "./contexts/board-selection-context";
import { useGameAnimation } from "./contexts/game-animation";
import { useGameContext } from "./contexts/game-context";
import { usePromptContext } from "./contexts/prompt-context";
import { useToastContext } from "./contexts/toast-context";
import { History } from "./history";
import { Pile } from "./pile";
import { Stack } from "./stack";
import { usePileDetails } from "./use-pile-details";
import { useLanguageContext } from "../contexts/language-context";
import {
  cheatDrawLoot,
  cheatDrawTreasure,
  putMonsterInSlot,
  putRoomInSlot,
  selectCardToLoot,
  selectCardToTreasure,
} from "./cheats";
interface CenterProps {
  state: DetailedState;
}

export const Center = ({ state }: CenterProps) => {
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();
  const { displayPileDetails } = usePileDetails();
  const { translateError, t, ts } = useLanguageContext();
  const { parameters, isCheatViewOpen } = useGameContext();
  const cheatServices = { addPrompt, removePrompt, toast, t, translateError };
  const {
    registerLootDeckEl,
    registerTreasureDeckEl,
    registerTreasureShopPileEl,
    registerMonsterSlotEl,
    registerBonusSoulPileEl,
  } = useGameAnimation();
  const onRoomCardClick = (card: InPlayMeCard, index: number) => {
    const activateCard = (
      effectIndex: number,
      selections: SelectionItem[] = [],
    ) => {
      socket.emit(
        "activateWithID",
        {
          index: index,
          effectIndex,
          targetChoices: selections,
          type: "room",
        },
        (response) => {
          switch (response.status) {
            case 200:
              if (response.response.complete) {
              } else if (response.response.options.length === 0) {
                toast(
                  "error",
                  t("gameStep.activate.errorToast.title"),
                  t("gameStep.noOptionsAvailable"),
                );
              } else {
                const promptId = `card-activation-${card.slug}-${index}-${effectIndex}-${selections.length}-${Date.now()}`;
                addPrompt({
                  promptId,
                  isUnique: false,
                  prompt: ts(response.response.description),
                  options: response.response.options,
                  minCount: response.response.min,
                  maxCount: response.response.max,
                  onSubmit: (additionalSelections) => {
                    activateCard(effectIndex, [
                      ...selections,
                      ...additionalSelections,
                    ]);
                    removePrompt(promptId);
                  },
                  onCancel: () => {
                    removePrompt(promptId);
                  },
                });
              }
              break;
            case 400:
            default:
              toast(
                "error",
                t("gameStep.activate.errorToast.title"),
                translateError(response.error),
              );
              break;
          }
        },
      );
    };

    // First, check if the card has multiple effects
    // If it does, we need to first prompt the user to select an effect
    if (card.effects && card.effects.length > 1) {
      type CardEffectSelectionItem = Extract<
        SelectionItem,
        { type: "cardEffect" }
      >;
      const effects: CardEffectSelectionItem[] = card.effects.map((effect) => ({
        type: "cardEffect",
        payload: {
          card: card,
          visualEffectBox: effect.visualEffectBox,
          index: effect.index,
          description: effect.description,
        },
      }));

      const promptId = `select-card-effect-${card.slug}-${index}-${Date.now()}`;
      addPrompt<CardEffectSelectionItem>({
        promptId,
        isUnique: false,
        prompt: t("gameStep.activate.popup.title"),
        options: effects,
        minCount: 1,
        maxCount: 1,
        onSubmit: (selectedEffect) => {
          activateCard(selectedEffect[0].payload.visualEffectBox.startIndex);
          removePrompt(promptId);
        },
        onCancel: () => {
          removePrompt(promptId);
        },
      });
    } else if (card.effects && card.effects.length === 1) {
      activateCard(card.effects[0].visualEffectBox.startIndex);
    }
  };
  const purchaseTreasure = (index: number | "top") => {
    socket.emit("purchase", { index }, (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("gameStep.purchase.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  const selectMonsterToAttack = (card: Card | "top", toCoverIndex?: number) => {
    if (card === "top") {
      if (toCoverIndex === undefined) {
        type ReplaceIndexOption = {
          type: "card";
          payload: Card;
          index: number;
        };

        const promptId = `select-replace-monster-${Date.now()}`;
        addPrompt<ReplaceIndexOption>({
          promptId,
          isUnique: false,
          prompt: t("gameStep.attack.popup.title"),
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
        { card: "top", toCoverIndex: toCoverIndex },
        (response) => {
          if (response.status === 400)
            toast(
              "error",
              t("gameStep.attack.errorToast.title"),
              translateError(response.error),
            );
        },
      );

      return;
    }

    socket.emit("attackMonster", { card }, (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("gameStep.attack.errorToast.title"),
          translateError(response.error),
        );
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

  const currentPlayer = [state.me, ...state.players].find(
    (player) => player.name === state.turn,
  );
  const activeRoom = state.room?.inPlay[0];
  const firstDiscardRoom = state.room?.discard[state.room?.discard.length - 1];
  return (
    <div
      className="flex place-items-center gap-7 rounded-3xl border-[0.3em] border-taupe-900/40 bg-board/90 p-8"
      style={{
        background: `radial-gradient(circle at center, var(--color-board) 50%, ${currentPlayer?.color} 250%)`,
      }}>
      <div className="flex gap-2">
        <Stack />
        <History />
      </div>
      {state.bonusSouls && (
        <div className="flex shrink-0 flex-col place-items-center gap-2">
          {state.bonusSouls.map((soul) => (
            <div
              key={soul.globalId}
              ref={(el) => registerBonusSoulPileEl(soul.globalId, el)}>
              <Pile
                cards={soul.granted ? [] : [soul]}
                size={105}
                globalId={soul.globalId}
                onHoverPopover={() => (
                  <CardHoverPreview
                    card={soul}
                    counter={soul.counter}
                    tooltip={{
                      enabled: true,
                      title: t("gameStep.bonusSouls.tooltip.title"),
                      content: t("gameStep.bonusSouls.tooltip.message"),
                    }}
                  />
                )}
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col-reverse place-items-center gap-6">
        <Pile
          cards={state.loot.discard}
          onPileDetailsClick={
            state.loot.discard.length > 1
              ? () => displayPileDetails(state.loot.discard.toReversed())
              : undefined
          }
          cheats={
            parameters.allowCheatOptions.value && isCheatViewOpen
              ? {}
              : undefined
          }
          disabled={state.loot.discard.length === 0}
          onClickTopCard={
            state.loot.discard.length > 1
              ? () => displayPileDetails(state.loot.discard.toReversed())
              : undefined
          }
          onHoverPopover={
            state.loot.discard.length > 0
              ? () => (
                  <CardHoverPreview
                    card={state.loot.discard[state.loot.discard.length - 1]}
                  />
                )
              : undefined
          }
        />
        <div ref={registerLootDeckEl} className="relative">
          <Pile
            cheats={
              parameters.allowCheatOptions.value && isCheatViewOpen
                ? {
                    drawLoot: () => cheatDrawLoot(cheatServices),
                    selectLoot: () => selectCardToLoot(cheatServices),
                  }
                : undefined
            }
            globalId={SpecialGlobalIds.Loot}
            cards={Array.from({ length: state.loot.deckSize }).map(
              () => CardType.LootCard,
            )}
          />
        </div>
      </div>
      {state.room && activeRoom && (
        <div className="flex flex-col gap-3">
          <Pile
            cards={state.room.discard}
            onPileDetailsClick={
              state.room.discard.length > 1
                ? () => displayPileDetails(state.room!.discard.toReversed())
                : undefined
            }
            onHoverPopover={
              firstDiscardRoom === undefined
                ? undefined
                : () => (
                    <CardHoverPreview
                      card={firstDiscardRoom}
                      orientation={firstDiscardRoom.orientation}
                    />
                  )
            }
            orientation="landscape"
          />
          <Pile
            cheats={
              parameters.allowCheatOptions.value && isCheatViewOpen
                ? {
                    putRoom: () => putRoomInSlot(state.room, cheatServices),
                  }
                : undefined
            }
            cards={Array.from({ length: state.room.deckSize }).map(
              () => CardType.RoomCard,
            )}
            orientation="landscape"
          />
          <Pile
            cards={state.room.inPlay.map((card) => ({
              slug: card.slug,
              globalId: card.globalId,
              charged: card.charged,
              eternal: card.eternal,
              engagedInCombat: card.stats && card.stats.isEngagedInCombat,
              engagedInPurchase: false,
              effects: card.stats ? card.stats.temporaryEffect : undefined,
              counter: card.counter,
              stats: card.stats,
            }))}
            cheats={
              parameters.allowCheatOptions.value && isCheatViewOpen
                ? {}
                : undefined
            }
            globalId={state.room.inPlay[0]?.globalId}
            onClickTopCard={() =>
              state.room!.inPlay[0]!.stats
                ? block(
                    t("gameStep.attack.blockedTooltip.title"),
                    state.room!.inPlay[0]!.stats.capabilities.targetable,
                    () => {
                      console.log(
                        "Attacking monster with card:",
                        state.room!.inPlay[0]!,
                      );
                      socket.emit(
                        "attackMonster",
                        { card: state.room!.inPlay[0]! },
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
                : block(
                    t("capability.cannotActivate"),
                    activeRoom.capabilities.activate,
                    () => onRoomCardClick(activeRoom, 0),
                  )
            }
            disabled={
              activeRoom.stats
                ? activeRoom.stats.capabilities.targetable !== true
                : activeRoom.capabilities.activate !== true
            }
            onHoverPopover={() => (
              <CardHoverPreview
                card={activeRoom}
                orientation={activeRoom.orientation}
                stats={activeRoom.stats}
                effects={
                  activeRoom.stats
                    ? activeRoom.stats.temporaryEffect
                    : undefined
                }
                counter={activeRoom.counter}
                isEternal={activeRoom.eternal}
                tooltip={{
                  title: t("gameStep.activate.blockedTooltip.title"),
                  capable: activeRoom.capabilities.activate,
                }}
              />
            )}
            orientation="landscape"
          />
        </div>
      )}
      <div className="flex flex-col gap-6">
        <div className="flex place-items-center gap-3">
          <Pile
            cheats={
              parameters.allowCheatOptions.value && isCheatViewOpen
                ? {}
                : undefined
            }
            cards={state.treasure.discard}
            disabled={state.treasure.discard.length === 0}
            onPileDetailsClick={
              state.treasure.discard.length > 1
                ? () => displayPileDetails(state.treasure.discard.toReversed())
                : undefined
            }
            onClickTopCard={
              state.treasure.discard.length > 1
                ? () => displayPileDetails(state.treasure.discard.toReversed())
                : undefined
            }
            onHoverPopover={
              state.treasure.discard.length > 0
                ? () => (
                    <CardHoverPreview
                      card={
                        state.treasure.discard[
                          state.treasure.discard.length - 1
                        ]
                      }
                    />
                  )
                : undefined
            }
          />
          <div ref={registerTreasureDeckEl} className="relative">
            <Pile
              cheats={
                parameters.allowCheatOptions.value && isCheatViewOpen
                  ? {
                      drawTreasure: () => cheatDrawTreasure(cheatServices),
                      selectTreasure: () => selectCardToTreasure(cheatServices),
                    }
                  : undefined
              }
              globalId={SpecialGlobalIds.Treasure}
              cards={Array.from({ length: state.treasure.deckSize }).map(
                (_, index) =>
                  index === state.treasure.deckSize - 1 &&
                  state.treasure.firstCardTreasureDeck
                    ? state.treasure.firstCardTreasureDeck
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
                  t("gameStep.purchase.shop.blockedTooltip.title"),
                  state.me.capabilities.buyTreasure,
                  () => purchaseTreasure("top"),
                )
              }
              tooltip={[
                {
                  capable: state.me.capabilities.buyTreasure,
                  title: t("gameStep.purchase.shop.blockedTooltip.title"),
                },
                {
                  enabled: true,
                  title: t("gameStep.purchase.shop.price", {
                    value: String(state.treasure.topDeckPrice),
                  }),
                  type: "gold",
                },
              ]}
              onHoverPopover={
                state.treasure.firstCardTreasureDeck &&
                (() => (
                  <CardHoverPreview
                    card={
                      state.treasure.firstCardTreasureDeck ??
                      CardType.TreasureCard
                    }
                    tooltip={[
                      {
                        capable: state.me.capabilities.buyTreasure,
                        title: t("gameStep.purchase.shop.blockedTooltip.title"),
                      },
                      {
                        enabled: true,
                        title: t("gameStep.purchase.shop.price", {
                          value: String(state.treasure.topDeckPrice),
                        }),
                        type: "gold",
                      },
                    ]}
                  />
                ))
              }
            />
          </div>
          {state.treasure.inPlay.map((card, index) => (
            <div
              key={card.slug}
              ref={(el) => registerTreasureShopPileEl(card.globalId, el)}>
              <Pile
                cheats={
                  parameters.allowCheatOptions.value && isCheatViewOpen
                    ? {}
                    : undefined
                }
                globalId={card.globalId}
                cards={[card]}
                disabled={state.me.capabilities.buyTreasure !== true}
                onClickTopCardHotkey={
                  targetableTreasures.includes(card.slug)
                    ? `${targetableTreasures.indexOf(card.slug) + 1}`
                    : undefined
                }
                onClickTopCard={() =>
                  block(
                    t("gameStep.purchase.shop.blockedTooltip.title"),
                    state.me.capabilities.buyTreasure,
                    () => purchaseTreasure(index),
                  )
                }
                onHoverPopover={() => (
                  <CardHoverPreview
                    card={card}
                    tooltip={[
                      {
                        capable: state.me.capabilities.buyTreasure,
                        title: t("gameStep.purchase.shop.blockedTooltip.title"),
                      },
                      {
                        enabled: true,
                        title: t("gameStep.purchase.shop.price", {
                          value: String(card.price),
                        }),
                        type: "gold",
                      },
                    ]}
                  />
                )}
              />
            </div>
          ))}
        </div>
        <div className="flex place-items-center gap-3">
          <Pile
            cheats={
              parameters.allowCheatOptions.value && isCheatViewOpen
                ? {}
                : undefined
            }
            cards={state.monsters.discard.map((card) => ({
              slug: card.slug,
              globalId: card.globalId,
              face: "front",
            }))}
            onPileDetailsClick={
              state.monsters.discard.length > 1
                ? () => displayPileDetails(state.monsters.discard.toReversed())
                : undefined
            }
            disabled={state.monsters.discard.length === 0}
            onClickTopCard={
              state.monsters.discard.length > 1
                ? () => displayPileDetails(state.monsters.discard.toReversed())
                : undefined
            }
            onHoverPopover={
              state.monsters.discard.length > 0
                ? () => (
                    <CardHoverPreview
                      card={
                        state.monsters.discard[
                          state.monsters.discard.length - 1
                        ]
                      }
                    />
                  )
                : undefined
            }
          />
          <div className="relative">
            <Pile
              cheats={
                parameters.allowCheatOptions.value && isCheatViewOpen
                  ? {
                      putInSlot: () => putMonsterInSlot(cheatServices),
                    }
                  : undefined
              }
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
                            title: t("gameStep.attack.blockedTooltip.title"),
                          },
                          {
                            enabled: true,
                            title: t("gameStep.attack.requiredTooltip.title"),
                            content: t(
                              "gameStep.attack.requiredTooltip.message",
                              {
                                card: monsterDeckAttackRequirement.source
                                  .nameKey,
                              },
                            ),
                          },
                        ]}
                      />
                    )
                  : undefined
              }
              onClickTopCardHotkey={
                targetableMonsters.includes("top")
                  ? `${targetableMonsters.indexOf("top") + 1}`
                  : undefined
              }
              onClickTopCard={() =>
                block(
                  t("gameStep.attack.blockedTooltip.title"),
                  state.monsters.capabilities.targetableDeck,
                  () => {
                    selectMonsterToAttack("top");
                  },
                )
              }
              tooltip={{
                capable: state.monsters.capabilities.targetableDeck,
                title: t("gameStep.attack.blockedTooltip.title"),
              }}
            />
          </div>
          {state.monsters.inPlay.map((card, index) => {
            const targetable =
              card.top.stats?.capabilities.targetable ??
              t("gameStep.attack.blockedTooltip.message");
            const attackRequirement = state.me.attackRequirements.find(
              (requirement) =>
                requirement.target !== "topDeck" &&
                requirement.target.slug === card.top.slug,
            );
            return (
              <div
                key={card.top.globalId}
                ref={(el) => registerMonsterSlotEl(card.top.globalId, el)}>
                <Pile
                  cheats={
                    parameters.allowCheatOptions.value && isCheatViewOpen
                      ? {}
                      : undefined
                  }
                  globalId={card.top.globalId}
                  cards={[
                    ...card.covered,
                    {
                      slug: card.top.slug,
                      stats: card.top.stats,
                      effects: card.top.stats?.temporaryEffect,
                      engagedInCombat:
                        card.top.stats?.isEngagedInCombat ?? false,
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
                    block(
                      t("gameStep.attack.blockedTooltip.title"),
                      targetable,
                      () => selectMonsterToAttack(card.top),
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
                      counter={card.top.counter}
                      stats={card.top.stats}
                      effects={card.top.stats?.temporaryEffect}
                      tooltip={[
                        {
                          capable: targetable,
                          title: t("gameStep.attack.blockedTooltip.title"),
                        },
                        {
                          enabled: attackRequirement !== undefined,
                          title: t("gameStep.attack.requiredTooltip.title"),
                          content:
                            attackRequirement &&
                            t("gameStep.attack.requiredTooltip.message", {
                              card: attackRequirement.source.nameKey,
                            }),
                        },
                      ]}
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
