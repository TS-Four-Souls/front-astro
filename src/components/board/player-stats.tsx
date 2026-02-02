import { cn } from "@/utils/cn";
import { useGameContext } from "./contexts/game-context";
import { socket } from "@/utils/socket";
import { useToastContext } from "./contexts/toast-context";
import { Gear } from "@/icons/gear";
import { Button } from "../button";
import { usePromptContext } from "./contexts/prompt-context";
import { tooltip } from "@/utils/tooltip";
import { usePopoverContext } from "./contexts/popover-context";
import type { Card as CardType } from "@/shared/api";
import { useRef } from "react";
import { CardImage } from "./card";
import { useMainMenuContext } from "./contexts/main-menu-context";

interface PlayerStatsProps {
  name: string;
  coins: number;
  souls: number;
  soulCards: CardType[];
  isEngagedInCombat: boolean;
  isEngagedInPurchase: boolean;
  className?: string;
}

export const PlayerStats = ({
  name,
  coins,
  souls,
  soulCards,
  isEngagedInCombat,
  isEngagedInPurchase,
  className,
}: PlayerStatsProps) => {
  const { state, issuer } = useGameContext();
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();
  const { setPopover, closePopover } = usePopoverContext();
  const { openMenu } = useMainMenuContext();
  const soulSequenceRef = useRef<HTMLDivElement>(null);

  const isCurrentTurn = state.turn === name;
  const isMe = state.me.name === name;
  const canEndTurn = isMe && state.me.capabilities.endTurn;

  const declareAttack = () => {
    socket.emit("declareAttack", { issuer }, (response) => {
      if (response.status === 200) {
        toast("success", "Declared attack", "You have declared an attack");
      } else {
        toast("error", "Failed to declare attack", response.error);
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

  const onEndTurnPress = () => {
    socket.emit("endTurn", { issuer }, (response) => {
      switch (response.status) {
        case 200:
          break;
        default:
        case 400:
          toast("error", "Failed to end turn", response.error);
          break;
      }
    });
  };

  const onCoinPress = () => {
    if (state.me.coins === 0) {
      toast("error", "Cannot give coins", "You have no coins to give");
      return;
    }

    const promptId = `coin-prompt-${Date.now()}`;
    addPrompt<{ type: "number"; payload: number }>({
      promptId: `coin-prompt-${Date.now()}`,
      isUnique: false,
      prompt: "How many coins do you want to give?",
      options: Array.from({ length: state.me.coins }, (_, index) => ({
        type: "number",
        payload: index + 1,
      })),
      minCount: 0,
      maxCount: 1,
      onSubmit: function (selections): void {
        if (selections.length === 0) {
          removePrompt(promptId);
          return;
        }
        socket.emit(
          "giveCoins",
          { issuer, coins: selections[0].payload, target: name },
          (response) => {
            switch (response.status) {
              case 200:
                toast(
                  "success",
                  "Coins given",
                  `Gave ${selections[0].payload} coins to ${name}`,
                );
                removePrompt(promptId);
                break;
              default:
                toast("error", "Failed to give coins", response.error);
                break;
            }
          },
        );
      },
      onCancel: () => {
        removePrompt(promptId);
      },
    });
  };

  return (
    <div
      className={cn(
        "flex place-items-center gap-16 rounded-lg p-3 pr-4 pl-6 text-white outline-3 outline-transparent transform-3d",
        isCurrentTurn && "outline-stone-700",
        isEngagedInCombat && "outline-red-500/60",
        isEngagedInPurchase && "outline-yellow-400/87",
        className,
      )}>
      <h1 className="text-center font-alt-stats font-bold uppercase">{name}</h1>
      <div
        className="flex cursor-pointer items-center gap-1"
        onClick={() => !isMe && onCoinPress()}>
        <img src="/coin.png" className="size-6 rounded-full shadow-md/50" />:
        <span className="font-statblock text-4xl">{coins}</span>
      </div>

      {souls > 0 && (
        <div
          ref={soulSequenceRef}
          className="flex translate-z-1 cursor-pointer flex-row-reverse items-center transform-3d"
          onMouseEnter={() => {
            if (soulSequenceRef.current && soulCards.length > 0) {
              const rect = soulSequenceRef.current.getBoundingClientRect();
              setPopover({
                anchor: rect,
                content: (
                  <div className="flex w-max flex-nowrap gap-4">
                    {soulCards.map((card, index) => (
                      <CardImage
                        card={card}
                        className="w-64 shrink-0"
                        key={index}
                        tooltip={card.name}
                      />
                    ))}
                  </div>
                ),
              });
            }
          }}
          onMouseLeave={() => {
            closePopover();
          }}>
          {alternateSoulSequence(souls)
            .reverse()
            .map((type, index) => {
              return (
                <img
                  src={`/${type === 1 ? "soul-1" : "soul-2"}.png`}
                  className={cn(
                    type === 1 ? "h-6" : "h-8",
                    souls > 2 && "-ml-3",
                  )}
                  key={index}
                />
              );
            })}
        </div>
      )}

      {isMe && (
        <div className="flex items-center gap-4">
          <Button
            disabled={canEndTurn !== true}
            hotkey="e"
            onClick={() =>
              block(
                "Cannot end turn",
                state.me.capabilities.endTurn,
                onEndTurnPress,
              )
            }
            tooltip={tooltip("Cannot end turn", state.me.capabilities.endTurn)}
            label="End turn"
            className="translate-z-1"
          />
          {!state.me.isEngagedInPurchase && (
            <Button
              label="Declare purchase"
              disabled={state.me.capabilities.declarePurchase !== true}
              hotkey="p"
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
              hotkey="p"
              onClick={() =>
                block(
                  "Abandon purchase",
                  state.me.capabilities.buyTreasure === true
                    ? "Cannot abandon purchase while able to buy treasure."
                    : true,
                  cancelPurchase,
                )
              }
            />
          )}
          {!state.me.isEngagedInCombat && (
            <Button
              label="Declare attack"
              disabled={state.me.capabilities.declareAttack !== true}
              hotkey="a"
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
              hotkey="a"
              onClick={() =>
                block(
                  "Cannot roll dice",
                  state.me.capabilities.rollDice,
                  rollDice,
                )
              }
            />
          )}
          <Gear className="size-5 cursor-pointer" onClick={() => openMenu()} />
        </div>
      )}
    </div>
  );
};

const alternateSoulSequence = (souls: number): (1 | 2)[] => {
  const sequence: (1 | 2)[] = [];
  const sequenceDividedByThree = Math.floor(souls / 3);

  for (let i = 0; i < sequenceDividedByThree; i++) {
    sequence.push(1, 2);
  }

  if (souls % 3 === 1) {
    sequence.push(1);
  } else if (souls % 3 === 2) {
    sequence.unshift(2);
  }

  return sequence;
};
