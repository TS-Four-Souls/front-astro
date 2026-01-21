import { socket } from "@/utils/socket";
import { CardImage } from "./card";
import { useGameContext } from "./contexts/game-context";
import { useToastContext } from "./contexts/toast-context";
import { usePromptContext } from "./contexts/prompt-context";
import type { SelectionItem } from "@/shared/api";
import { cn } from "@/utils/cn";
import { tooltip } from "@/utils/tooltip";

export const Hand = () => {
  const { state, issuer } = useGameContext();
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();

  const playCard = (index: number, selections: SelectionItem[] = []) => {
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

  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 flex place-content-center place-items-center">
      <div className="pointer-events-auto grid translate-y-1/2 auto-cols-fr grid-flow-col transition-transform duration-500 hover:translate-y-0 hover:blur-none">
        {state.me.hand.map((card, index) => (
          <CardImage
            key={card.slug}
            card={card}
            className={cn(
              "m-1 max-h-[25vh] transition-transform",
              state.me.capabilities.useLoot === true
                ? "cursor-pointer hover:-translate-y-10"
                : "cursor-not-allowed",
            )}
            tooltip={tooltip(
              "Cannot play this card",
              state.me.capabilities.useLoot,
            )}
            onClick={() =>
              block(
                "Cannot play this card",
                state.me.capabilities.useLoot,
                () => playCard(index),
              )
            }
          />
        ))}
      </div>
    </div>
  );
};
