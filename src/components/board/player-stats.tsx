import { TeamIcon } from "@/icons/team-icon";
import type { Player, PlayerMe } from "@/shared/api";
import { cn } from "@/utils/cn";
import { HotkeyScope } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ImgButton } from "../button";
import { Card } from "./card";
import { useGameAnimation } from "./contexts/game-animation";
import { useGameContext } from "./contexts/game-context";
import { usePopoverContext } from "./contexts/popover-context";
import { usePromptContext } from "./contexts/prompt-context";
import { useToastContext } from "./contexts/toast-context";
import { useTooltip } from "./use-tooltip";
import { useLanguageContext } from "../contexts/language-context";
import { gainCoinsCheat } from "./cheats";
import { Gear } from "@/icons/gear";
import { useMainMenuContext } from "./contexts/main-menu-context";

interface PlayerStatsProps {
  player: Player | PlayerMe;
  className?: string;
}

export const PlayerStats = ({ player, className }: PlayerStatsProps) => {
  const { translateError, t } = useLanguageContext();
  const { state, isCheatViewOpen, isSpectator } = useGameContext();
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();
  const { setPopover, closePopover } = usePopoverContext();
  const { openMenu } = useMainMenuContext();
  const { registerPlayerAnchor } = useGameAnimation();
  const soulAnchorRef = useRef<HTMLDivElement | null>(null);

  const { name, color, coins, souls, soulCards } = player;

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
        "flex place-items-center gap-16 rounded-xl text-white outline-[0.2em] outline-transparent duration-500",
        className,
      )}>
      <p
        className={cn(
          "text-stroke inline-flex place-items-center gap-1 text-center font-alt-stats font-bold uppercase",
          player.capabilities.canSwitchTo === true
            ? "cursor-pointer transition-transform duration-100 hover:scale-108 ease-out-back"
            : "cursor-not-allowed",
        )}
        style={{ color }}
        onMouseEnter={setSwitchToTooltip}
        onMouseLeave={closeSwitchToTooltip}
        onClick={onSwitchToCopyPress}>
        {isNextInstance && (
          <img src="/input-prompts/keyboard_s_outline.svg" className="size-6" />
        )}
        <TeamIcon team={player.team} className="icon-shadow size-5 shrink-0" />
        {name}
      </p>
      <div
        onMouseEnter={setCoinTooltip}
        onMouseLeave={closeCoinTooltip}
        className={cn(
          "relative flex items-center gap-1",
          player.capabilities.canDonateCoinsTo === true
            ? "cursor-pointer transition-[scale] ease-out-back hover:scale-110"
            : "cursor-not-allowed",
        )}
        onClick={() =>
          block(
            t("gameStep.giveCoins.blockedTooltip.title"),
            player.capabilities.canDonateCoinsTo,
            onCoinPress,
          )
        }>
        {isMe && isCheatViewOpen && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              gainCoinsCheat({
                addPrompt,
                removePrompt,
                toast,
                t,
                translateError,
              });
            }}
            className="cheat-button absolute -top-2 -left-2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-[12px] leading-none font-bold text-white hover:brightness-110"
            aria-label="Add coins cheat">
            +
          </button>
        )}
        <img
          ref={(el) => registerPlayerAnchor(name, "coins", el)}
          src="/coin.png"
          className="size-6 rounded-full"
          draggable={false}
        />
        <span className="text-stroke">:</span>{" "}
        <span className="text-stroke font-statblock text-4xl">{coins}</span>
      </div>

      <div
        ref={(el) => {
          soulAnchorRef.current = el;
          registerPlayerAnchor(name, "souls", el);
        }}
        className={cn(
          "icon-shadow flex flex-row-reverse items-center",
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
                    <Card
                      card={card}
                      key={index}
                      size={22}
                      orientation={card.orientation}
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
                className={cn(type === 1 ? "h-6" : "h-8", souls > 2 && "-ml-3")}
                draggable={false}
                key={index}
              />
            );
          })}
      </div>

      {isMe && (
        <div className="flex items-center gap-2">
          <ImgButton
            frontImage="End_turn_Icon.png"
            frontHoverImage="End_turn_Icon_hover.png"
            backgroundImage="Button_Small.png"
            className="rotate-5"
            enabledClassName="hover:rotate-10"
            size={64}
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
                ? state.me.numberOfCardsOverMaxHandSize > 0
                  ? {
                      enabled: true,
                      title: t(
                        "gameStep.endTurnButton.excessLootTooltip.title",
                      ),
                      content: t(
                        "gameStep.endTurnButton.excessLootTooltip.message",
                        {
                          value: String(state.me.numberOfCardsOverMaxHandSize),
                        },
                      ),
                      type: "warning",
                    }
                  : {
                      enabled: true,
                      title: t("gameStep.endTurnButton.label"),
                    }
                : {
                    title: t("gameStep.endTurnButton.blockedTooltip.title"),
                    capable: state.me.capabilities.endTurn,
                  }
            }
          />
          <ImgButton
            frontImage={
              state.me.isEngagedInPurchase
                ? "Cancel_Purchase_Icon.png"
                : "Declare_Purchase_Icon.png"
            }
            frontHoverImage={
              state.me.isEngagedInPurchase
                ? "Cancel_Purchase_Icon_hover.png"
                : "Declare_Purchase_Icon_hover.png"
            }
            className="-rotate-5"
            enabledClassName="hover:rotate-0"
            backgroundImage="Button_Small.png"
            size={64}
            disabled={
              state.me.isEngagedInPurchase
                ? state.me.capabilities.buyTreasure === true
                : state.me.capabilities.declarePurchase !== true
            }
            hotkey="p"
            onClick={() =>
              state.me.isEngagedInPurchase
                ? block(
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
                : block(
                    t(
                      "gameStep.purchase.declarePurchaseButton.blockedTooltip.title",
                    ),
                    state.me.capabilities.declarePurchase,
                    declarePurchase,
                  )
            }
            tooltip={
              state.me.isEngagedInPurchase
                ? state.me.capabilities.buyTreasure !== true
                  ? {
                      title: t("gameStep.purchase.abandonPurchaseButton.label"),
                      enabled: true,
                    }
                  : {
                      title: t(
                        "gameStep.purchase.abandonPurchaseButton.blockedTooltip.title",
                      ),
                      capable: t(
                        "gameStep.purchase.abandonPurchaseButton.blockedTooltip.ableToPurchaseMessage",
                      ),
                    }
                : state.me.capabilities.declarePurchase !== true
                  ? {
                      title: t(
                        "gameStep.purchase.declarePurchaseButton.blockedTooltip.title",
                      ),
                      capable: state.me.capabilities.declarePurchase,
                    }
                  : {
                      title: t("gameStep.purchase.declarePurchaseButton.label"),
                      enabled: true,
                    }
            }
          />
          <ImgButton
            frontImage={
              state.me.character.stats.isEngagedInCombat
                ? "Roll_Icon.png"
                : "Declare_Attack_Icon.png"
            }
            frontHoverImage={
              state.me.character.stats.isEngagedInCombat
                ? "Roll_Icon_hover.png"
                : "Declare_Attack_Icon_hover.png"
            }
            backgroundImage="Button_Small.png"
            size={64}
            disabled={
              state.me.character.stats.isEngagedInCombat
                ? state.me.capabilities.rollDice !== true
                : state.me.capabilities.declareAttack !== true
            }
            hotkey="a"
            onClick={() =>
              state.me.character.stats.isEngagedInCombat
                ? block(
                    t("gameStep.rollDiceButton.blockedTooltip.title"),
                    state.me.capabilities.rollDice,
                    rollDice,
                  )
                : block(
                    t("gameStep.declareAttackButton.blockedTooltip.title"),
                    state.me.capabilities.declareAttack,
                    declareAttack,
                  )
            }
            tooltip={
              state.me.character.stats.isEngagedInCombat
                ? state.me.capabilities.rollDice !== true
                  ? {
                      title: t("gameStep.rollDiceButton.blockedTooltip.title"),
                      capable: state.me.capabilities.rollDice,
                    }
                  : {
                      title: t("gameStep.rollDiceButton.label"),
                      enabled: true,
                    }
                : state.me.capabilities.declareAttack === true
                  ? {
                      title: t("gameStep.declareAttackButton.label"),
                      enabled: true,
                    }
                  : {
                      title: t(
                        "gameStep.declareAttackButton.blockedTooltip.title",
                      ),
                      capable: state.me.capabilities.declareAttack,
                    }
            }
          />
          {!isSpectator && (
            <Gear
              className="icon-shadow ml-6 size-6 cursor-pointer transition-[scale,rotate] ease-out-back hover:scale-120 hover:rotate-10"
              onClick={openMenu}
            />
          )}
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
