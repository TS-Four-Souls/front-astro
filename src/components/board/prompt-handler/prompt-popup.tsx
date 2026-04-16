import { Button } from "@/components/button";
import { Popup } from "@/components/popup";
import type { SelectionItem } from "@/shared/api";
import { cn } from "@/utils/cn";
import { HotkeyScope } from "@/utils/hotkey";
import { useHotkeys } from "react-hotkeys-hook";
import { CardImage, CardType } from "../card";
import { Person } from "@/icons/person";
import { Sword } from "@/icons/sword";
import { StackElement } from "../stack";

interface PromptPopupProps {
  onCancel?: () => void | undefined;
  prompt: string;
  options: SelectionItem[];
  minCount: number;
  maxCount: number;
  displayRow: boolean;
  isInformational: boolean;
  selectedOptions: SelectionItem[];
  addSelection: (option: SelectionItem) => void;
  removeSelection: (option: SelectionItem) => void;
  replaceSelection: (option: SelectionItem) => void;
  onSubmit: (selections: SelectionItem[]) => void;
  toggleMode?: () => void | undefined;
}

export const PromptPopup = ({
  onCancel,
  prompt,
  options,
  minCount,
  maxCount,
  displayRow,
  isInformational,
  selectedOptions,
  addSelection,
  removeSelection,
  replaceSelection,
  onSubmit,
  toggleMode,
}: PromptPopupProps) => {
  return (
    <Popup onPressBackdrop={onCancel}>
      <div className="flex flex-row justify-between gap-8">
        <h1 className="font-alt-stats text-2xl font-bold uppercase">
          {prompt}
        </h1>
        <div className="flex gap-2">
          {toggleMode && (
            <Button
              onClick={toggleMode}
              hotkey="tab"
              hotkeyScope={[HotkeyScope.Popup]}
              label="Use board selection"
            />
          )}
          {onCancel && (
            <Button
              onClick={onCancel}
              hotkey="escape"
              hotkeyScope={[HotkeyScope.Popup]}
              label={isInformational ? "Close" : "Cancel"}
            />
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex grow flex-wrap gap-2 overflow-auto",
          displayRow ? "flex-col" : "flex-row justify-center",
        )}>
        {options.map((option, index) => {
          const selectionIndex = selectedOptions.findIndex((o) => o === option);
          const canAddMore = selectedOptions.length < maxCount;
          const isSingularSelection = maxCount === 1;

          const isSelected = selectionIndex >= 0;
          const isIndexVisible = isSelected && maxCount > 1;

          const hotkey = index < 10 ? `${(index + 1) % 10}` : undefined;

          return (
            <PromptOption
              key={index}
              option={option}
              isSelected={isSelected}
              selectionIndex={isIndexVisible ? selectionIndex + 1 : undefined}
              hotkey={hotkey}
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
      {!isInformational && (
        <Button
          onClick={() => onSubmit(selectedOptions)}
          disabled={
            selectedOptions.length < minCount ||
            selectedOptions.length > maxCount
          }
          theme="onLight"
          hotkey="enter"
          hotkeyScope={[HotkeyScope.Popup]}
          label="Submit"
        />
      )}
    </Popup>
  );
};

interface PromptOptionProps {
  option: SelectionItem;
  isSelected: boolean;
  selectionIndex: number | undefined;
  hotkey?: string;
  onPress?: () => void;
}

export const PromptOption = ({
  option,
  isSelected,
  selectionIndex,
  hotkey,
  onPress,
}: PromptOptionProps) => {
  useHotkeys(hotkey ?? "", () => onPress?.(), {
    scopes: [HotkeyScope.Popup],
    enabled: onPress !== undefined && !!hotkey,
  });

  return (
    <div
      className={cn(
        "relative flex w-max flex-row place-items-center gap-2 rounded-md border-2 border-stone-500 p-2 select-none",
        isSelected ? "border-blue-600 bg-blue-600" : "bg-stone-600",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      {hotkey && (
        <div className="absolute top-0 left-0 flex aspect-square w-6 place-items-center overflow-hidden rounded-sm bg-stone-700 outline-[0.1em] -outline-offset-[0.1em] outline-stone-200">
          <img
            src={`/input-prompts/keyboard_${hotkey.split(",")[0]}_outline.svg`}
            className="scale-170"
          />
        </div>
      )}
      {selectionIndex && (
        <div className="absolute top-0 right-0 flex size-12 items-center justify-center rounded-xl border-4 border-stone-300 bg-stone-800 text-sm font-bold text-stone-200">
          {selectionIndex}
        </div>
      )}
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
    case "deck":
      return <DeckOption option={option} />;
    case "card":
      return <CardOption option={option} />;
    case "couplePlayerHand":
      return <CouplePlayerHandOption option={option} />;
    case "boolean":
      return <BooleanOption option={option} />;
    case "number":
      return <NumberOption option={option} />;
    case "object":
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
        <p className="text-center font-main font-bold uppercase">
          {option.payload.name}
        </p>
      </div>
      <CardImage card={option.payload} className="h-64" />
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
        <p className="text-center font-main font-bold uppercase">
          {option.payload.name}
        </p>
      </div>
      <CardImage card={option.payload} className="h-64" />
    </div>
  );
};

export const DeckOption = ({
  option,
}: {
  option: Extract<SelectionItem, { type: "deck" }>;
}) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-row items-center gap-2">
        <p className="text-center font-main font-bold uppercase">
          {option.payload}
        </p>
      </div>
      <CardImage
        card={option.payload as CardType /* TODO: use type from api */}
        className="h-64"
      />
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

export const BooleanOption = ({
  option,
}: {
  option: Extract<SelectionItem, { type: "boolean" }>;
}) => {
  return (
    <p className="w-60 p-4 text-center text-lg font-bold">
      {option.payload ? "Yes" : "No"}
    </p>
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

export const CardOption = ({
  option,
}: {
  option: Extract<SelectionItem, { type: "card" }>;
}) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <CardImage card={option.payload} className="h-64" />
    </div>
  );
};

export const CouplePlayerHandOption = ({
  option,
}: {
  option: Extract<SelectionItem, { type: "couplePlayerHand" }>;
}) => {
  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-row items-center gap-2">
          <Person className="size-6" />
          <p className="text-center text-lg font-bold">
            {option.payload.player.name}
          </p>
        </div>
        <CardImage card={option.payload.player} className="h-64" />
      </div>
      <div className="mx-2 h-64" />
      {option.payload.hand.map((card) => (
        <CardImage key={card.slug} card={card} className="h-64" />
      ))}
    </div>
  );
};

export const NumberOption = ({
  option,
}: {
  option: Extract<SelectionItem, { type: "number" }>;
}) => {
  return (
    <p className="w-10 p-4 text-center text-lg font-bold">{option.payload}</p>
  );
};
