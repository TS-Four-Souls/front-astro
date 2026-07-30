import type { SelectionItem } from "@/shared/api";
import { useState, type SetStateAction, type Dispatch } from "react";
import { PromptPopup } from "./prompt-popup";
import { PromptBoardSelection } from "../prompt-board-selection";
import type { Prompt } from "../contexts/prompt-context";
import { t } from "@/utils/translate";

interface PromptHandlerProps<T extends SelectionItem = SelectionItem> {
  areOptionsOnBoard: boolean;
  prompt: Prompt<T>;
  setSelectedOptions: Dispatch<SetStateAction<SelectionItem[]>>;
  selectedOptions: SelectionItem[];
}
export const PromptHandler = (props: PromptHandlerProps) => {
  const {
    areOptionsOnBoard,
    prompt: promptProps,
    setSelectedOptions,
    selectedOptions,
  } = props;
  const { prompt, options, minCount, maxCount, onSubmit } = promptProps;
  const addSelection = (option: SelectionItem) => {
    setSelectedOptions((current) => [...current, option]);
  };

  const removeSelection = (option: SelectionItem) => {
    setSelectedOptions((current) => current.filter((o) => o !== option));
  };

  const replaceSelection = (option: SelectionItem) => {
    setSelectedOptions([option]);
  };

  const displayRow = options.some(
    (option) => option.type === "couplePlayerHand",
  );

  const isInformational = maxCount === 0;

  const onCancel =
    promptProps.onCancel ?? (isInformational ? () => onSubmit([]) : undefined);

  const [mode, setMode] = useState<"popup" | "board">(
    areOptionsOnBoard ? "board" : "popup",
  );

  const toggleMode = () => {
    setMode((current) => (current === "popup" ? "board" : "popup"));
  };

  return (
    <>
      {(mode === "popup") && (
        <PromptPopup
          onCancel={onCancel}
          prompt={prompt}
          options={options}
          minCount={minCount}
          maxCount={maxCount}
          displayRow={displayRow}
          isInformational={isInformational}
          selectedOptions={selectedOptions}
          addSelection={addSelection}
          removeSelection={removeSelection}
          replaceSelection={replaceSelection}
          onSubmit={onSubmit}
          toggleMode={{onClick: toggleMode, label: areOptionsOnBoard ? t("common.popup.useBoardSelectionButton") : t("common.popup.viewBoardButton")}}
        />
      )}
      {mode === "board" && (
        <PromptBoardSelection
          onCancel={onCancel}
          prompt={prompt}
          minCount={minCount}
          maxCount={maxCount}
          selectedOptions={selectedOptions}
          onSubmit={onSubmit}
          toggleMode={toggleMode}
        />
      )}
    </>
  );
};
