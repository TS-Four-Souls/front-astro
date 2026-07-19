import { Gear } from "@/icons/gear";
import { TeamIcon } from "@/icons/team-icon";
import type { Player, PlayerMe } from "@/shared/api";
import { cn } from "@/utils/cn";
import { HotkeyScope } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "../button";
import { translateError } from "../../utils/translate";
import { Card } from "./card";
import { useGameAnimation } from "./contexts/game-animation";
import { useGameContext } from "./contexts/game-context";
import { useMainMenuContext } from "./contexts/main-menu-context";
import { usePopoverContext } from "./contexts/popover-context";
import { usePromptContext } from "./contexts/prompt-context";
import { useToastContext } from "./contexts/toast-context";
import { useTooltip } from "./use-tooltip";
import { t } from "../../utils/translate";

interface PlayerStatsProps {
  player: Player | PlayerMe;
  className?: string;
}

export const PlayerStats = ({ player, className }: PlayerStatsProps) => {
  const { state } = useGameContext();
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();
  const { setPopover, closePopover } = usePopoverContext();
  const { openMenu } = useMainMenuContext();
  const { registerPlayerAnchor } = useGameAnimation();
  const soulAnchorRef = useRef<HTMLDivElement | null>(null);

  const { name, color, coins, souls, soulCards } = player;

  const isCurrentTurn = state.turn === name;
  const isMe = state.me.name === name;

  const declareAttack = () => {
    socket.emit("declareAttack", (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("gameStep.declareAttackButton.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  const rollDice = () => {
    socket.emit("attackRoll", (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("gameStep.rollDiceButton.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  const declarePurchase = () => {
    socket.emit("declarePurchase", (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("gameStep.purchase.declarePurchaseButton.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  const cancelPurchase = () => {
    socket.emit("cancelPurchase", (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("gameStep.purchase.abandonPurchaseButton.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  const onEndTurnPress = () => {
    socket.emit("endTurn", (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("gameStep.endTurnButton.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  const onSwitchToCopyPress = () => {
    socket.emit("switchToCopy", { name }, (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("gameStep.switchToCopy.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  const onCoinPress = () => {
    if (state.me.coins === 0) {
      toast(
        "error",
        t("gameStep.giveCoins.errorToast.title"),
        t("gameStep.giveCoins.errorToast.noCoinsMessage"),
      );
      return;
    }

    const promptId = `coin-prompt-${Date.now()}`;
    addPrompt<{ type: "number"; payload: number }>({
      promptId: `coin-prompt-${Date.now()}`,
      isUnique: false,
      prompt: t("gameStep.giveCoins.popup.title"),
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
        removePrompt(promptId);
        socket.emit(
          "giveCoins",
          { coins: selections[0].payload, target: name },
          (response) => {
            if (response.status === 200) {
            } else {
              toast(
                "error",
                t("gameStep.giveCoins.errorToast.title"),
                translateError(response.error),
              );
            }
          },
        );
      },
      onCancel: () => {
        removePrompt(promptId);
      },
    });
  };

  const { setTooltip: setCoinTooltip, closeTooltip: closeCoinTooltip } =
    useTooltip(
      player.capabilities.canDonateCoinsTo === true && !isMe
        ? {
            enabled: true,
            title: t("gameStep.giveCoins.tooltip.title"),
            content: t("gameStep.giveCoins.tooltip.message"),
          }
        : {
            title: t("gameStep.giveCoins.blockedTooltip.title"),
            capable: player.capabilities.canDonateCoinsTo,
          },
    );

  const { setTooltip: setSwitchToTooltip, closeTooltip: closeSwitchToTooltip } =
    useTooltip(
      player.capabilities.canSwitchTo === true && !isMe
        ? {
            enabled: true,
            title: t("capability.SwitchToCopy"),
            content: t("capability.switchOk"),
          }
        : {
            title: t("capability.cannotSwitchToCopy"),
            capable: player.capabilities.canSwitchTo,
          },
    );

  const nextMeInstance = state.players.find(
    (p) => p.capabilities.canSwitchTo === true,
  );
  const isNextInstance =
    nextMeInstance !== undefined && nextMeInstance.name === name;

  useHotkeys("s", onSwitchToCopyPress, {
    enabled: isNextInstance,
    scopes: [HotkeyScope.Main],
  });

  return (
    <div
      className={cn(
        "flex place-items-center gap-16 rounded-xl border-[0.2em] border-taupe-900/50 bg-board/90 p-3 pr-4 pl-6 text-white outline-[0.2em] outline-transparent transition-shadow duration-500",
        className,
      )}
      style={{
        background: isCurrentTurn
          ? `radial-gradient(circle at center, var(--color-board) 0%, ${color} 500%)`
          : undefined,
      }}>
      <p
        className={cn(
          "inline-flex place-items-center gap-1 text-center font-alt-stats font-bold uppercase text-shadow-lg text-shadow-taupe-950/20",
          player.capabilities.canSwitchTo === true
            ? "cursor-pointer transition-transform duration-100 hover:scale-108"
            : "cursor-not-allowed",
        )}
        style={{ color }}
        onMouseEnter={setSwitchToTooltip}
        onMouseLeave={closeSwitchToTooltip}
        onClick={onSwitchToCopyPress}>
        {isNextInstance && (
          <img src="/input-prompts/keyboard_s_outline.svg" className="size-6" />
        )}
        <TeamIcon team={player.team} className="size-5 shrink-0" />
        {name}
      </p>
      <div
        onMouseEnter={setCoinTooltip}
        onMouseLeave={closeCoinTooltip}
        className={cn(
          "flex items-center gap-1",
          player.capabilities.canDonateCoinsTo === true
            ? "cursor-pointer"
            : "cursor-not-allowed",
        )}
        onClick={() =>
          block(
            t("gameStep.giveCoins.blockedTooltip.title"),
            player.capabilities.canDonateCoinsTo,
            onCoinPress,
          )
        }>
        <img
          ref={(el) => registerPlayerAnchor(name, "coins", el)}
          src="/coin.png"
          className="size-6 rounded-full shadow-lg shadow-taupe-800/30"
          draggable={false}
        />
        <span className="text-shadow-lg text-shadow-taupe-800/70">:</span>{" "}
        <span className="font-statblock text-4xl text-shadow-lg text-shadow-taupe-800/70">
          {coins}
        </span>
      </div>

      <div
        ref={(el) => {
          soulAnchorRef.current = el;
          registerPlayerAnchor(name, "souls", el);
        }}
        className={cn(
          "flex min-h-8 min-w-6 flex-row-reverse items-center",
          souls > 0 && "cursor-pointer",
        )}
        onMouseEnter={() => {
          if (soulAnchorRef.current && soulCards.length > 0) {
            const rect = soulAnchorRef.current.getBoundingClientRect();
            setPopover({
              anchor: rect,
              content: (
                <div className="flex w-max flex-nowrap gap-4">
                  {soulCards.map((card, index) => (
                    <Card card={card} key={index} size={22} />
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
          .toReversed()
          .map((type, index) => {
            return (
              <img
                src={`/${type === 1 ? "soul-1" : "soul-2"}.png`}
                className={cn(
                  type === 1 ? "h-6" : "h-8",
                  souls > 2 && "-ml-3",
                  "drop-shadow-lg drop-shadow-taupe-800/70",
                )}
                draggable={false}
                key={index}
              />
            );
          })}
      </div>

      {isMe && (
        <div className="flex items-center gap-4">
          <Button
            className="shadow-lg shadow-taupe-800/70"
            disabled={state.me.capabilities.endTurn !== true}
            hotkey="e"
            onClick={() =>
              block(
                t("gameStep.endTurnButton.blockedTooltip.title"),
                state.me.capabilities.endTurn,
                onEndTurnPress,
              )
            }
            tooltip={
              state.me.capabilities.endTurn === true
                ? {
                    enabled: state.me.numberOfCardsOverMaxHandSize > 0,
                    title: t("gameStep.endTurnButton.excessLootTooltip.title"),
                    content: t(
                      "gameStep.endTurnButton.excessLootTooltip.message",
                      {
                        value: String(state.me.numberOfCardsOverMaxHandSize),
                      },
                    ),
                    type: "warning",
                  }
                : {
                    title: t("gameStep.endTurnButton.blockedTooltip.title"),
                    capable: state.me.capabilities.endTurn,
                  }
            }
            label={t("gameStep.endTurnButton.label")}
          />
          {!state.me.isEngagedInPurchase && (
            <Button
              label={t("gameStep.purchase.declarePurchaseButton.label")}
              className="shadow-lg shadow-taupe-800/70"
              disabled={state.me.capabilities.declarePurchase !== true}
              hotkey="p"
              onClick={() =>
                block(
                  t(
                    "gameStep.purchase.declarePurchaseButton.blockedTooltip.title",
                  ),
                  state.me.capabilities.declarePurchase,
                  declarePurchase,
                )
              }
              tooltip={{
                title: t(
                  "gameStep.purchase.declarePurchaseButton.blockedTooltip.title",
                ),
                capable: state.me.capabilities.declarePurchase,
              }}
            />
          )}
          {state.me.isEngagedInPurchase && (
            <Button
              label={t("gameStep.purchase.abandonPurchaseButton.label")}
              className="shadow-lg shadow-taupe-800/70"
              disabled={state.me.capabilities.buyTreasure === true}
              tooltip={{
                title: t(
                  "gameStep.purchase.abandonPurchaseButton.blockedTooltip.title",
                ),
                capable:
                  state.me.capabilities.buyTreasure === true
                    ? t(
                        "gameStep.purchase.abandonPurchaseButton.blockedTooltip.ableToPurchaseMessage",
                      )
                    : true,
              }}
              hotkey="p"
              onClick={() =>
                block(
                  t(
                    "gameStep.purchase.abandonPurchaseButton.blockedTooltip.title",
                  ),
                  state.me.capabilities.buyTreasure === true
                    ? t(
                        "gameStep.purchase.abandonPurchaseButton.blockedTooltip.ableToPurchaseMessage",
                      )
                    : true,
                  cancelPurchase,
                )
              }
            />
          )}
          {!state.me.isEngagedInCombat && (
            <Button
              label={t("gameStep.declareAttackButton.label")}
              className="shadow-lg shadow-taupe-800/70"
              disabled={state.me.capabilities.declareAttack !== true}
              hotkey="a"
              onClick={() =>
                block(
                  t("gameStep.declareAttackButton.blockedTooltip.title"),
                  state.me.capabilities.declareAttack,
                  declareAttack,
                )
              }
              tooltip={{
                title: t("gameStep.declareAttackButton.blockedTooltip.title"),
                capable: state.me.capabilities.declareAttack,
              }}
            />
          )}
          {state.me.isEngagedInCombat && (
            <Button
              label={t("gameStep.rollDiceButton.label")}
              className="shadow-lg shadow-taupe-800/70"
              disabled={state.me.capabilities.rollDice !== true}
              tooltip={{
                title: t("gameStep.rollDiceButton.blockedTooltip.title"),
                capable: state.me.capabilities.rollDice,
              }}
              hotkey="a"
              onClick={() =>
                block(
                  t("gameStep.rollDiceButton.blockedTooltip.title"),
                  state.me.capabilities.rollDice,
                  rollDice,
                )
              }
            />
          )}
          <Gear
            className="size-5 cursor-pointer drop-shadow-lg drop-shadow-taupe-800"
            onClick={() => openMenu()}
          />
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
