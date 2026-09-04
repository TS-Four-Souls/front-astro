import type { InPlayMeCard, SelectionItem } from "@/shared/api";
import { HotkeyScope } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { CardHoverPreview } from "../card-hover-preview";
import { useGameAnimation } from "../contexts/game-animation";
import { useGameContext } from "../contexts/game-context";
import { useMainMenuContext } from "../contexts/main-menu-context";
import { usePromptContext } from "../contexts/prompt-context";
import { useToastContext } from "../contexts/toast-context";
import { Hand } from "../hand";
import { Pile } from "../pile";
import { PlayerStats } from "../player-stats";
import { useLanguageContext } from "@/components/contexts/language-context";
import { discardCardCheat } from "../cheats";

export const Me = () => {
  const { ts, t, translateError } = useLanguageContext();
  const { state, isHandUp, isCheatViewOpen, cheatRemovableCards } =
    useGameContext();
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt, clearPrompts } = usePromptContext();
  const { registerInPlayCardEl } = useGameAnimation();
  const { openMenu } = useMainMenuContext();

  const pendingSelectionsPrompts = useRef<string | undefined>(undefined);

  useHotkeys("escape", openMenu, {
    scopes: [HotkeyScope.Main],
    enabled: true,
  });

  useEffect(() => {
    clearPrompts();
  }, [state.me.name]);

  // Clear the prompts on component cleanup
  useEffect(() => {
    return () => clearPrompts();
  }, []);

  useEffect(() => {
    const pendingSelection = state.me.pendingSelection;
    if (pendingSelection) {
      const promptId = `pending-selection-${pendingSelection.requestId}`;
      pendingSelectionsPrompts.current = promptId;
      addPrompt({
        promptId,
        isUnique: true,
        prompt: ts(pendingSelection.description),
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
                  toast(
                    "error",
                    t("gameStep.pendingSelection.errorToast.title"),
                    translateError(response.error),
                  );
                  break;
              }
            },
          );
        },
      });
    } else if (pendingSelectionsPrompts.current) {
      removePrompt(pendingSelectionsPrompts.current);
    }
  }, [state.me.pendingSelection, addPrompt, removePrompt, toast]);

  const onTargetableCardClick = (card: InPlayMeCard) => {
    console.log("Attacking monster with card:", card);
    socket.emit("attackMonster", { card }, (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("gameStep.attack.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  const onInPlayCardClick = (card: InPlayMeCard, index: number) => {
    const activateCard = (
      effectIndex: number,
      selections: SelectionItem[] = [],
    ) => {
      socket.emit(
        "activateWithID",
        {
          index: index - 1,
          effectIndex,
          targetChoices: selections,
          type: card === state.me.character ? "character" : "inPlay",
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

  const targetableCards = [state.me.character, ...state.me.inPlay]
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
          gridTemplateColumns: `repeat(${Math.min(state.me.inPlay.length + 1, 8)}, 1fr)`,
        }}>
        {[state.me.character, ...state.me.inPlay].map((card, index) => {
          return (
            <div
              key={card.globalId}
              ref={(el) => registerInPlayCardEl(card.globalId, el)}>
              <Pile
                cheats={
                  isCheatViewOpen
                    ? {
                        discard: cheatRemovableCards.has(card.globalId)
                          ? () => discardCardCheat(card)
                          : undefined,
                      }
                    : undefined
                }
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
                    engagedInCombat: card.stats?.isEngagedInCombat === true,
                    engagedInPurchase:
                      state.me.character === card &&
                      state.me.isEngagedInPurchase,
                    effects: card.stats?.temporaryEffect,
                    counter: card.counter,
                    stats: card.stats,
                  },
                ]}
                disabled={
                  !card.stats || (card.effects && card.effects.length > 0)
                    ? card.capabilities.activate !== true
                    : card.stats.capabilities.targetable !== true
                }
                onHoverPopover={() => (
                  <CardHoverPreview
                    card={card}
                    stats={card.stats}
                    effects={card.stats?.temporaryEffect}
                    counter={card.counter}
                    isEternal={card.eternal}
                    tooltip={
                      !card.stats || (card.effects && card.effects.length > 0)
                        ? {
                            title: t("gameStep.activate.blockedTooltip.title"),
                            capable: card.capabilities.activate,
                          }
                        : {
                            title: t("gameStep.attack.blockedTooltip.title"),
                            capable: card.stats.capabilities.targetable,
                          }
                    }
                  />
                )}
                onClickTopCard={() =>
                  !card.stats || (card.effects && card.effects.length > 0)
                    ? block(
                        t("capability.cannotActivate"),
                        card.capabilities.activate,
                        () => onInPlayCardClick(card, index),
                      )
                    : block(
                        t("gameStep.attack.blockedTooltip.title"),
                        card.stats.capabilities.targetable,
                        () => onTargetableCardClick(card),
                      )
                }
              />
            </div>
          );
        })}
      </div>
      <Hand />
    </div>
  );
};
