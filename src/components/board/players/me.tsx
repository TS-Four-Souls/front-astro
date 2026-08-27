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

export const Me = () => {
  const { ts, t, translateError } = useLanguageContext();
  const { state, isHandUp } = useGameContext();
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
                const promptId = `card-activation-${card.slug}-${index}-${effectIndex}-${selections.length}`;
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

      const promptId = `select-card-effect-${card.slug}-${index}`;
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
          const isCharacter = state.me.character === card;
          return (
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
                    engagedInCombat: isCharacter && state.me.isEngagedInCombat,
                    engagedInPurchase:
                      isCharacter && state.me.isEngagedInPurchase,
                    effects: isCharacter ? state.me.temporaryEffect : undefined,
                    counter: card.counter,
                    stats: isCharacter
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
                      isCharacter
                        ? {
                            healthPoints: state.me.currentHealthPoints,
                            attackPoints: state.me.currentAttackPoints,
                          }
                        : undefined
                    }
                    effects={isCharacter ? state.me.temporaryEffect : undefined}
                    counter={card.counter}
                    isEternal={card.eternal}
                    tooltip={{
                      title: t("gameStep.activate.blockedTooltip.title"),
                      capable: card.capabilities.activate,
                    }}
                  />
                )}
                onClickTopCard={() =>
                  block(
                    t("capability.cannotActivate"),
                    card.capabilities.activate,
                    () => onInPlayCardClick(card, index),
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
