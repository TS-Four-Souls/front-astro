import { socket } from "@/utils/socket";
import { useGameContext } from "./contexts/game-context";
import { useToastContext } from "./contexts/toast-context";
import { usePromptContext } from "./contexts/prompt-context";
import type { SelectionItem } from "@/shared/api";
import { cn } from "@/utils/cn";
import { Pile } from "./pile";
import { CardHoverPreview } from "./card-hover-preview";
import { useGameAnimation } from "./contexts/game-animation";

export const Hand = () => {
  const { state, issuer, isHandUp, setIsHandUp } = useGameContext();
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();
  const { registerMeHandCardEl } = useGameAnimation();

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
                minCount: response.response.min,
                maxCount: response.response.max,
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

  const targetableCards = state.me.hand
    .filter((_, index) => isHandUp && index < 10)
    .map((card) => card.slug);

  return (
    <div className="pointer-events-none flex place-content-center place-items-center">
      <div
        className={cn(
          "pointer-events-auto grid auto-cols-fr grid-flow-col gap-2 transition-transform duration-500",
        )}
        onMouseEnter={() => setIsHandUp(true)}
        onMouseLeave={() => setIsHandUp(false)}>
        {state.me.hand.map((card, index) => (
          <div
            key={card.slug}
            ref={(el) => registerMeHandCardEl(card.globalId, el)}>
            <Pile
              globalId={card.globalId}
              cards={[{ slug: card.slug }]}
              className={cn(
                "transition-transform",
                state.me.capabilities.useLoot === true
                  ? "cursor-pointer"
                  : "cursor-not-allowed",
              )}
              onHoverPopover={() => (
                <CardHoverPreview
                  card={card}
                  tooltip={{
                    capable: state.me.capabilities.useLoot,
                    title: "Cannot play this card",
                  }}
                />
              )}
              onClickTopCardHotkey={
                targetableCards.includes(card.slug)
                  ? `${(targetableCards.indexOf(card.slug) + 1) % 10},shift+${(targetableCards.indexOf(card.slug) + 1) % 10}`
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
              size={200}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
