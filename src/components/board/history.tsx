import { useGameContext } from "./contexts/game-context";
import { useHistoryContext } from "./contexts/history-context";
import type {
  StackElement as StackElementType,
  DiceRollJson,
  LootCardOnStackJson,
  EffectOnStackJson,
  DamageOnStackJson,
  DeathOnStackJson,
} from "@/shared/api";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";
import { Dice } from "@/icons/dice";
import { CardImage } from "./card";
import { usePopoverContext } from "./contexts/popover-context";
import { receiverName, selectionToText } from "@/utils/selection-text";

const getBorderColor = (
  element: StackElementType,
  currentPlayerName: string,
) => {
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
    return "border-stone-900";
  }

  if (issuerEntity.name === currentPlayerName) {
    return "border-blue-600";
  }

  return "border-red-600";
};

const HistoryIcon = ({ element }: { element: StackElementType }) => {
  const { setPopover, closePopover } = usePopoverContext();
  const { state } = useGameContext();

  const borderColor = getBorderColor(element, state.me.name);

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    let content: React.ReactNode = null;

    switch (element.type) {
      case "diceRoll": {
        const diceElement = element as DiceRollJson;
        content = (
          <>
            {diceElement.card && (
              <CardImage card={diceElement.card} className="w-64" />
            )}
            <div className="mt-3 flex max-w-64 flex-wrap place-content-center gap-1 text-center leading-tight text-stone-400">
              <span>{diceElement.issuer.name} rolled a</span>
              <span className="font-bold whitespace-pre-line text-stone-300">
                {diceElement.diceRoll}
                {diceElement.modifier !== 0
                  ? ` (+${diceElement.modifier})`
                  : ""}
              </span>
              <span>for</span>
              <span className="font-bold whitespace-pre-line text-stone-300">
                {diceElement.card?.name ?? "an attack roll"}
              </span>
            </div>
          </>
        );
        break;
      }
      case "LootCardEffect": {
        const lootElement = element as LootCardOnStackJson;
        const selectionText = lootElement.targets
          .map((target) => selectionToText(target))
          .join("\n");
        content = (
          <>
            <CardImage card={lootElement.card} className="w-64" />
            {selectionText.length > 0 && (
              <div className="mt-3 flex max-w-64 flex-col gap-2 text-center leading-tight text-stone-400">
                <span>{lootElement.issuer.name} used this card on</span>
                <span className="font-bold whitespace-pre-line text-stone-300">
                  {selectionText}
                </span>
              </div>
            )}
          </>
        );
        break;
      }
      case "effect": {
        const effectElement = element as EffectOnStackJson;
        const selectionText = effectElement.targets
          .map((target) => selectionToText(target))
          .join("\n");
        content = (
          <>
            <CardImage card={effectElement.card} className="w-64" />
            <div className="mt-3 flex max-w-64 flex-col gap-2 text-center leading-tight text-stone-400">
              <span>{effectElement.issuer.name} selected</span>
              <span className="font-bold text-stone-300">
                {effectElement.effect}
              </span>
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
        break;
      }
      case "damage": {
        const damageElement = element as DamageOnStackJson;
        content = (
          <>
            {"slug" in damageElement.source && (
              <CardImage card={damageElement.source} className="w-64" />
            )}
            <div className="mt-3 max-w-64 text-center leading-tight text-stone-400">
              <span className="font-bold text-stone-300">
                {damageElement.from.name}
              </span>{" "}
              dealt{" "}
              <span className="font-bold text-stone-300">
                {damageElement.damage}
              </span>{" "}
              damage to{" "}
              <span className="font-bold text-stone-300">
                {receiverName(damageElement)}
              </span>{" "}
              using{" "}
              <span className="font-bold text-stone-300">
                {"slug" in damageElement.source
                  ? damageElement.source.name
                  : "an attack roll"}
              </span>
            </div>
          </>
        );
        break;
      }
      case "death": {
        const deathElement = element as DeathOnStackJson;
        content = (
          <>
            {"slug" in deathElement.source && (
              <CardImage card={deathElement.source} className="w-64" />
            )}
            <div className="mt-3 max-w-64 text-center leading-tight text-stone-400">
              <span className="font-bold text-stone-300">
                {deathElement.from.name}
              </span>{" "}
              killed{" "}
              <span className="font-bold text-stone-300">
                {receiverName(deathElement)}
              </span>{" "}
              using{" "}
              <span className="font-bold text-stone-300">
                {"slug" in deathElement.source
                  ? deathElement.source.name
                  : "an attack roll"}
              </span>
            </div>
          </>
        );
        break;
      }
    }

    setPopover({
      anchor: rect,
      content,
    });
  };

  // Render icon based on type
  const renderIcon = () => {
    switch (element.type) {
      case "diceRoll":
        return (
          <Dice
            value={(element as DiceRollJson).diceRoll}
            className={cn(
              "size-10 rounded-xl border-2 bg-stone-800/50 p-0.5 text-red-500",
              borderColor,
            )}
          />
        );
      case "LootCardEffect":
      case "effect": {
        const card =
          element.type === "LootCardEffect"
            ? (element as LootCardOnStackJson).card
            : (element as EffectOnStackJson).card;
        return (
          <div
            className={cn(
              "size-10 overflow-hidden rounded-xl border-2 bg-stone-800/50",
              borderColor,
            )}>
            <CardImage card={card} className="translate-y-[5%] scale-155" />
          </div>
        );
      }
      case "damage":
        return (
          <img
            src="/heart.png"
            alt="damage"
            className={cn(
              "size-10 shrink-0 rounded-xl border-2 bg-stone-800/50 p-0.5",
              borderColor,
            )}
          />
        );
      case "death":
        return (
          <img
            src="/skull.webp"
            alt="death"
            className={cn(
              "size-10 shrink-0 rounded-xl border-2 bg-stone-800/50 p-0.5",
              borderColor,
            )}
            style={{ imageRendering: "pixelated" }}
          />
        );
    }
  };

  return (
    <div
      className="flex cursor-pointer items-center justify-center transition-transform hover:scale-110"
      onMouseEnter={onHover}
      onMouseLeave={closePopover}>
      {renderIcon()}
    </div>
  );
};

export const History = () => {
  const { state } = useGameContext();
  const { isOpen } = useHistoryContext();
  const [isHovered, setIsHovered] = useState(false);
  const scrollViewRef = useRef<HTMLDivElement>(null);

  // Show history in reverse order (newest first)
  const reversedHistory = [...state.history].reverse();
  const displayedHistory = reversedHistory.slice(0, 30);

  if (!isOpen) return null;

  useEffect(() => {
    const scrollView = scrollViewRef.current;
    if (!scrollView) return;

    // Measure if the scroll view is overflowing
    const isOverflowing = scrollView.scrollHeight > scrollView.clientHeight;
    if (isOverflowing) {
      scrollView.classList.add("scroll-priority");
    } else {
      scrollView.classList.remove("scroll-priority");
    }
  }, [state.stack.length]);

  return (
    <div
      ref={scrollViewRef}
      className="relative flex h-86 w-14 flex-col items-center gap-1.5 overflow-y-auto rounded-lg bg-stone-900 p-2 transition-colors duration-300 transform-3d"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {displayedHistory.map((element, index) => (
        <HistoryIcon key={index} element={element} />
      ))}
    </div>
  );
};
