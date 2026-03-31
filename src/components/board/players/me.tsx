import { PlayerStats } from "../player-stats";
import { Pile } from "../pile";
import { useEffect, useRef, useState } from "react";
import { useGameContext } from "../contexts/game-context";
import { usePromptContext } from "../contexts/prompt-context";
import { socket } from "@/utils/socket";
import { useToastContext } from "../contexts/toast-context";
import type { InPlayMeCard, SelectionItem } from "@/shared/api";
import {
  boardSelectionTargetId,
  useBoardSelectionContext,
} from "../contexts/board-selection-context";
import { startHybridSelectionFlow } from "../selection-flow";
import { HotkeyScope } from "@/utils/hotkey";
import {
  getSelectionClassName,
  resolveActiveSelectionTarget,
} from "../selection-class";

export const Me = () => {
  const { state, issuer, isHandUp } = useGameContext();
  const { toast, dismiss, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();
  const {
    canStartBoardSelection,
    tryStartBoardSelection,
    clearBoardSelection,
    cancelBoardSelection,
    getTargetSelectionState,
    getTargetSelectionHotkey,
    selectTarget,
    activeRequestId,
  } = useBoardSelectionContext();
  const [selectionMode, setSelectionMode] = useState<"board" | "menu">("board");
  const [selectionModeRequestId, setSelectionModeRequestId] = useState<string | null>(
    null,
  );

  const pendingSelections = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    for (const player of state.players) {
      if (player.pendingSelection) {
        if (pendingSelections.current.has(player.name)) {
          continue;
        }
        const toastId = toast(
          "info",
          `${player.name} is busy`,
          "Please wait for them to finish their selection",
          { duration: Infinity },
        );
        pendingSelections.current.set(player.name, toastId);
      } else {
        const toastId = pendingSelections.current.get(player.name);
        if (toastId) {
          dismiss(toastId);
          pendingSelections.current.delete(player.name);
        }
      }
    }
  }, [state.players, toast, dismiss]);

  useEffect(() => {
    // Reset mode when a new pending-selection request arrives.
    // Defaulting to board mode keeps interactions fast when direct targets exist.
    const requestId = state.me.pendingSelection?.requestId ?? null;
    if (requestId !== selectionModeRequestId) {
      setSelectionModeRequestId(requestId);
      setSelectionMode("board");
    }
  }, [state.me.pendingSelection?.requestId, selectionModeRequestId]);

  useEffect(() => {
    const pendingSelection = state.me.pendingSelection;
    if (!pendingSelection) {
      if (activeRequestId && selectionModeRequestId === activeRequestId) {
        clearBoardSelection();
      }
      return;
    }

    const onSubmitSelection = (selectedOptions: SelectionItem[]) => {
      socket.emit(
        "submitSelection",
        {
          issuer,
          requestId: pendingSelection.requestId,
          selections: selectedOptions,
        },
        (response) => {
          switch (response.status) {
            case 200:
              clearBoardSelection();
              removePrompt(pendingSelection.requestId);
              break;
            case 400:
              toast("error", "Failed to submit selection", response.error);
              break;
          }
        },
      );
    };

    const boardSelectionAvailable = canStartBoardSelection({
      options: pendingSelection.options,
    });

    const shouldUseBoardSelection = boardSelectionAvailable && selectionMode === "board";

    if (shouldUseBoardSelection) {
      const startBoardSelection = tryStartBoardSelection({
        requestId: pendingSelection.requestId,
        prompt: pendingSelection.description,
        options: pendingSelection.options,
        minCount: pendingSelection.asMany ? 0 : pendingSelection.count,
        maxCount: pendingSelection.count,
        onSubmit: onSubmitSelection,
        onSwitchToMenu: () => setSelectionMode("menu"),
      });

      if (startBoardSelection) {
        removePrompt(pendingSelection.requestId);
        return;
      }
    }

    clearBoardSelection();

    addPrompt({
      promptId: pendingSelection.requestId,
      isUnique: true,
      prompt: pendingSelection.description,
      options: pendingSelection.options,
      minCount: pendingSelection.asMany ? 0 : pendingSelection.count,
      maxCount: pendingSelection.count,
      onSubmit: onSubmitSelection,
      onSwitchToBoardSelection: boardSelectionAvailable
        ? () => setSelectionMode("board")
        : undefined,
    });
  }, [
    state.me.pendingSelection,
    addPrompt,
    removePrompt,
    issuer,
    toast,
    canStartBoardSelection,
    tryStartBoardSelection,
    clearBoardSelection,
    activeRequestId,
    selectionModeRequestId,
    selectionMode,
  ]);

  const onInPlayCardClick = (card: InPlayMeCard, index: number) => {
    const activateCard = (
      effectIndex: number | "tap",
      selections: SelectionItem[] = [],
    ) => {
      socket.emit(
        "activate",
        { issuer, index, effectIndex, targetChoices: selections },
        (response) => {
          switch (response.status) {
            case 200:
              if (response.response.complete) {
                toast(
                  "success",
                  "Card activated",
                  response.response.description,
                );
              } else if (response.response.options.length === 0) {
                toast("error", "Cannot play this card", "No options available");
              } else {
                const promptId = `card-activation-${card.slug}-${index}-${effectIndex}-${selections.length}`;
                const options = response.response.options;
                const minCount = response.response.asMany ? 0 : response.response.count;
                const maxCount = response.response.count;

                startHybridSelectionFlow({
                  requestId: promptId,
                  prompt: response.response.description,
                  options,
                  minCount,
                  maxCount,
                  onSubmit: (additionalSelections) => {
                    activateCard(effectIndex, [
                      ...selections,
                      ...additionalSelections,
                    ]);
                  },
                  addPrompt,
                  removePrompt,
                  clearBoardSelection,
                  canStartBoardSelection,
                  tryStartBoardSelection,
                });
              }
              break;
            case 400:
            default:
              toast("error", "Failed to activate card", response.error);
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
        prompt: "Select an effect to activate",
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
    <div className="col-start-2 row-start-3 flex flex-col place-content-center place-items-center gap-6 transform-3d">
      <PlayerStats
        name={state.me.name}
        coins={state.me.coins}
        souls={state.me.souls}
        soulCards={state.me.soulCards}
        isEngagedInCombat={state.me.isEngagedInCombat}
        isEngagedInPurchase={state.me.isEngagedInPurchase}
      />
      <div
        className="grid gap-2 transform-3d"
        style={{
          gridTemplateColumns: `repeat(${Math.min(state.me.inPlay.length, 8)}, 1fr)`,
        }}>
        {state.me.inPlay.map((card, index) => (
          (() => {
            const cardTargetId = boardSelectionTargetId.meInPlay(index, card.slug);
            const entityTargetId =
              index === 0
                ? boardSelectionTargetId.playerEntity(state.me.name, card.slug)
                : undefined;

            const { targetId, selectionState, selectionHotkey } =
              resolveActiveSelectionTarget({
                targetIds: [cardTargetId, entityTargetId],
                fallbackTargetId: cardTargetId,
                getTargetSelectionState,
                getTargetSelectionHotkey,
              });

            return (
          <Pile
            key={card.slug}
            onClickTopCardHotkey={
              selectionHotkey ??
              (activeRequestId
                ? undefined
                : targetableCards.includes(card.slug)
                  ? `${targetableCards.indexOf(card.slug) + 1}`
                  : undefined)
            }
            onClickTopCardHotkeyScope={
              selectionHotkey ? [HotkeyScope.Selection] : [HotkeyScope.Main]
            }
            cards={[
              {
                slug: card.slug,
                charged: card.charged,
                eternal: card.eternal,
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
            disabled={
              selectionState.selectable ? false : card.capabilities.activate !== true
            }
            tooltip={{
              capable: card.capabilities.activate,
              title: "Cannot activate this card",
            }}
            topCardClassName={getSelectionClassName(selectionState)}
            onClickTopCard={() =>
              selectionState.selectable
                ? selectTarget(targetId)
                : activeRequestId
                  ? cancelBoardSelection()
                : block(
                    "Cannot activate this card",
                    card.capabilities.activate,
                    () => onInPlayCardClick(card, index),
                  )
            }
          />
            );
          })()
        ))}
      </div>
    </div>
  );
};
