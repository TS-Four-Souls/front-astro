import { cn } from "@/utils/cn";
import { useGameContext } from "./contexts/game-context";
import { socket } from "@/utils/socket";
import { useToastContext } from "./contexts/toast-context";
import { Gear } from "@/icons/gear";
import { Button } from "../button";
import { usePromptContext } from "./contexts/prompt-context";
import { usePopoverContext } from "./contexts/popover-context";
import { useRef } from "react";
import { CardImage } from "./card";
import { useMainMenuContext } from "./contexts/main-menu-context";
import { useGameAnimation } from "./contexts/game-animation";
import { useTooltip } from "./use-tooltip";
import type { Player, PlayerMe } from "@/shared/api";
import { TeamIcon } from "@/icons/team-icon";
import { useHotkeys } from "react-hotkeys-hook";
import { HotkeyScope } from "@/utils/hotkey";

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
        toast("error", "Failed to declare attack", response.error);
    });
  };

  const rollDice = () => {
    socket.emit("attackRoll", (response) => {
      if (response.status === 400)
        toast("error", "Failed to roll dice", response.error);
    });
  };

  const declarePurchase = () => {
    socket.emit("declarePurchase", (response) => {
      if (response.status === 400)
        toast("error", "Failed to declare purchase", response.error);
    });
  };

  const cancelPurchase = () => {
    socket.emit("cancelPurchase", (response) => {
      if (response.status === 400)
        toast("error", "Failed to cancel purchase", response.error);
    });
  };

  const onEndTurnPress = () => {
    socket.emit("endTurn", (response) => {
      if (response.status === 400)
        toast("error", "Failed to end turn", response.error);
    });
  };

  const onSwitchToCopyPress = () => {
    socket.emit("switchToCopy", { name }, (response) => {
      if (response.status === 400)
        toast("error", "Failed to switch to copy", response.error);
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
          { coins: selections[0].payload, target: name },
          (response) => {
            if (response.status === 200) {
              removePrompt(promptId);
            } else {
              toast("error", "Failed to give coins", response.error);
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
            title: "Donate coins",
            content: "You can donate coins to this player.",
          }
        : {
            title: "Cannot donate coins",
            capable: player.capabilities.canDonateCoinsTo,
          },
    );

  const { setTooltip: setSwitchToTooltip, closeTooltip: closeSwitchToTooltip } =
    useTooltip(
      player.capabilities.canSwitchTo === true && !isMe
        ? {
            enabled: true,
            title: "Switch to copy",
            content: "You can switch to this copy.",
          }
        : {
            title: "Cannot switch to copy",
            capable: player.capabilities.canSwitchTo,
          },
    );

  const nextMeInstance = state.players.find(
    (p) => p.capabilities.canSwitchTo === true,
  );
  const isNextInstance = nextMeInstance !== undefined && nextMeInstance.name === name;

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
            ? "cursor-pointer hover:scale-108 transition-transform duration-100"
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
            "Cannot donate coins",
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
                "Cannot end turn",
                state.me.capabilities.endTurn,
                onEndTurnPress,
              )
            }
            tooltip={
              state.me.capabilities.endTurn === true
                ? {
                    enabled: state.me.numberOfCardsOverMaxHandSize > 0,
                    title: "Excess loot cards",
                    content:
                      "You have " +
                      state.me.numberOfCardsOverMaxHandSize +
                      " cards over the max hand size.",
                    type: "warning",
                  }
                : {
                    title: "Cannot end turn",
                    capable: state.me.capabilities.endTurn,
                  }
            }
            label="End turn"
          />
          {!state.me.isEngagedInPurchase && (
            <Button
              label="Declare purchase"
              className="shadow-lg shadow-taupe-800/70"
              disabled={state.me.capabilities.declarePurchase !== true}
              hotkey="p"
              onClick={() =>
                block(
                  "Cannot declare purchase",
                  state.me.capabilities.declarePurchase,
                  declarePurchase,
                )
              }
              tooltip={{
                title: "Cannot declare purchase",
                capable: state.me.capabilities.declarePurchase,
              }}
            />
          )}
          {state.me.isEngagedInPurchase && (
            <Button
              label="Abandon purchase"
              className="shadow-lg shadow-taupe-800/70"
              disabled={state.me.capabilities.buyTreasure === true}
              tooltip={{
                title: "Cannot abandon purchase while able to buy treasure.",
                capable: state.me.capabilities.buyTreasure,
              }}
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
              className="shadow-lg shadow-taupe-800/70"
              disabled={state.me.capabilities.declareAttack !== true}
              hotkey="a"
              onClick={() =>
                block(
                  "Cannot declare attack",
                  state.me.capabilities.declareAttack,
                  declareAttack,
                )
              }
              tooltip={{
                title: "Cannot declare attack",
                capable: state.me.capabilities.declareAttack,
              }}
            />
          )}
          {state.me.isEngagedInCombat && (
            <Button
              label="Roll dice"
              className="shadow-lg shadow-taupe-800/70"
              disabled={state.me.capabilities.rollDice !== true}
              tooltip={{
                title: "Cannot roll dice",
                capable: state.me.capabilities.rollDice,
              }}
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
