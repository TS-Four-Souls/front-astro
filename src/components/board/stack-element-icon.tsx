import { useGameContext } from "./contexts/game-context";
import type { DetailedState, StackElement } from "@/shared/api";
import { cn } from "@/utils/cn";
import { Dice } from "@/icons/dice";
import { CardImage } from "./card";
import { usePopoverContext } from "./contexts/popover-context";
import { receiverName, selectionToText } from "@/utils/selection-text";

interface StackElementIconProps {
  element: StackElement;
}

export const StackElementIcon = ({ element }: StackElementIconProps) => {
  const { setPopover, closePopover } = usePopoverContext();

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({
      anchor: rect,
      content: <PopoverContent element={element} />,
    });
  };

  return (
    <div
      className="flex shrink-0 cursor-pointer items-center justify-center transition-transform hover:scale-110"
      onMouseEnter={onHover}
      onMouseLeave={closePopover}>
      <Icon element={element} />
    </div>
  );
};

interface PopoverContentProps {
  element: StackElement;
}

const PopoverContent = ({ element }: PopoverContentProps) => {
  switch (element.type) {
    case "diceRoll": {
      return (
        <div className="flex flex-col items-center gap-3">
          {element.card && <CardImage card={element.card} className="w-64" />}
          <div className="flex max-w-64 flex-wrap place-content-center gap-1 px-2 text-center leading-tight text-stone-400">
            <span>{element.issuer.name} rolled a</span>
            <span className="font-bold whitespace-pre-line text-stone-300">
              {element.diceRoll}
              {element.modifier !== 0 ? ` (+${element.modifier})` : ""}
            </span>
            <span>for</span>
            <span className="font-bold whitespace-pre-line text-stone-300">
              {element.card?.name ?? "an attack roll"}
            </span>
          </div>
        </div>
      );
    }

    case "LootCardEffect": {
      const selectionText = element.targets
        .map((target) => selectionToText(target))
        .join("\n");
      return (
        <>
          <CardImage card={element.card} className="w-64" />
          {selectionText.length > 0 && (
            <div className="mt-3 flex max-w-64 flex-col gap-2 text-center leading-tight text-stone-400">
              <span>{element.issuer.name} used this card on</span>
              <span className="font-bold whitespace-pre-line text-stone-300">
                {selectionText}
              </span>
            </div>
          )}
        </>
      );
    }

    case "effect": {
      const selectionText = element.targets
        .map((target) => selectionToText(target))
        .join("\n");
      return (
        <>
          <CardImage card={element.card} className="w-64" />
          <div className="mt-3 flex max-w-64 flex-col gap-2 text-center leading-tight text-stone-400">
            <span>{element.issuer.name} selected</span>
            <span className="font-bold text-stone-300">{element.effect}</span>
            {selectionText.length > 0 && (
              <>
                <span>on</span>
                <span className="font-bold whitespace-pre-line text-stone-300">
                  {selectionText}
                </span>
              </>
            )}
          </div>
        </>
      );
    }

    case "damage": {
      return (
        <div className="flex flex-col items-center gap-3">
          {"slug" in element.source && (
            <CardImage card={element.source} className="w-64" />
          )}
          <div className="max-w-64 px-2 text-center leading-tight text-stone-400">
            <span className="font-bold text-stone-300">
              {element.from.name}
            </span>{" "}
            dealt{" "}
            <span className="font-bold text-stone-300">{element.damage}</span>{" "}
            damage to{" "}
            <span className="font-bold text-stone-300">
              {receiverName(element)}
            </span>{" "}
            using{" "}
            <span className="font-bold text-stone-300">
              {"slug" in element.source
                ? element.source.name
                : "an attack roll"}
            </span>
          </div>
        </div>
      );
    }

    case "death": {
      return (
        <div className="flex flex-col items-center gap-3">
          {"slug" in element.source && (
            <CardImage card={element.source} className="w-64" />
          )}
          <div className="max-w-64 px-2 text-center leading-tight text-stone-400">
            <span className="font-bold text-stone-300">
              {element.from.name}
            </span>{" "}
            killed{" "}
            <span className="font-bold text-stone-300">
              {receiverName(element)}
            </span>{" "}
            using{" "}
            <span className="font-bold text-stone-300">
              {"slug" in element.source
                ? element.source.name
                : "an attack roll"}
            </span>
          </div>
        </div>
      );
    }
  }
};

interface IconProps {
  element: StackElement;
}

const Icon = ({ element }: IconProps) => {
  const gameContext = useGameContext();
  const state = gameContext.state as DetailedState | undefined;
  const borderColor = getBorderColor(element, state?.me.name);

  switch (element.type) {
    case "diceRoll":
      return (
        <Dice
          value={element.diceRoll}
          className={cn(
            "size-10 rounded-lg border-[0.1em] bg-stone-800/50 p-0.5 text-red-500",
            borderColor,
          )}
        />
      );

    case "LootCardEffect":
    case "effect": {
      return (
        <div
          className={cn(
            "size-10 overflow-hidden rounded-lg border-[0.1em] bg-stone-800/50",
            borderColor,
          )}>
          <CardImage
            card={element.card}
            className="translate-y-[5%] scale-155"
          />
        </div>
      );
    }

    case "damage":
      return (
        <img
          src="/heart.png"
          alt="damage"
          className={cn(
            "size-10 shrink-0 rounded-lg border-[0.1em] bg-stone-800/50 p-0.5",
            borderColor,
          )}
          draggable={false}
        />
      );

    case "death":
      return (
        <img
          src="/skull.webp"
          alt="death"
          className={cn(
            "size-10 shrink-0 rounded-lg border-[0.1em] bg-stone-800/50 p-0.5",
            borderColor,
          )}
          style={{ imageRendering: "pixelated" }}
          draggable={false}
        />
      );
  }
};

const getBorderColor = (element: StackElement, currentPlayerName?: string) => {
  let issuerEntity;

  switch (element.type) {
    case "diceRoll":
    case "LootCardEffect":
    case "effect":
      issuerEntity = element.issuer;
      break;
    case "damage":
    case "death":
      issuerEntity = element.from;
      break;
    default:
      return "border-stone-700";
  }

  if (issuerEntity.type === "monster") {
    return "border-stone-700";
  }

  if (issuerEntity.name === currentPlayerName) {
    return "border-blue-600";
  }

  if (currentPlayerName) {
    return "border-red-600";
  }

  return "border-stone-700";
};
