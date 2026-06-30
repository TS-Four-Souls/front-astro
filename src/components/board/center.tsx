import type { Card, DetailedState } from "@/shared/api";
import { socket } from "@/utils/socket";
import { t, translateError, toSeriTrans } from "../translation/translate";
import { CardType } from "./card";
import { CardHoverPreview } from "./card-hover-preview";
import { SpecialGlobalIds } from "./contexts/board-selection-context";
import { useGameAnimation } from "./contexts/game-animation";
import { usePromptContext } from "./contexts/prompt-context";
import { useToastContext } from "./contexts/toast-context";
import { History } from "./history";
import { Pile } from "./pile";
import { Stack } from "./stack";
import { usePileDetails } from "./use-pile-details";
interface CenterProps {
  state: DetailedState;
}

export const Center = ({ state }: CenterProps) => {
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();
  const { displayPileDetails } = usePileDetails();
  const {
    registerLootDeckEl,
    registerTreasureDeckEl,
    registerTreasureShopPileEl,
    registerMonsterSlotEl,
    registerBonusSoulPileEl,
  } = useGameAnimation();

  const purchaseTreasure = (index: number | "top") => {
    socket.emit("purchase", { index }, (response) => {
      if (response.status === 400)
        toast("error", toSeriTrans("front.failPurchase"), translateError(response.error));
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
          prompt: t(toSeriTrans("front.selectMonsterToCover")),
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
        { index: "top", replaceIndex },
        (response) => {
          if (response.status === 400)
            toast(
              "error",
              toSeriTrans("front.failSelectMonsterToAttack"),
              translateError(response.error),
            );
        },
      );

      return;
    }

    socket.emit("attackMonster", { index }, (response) => {
      if (response.status === 400)
        toast("error", toSeriTrans("front.failSelectMonsterToAttack"), translateError(response.error));
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
                onHoverPopover={() => (
                  <CardHoverPreview
                    card={soul}
                    tooltip={{
                      enabled: true,
                      title: toSeriTrans("front.bsoulCard"),
                      content:
                        toSeriTrans("front.bonusSoulCondition"),
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
        <div ref={registerLootDeckEl}>
          <Pile
            globalId={SpecialGlobalIds.Loot}
            cards={Array.from({ length: state.loot.deckSize }).map(
              () => CardType.LootCard,
            )}
          />
        </div>
      </div>
      {state.room && (
        <div className="flex flex-col gap-2">
          <Pile cards={state.room.discard} orientation="landscape" size={110} />
          <Pile
            cards={Array.from({ length: state.room.deckSize }).map(
              () => CardType.RoomCard,
            )}
            orientation="landscape"
            size={110}
          />
          <Pile cards={state.room.inPlay} orientation="landscape" size={110} />
        </div>
      )}
      <div className="flex flex-col gap-6">
        <div className="flex place-items-center gap-3">
          <Pile
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
          <div ref={registerTreasureDeckEl}>
            <Pile
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
                  toSeriTrans("front.cannotBuy"),
                  state.me.capabilities.buyTreasure,
                  () => purchaseTreasure("top"),
                )
              }
              tooltip={[
                {
                  capable: state.me.capabilities.buyTreasure,
                  title: toSeriTrans("front.cannotBuy"),
                },
                {
                  enabled: true,
                  title: toSeriTrans("front.price", {value: String(state.treasure.topDeckPrice)}),
                  type: "gold",
                },
              ]}
              onHoverPopover={
                state.treasure.firstCardTreasureDeck &&
                (() => (
                  <CardHoverPreview
                    card={state.treasure.firstCardTreasureDeck ?? CardType.TreasureCard}
                    tooltip={[
                      {
                        capable: state.me.capabilities.buyTreasure,
                        title: toSeriTrans("front.cannotBuy"),
                      },
                      {
                        enabled: true,
                        title: toSeriTrans("front.price", {value: String(state.treasure.topDeckPrice)}),
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
                    toSeriTrans("front.cannotBuy"),
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
                        title: toSeriTrans("front.cannotBuy"),
                      },
                      {
                        enabled: true,
                        title: toSeriTrans("front.price", {value: String(card.price)}),
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
                          title: toSeriTrans("front.cannotAttackThisCard"),
                        },
                        {
                          enabled: true,
                          title: toSeriTrans("front.attackRequired"),
                          content: toSeriTrans("front.attackRequiredContent", {card: monsterDeckAttackRequirement.source.nameKey}),
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
                toSeriTrans("front.cannotAttackThisCard"),
                state.monsters.capabilities.targetableDeck,
                () => {
                  selectMonsterToAttack("top");
                },
              )
            }
            tooltip={{
              capable: state.monsters.capabilities.targetableDeck,
              title: toSeriTrans("front.cannotAttackThisCard"),
            }}
          />
          {state.monsters.inPlay.map((card, index) => {
            const targetable =
              card.top.stats?.capabilities.targetable ??
              toSeriTrans("front.notAMonsterCard");

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
                    block(toSeriTrans("front.cannotAttackThisCard"), targetable, () =>
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
                      stats={card.top.stats}
                      effects={card.top.stats?.temporaryEffect}
                      tooltip={[
                        {
                          capable: targetable,
                          title: toSeriTrans("front.cannotAttackThisCard"),
                        },
                        {
                          enabled: attackRequirement !== undefined,
                          title: toSeriTrans("front.attackRequired"),
                          content: toSeriTrans("front.attackRequiredContent", {card: attackRequirement!.source.nameKey}),
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
