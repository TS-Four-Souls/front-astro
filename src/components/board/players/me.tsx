import { PlayerStats } from "../player-stats";
import { Pile } from "../pile";
import { useEffect } from "react";
import { useGameContext } from "../contexts/game-context";
import { usePromptContext } from "../contexts/prompt-context";
import { socket } from "@/utils/socket";
import { useToastContext } from "../contexts/toast-context";
import type { InPlayMeCard, SelectionItem } from "@/shared/api";
import { tooltip } from "@/utils/tooltip";

export const Me = () => {
  const { state, issuer } = useGameContext();
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();

  useEffect(() => {
    const pendingSelection = state.me.pendingSelection;
    if (pendingSelection) {
      addPrompt({
        promptId: pendingSelection.requestId,
        isUnique: true,
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
                  isUnique: false,
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
        isUnique: false,
        prompt: "Select an effect to activate",
        options: effects,
        minCount: 1,
        maxCount: 1,
        onSubmit: (selectedEffect) => {
          activateCard(selectedEffect[0].index);
          removePrompt(promptId);
        },
      });
    } else if (card.effects && card.effects.length === 1) {
      activateCard(card.effects[0].index);
    }
  };

  return (
    <div className="col-start-2 row-start-3 flex flex-col place-content-center place-items-center gap-6 transform-3d">
      <PlayerStats
        name={state.me.name}
        coins={state.me.coins}
        souls={state.me.souls}
        isEngagedInCombat={state.me.isEngagedInCombat}
        isEngagedInPurchase={state.me.isEngagedInPurchase}
      />
      <div
        className="grid grid-cols-7 gap-2 transform-3d"
        style={{
          gridTemplateColumns: `repeat(${Math.min(state.me.inPlay.length, 8)}, 1fr)`,
        }}>
        {state.me.inPlay.map((card, index) => (
          <Pile
            key={card.slug}
            cards={[
              {
                ...card,
                stats:
                  index === 0
                    ? {
                        healthPoints: state.me.currentHealthPoints,
                        attackPoints: state.me.currentAttackPoints,
                      }
                    : undefined,
              },
            ]}
            disabled={card.capabilities.activate !== true}
            tooltip={tooltip(
              "Cannot activate this card",
              card.capabilities.activate,
            )}
            onClickTopCard={() =>
              block(
                "Cannot activate this card",
                card.capabilities.activate,
                () => onInPlayCardClick(card, index),
              )
            }
          />
        ))}
      </div>
    </div>
  );
};
