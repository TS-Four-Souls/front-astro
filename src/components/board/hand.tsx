import { socket } from "@/utils/socket";
import { useGameContext } from "./contexts/game-context";
import { useToastContext } from "./contexts/toast-context";
import { usePromptContext } from "./contexts/prompt-context";
import type { SelectionItem } from "@/shared/api";
import { cn } from "@/utils/cn";
import { Pile } from "./pile";
import {
  boardSelectionTargetId,
  useBoardSelectionContext,
} from "./contexts/board-selection-context";
import { startHybridSelectionFlow } from "./selection-flow";
import { HotkeyScope } from "@/utils/hotkey";
import { getSelectionClassName } from "./selection-class";

export const Hand = () => {
  const { state, issuer, isHandUp, setIsHandUp } = useGameContext();
  const { toast, block } = useToastContext();
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

  const playCard = (index: number, selections: SelectionItem[] = []) => {
    setIsHandUp(false);
    socket.emit(
      "playCard",
      { issuer, index, effectIndex: "tap", targetChoices: selections },
      (response) => {
        switch (response.status) {
          case 200:
            if (response.response.complete) {
              toast("success", "Card played", response.response.description);
            } else if (response.response.options.length === 0) {
              toast("error", "Cannot play this card", "No options available");
            } else {
              const promptId = `card-play-${index}-${selections.length}`;
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
                  playCard(index, [...selections, ...additionalSelections]);
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
            toast("error", "Failed to play card", response.error);
            break;
        }
      },
    );
  };

  const cardSize = isHandUp ? 350 : 320;

  const targetableCards = state.me.hand
    .filter((_, index) => isHandUp && index < 8)
    .map((card) => card.slug);

  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 flex place-content-center place-items-center">
      <div
        className={cn(
          "pointer-events-auto grid auto-cols-fr grid-flow-col transition-transform duration-500",
          isHandUp ? "translate-y-0" : "translate-y-[35%]",
        )}
        onMouseEnter={() => setIsHandUp(true)}
        onMouseLeave={() => setIsHandUp(false)}>
        {state.me.hand.map((card, index) => (
          (() => {
            const targetId = boardSelectionTargetId.meHand(index, card.slug);
            const selectionState = getTargetSelectionState(targetId);
            const selectionHotkey = getTargetSelectionHotkey(targetId);

            return (
          <Pile
            key={card.slug}
            cards={[{ slug: card.slug }]}
            className={cn(
              "m-1 transition-transform",
              selectionState.selectable
                ? "cursor-pointer hover:-translate-y-10"
                : state.me.capabilities.useLoot === true
                ? "cursor-pointer hover:-translate-y-10"
                : "cursor-not-allowed",
            )}
            tooltip={
              isHandUp
                ? {
                    capable: state.me.capabilities.useLoot,
                    title: "Cannot play this card",
                  }
                : undefined
            }
            onClickTopCardHotkey={
              selectionHotkey
                ? selectionHotkey
                : activeRequestId
                  ? undefined
                : targetableCards.includes(card.slug)
                ? `${targetableCards.indexOf(card.slug) + 1},shift+${targetableCards.indexOf(card.slug) + 1}`
                : undefined
            }
            onClickTopCardHotkeyScope={
              selectionHotkey ? [HotkeyScope.Selection] : [HotkeyScope.Main]
            }
            disabled={
              selectionState.selectable
                ? false
                : state.me.capabilities.useLoot !== true
            }
            onClickTopCard={() =>
              selectionState.selectable
                ? selectTarget(targetId)
                : activeRequestId
                  ? cancelBoardSelection()
                : block(
                    "Cannot play this card",
                    state.me.capabilities.useLoot,
                    () => playCard(index),
                  )
            }
            topCardClassName={getSelectionClassName(selectionState, {
              selectedClassName:
                "-translate-y-10 scale-[1.03] outline-[0.2em] outline-green-300 glow-5",
              selectableClassName: "outline-[0.2em] outline-green-500/80",
            })}
            size={cardSize}
            enableRandomRotation={false}
          />
            );
          })()
        ))}
      </div>
    </div>
  );
};
