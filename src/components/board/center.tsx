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

interface CenterProps {
  state: DetailedState;
}

export const Center = ({ state }: CenterProps) => {
  const { issuer } = useGameContext();
  const { toast } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();

  const onLootDeckClick = () => {
    socket.emit("debugLoot", issuer, (response) => {
      if (response.status === 200) {
        toast(
          "success",
          "CHEAT MODE",
          "You have looted a card from the loot deck",
        );
      } else {
        toast("error", "CHEAT MODE", response.error);
      }
    });
  };

  const onTreasureDeckClick = () => {
    socket.emit("debugGainTreasure", issuer, (response) => {
      if (response.status === 200) {
        toast(
          "success",
          "CHEAT MODE",
          "You have gained a treasure card from the treasure deck",
        );
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
    } else {
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
    }
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
    <div className="flex flex-col gap-4 transform-3d">
      <div className="flex place-items-center gap-12 transform-3d">
        <Stack />
        <div className="flex shrink-0 flex-col place-items-center gap-2 transform-3d">
          {state.bonusSouls.map((soul) => (
            <Pile key={soul.slug} cards={[soul]} size={105} />
          ))}
        </div>
        <div className="flex flex-col place-items-center gap-2 transform-3d">
          <Pile
            cards={Array.from({ length: state.loot.deckSize }).map(
              () => CardType.LootCard,
            )}
            onClickTopCard={CHEAT_MODE ? onLootDeckClick : undefined}
          />
          <Pile cards={state.loot.discard} />
        </div>
        <div className="flex flex-col gap-8 transform-3d">
          <div className="flex place-items-center gap-2 transform-3d">
            <Pile cards={state.treasure.discard} />
            <Pile
              cards={Array.from({ length: state.treasure.deckSize }).map(
                () => CardType.TreasureCard,
              )}
              onClickTopCard={CHEAT_MODE ? onTreasureDeckClick : undefined}
            />
            {state.treasure.inPlay.map((card) => (
              <Pile key={card.slug} cards={[card]} />
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
              onClickTopCard={
                state.monsters.capabilities.targetableDeck
                  ? () => selectMonsterToAttack("top")
                  : undefined
              }
            />
            {state.monsters.inPlay.map((card, index) => (
              <Pile
                key={card.top.slug}
                cards={[
                  ...card.covered,
                  {
                    slug: card.top.slug,
                    engagedInCombat: card.top.stats?.isEngagedInCombat ?? false,
                  },
                ]}
                onClickTopCard={
                  card.top.stats?.capabilities.targetable
                    ? () => selectMonsterToAttack(index)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex place-items-center justify-end gap-2">
        {!state.me.isEngagedInCombat && (
          <Button
            label="Declare attack"
            disabled={!state.me.capabilities.declareAttack}
            onClick={declareAttack}
            className="self-end"
          />
        )}
        {state.me.isEngagedInCombat && (
          <Button
            label="Roll dice"
            disabled={!state.me.capabilities.rollDice}
            onClick={rollDice}
            className="self-end"
          />
        )}
      </div>
    </div>
  );
};
