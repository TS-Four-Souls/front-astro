import { Button } from "@/components/button";
import { Popup } from "@/components/popup";
import type { SelectionItem } from "@/shared/api";
import { cn } from "@/utils/cn";
import { HotkeyScope } from "@/utils/hotkey";
import { useHotkeys } from "react-hotkeys-hook";
import { Card, CardType, VisualEffectBoxComponent } from "../card";
import { Person } from "@/icons/person";
import { Sword } from "@/icons/sword";
import { StackElement } from "../stack";
import { SelectionIndexIndicator } from "../selection-index-indicator";
import { useMemo, useState } from "react";
import { useLanguageContext } from "@/components/contexts/language-context";
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
  toggleMode?: { onClick: () => void; label: string } | undefined;
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
  const { ts, t } = useLanguageContext();
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
      let payload = JSON.stringify(option.payload);
      if (
        option.payload !== null &&
        option.payload instanceof Object &&
        "nameKey" in option.payload &&
        "key" in option.payload.nameKey
      ) {
        payload = ts(option.payload.nameKey) + payload;
      }
      return JSON.stringify(payload).toLowerCase().includes(searchCleaned);
    });
  }, [sortedOptions, search]);

  return (
    <Popup
      onPressBackdrop={onCancel}
      className={cn(canUseLookup && "h-full w-full")}>
      <div className="flex flex-row justify-between gap-8">
        <h1 className="font-main text-2xl leading-tight font-bold uppercase">
          {prompt}
        </h1>
        <div className="flex gap-2">
          {canUseLookup && (
            <input
              className="w-48 rounded-md border-2 border-taupe-500 px-4"
              placeholder={t("common.popup.search.placeholder")}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
          {toggleMode && (
            <Button
              onClick={toggleMode.onClick}
              hotkey="tab"
              hotkeyScope={[HotkeyScope.Popup]}
              label={toggleMode.label}
            />
          )}
          {onCancel && (
            <Button
              onClick={onCancel}
              hotkey="escape"
              hotkeyScope={[HotkeyScope.Popup]}
              label={
                isInformational
                  ? t("common.closeButton")
                  : t("common.cancelButton")
              }
            />
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex grow flex-wrap content-start gap-2 overflow-auto p-4",
          displayRow ? "flex-col" : "flex-row justify-center",
        )}>
        {isOnCardSelection(filteredOptions) ? (
          <OnCardSelector
            options={filteredOptions}
            selectedOptions={selectedOptions}
            onPress={(option) => {
              const selectionIndex = selectedOptions.indexOf(option);
              const isSelected = selectionIndex >= 0;
              if (isSelected) {
                removeSelection(option);
              } else {
                replaceSelection(option);
              }
            }}
          />
        ) : (
          filteredOptions.map((option, index) => {
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
          })
        )}
        {sortedOptions.length === 0 && (
          <div className="text-center text-lg text-taupe-400">
            {t("common.popup.emptyResults")}
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
          label={t("common.submitButton")}
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
        <div className="absolute top-0 left-0 flex size-7 place-items-center overflow-hidden rounded-md bg-taupe-700 outline-3 outline-taupe-200">
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
    case "chooseOne":
      return (
        <ChooseOneOption
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
    case "serializedTranslation":
      return (
        <SerializedTranslationOption
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
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 p-2",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <Card
        card={option.payload.card}
        orientation={option.payload.card.orientation}
        className={cn("shadow-lg/30", selected && "outline-6 outline-blue-400")}
        size={22}
        visualEffectBox={option.payload.visualEffectBox}
      />
      <div className="absolute inset-4">{children}</div>
    </div>
  );
};

export const ChooseOneOption = ({
  option,
  onPress,
  children,
  selected,
}: TemplateOptionProps<"chooseOne">) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 p-2",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <Card
        card={option.payload.card}
        orientation={option.payload.card.orientation}
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
  const { ts } = useLanguageContext();
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
      <div className="relative p-2">
        <Card
          card={option.payload}
          orientation={option.payload.orientation}
          className={cn(
            "shadow-lg/30",
            selected && "outline-6 outline-blue-400",
          )}
          size={22}
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
  const { ts } = useLanguageContext();

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
      <div className="relative p-2">
        <Card
          card={option.payload}
          orientation={option.payload.orientation}
          className={cn(
            "shadow-lg/30",
            selected && "outline-6 outline-blue-400",
          )}
          size={22}
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
      <div className="relative p-2">
        <Card
          card={option.payload as CardType}
          orientation={option.payload === "room" ? "landscape" : "portrait"}
          className={cn(
            "shadow-lg/30",
            selected && "outline-6 outline-blue-400",
          )}
          size={22}
        />
        <div className="absolute inset-4">{children}</div>
      </div>
    </div>
  );
};

export const SerializedTranslationOption = ({
  option,
  selected,
  onPress,
  children,
}: TemplateOptionProps<"serializedTranslation">) => {
  const { ts } = useLanguageContext();
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
        {ts(option.payload)}
      </p>
      <div className="absolute inset-1">{children}</div>
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
  const { t } = useLanguageContext();
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
        {option.payload ? t("common.yes") : t("common.no")}
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
        "relative flex flex-col items-center gap-2 p-2",
        onPress && "cursor-pointer",
      )}
      onClick={onPress}>
      <Card
        card={option.payload}
        orientation={option.payload.orientation}
        className={cn("shadow-lg/30", selected && "outline-6 outline-blue-400")}
        size={22}
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
          <Card
            card={CardType.CharacterCard}
            size={16}
            containerClassName="col-start-1 row-start-1"
            className="shadow-lg/30"
          />
          <p className="relative col-start-1 row-start-1 text-center font-main text-[800%] font-bold text-black uppercase text-shadow-amber-50 text-shadow-lg">
            ?
          </p>
        </div>
      ) : (
        <Card
          card={{ slug: option.payload.character }}
          size={16}
          className={"shadow-lg/30"}
        />
      )}
      {option.payload.eternal === "random" ? (
        <div className="grid items-center gap-2">
          <Card
            card={CardType.TreasureCard}
            size={16}
            containerClassName="col-start-1 row-start-1"
            className="shadow-lg/30"
          />
          <p className="relative col-start-1 row-start-1 text-center font-main text-[800%] font-bold text-black uppercase text-shadow-amber-50 text-shadow-lg">
            ?
          </p>
        </div>
      ) : (
        <Card
          card={{ slug: option.payload.eternal }}
          size={16}
          className={"shadow-lg/30"}
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
  const { ts } = useLanguageContext();
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
        <Card
          card={option.payload.player}
          orientation={option.payload.player.orientation}
          size={16}
          className="shadow-lg/30"
        />
      </div>
      <div className="w-12" />
      {option.payload.hand.map((card) => (
        <Card
          key={card.slug}
          orientation={card.orientation}
          card={card}
          size={16}
          className="shadow-lg/30"
        />
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

/** Check that all the options are cardEffect options and they all refer to the same card */
const isOnCardSelection = (
  options: SelectionItem[],
): options is Extract<
  SelectionItem,
  { type: "cardEffect" | "chooseOne" }
>[] => {
  if (options.length === 0) {
    return false;
  }
  if (
    options.some(
      (option) => option.type !== "cardEffect" && option.type !== "chooseOne",
    )
  ) {
    return false;
  }
  const cardEffectOptions = options as Extract<
    SelectionItem,
    { type: "cardEffect" | "chooseOne" }
  >[];
  const card = cardEffectOptions[0].payload.card;
  if (
    cardEffectOptions.some(
      (option) => option.payload.card.globalId !== card.globalId,
    )
  ) {
    return false;
  }
  return true;
};

interface OnCardSelectorProps {
  selectedOptions: SelectionItem[];
  onPress: (option: SelectionItem) => void;
  options: Extract<SelectionItem, { type: "cardEffect" | "chooseOne" }>[];
}

const OnCardSelector = ({
  options,
  onPress,
  selectedOptions,
}: OnCardSelectorProps) => {
  const card = options[0].payload.card;
  return (
    <div className="relative">
      <Card
        card={card}
        className="shadow-lg/30"
        size={42}
        orientation={card.orientation}
      />
      {options.map((option, index) => (
        <OnCardSelectorOption
          key={index}
          isSelected={selectedOptions.indexOf(option) >= 0}
          option={option}
          onPress={() => onPress(option)}
          hotkey={index < 10 ? `${(index + 1) % 10}` : undefined}
        />
      ))}
    </div>
  );
};

interface OnCardSelectorOptionProps {
  isSelected: boolean;
  onPress: () => void;
  option: Extract<SelectionItem, { type: "cardEffect" | "chooseOne" }>;
  hotkey?: string | undefined;
}

const OnCardSelectorOption = ({
  isSelected,
  onPress,
  option,
  hotkey,
}: OnCardSelectorOptionProps) => {
  useHotkeys(hotkey ?? "", () => onPress?.(), {
    scopes: [HotkeyScope.Popup],
    enabled: onPress !== undefined && hotkey !== undefined,
  });

  return (
    <VisualEffectBoxComponent
      onClick={onPress}
      card={option.payload.card}
      visualEffectBox={option.payload.visualEffectBox}
      className={cn(
        "cursor-pointer transition-opacity duration-100",
        isSelected
          ? "outline-6 outline-blue-400"
          : "shadow-none inset-shadow-none backdrop-brightness-100 hover:backdrop-brightness-120",
      )}>
      {onPress !== undefined && hotkey !== undefined && (
        <div className="absolute top-0 bottom-0 -left-9 flex h-full place-items-center">
          <div className="flex size-6 place-items-center overflow-hidden rounded-md bg-taupe-700 outline-3 outline-taupe-200">
            <img
              src={`/input-prompts/keyboard_${hotkey.split(",")[0]}_outline.svg`}
              className="scale-170"
              draggable={false}
            />
          </div>
        </div>
      )}
    </VisualEffectBoxComponent>
  );
};
