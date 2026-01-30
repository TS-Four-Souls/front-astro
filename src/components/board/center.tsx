import type { Card, DetailedState } from "@/shared/api";
import { Pile } from "./pile";
import { CardType } from "./card";
import { Stack } from "./stack";
import { socket } from "@/utils/socket";
import { useGameContext } from "./contexts/game-context";
import { CHEAT_MODE } from "@/constants";
import { useToastContext } from "./contexts/toast-context";
import { Button } from "../button";
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

  const debugGainLoot = () => {
    socket.emit("debugListLoot", issuer, (response) => {
      if (response.status === 200) {
        const promptId = `debug-list-loot-${Date.now()}`;
        addPrompt({
          promptId,
          isUnique: false,
          prompt: "Select a loot card to loot",
          options: response.cards.map((card) => ({
            type: "card",
            payload: card,
          })),
          minCount: 1,
          maxCount: 50,
          onSubmit: (selections) => {
            socket.emit(
              "debugLoot",
              {
                ...issuer,
                slugs: selections.map((selection) => selection.payload.slug),
              },
              (response) => {
                if (response.status === 200) {
                  toast("success", "CHEAT MODE", response.response);
                } else {
                  toast("error", "CHEAT MODE", response.error);
                }
              },
            );
            removePrompt(promptId);
          },
          onCancel: () => {
            removePrompt(promptId);
          },
        });
      } else {
        toast("error", "CHEAT MODE", response.error);
      }
    });
  };

  const debugGainTreasure = () => {
    socket.emit("debugListTreasure", issuer, (response) => {
      if (response.status === 200) {
        const promptId = `debug-list-treasure-${Date.now()}`;
        addPrompt({
          promptId,
          isUnique: false,
          prompt: "Select a treasure card to gain",
          options: response.cards.map((card) => ({
            type: "card",
            payload: card,
          })),
          minCount: 1,
          maxCount: 50,
          onSubmit: (selections) => {
            socket.emit(
              "debugGainTreasure",
              {
                ...issuer,
                slugs: selections.map((selection) => selection.payload.slug),
              },
              (response) => {
                if (response.status === 200) {
                  toast("success", "CHEAT MODE", response.response);
                } else {
                  toast("error", "CHEAT MODE", response.error);
                }
              },
            );
            removePrompt(promptId);
          },
          onCancel: () => {
            removePrompt(promptId);
          },
        });
      } else {
        toast("error", "CHEAT MODE", response.error);
      }
    });
  };

  const declareAttack = () => {
    socket.emit("declareAttack", { issuer }, (response) => {
      if (response.status === 200) {
        toast("success", "Declared attack", "You have declared an attack");
      } else {
        toast("error", "Failed to declare attack", response.error);
      }
    });
  };

  const declarePurchase = () => {
    socket.emit("declarePurchase", { issuer }, (response) => {
      if (response.status === 200) {
        toast("success", "Declared purchase", "You have declared a purchase");
      } else {
        toast("error", "Failed to declare purchase", response.error);
      }
    });
  };

  const cancelPurchase = () => {
    socket.emit("cancelPurchase", { issuer }, (response) => {
      if (response.status === 200) {
        toast("success", "Cancelled purchase", "You have cancelled a purchase");
      } else {
        toast("error", "Failed to cancel purchase", response.error);
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

  const rollDice = () => {
    socket.emit("attackRoll", issuer, (response) => {
      if (response.status === 200) {
        toast("success", "Rolled dice", "You have rolled a dice");
      } else {
        toast("error", "Failed to roll dice", response.error);
      }
    });
  };

  return (
    <div className="mx-24 my-8 flex flex-col gap-4 rounded-xl bg-stone-700/10 p-12 shadow-md inset-shadow-xs inset-shadow-stone-700 transform-3d translate-z-1">
      <div className="flex justify-end translate-z-1">
        {!state.me.isEngagedInPurchase && (
          <Button
            label="Declare purchase"
            disabled={state.me.capabilities.declarePurchase !== true}
            onClick={() =>
              block(
                "Cannot declare purchase",
                state.me.capabilities.declarePurchase,
                declarePurchase,
              )
            }
            tooltip={tooltip(
              "Cannot declare purchase",
              state.me.capabilities.declarePurchase,
            )}
            className="self-end"
          />
        )}
        {state.me.isEngagedInPurchase && (
          <Button
            label="Abandon purchase"
            disabled={state.me.capabilities.buyTreasure === true}
            tooltip={tooltip(
              "Abandon purchase",
              state.me.capabilities.buyTreasure === true
                ? "Cannot abandon purchase while able to buy treasure."
                : true,
            )}
            onClick={() =>
              block(
                "Abandon purchase",
                state.me.capabilities.buyTreasure === true
                  ? "Cannot abandon purchase while able to buy treasure."
                  : true,
                cancelPurchase,
              )
            }
            className="self-end"
          />
        )}
      </div>
      <div className="flex place-items-center gap-12 transform-3d">
        <Stack />
        <div className="flex shrink-0 flex-col place-items-center gap-2 transform-3d">
          {state.bonusSouls.map((soul) => (
            <Pile
              key={soul.slug}
              cards={soul.granted ? [] : [soul]}
              size={105}
            />
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
            onClickTopCard={CHEAT_MODE ? debugGainLoot : undefined}
          />
        </div>
        <div className="flex flex-col gap-8 transform-3d">
          <div className="flex place-items-center gap-2 transform-3d">
            <Pile
              cards={state.treasure.discard}
              onClickTopCard={CHEAT_MODE ? debugGainTreasure : undefined}
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
            />
            <Pile
              cards={Array.from({ length: state.monsters.deckSize }).map(
                () => CardType.MonsterCard,
              )}
              disabled={state.monsters.capabilities.targetableDeck !== true}
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
              return (
                <Pile
                  key={card.top.slug}
                  cards={[
                    ...card.covered,
                    {
                      slug: card.top.slug,
                      stats: card.top.stats,
                      effects: card.top.stats?.temporaryEffect,
                      engagedInCombat:
                        card.top.stats?.isEngagedInCombat ?? false,
                    },
                  ]}
                  disabled={targetable !== true}
                  onClickTopCard={() =>
                    block("Cannot attack this card", targetable, () =>
                      selectMonsterToAttack(index),
                    )
                  }
                  tooltip={tooltip("Cannot attack this card", targetable)}
                />
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex justify-end translate-z-1">
        {!state.me.isEngagedInCombat && (
          <Button
            label="Declare attack"
            disabled={state.me.capabilities.declareAttack !== true}
            onClick={() =>
              block(
                "Cannot declare attack",
                state.me.capabilities.declareAttack,
                declareAttack,
              )
            }
            tooltip={tooltip(
              "Cannot declare attack",
              state.me.capabilities.declareAttack,
            )}
            className="self-end"
          />
        )}
        {state.me.isEngagedInCombat && (
          <Button
            label="Roll dice"
            disabled={state.me.capabilities.rollDice !== true}
            tooltip={tooltip(
              "Cannot roll dice",
              state.me.capabilities.rollDice,
            )}
            onClick={() =>
              block(
                "Cannot roll dice",
                state.me.capabilities.rollDice,
                rollDice,
              )
            }
            className="self-end"
          />
        )}
      </div>
    </div>
  );
};
