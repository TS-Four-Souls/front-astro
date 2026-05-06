import type { SelectionItem, StackElement } from "@/shared/api";
import { cn } from "@/utils/cn";
import { Dice } from "@/icons/dice";
import { CardImage } from "./card";
import { usePopoverContext } from "./contexts/popover-context";
import { receiverName } from "@/utils/selection-text";

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
          <div className="flex max-w-64 flex-wrap place-content-center gap-1 px-2 text-center leading-tight text-taupe-400">
            <span>
              <span
                className="font-bold"
                style={{ color: element.issuer.color }}>
                {element.issuer.name}
              </span>{" "}
              rolled a
            </span>
            <span className="font-bold whitespace-pre-line text-taupe-300">
              {element.diceRoll}
              {element.modifier !== 0 ? ` (+${element.modifier})` : ""}
            </span>
            <span>for</span>
            <span className="font-bold whitespace-pre-line text-taupe-300">
              {element.card?.name ?? "an attack roll"}
            </span>
          </div>
        </div>
      );
    }

    case "LootCardEffect": {
      return (
        <>
          <CardImage card={element.card} className="w-64" />
          <div className="mt-3 flex max-w-64 flex-col gap-2 text-center leading-tight text-taupe-400">
            <span>
              <span
                className="font-bold"
                style={{ color: element.issuer.color }}>
                {element.issuer.name}
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
          <CardImage card={element.card} className="w-64" />
          <div className="mt-3 flex max-w-64 flex-col gap-2 text-center leading-tight text-taupe-400">
            <span>
              <span
                style={{ color: element.issuer.color }}
                className="font-bold">
                {element.issuer.name}
              </span>{" "}
              selected
            </span>
            <span className="font-bold text-taupe-300">{element.effect}</span>
            <SelectionsList selections={element.targets} />
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
          <div className="max-w-64 px-2 text-center leading-tight text-taupe-400">
            <span
              style={{ color: element.from.color }}
              className="font-bold text-taupe-300">
              {element.from.name}
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
          <div className="max-w-64 px-2 text-center leading-tight text-taupe-400">
            <span
              style={{ color: element.from.color }}
              className="font-bold text-taupe-300">
              {element.from.name}
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
            "size-10 overflow-hidden rounded-lg border-[0.15em] bg-taupe-800/50",
          )}
          style={{ borderColor }}>
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
      return selection.payload.name;
    case "stackElement":
      switch (selection.payload.type) {
        case "death":
          return `${selection.payload.from.name} killed ${receiverName(selection.payload)}`;
        case "diceRoll":
          return `${selection.payload.card?.name ?? "Attack roll"} - ${selection.payload.issuer.name} rolled a ${selection.payload.diceRoll}`;
        case "damage":
          return `${selection.payload.from.name} dealt ${selection.payload.damage} damage to ${receiverName(selection.payload)}`;
        case "effect":
          return `${selection.payload.issuer.name} - ${selection.payload.card.name}`;
        case "LootCardEffect":
          return `${selection.payload.issuer.name} used ${selection.payload.card.name}`;
      }
    case "deck":
      return selection.payload;
    case "player":
      return (
        <span style={{ color: selection.payload.color }}>
          {selection.payload.name}
        </span>
      );
    case "monster":
      return (
        <span style={{ color: selection.payload.color }}>
          {selection.payload.name}
        </span>
      );
    case "string":
      return selection.payload;
    case "number":
      return selection.payload;
    case "boolean":
      return selection.payload;
    case "couplePlayerHand":
      return `${selection.payload.player.name} hand`;
    case "object":
    case "character":
    case "array":
    case "null":
    case "unknown":
      return "Unknown";
  }
};
