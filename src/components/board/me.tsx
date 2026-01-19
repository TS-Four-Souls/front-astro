import { PlayerStats } from "./player-stats";
import { Pile } from "./pile";
import { useEffect } from "react";
import { useGameContext } from "./contexts/game-context";
import { usePromptContext } from "./contexts/prompt-context";
import { socket } from "@/utils/socket";
import { useToastContext } from "./contexts/toast-context";
import type { InPlayMeCard, SelectionItem } from "@/shared/api";

export const Me = () => {
  const { state, issuer } = useGameContext();
  const { toast } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();

  useEffect(() => {
    const pendingSelection = state.me.pendingSelection;
    if (pendingSelection) {
      addPrompt({
        promptId: pendingSelection.requestId,
        prompt: pendingSelection.description,
        options: pendingSelection.options,
        minCount: pendingSelection.asMany ? 0 : pendingSelection.count,
        maxCount: pendingSelection.count,
        onSubmit: (selectedOptions) => {
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
                  removePrompt(pendingSelection.requestId);
                  break;
                case 400:
                  toast("error", "Failed to submit selection", response.error);
                  break;
              }
            },
          );
        },
      });
    }
  }, [state.me.pendingSelection, addPrompt, removePrompt, issuer, toast]);

  const onInPlayCardClick = (card: InPlayMeCard, index: number) => {
    if (
      !card.capabilities.activate ||
      !card.effects ||
      card.effects.length === 0
    ) {
      return;
    }

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
                addPrompt({
                  promptId,
                  prompt: response.response.description,
                  options: response.response.options,
                  minCount: response.response.asMany
                    ? 0
                    : response.response.count,
                  maxCount: response.response.count,
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
        prompt: "Select an effect to activate",
        options: effects,
        minCount: 1,
        maxCount: 1,
        onSubmit: (selectedEffect) => {
          activateCard(selectedEffect[0].index);
          removePrompt(promptId);
        },
      });
    } else {
      activateCard(card.effects[0].index);
    }
  };

  return (
    <div className="col-start-2 row-start-3 mt-24 flex place-content-center items-start gap-8 transform-3d">
      <PlayerStats
        name={state.me.name}
        coins={state.me.coins}
        health={state.me.currentHealthPoints}
        attack={state.me.currentAttackPoints}
        souls={state.me.souls}
      />
      <div className="flex max-w-275 flex-wrap gap-1 transform-3d">
        {state.me.inPlay.map((card, index) => (
          <Pile
            key={card.slug}
            cards={[card]}
            onClickTopCard={
              card.capabilities.activate
                ? () => onInPlayCardClick(card, index)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
};
