import { Button } from "@/components/button";
import { Popup } from "@/components/popup";
import type { SelectionItem } from "@/shared/api";
import { cn } from "@/utils/cn";
import { HotkeyScope } from "@/utils/hotkey";
import { useHotkeys } from "react-hotkeys-hook";
import { Card, CardImage, CardType } from "../card";
import { Person } from "@/icons/person";
import { Sword } from "@/icons/sword";
import { StackElement } from "../stack";
import { SelectionIndexIndicator } from "../selection-index-indicator";
import { useMemo, useState } from "react";
import { ts, t } from "../../../utils/translate";
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
  const sortedOptions = options.every((o) => o.type === "stackElement")
    ? options.toReversed()
    : options;

  const canUseLookup = useMemo(() => {
    return sortedOptions.length > 10;
  }, [sortedOptions]);

  const [search, setSearch] = useState<string>("");

  const filteredOptions = useMemo(() => {
    const searchCleaned = search.trim().toLowerCase();
    if (searchCleaned.length === 0) {
      return sortedOptions;
    }
    return sortedOptions.filter((option) => {
      return JSON.stringify(option.payload)
        .toLowerCase()
        .includes(searchCleaned);
    });
  }, [sortedOptions, search]);

  return (
    <Popup
      onPressBackdrop={onCancel}
      className={cn(canUseLookup && "h-full w-full")}>
      <div className="flex flex-row justify-between gap-8">
        <h1 className="font-alt-stats text-2xl leading-tight font-bold uppercase">
          {prompt}
        </h1>
        <div className="flex gap-2">
          {canUseLookup && (
            <input
              className="w-48 rounded-md border-2 border-taupe-500 px-4"
              placeholder={t("front.search")}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
          {toggleMode && (
            <Button
              onClick={toggleMode}
              hotkey="tab"
              hotkeyScope={[HotkeyScope.Popup]}
              label={t("front.useBoardSelection")}
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
          "flex grow flex-wrap content-start gap-2 overflow-auto p-4",
          displayRow ? "flex-col" : "flex-row justify-center",
        )}>
        {filteredOptions.map((option, index) => {
          const selectionIndex = selectedOptions.indexOf(option);
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
        {sortedOptions.length === 0 && (
          <div className="text-center text-lg text-taupe-400">
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
          label={t("front.submit")}
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
    enabled: onPress !== undefined && hotkey !== undefined,
  });

  return (
    <GenericOption option={option} onPress={onPress} selected={isSelected}>
      {onPress !== undefined && hotkey !== undefined && (
        <div className="absolute top-0 left-0 flex aspect-square w-7 place-items-center overflow-hidden rounded-md bg-taupe-700 outline-3 outline-taupe-200">
          <img
            src={`/input-prompts/keyboard_${hotkey.split(",")[0]}_outline.svg`}
            className="scale-170"
            draggable={false}
          />
        </div>
      )}
      {selectionIndex && <SelectionIndexIndicator index={selectionIndex} />}
    </GenericOption>
  );
};

export const GenericOption = ({
  option,
  onPress,
  selected,
  children,
}: TemplateOptionProps<SelectionItem["type"]>) => {
  switch (option.type) {
    case "player":
      return (
        <PlayerOption
          option={option}
          onPress={onPress}
          selected={selected}
          children={children}
        />
      );
    case "monster":
      return (
        <MonsterOption
          option={option}
          onPress={onPress}
          selected={selected}
          children={children}
        />
      );
    case "cardEffect":
      return (
        <CardEffectOption
          option={option}
          onPress={onPress}
          selected={selected}
          children={children}
        />
      );
    case "string":
      return (
        <StringOption
          option={option}
          onPress={onPress}
          selected={selected}
          children={children}
        />
      );
    case "stackElement":
      return (
        <StackElementOption
          option={option}
          onPress={onPress}
          selected={selected}
          children={children}
        />
      );
    case "deck":
      return (
        <DeckOption
          option={option}
          onPress={onPress}
          selected={selected}
          children={children}
        />
      );
    case "card":
      return (
        <CardOption
          option={option}
          onPress={onPress}
          selected={selected}
          children={children}
        />
      );
    case "couplePlayerHand":
      return (
        <CouplePlayerHandOption
          option={option}
          onPress={onPress}
          selected={selected}
          children={children}
        />
      );
    case "character":
      return (
        <CharacterOption
          option={option}
          onPress={onPress}
          selected={selected}
          children={children}
        />
      );
    case "boolean":
      return (
        <BooleanOption
          option={option}
          onPress={onPress}
          selected={selected}
          children={children}
        />
      );
    case "number":
      return (
        <NumberOption
          option={option}
          onPress={onPress}
          selected={selected}
          children={children}
        />
      );
    case "object":
    case "array":
    case "null":
    case "unknown":
    default:
      return <div>{option.type}</div>;
  }
};

interface TemplateOptionProps<T extends SelectionItem["type"]> {
  option: Extract<SelectionItem, { type: T }>;
  selected: boolean;
  onPress: (() => void) | undefined;
  children: React.ReactNode;
}

export const CardEffectOption = ({
  option,
  onPress,
  children,
  selected,
}: TemplateOptionProps<"cardEffect">) => {
  console.log(option.payload);
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 p-2",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <Card
        card={option.payload.card}
        className={cn("shadow-lg/30", selected && "outline-6 outline-blue-400")}
        size={22}
        visualEffectBox={option.payload.visualEffectBox}
      />
      <div className="absolute inset-4">{children}</div>
    </div>
  );
};

export const PlayerOption = ({
  option,
  onPress,
  selected,
  children,
}: TemplateOptionProps<"player">) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <div className="flex flex-row items-center gap-2">
        <Person className="size-6" />
        <p className="text-center font-main font-bold uppercase">
          {ts(option.payload.nameKey)}
        </p>
      </div>
      <div className="relative">
        <CardImage
          card={option.payload}
          className={cn(
            "m-2 w-64 shadow-lg/30",
            selected && "outline-6 outline-blue-400",
          )}
        />
        <div className="absolute inset-4">{children}</div>
      </div>
    </div>
  );
};

export const MonsterOption = ({
  option,
  selected,
  onPress,
  children,
}: TemplateOptionProps<"monster">) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <div className="flex flex-row items-center gap-2">
        <Sword className="size-6" />
        <p className="text-center font-main font-bold uppercase">
          {ts(option.payload.nameKey)}
        </p>
      </div>
      <div className="relative">
        <CardImage
          card={option.payload}
          className={cn(
            "m-2 w-64 shadow-lg/30",
            selected && "outline-6 outline-blue-400",
          )}
        />
        <div className="absolute inset-4">{children}</div>
      </div>
    </div>
  );
};

export const DeckOption = ({
  option,
  selected,
  onPress,
  children,
}: TemplateOptionProps<"deck">) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <div className="flex flex-row items-center gap-2">
        <p className="text-center font-main font-bold uppercase">
          {option.payload}
        </p>
      </div>
      <div className="relative">
        <CardImage
          card={option.payload as CardType}
          className={cn(
            "m-2 w-64 shadow-lg/30",
            selected && "outline-6 outline-blue-400",
          )}
        />
        <div className="absolute inset-4">{children}</div>
      </div>
    </div>
  );
};

export const StringOption = ({
  option,
  selected,
  onPress,
  children,
}: TemplateOptionProps<"string">) => {
  return (
    <div
      className={cn(
        "relative flex w-max flex-row place-items-center gap-2 rounded-md border-2 bg-taupe-600 p-2",
        selected
          ? "border-blue-500 outline-2 outline-blue-400"
          : "border-taupe-500",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <p className={cn("w-60 p-4 text-center text-lg font-bold")}>
        {option.payload}
      </p>
      <div className="absolute inset-1">{children}</div>
    </div>
  );
};

export const BooleanOption = ({
  option,
  onPress,
  children,
  selected,
}: TemplateOptionProps<"boolean">) => {
  return (
    <div
      className={cn(
        "relative flex w-max flex-row place-items-center gap-2 rounded-md border-2 bg-taupe-600 p-2",
        selected
          ? "border-blue-500 outline-2 outline-blue-400"
          : "border-taupe-500",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <p className={cn("px-6 py-4 text-center text-lg font-bold")}>
        {option.payload ? "Yes" : "No"}
      </p>
      {children}
    </div>
  );
};

export const StackElementOption = ({
  option,
  onPress,
  children,
  selected,
}: TemplateOptionProps<"stackElement">) => {
  return (
    <div
      className={cn(
        "relative m-1 rounded-md bg-taupe-900 p-4 pr-12 text-xl",
        selected && "outline-4 outline-blue-400",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <StackElement element={option.payload} className="p-0 pl-6" />
      <div className="absolute inset-1">{children}</div>
    </div>
  );
};

export const CardOption = ({
  option,
  onPress,
  children,
  selected,
}: TemplateOptionProps<"card">) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <CardImage
        card={option.payload}
        className={cn(
          "m-2 w-64 shadow-lg/30",
          selected && "outline-6 outline-blue-400",
        )}
      />
      <div className="absolute inset-4">{children}</div>
    </div>
  );
};

export const CharacterOption = ({
  option,
  onPress,
  children,
  selected,
}: TemplateOptionProps<"character">) => {
  return (
    <div
      className={cn(
        "relative flex items-center gap-2 p-8",
        onPress && "cursor-pointer",
        selected && "rounded-2xl outline-6 outline-blue-400",
      )}
      onClick={onPress}>
      {option.payload.character === "random" ? (
        <div className="grid items-center gap-2">
          <CardImage
            card={CardType.CharacterCard}
            className={cn("col-start-1 row-start-1 w-48 shadow-lg/30")}
          />
          <p className="col-start-1 row-start-1 text-center font-main text-[800%] font-bold text-black uppercase text-shadow-amber-50 text-shadow-lg">
            ?
          </p>
        </div>
      ) : (
        <CardImage
          card={{ slug: option.payload.character }}
          className={"w-48 shadow-lg/30"}
        />
      )}
      {option.payload.eternal === "random" ? (
        <div className="grid items-center gap-2">
          <CardImage
            card={CardType.TreasureCard}
            className={cn("col-start-1 row-start-1 w-48 shadow-lg/30")}
          />
          <p className="col-start-1 row-start-1 text-center font-main text-[800%] font-bold text-black uppercase text-shadow-amber-50 text-shadow-lg">
            ?
          </p>
        </div>
      ) : (
        <CardImage
          card={{ slug: option.payload.eternal }}
          className={"w-48 shadow-lg/30"}
        />
      )}
      <div className="absolute inset-4">{children}</div>
    </div>
  );
};

export const CouplePlayerHandOption = ({
  option,
  onPress,
  children,
}: TemplateOptionProps<"couplePlayerHand">) => {
  return (
    <div
      className={cn(
        "relative flex items-end gap-2",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-row items-center gap-2">
          <Person className="size-6" />
          <p className="text-center text-lg font-bold">
            {ts(option.payload.player.nameKey)}
          </p>
        </div>
        <CardImage card={option.payload.player} className="h-64 shadow-lg/30" />
      </div>
      <div className="mx-2 h-64" />
      {option.payload.hand.map((card) => (
        <CardImage key={card.slug} card={card} className="h-64 shadow-lg/30" />
      ))}
      <div className="absolute inset-1">{children}</div>
    </div>
  );
};

export const NumberOption = ({
  option,
  onPress,
  children,
  selected,
}: TemplateOptionProps<"number">) => {
  return (
    <div
      className={cn(
        "relative flex w-max flex-row place-items-center gap-2 rounded-md border-2 bg-taupe-600 p-2",
        selected
          ? "border-blue-500 outline-2 outline-blue-400"
          : "border-taupe-500",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <p className={cn("px-6 py-4 text-center text-lg font-bold")}>
        {option.payload}
      </p>
      {children}
    </div>
  );
};
