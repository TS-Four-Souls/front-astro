import type { SelectionItem } from "@/shared/api";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { Card } from "./card";
import { Person } from "@/icons/person";
import { Sword } from "@/icons/sword";
import { StackElement } from "./stack";
import { Popup } from "../popup";

interface PromptPopupProps {
  /**
   * The prompt to display to the user
   */
  prompt: string;
  /**
   * The options to select from
   */
  options: SelectionItem[];
  /**
   * The minimum number of targets to select
   */
  minCount: number;
  /**
   * The maximum number of targets to select
   */
  maxCount: number;
  /**
   * The function to call when the user submits the prompt
   */
  onSubmit: (selections: SelectionItem[]) => void;
  /**
   * If the user cancels the prompt, this function will be called
   * If not provided, we consider the prompt is not cancellable
   */
  onCancel?: () => void;
}
export const PromptPopup = ({
  prompt,
  options,
  minCount,
  maxCount,
  onSubmit,
  onCancel,
}: PromptPopupProps) => {
  const [selectedOptions, setSelectedOptions] = useState<SelectionItem[]>([]);

  const addSelection = (option: SelectionItem) => {
    setSelectedOptions((current) => [...current, option]);
  };

  const removeSelection = (option: SelectionItem) => {
    setSelectedOptions((current) => current.filter((o) => o !== option));
  };

  const replaceSelection = (option: SelectionItem) => {
    setSelectedOptions([option]);
  };

  return (
    <Popup onPressBackdrop={onCancel}>
      <div className="flex flex-row justify-between gap-8">
        <h1 className="text-2xl font-bold">{prompt}</h1>
        {onCancel && (
          <button
            className="cursor-pointer rounded-md bg-stone-500/50 px-4 py-2 text-white transition-colors duration-300 hover:bg-stone-500"
            onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
      <div className="flex grow place-content-center gap-2">
        {options.map((option, index) => {
          const isSelected = selectedOptions.includes(option);
          const canAddMore = selectedOptions.length < maxCount;
          const isSingularSelection = maxCount === 1;

          return (
            <PromptOption
              key={index}
              option={option}
              isSelected={isSelected}
              onPress={
                isSelected
                  ? () => removeSelection(option)
                  : canAddMore
                    ? () => addSelection(option)
                    : isSingularSelection
                      ? () => replaceSelection(option)
                      : undefined
              }
            />
          );
        })}
        {options.length === 0 && (
          <div className="text-center text-lg text-stone-400">
            No options available
          </div>
        )}
      </div>
      <button
        disabled={
          selectedOptions.length < minCount || selectedOptions.length > maxCount
        }
        className="cursor-pointer rounded-md bg-stone-500 px-4 py-2 text-white transition-colors duration-300 not-disabled:hover:bg-stone-400 disabled:cursor-not-allowed disabled:opacity-30"
        onClick={() => onSubmit(selectedOptions)}>
        Submit
      </button>
    </Popup>
  );
};

interface PromptOptionProps {
  option: SelectionItem;
  isSelected: boolean;
  onPress?: () => void;
}

export const PromptOption = ({
  option,
  isSelected,
  onPress,
}: PromptOptionProps) => {
  return (
    <div
      className={cn(
        "flex flex-row place-content-center place-items-center gap-2 rounded-md border-2 border-stone-500 p-2 select-none",
        isSelected
          ? "border-stone-300 bg-stone-300 text-stone-900"
          : "bg-stone-600",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <GenericOption option={option} />
    </div>
  );
};

export const GenericOption = ({ option }: { option: SelectionItem }) => {
  switch (option.type) {
    case "player":
      return <PlayerOption option={option} />;
    case "monster":
      return <MonsterOption option={option} />;
    case "string":
      return <StringOption option={option} />;
    case "stackElement":
      return <StackElementOption option={option} />;
    case "number":
    case "boolean":
    case "object":
    case "card":
    case "couplePlayerHand":
    case "array":
    case "null":
    case "unknown":
    default:
      return <div>{option.type}</div>;
  }
};

export const PlayerOption = ({
  option,
}: {
  option: Extract<SelectionItem, { type: "player" }>;
}) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-row items-center gap-2">
        <Person className="size-6" />
        <p className="text-center text-lg font-bold">{option.payload.name}</p>
      </div>
      <Card card={option.payload} className="h-64" />
    </div>
  );
};

export const MonsterOption = ({
  option,
}: {
  option: Extract<SelectionItem, { type: "monster" }>;
}) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-row items-center gap-2">
        <Sword className="size-6" />
        <p className="text-center text-lg font-bold">{option.payload.name}</p>
      </div>
      <Card card={option.payload} className="h-64" />
    </div>
  );
};

export const StringOption = ({
  option,
}: {
  option: Extract<SelectionItem, { type: "string" }>;
}) => {
  return (
    <p className="w-60 p-4 text-center text-lg font-bold">{option.payload}</p>
  );
};

export const StackElementOption = ({
  option,
}: {
  option: Extract<SelectionItem, { type: "stackElement" }>;
}) => {
  return (
    <div className="rounded-md bg-stone-900 p-4 pr-12 text-xl">
      <StackElement element={option.payload} />
    </div>
  );
};
