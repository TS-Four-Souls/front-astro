import type { InPlayMeCard, SelectionItem } from "@/shared/api";
import { HotkeyScope } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { t, translateError } from "../../translation/translate";
import { CardHoverPreview } from "../card-hover-preview";
import { useGameAnimation } from "../contexts/game-animation";
import { useGameContext } from "../contexts/game-context";
import { useMainMenuContext } from "../contexts/main-menu-context";
import { usePromptContext } from "../contexts/prompt-context";
import { useToastContext } from "../contexts/toast-context";
import { Hand } from "../hand";
import { Pile } from "../pile";
import { PlayerStats } from "../player-stats";
import { toSeriTrans } from "../../translation/translate";

export const Me = () => {
  const { state, isHandUp } = useGameContext();
  const { toast, dismiss, block } = useToastContext();
  const { addPrompt, removePrompt, clearPrompts } = usePromptContext();
  const { registerInPlayCardEl } = useGameAnimation();
  const { openMenu } = useMainMenuContext();

  const pendingSelectionsToastIds = useRef<Map<string, string>>(new Map());
  const pendingSelectionsPrompts = useRef<string | undefined>(undefined);

  useHotkeys("escape", openMenu, {
    scopes: [HotkeyScope.Main],
    enabled: true,
  });

  useEffect(() => {
    clearPrompts();
  }, [state.me.name]);

  useEffect(() => {
    console.log("state", state);
    console.log("pendingSelections", pendingSelectionsToastIds.current);

    for (const [playerName, promptId] of pendingSelectionsToastIds.current) {
      if (!state.players.some((player) => player.name === playerName)) {
        dismiss(promptId);
        pendingSelectionsToastIds.current.delete(playerName);
      }
    }

    for (const player of state.players) {
      if (player.pendingSelection) {
        if (pendingSelectionsToastIds.current.has(player.name)) {
          continue;
        }
        const toastId = toast(
          "info",
          toSeriTrans("front.playerIsBusy", {player: player.name}),
          toSeriTrans("front.pleaseWaitForThemToFinishTheirSelection"),
          { duration: Infinity },
        );
        pendingSelectionsToastIds.current.set(player.name, toastId);
      } else {
        const toastId = pendingSelectionsToastIds.current.get(player.name);
        if (toastId) {
          dismiss(toastId);
          pendingSelectionsToastIds.current.delete(player.name);
        }
      }
    }
  }, [state.players, toast, dismiss]);

  useEffect(() => {
    const pendingSelection = state.me.pendingSelection;
    if (pendingSelection) {
      const promptId = `pending-selection-${pendingSelection.requestId}`;
      pendingSelectionsPrompts.current = promptId;
      addPrompt({
        promptId,
        isUnique: true,
        prompt: t(pendingSelection.description),
        options: pendingSelection.options,
        minCount: pendingSelection.min,
        maxCount: pendingSelection.max,
        canUseOnBoardSelection: pendingSelection.canUseOnBoardSelection,
        onSubmit: (selectedOptions) => {
          socket.emit(
            "submitSelection",
            {
              requestId: pendingSelection.requestId,
              selections: selectedOptions,
            },
            (response) => {
              switch (response.status) {
                case 200:
                  removePrompt(promptId);
                  break;
                case 400:
                  toast("error", toSeriTrans("front.failSubmit"), translateError(response.error));
                  break;
              }
            },
          );
        },
      });
    }
  }, [state.me.pendingSelection, addPrompt, removePrompt, toast]);

  const onInPlayCardClick = (card: InPlayMeCard, index: number) => {
    const activateCard = (
      effectIndex: number | "tap",
      selections: SelectionItem[] = [],
    ) => {
      socket.emit(
        "activate",
        { index, effectIndex, targetChoices: selections },
        (response) => {
          switch (response.status) {
            case 200:
              if (response.response.complete) {
              } else if (response.response.options.length === 0) {
                toast("error", toSeriTrans("front.cannotPlay"), toSeriTrans("front.noOptionsAvailable"));
              } else {
                const promptId = `card-activation-${card.slug}-${index}-${effectIndex}-${selections.length}`;
                addPrompt({
                  promptId,
                  isUnique: false,
                  prompt: t(response.response.description),
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
              toast("error", toSeriTrans("front.failActivateCard"), translateError(response.error));
              break;
          }
        },
      );
    };

    // First, check if the card has multiple effects
    // If it does, we need to first prompt the user to select an effect
    if (card.effects && card.effects.length > 1) {
      type EffectOption = SelectionItem & {
        index: number | "tap";
      };
      const effects: EffectOption[] = card.effects.map((effect) => ({
        type: "string",
        payload: effect.description,
        index: effect.index,
      }));

      const promptId = `select-card-effect-${card.slug}-${index}`;
      addPrompt<EffectOption>({
        promptId,
        isUnique: false,
        prompt: t(toSeriTrans("front.selectEffectToActivate")),
        options: effects,
        minCount: 1,
        maxCount: 1,
        onSubmit: (selectedEffect) => {
          activateCard(selectedEffect[0].index);
          removePrompt(promptId);
        },
        onCancel: () => {
          removePrompt(promptId);
        },
      });
    } else if (card.effects && card.effects.length === 1) {
      activateCard(card.effects[0].index);
    }
  };

  const targetableCards = state.me.inPlay
    .filter(
      (card) =>
        !isHandUp &&
        card.effects &&
        card.effects.length > 0 &&
        !state.me.isEngagedInPurchase &&
        state.monsters.capabilities.targetableDeck !== true &&
        !state.monsters.inPlay.some(
          (c) => c.top.stats?.capabilities.targetable === true,
        ),
    )
    .map((card) => card.slug)
    .slice(0, 9);

  return (
    <div className="col-start-2 row-start-3 flex flex-col place-content-center place-items-center gap-6">
      <PlayerStats player={state.me} />
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${Math.min(state.me.inPlay.length, 8)}, 1fr)`,
        }}>
        {state.me.inPlay.map((card, index) => (
          <div
            key={card.globalId}
            ref={(el) => registerInPlayCardEl(card.globalId, el)}>
            <Pile
              globalId={card.globalId}
              onClickTopCardHotkey={
                targetableCards.includes(card.slug)
                  ? `${targetableCards.indexOf(card.slug) + 1}`
                  : undefined
              }
              cards={[
                {
                  slug: card.slug,
                  charged: card.charged,
                  eternal: card.eternal,
                  engagedInCombat: index === 0 && state.me.isEngagedInCombat,
                  engagedInPurchase:
                    index === 0 && state.me.isEngagedInPurchase,
                  effects: index === 0 ? state.me.temporaryEffect : undefined,
                  counter: card.counter,
                  stats:
                    index === 0
                      ? {
                          healthPoints: state.me.currentHealthPoints,
                          attackPoints: state.me.currentAttackPoints,
                        }
                      : undefined,
                },
              ]}
              disabled={card.capabilities.activate !== true}
              onHoverPopover={() => (
                <CardHoverPreview
                  card={card}
                  stats={
                    index === 0
                      ? {
                          healthPoints: state.me.currentHealthPoints,
                          attackPoints: state.me.currentAttackPoints,
                        }
                      : undefined
                  }
                  effects={index === 0 ? state.me.temporaryEffect : undefined}
                  counter={card.counter}
                  isEternal={card.eternal}
                  tooltip={{
                    capable: card.capabilities.activate,
                    title: toSeriTrans("front.cannotActivateTitle"),
                  }}
                />
              )}
              onClickTopCard={() =>
                block(
                  toSeriTrans("capability.cannotActivate"),
                  card.capabilities.activate,
                  () => onInPlayCardClick(card, index),
                )
              }
            />
          </div>
        ))}
      </div>
      <Hand />
    </div>
  );
};
