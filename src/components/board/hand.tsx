import type { SelectionItem } from "@/shared/api";
import { cn } from "@/utils/cn";
import { socket } from "@/utils/socket";
import { CardHoverPreview } from "./card-hover-preview";
import { useGameAnimation } from "./contexts/game-animation";
import { useGameContext } from "./contexts/game-context";
import { usePromptContext } from "./contexts/prompt-context";
import { useToastContext } from "./contexts/toast-context";
import { Pile } from "./pile";
import { useLanguageContext } from "../contexts/language-context";

export const Hand = () => {
  const { state, isHandUp, setIsHandUp } = useGameContext();
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();
  const { registerMeHandCardEl } = useGameAnimation();
  const { ts, t, translateError } = useLanguageContext();

  const playCard = (index: number, selections: SelectionItem[] = []) => {
    setIsHandUp(false);
    socket.emit(
      "activate",
      { index, effectIndex: "tap", targetChoices: selections, type: "hand" },
      (response) => {
        switch (response.status) {
          case 200:
            if (response.response.complete) {
            } else if (response.response.options.length === 0) {
              toast(
                "error",
                t("gameStep.play.errorToast.title"),
                t("gameStep.noOptionsAvailable"),
              );
            } else {
              const promptId = `card-play-${index}-${selections.length}`;
              addPrompt({
                promptId,
                isUnique: false,
                prompt: ts(response.response.description),
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
            toast(
              "error",
              t("gameStep.play.errorToast.title"),
              translateError(response.error),
            );
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
          "hand-pile pointer-events-auto grid auto-cols-fr grid-flow-col gap-2 transition-transform duration-500",
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
              topCardClassName="shadow-lg/30"
              enableRandomRotation={false}
              onHoverPopover={() => (
                <CardHoverPreview
                  card={card}
                  tooltip={{
                    capable: state.me.capabilities.useLoot,
                    title: t("gameStep.play.blockedTooltip.title"),
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
                  t("gameStep.play.blockedTooltip.title"),
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
