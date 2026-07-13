import type { SelectionItem, StackElement } from "@/shared/api";
import { cn } from "@/utils/cn";
import { Dice } from "@/icons/dice";
import { Card, CardImage, CardType } from "./card";
import { usePopoverContext } from "./contexts/popover-context";
import { receiverName } from "@/utils/selection-text";
import { ts } from "../../utils/translate";
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
          {element.card && <Card card={element.card} size={22} />}
          <div className="flex max-w-64 flex-wrap place-content-center gap-1 px-2 text-center leading-tight text-taupe-400">
            <span>
              <span
                className="font-bold"
                style={{ color: element.issuer.color }}>
                {ts(element.issuer.nameKey)}
              </span>{" "}
              rolled a
            </span>
            <span className="font-bold whitespace-pre-line text-taupe-300">
              {element.diceRoll}
              {element.modifier !== 0 ? ` (+${element.modifier})` : ""}
            </span>
            <span>for</span>
            <span className="font-bold whitespace-pre-line text-taupe-300">
              {element.card !== undefined
                ? ts(element.card.nameKey)
                : "an attack roll"}
            </span>
          </div>
        </div>
      );
    }

    case "LootCardEffect": {
      return (
        <>
          <Card card={element.card} size={22} />
          <div className="mt-3 flex max-w-64 flex-col gap-2 text-center leading-tight text-taupe-400">
            <span>
              <span
                className="font-bold"
                style={{ color: element.issuer.color }}>
                {ts(element.issuer.nameKey)}
              </span>{" "}
              used this card
            </span>
            <SelectionsList selections={element.targets} />
          </div>
        </>
      );
    }

    case "effect": {
      return (
        <>
          <Card
            card={element.card}
            size={22}
            visualEffectBox={element.visualEffectBox}
          />
          <div className="mt-3 flex max-w-64 flex-col gap-2 text-center leading-tight text-taupe-400">
            <span>
              <span
                style={{ color: element.issuer.color }}
                className="font-bold">
                {ts(element.issuer.nameKey)}
              </span>{" "}
              selected
            </span>
            <span className="font-bold text-taupe-300">{element.effect}</span>
            <SelectionsList selections={element.targets} />
          </div>
        </>
      );
    }

    case "lootStep": {
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="max-w-64 px-2 text-center leading-tight text-taupe-400">
            <span style={{ color: element.player.color }} className="font-bold">
              {ts(element.player.nameKey)}
            </span>{" "}
            loots{" "}
            <span className="font-bold text-taupe-300">{element.nbLoots}</span>.
          </div>
        </div>
      );
    }

    case "endOfTurn": {
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="max-w-64 px-2 text-center leading-tight text-taupe-400">
            End of{" "}
            <span style={{ color: element.player.color }} className="font-bold">
              {ts(element.player.nameKey)}
            </span>
            's turn
          </div>
        </div>
      );
    }

    case "damage": {
      return (
        <div className="flex flex-col items-center gap-3">
          {"slug" in element.source && <Card card={element.source} size={22} />}
          <div className="max-w-64 px-2 text-center leading-tight text-taupe-400">
            <span
              style={{ color: element.from.color }}
              className="font-bold text-taupe-300">
              {ts(element.from.nameKey)}
            </span>{" "}
            dealt{" "}
            <span className="font-bold text-taupe-300">{element.damage}</span>{" "}
            damage to{" "}
            <span
              style={{ color: element.receiver.color }}
              className="font-bold text-taupe-300">
              {receiverName(element)}
            </span>{" "}
            using{" "}
            <span className="font-bold text-taupe-300">
              {"slug" in element.source
                ? ts(element.source.nameKey)
                : "an attack roll"}
            </span>
          </div>
        </div>
      );
    }

    case "death": {
      return (
        <div className="flex flex-col items-center gap-3">
          {"slug" in element.source && <Card card={element.source} size={22} />}
          <div className="max-w-64 px-2 text-center leading-tight text-taupe-400">
            <span
              style={{ color: element.from.color }}
              className="font-bold text-taupe-300">
              {ts(element.from.nameKey)}
            </span>{" "}
            killed{" "}
            <span
              style={{ color: element.receiver.color }}
              className="font-bold text-taupe-300">
              {receiverName(element)}
            </span>{" "}
            using{" "}
            <span className="font-bold text-taupe-300">
              {"slug" in element.source
                ? ts(element.source.nameKey)
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
  const borderColor = getBorderColor(element);

  switch (element.type) {
    case "diceRoll":
      return (
        <Dice
          value={element.diceRoll}
          className="size-10 rounded-lg border-[0.15em] bg-taupe-800/50 p-0.5 text-red-500"
          style={{ borderColor }}
        />
      );

    case "LootCardEffect":
    case "effect": {
      return (
        <div
          className={cn(
            "aspect-square overflow-hidden rounded-lg border-[0.15em] bg-taupe-800/50",
          )}
          style={{ borderColor }}>
          <CardImage
            sizes="2.5em"
            card={element.card}
            className="translate-y-[5%] scale-155"
          />
        </div>
      );
    }

    case "lootStep": {
      return (
        <div
          className={cn(
            "aspect-square overflow-hidden rounded-lg border-[0.15em] bg-taupe-800/50",
          )}
          style={{ borderColor }}>
          <CardImage
            sizes="2.5em"
            card={CardType.LootCard}
            className="translate-y-[-17%] scale-155"
          />
        </div>
      );
    }

    case "endOfTurn": {
      return (
        <div
          className={cn(
            "aspect-square overflow-hidden rounded-lg border-[0.15em] bg-taupe-800/50",
          )}
          style={{ borderColor }}>
          <CardImage
            sizes="2.5em"
            card={CardType.CharacterCard}
            className="translate-y-[-17%] scale-155"
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
            "size-10 shrink-0 rounded-lg border-[0.15em] bg-taupe-800/50 p-0.5",
          )}
          style={{ borderColor }}
          draggable={false}
        />
      );

    case "death":
      return (
        <img
          src="/skull.webp"
          alt="death"
          className={cn(
            "size-10 shrink-0 rounded-lg border-[0.15em] bg-taupe-800/50 p-0.5",
          )}
          style={{ imageRendering: "pixelated", borderColor }}
          draggable={false}
        />
      );
  }
};

const getBorderColor = (element: StackElement) => {
  switch (element.type) {
    case "diceRoll":
    case "LootCardEffect":
    case "effect":
      return element.issuer.color;
    case "damage":
    case "death":
      return element.from.color;
    case "lootStep":
    case "endOfTurn":
      return element.player.color;
    default:
      return "border-taupe-700";
  }
};

export const SelectionsList = ({
  selections,
}: {
  selections: SelectionItem[];
}): React.ReactNode => {
  return (
    selections.length > 0 && (
      <>
        <span>and choose</span>
        {selections.length === 1 ? (
          <span className="font-bold text-taupe-300">
            <SelectionContent selection={selections[0]} />
          </span>
        ) : (
          <ol className="flex list-decimal flex-col gap-2 pr-4 pl-6 text-left font-bold text-taupe-300 marker:font-normal marker:text-taupe-400">
            {selections.map((target, index) => (
              <li className="pl-2">
                <SelectionContent key={index} selection={target} />
              </li>
            ))}
          </ol>
        )}
      </>
    )
  );
};

export const SelectionContent = ({
  selection,
}: {
  selection: SelectionItem;
}): React.ReactNode => {
  switch (selection.type) {
    case "card":
      return ts(selection.payload.nameKey);
    case "stackElement":
      switch (selection.payload.type) {
        case "death":
          return `${ts(selection.payload.from.nameKey)} killed ${receiverName(selection.payload)}`;
        case "diceRoll":
          return `${selection.payload.card ? ts(selection.payload.card.nameKey) : "an attack roll"} - ${ts(selection.payload.issuer.nameKey)} rolled a ${selection.payload.diceRoll}`;
        case "damage":
          return `${ts(selection.payload.from.nameKey)} dealt ${selection.payload.damage} damage to ${receiverName(selection.payload)}`;
        case "effect":
          return `${ts(selection.payload.issuer.nameKey)} - ${ts(selection.payload.card.nameKey)}`;
        case "LootCardEffect":
          return `${ts(selection.payload.issuer.nameKey)} used ${ts(selection.payload.card.nameKey)}`;
        case "lootStep":
          return `${ts(selection.payload.player.nameKey)} is about to loot ${selection.payload.nbLoots} card${selection.payload.nbLoots > 1 ? "s" : ""}`;
        case "endOfTurn":
          return `${ts(selection.payload.player.nameKey)}'s turn is about to end.`;
      }
    case "deck":
      return selection.payload;
    case "player":
      return (
        <span style={{ color: selection.payload.color }}>
          {ts(selection.payload.nameKey)}
        </span>
      );
    case "monster":
      return (
        <span style={{ color: selection.payload.color }}>
          {ts(selection.payload.nameKey)}
        </span>
      );
    case "string":
      return selection.payload;
    case "number":
      return selection.payload;
    case "boolean":
      return selection.payload;
    case "couplePlayerHand":
      return `${ts(selection.payload.player.nameKey)} hand`;
    case "object":
    case "character":
    case "array":
    case "null":
    case "unknown":
      return "Unknown";
  }
};
