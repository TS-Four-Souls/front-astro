import { socket } from "@/utils/socket";
import { useGameContext } from "./contexts/game-context";
import { useToastContext } from "./contexts/toast-context";
import { usePromptContext } from "./contexts/prompt-context";
import type { SelectionItem } from "@/shared/api";
import { cn } from "@/utils/cn";
import { Pile } from "./pile";

export const Hand = () => {
  const { state, issuer, isHandUp, setIsHandUp } = useGameContext();
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();

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
              addPrompt({
                promptId,
                isUnique: false,
                prompt: response.response.description,
                options: response.response.options,
                minCount: response.response.asMany
                  ? 0
                  : response.response.count,
                maxCount: response.response.count,
                onSubmit: (additionalSelections) => {
                  playCard(index, [...selections, ...additionalSelections]);
                  removePrompt(promptId);
                },
                onCancel: () => {
                  removePrompt(promptId);
                },
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

  const cardSize = 350;

  const targetableCards = state.me.hand
    .filter((_, index) => isHandUp && index < 8)
    .map((card) => card.slug);

  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 flex place-content-center place-items-center">
      <div
        className={cn(
          "pointer-events-auto grid translate-y-1/2 auto-cols-fr grid-flow-col transition-transform duration-500",
          isHandUp && "translate-y-0",
        )}
        onMouseEnter={() => setIsHandUp(true)}
        onMouseLeave={() => setIsHandUp(false)}>
        {state.me.hand.map((card, index) => (
          <Pile
            globalId={card.globalId}
            key={card.slug}
            cards={[{ slug: card.slug }]}
            className={cn(
              "m-1 transition-transform",
              state.me.capabilities.useLoot === true
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
              targetableCards.includes(card.slug)
                ? `${targetableCards.indexOf(card.slug) + 1},shift+${targetableCards.indexOf(card.slug) + 1}`
                : undefined
            }
            disabled={state.me.capabilities.useLoot !== true}
            onClickTopCard={() =>
              block(
                "Cannot play this card",
                state.me.capabilities.useLoot,
                () => playCard(index),
              )
            }
            size={cardSize}
            enableRandomRotation={false}
          />
        ))}
      </div>
    </div>
  );
};
