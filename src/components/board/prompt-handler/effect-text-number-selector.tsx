import { useLanguageContext } from "@/components/contexts/language-context";
import type { SelectionItem } from "@/shared/api";
import { cn } from "@/utils/cn";
import { HotkeyScope } from "@/utils/hotkey";
import { resolveNumberBoxes, type NumberBox } from "@/utils/number-boxes";
import { useHotkeys } from "react-hotkeys-hook";
import { Card, CARD_TEXT_MARKER_CLASS_NAME, CardTextMarker } from "../card";

type EffectTextNumberOption = Extract<
  SelectionItem,
  { type: "effectTextNumber" }
>;

interface EffectTextNumberSelectorProps {
  options: EffectTextNumberOption[];
  selectedOptions: SelectionItem[];
  onPress: (option: EffectTextNumberOption) => void;
}

export function isEffectTextNumberSelection(
  options: SelectionItem[],
): options is EffectTextNumberOption[] {
  if (options.length === 0 || options[0]?.type !== "effectTextNumber") {
    return false;
  }

  const cardId = options[0].payload.card.globalId;
  return options.every(
    (option) =>
      option.type === "effectTextNumber" &&
      option.payload.card.globalId === cardId,
  );
}

export function EffectTextNumberSelector({
  options,
  selectedOptions,
  onPress,
}: EffectTextNumberSelectorProps) {
  const card = options[0]?.payload.card;
  const { language } = useLanguageContext();
  if (!card) return null;

  const resolved = resolveNumberBoxes(card.slug, language);
  if (!resolved) return null;

  return (
    <div className="relative">
      <Card
        card={card}
        className="shadow-lg/30"
        size={42}
        imageLanguage={resolved.language}
      />
      {options.map((option, index) => {
        const box = resolved.boxes[option.payload.occurrenceIndex];
        if (!box) return null;

        return (
          <EffectTextNumberButton
            key={option.payload.occurrenceIndex}
            box={box}
            hotkey={index < 10 ? `${(index + 1) % 10}` : undefined}
            isSelected={selectedOptions.includes(option)}
            onClick={() => onPress(option)}
          />
        );
      })}
    </div>
  );
}

interface EffectTextNumberButtonProps {
  box: NumberBox;
  hotkey?: string;
  isSelected: boolean;
  onClick: () => void;
}

function EffectTextNumberButton({
  box,
  hotkey,
  isSelected,
  onClick,
}: EffectTextNumberButtonProps) {
  useHotkeys(hotkey ?? "", onClick, {
    scopes: [HotkeyScope.Popup],
    enabled: hotkey !== undefined,
  });

  return (
    <CardTextMarker bounds={box}>
      <button
        type="button"
        aria-label={`Select ${box.value}`}
        onClick={onClick}
        className={cn(
          CARD_TEXT_MARKER_CLASS_NAME,
          "cursor-pointer transition-opacity duration-100",
          isSelected
            ? "outline-6 outline-blue-400"
            : "hover:backdrop-brightness-120",
        )}
      />
      {hotkey && (
        <div className="pointer-events-none absolute top-0 bottom-0 -left-9 flex h-full place-items-center">
          <div className="flex size-6 place-items-center overflow-hidden rounded-md bg-taupe-700 outline-3 outline-taupe-200">
            <img
              src={`/input-prompts/keyboard_${hotkey}_outline.svg`}
              className="scale-170"
              draggable={false}
            />
          </div>
        </div>
      )}
    </CardTextMarker>
  );
}
