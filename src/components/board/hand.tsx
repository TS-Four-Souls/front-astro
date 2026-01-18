import { socket } from "@/utils/socket";
import { CardImage } from "./card";
import { useGameContext } from "./contexts/game-context";
import { useToastContext } from "./contexts/toast-context";
import { usePromptContext } from "./contexts/prompt-context";
import type { SelectionItem } from "@/shared/api";
import { cn } from "@/utils/cn";

export const Hand = () => {
  const { state, issuer } = useGameContext();
  const { toast } = useToastContext();
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
              console.log(
                "Prompting for additional selections",
                response.response.options,
              );
              addPrompt({
                prompt: response.response.description,
                options: response.response.options,
                minCount: response.response.count,
                maxCount: response.response.count,
                onSubmit: (additionalSelections) => {
                  playCard(index, [...selections, ...additionalSelections]);
                  removePrompt();
                },
                onCancel: () => {
                  removePrompt();
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
      <div className="pointer-events-auto grid translate-y-3/4 auto-cols-fr grid-flow-col transition-transform duration-600 hover:translate-y-0 hover:blur-none">
        {state.me.hand.map((card, index) => (
          <CardImage
            key={card.slug}
            card={card}
            className={cn(
              "m-1 max-h-[25vh] overflow-hidden rounded-lg shadow-3xl/100 transition-transform duration-300",
              state.me.capabilities.useLoot
                ? "cursor-pointer hover:-translate-y-10"
                : "cursor-not-allowed",
            )}
            onClick={() =>
              state.me.capabilities.useLoot ? playCard(index) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
};
