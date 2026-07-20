import type { Card } from "@/shared/api";
import { usePromptContext } from "./contexts/prompt-context";
import { useLanguageContext } from "../contexts/language-context";

export const usePileDetails = () => {
  const { t } = useLanguageContext();
  const { addPrompt, removePrompt } = usePromptContext();

  const displayPileDetails = (cards?: Card[] | undefined) => {
    if (cards === undefined) {
      return;
    }

    const promptId = `pile-details-${Date.now()}`;
    addPrompt({
      promptId,
      isUnique: false,
      prompt: t("gameStep.pileDetails"),
      options: cards.map((card) => ({
        type: "card",
        payload: card,
      })),
      minCount: 0,
      maxCount: 0,
      onSubmit: () => {
        removePrompt(promptId);
      },
    });
  };

  return { displayPileDetails };
};
