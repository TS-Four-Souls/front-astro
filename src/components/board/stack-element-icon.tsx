import type {
  SelectionItem,
  SerializedTranslation,
  StackElement,
  DeckName,
} from "@/shared/api";
import { cn } from "@/utils/cn";
import { Dice } from "@/icons/dice";
import { Card, CardImage, CardType } from "./card";
import { usePopoverContext } from "./contexts/popover-context";
import { useLanguageContext } from "../contexts/language-context";
import { replaceTokens } from "@/utils/replaceToken";
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
  const { ts, t } = useLanguageContext();
  switch (element.type) {
    case "diceRoll": {
      const result = `${element.diceRoll} ${element.modifier !== 0 ? `(+${element.modifier})` : ""}`;
      const serialized: SerializedTranslation = {
        key: "gameStep.stack.stackElement.cardRoll",
        interpolates: {
          player: `{{1}}`,
          result: result,
        },
      };
      const msg = replaceTokens(ts(serialized), [
        [
          `{{1}}`,
          <span key="player" style={{ color: element.issuer.color }}>
            {ts(element.issuer.nameKey)}
          </span>,
        ],
      ]);
      return (
        <div className="flex flex-col items-center gap-3">
          {element.card && (
            <Card
              card={element.card}
              visualEffectBox={element.visualEffectBox}
              size={22}
            />
          )}
          <div className="flex max-w-64 flex-wrap place-content-center gap-1 px-2 text-center leading-tight text-taupe-400">
            {msg}
          </div>
        </div>
      );
    }

    case "diceWillRoll": {
      const serialized: SerializedTranslation = {
        key: element.attackRoll
          ? "gameStep.stack.stackElement.diceWillRollForAttack"
          : "gameStep.stack.stackElement.diceWillRollForCard",
        interpolates: {
          player: `{{1}}`,
          card: `{{2}}`,
        },
      };
      const msg = replaceTokens(ts(serialized), [
        [
          `{{1}}`,
          <span key="player" style={{ color: element.issuer.color }}>
            {ts(element.issuer.nameKey)}
          </span>,
        ],
        [
          `{{2}}`,
          <span key="card" style={{ color: "white" }}>
            {ts(element.card!.nameKey)}
          </span>,
        ],
      ]);
      return (
        <div className="flex flex-col items-center gap-3">
          {element.card && <Card card={element.card} size={22} />}
          <div className="flex max-w-64 flex-wrap place-content-center gap-1 px-2 text-center leading-tight text-taupe-400">
            <span>{msg}</span>
          </div>
        </div>
      );
    }

    case "LootCardEffect": {
      const serialized: SerializedTranslation = {
        key: "gameStep.stack.stackElement.lootCardEffect",
        interpolates: {
          player: `{{1}}`,
          card: `{{2}}`,
        },
      };
      const msg = replaceTokens(ts(serialized), [
        [
          `{{1}}`,
          <span key="player" style={{ color: element.issuer.color }}>
            {ts(element.issuer.nameKey)}
          </span>,
        ],
        [
          `{{2}}`,
          <span key="player" style={{ color: "white" }}>
            {ts(element.card.nameKey)}
          </span>,
        ],
      ]);
      return (
        <>
          <Card card={element.card} size={22} />
          <div className="mt-3 flex max-w-64 flex-col gap-2 text-center leading-tight text-taupe-400">
            {msg}
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
            <span style={{ color: element.issuer.color }} className="font-bold">
              {ts(element.issuer.nameKey)}
            </span>
            <SelectionsList selections={element.targets} />
          </div>
        </>
      );
    }

    case "lootStep": {
      const serialized: SerializedTranslation = {
        key: "gameStep.stack.stackElement.loots",
        interpolates: {
          player: `{{1}}`,
          value: element.nbLoots.toString(),
        },
      };
      const msg = replaceTokens(ts(serialized), [
        [
          `{{1}}`,
          <span className="font-bold" style={{ color: element.player.color }}>
            {ts(element.player.nameKey)}
          </span>,
        ],
      ]);
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="max-w-64 px-2 text-center leading-tight text-taupe-400">
            {msg}
          </div>
        </div>
      );
    }

    case "endOfTurn": {
      const serialized: SerializedTranslation = {
        key: "gameStep.stack.stackElement.turnEnded",
        interpolates: {
          player: `{{1}}`,
        },
      };
      const msg = replaceTokens(ts(serialized), [
        [
          `{{1}}`,
          <span className="font-bold" style={{ color: element.player.color }}>
            {ts(element.player.nameKey)}
          </span>,
        ],
      ]);
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="max-w-64 px-2 text-center leading-tight text-taupe-400">
            {msg}
          </div>
        </div>
      );
    }

    case "damage": {
      const serialized: SerializedTranslation = {
        key: "gameStep.stack.stackElement.damageUsing",
        interpolates: {
          entity1: `{{1}}`,
          value: element.damage.toString(),
          entity2: `{{2}}`,
          cardOrAttackRoll: `{{3}}`,
        },
      };
      const msg = replaceTokens(ts(serialized), [
        [
          `{{1}}`,
          <span className="font-bold" style={{ color: element.from.color }}>
            {ts(element.from.nameKey)}
          </span>,
        ],
        [
          `{{2}}`,
          <span className="font-bold" style={{ color: element.receiver.color }}>
            {ts(element.receiver.nameKey)}
          </span>,
        ],
        [
          `{{3}}`,
          <span style={{ color: "white" }}>
            {"slug" in element.source
              ? ts(element.source.nameKey)
              : t("gameStep.stack.stackElement.anAttackRoll")}
          </span>,
        ],
      ]);
      return (
        <div className="flex flex-col items-center gap-3">
          {"slug" in element.source && <Card card={element.source} size={22} />}
          <div className="max-w-64 px-2 text-center leading-tight text-taupe-400">
            {msg}
          </div>
        </div>
      );
    }

    case "death": {
      const serialized: SerializedTranslation = {
        key: "gameStep.stack.stackElement.aKilledBusing",
        interpolates: {
          entity1: `{{1}}`,
          entity2: `{{2}}`,
          cardOrAttackRoll: `{{3}}`,
        },
      };
      const msg = replaceTokens(ts(serialized), [
        [
          `{{1}}`,
          <span className="font-bold" style={{ color: element.from.color }}>
            {ts(element.from.nameKey)}
          </span>,
        ],
        [
          `{{2}}`,
          <span className="font-bold" style={{ color: element.receiver.color }}>
            {ts(element.receiver.nameKey)}
          </span>,
        ],
        [
          `{{3}}`,
          <span style={{ color: "white" }}>
            {"slug" in element.source
              ? ts(element.source.nameKey)
              : t("gameStep.stack.stackElement.anAttackRoll")}
          </span>,
        ],
      ]);
      return (
        <div className="flex flex-col items-center gap-3">
          {"slug" in element.source && <Card card={element.source} size={22} />}
          <div className="max-w-64 px-2 text-center leading-tight text-taupe-400">
            {msg}
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
    case "diceWillRoll":
      return (
        <Dice
          value={undefined}
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
  const { t } = useLanguageContext();
  return (
    selections.length > 0 && (
      <>
        <span>{t("gameStep.stack.stackElement.chose")}</span>
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
  const { ts, t } = useLanguageContext();
  switch (selection.type) {
    case "card":
      return ts(selection.payload.nameKey);
    case "stackElement":
      switch (selection.payload.type) {
        case "death":
          return t("gameStep.stack.stackElement.aKilledB", {
            entity1: selection.payload.from.nameKey,
            entity2: selection.payload.receiver.nameKey,
          });
        case "diceRoll":
          return `${selection.payload.card ? ts(selection.payload.card.nameKey) : "an attack roll"} - ${ts(selection.payload.issuer.nameKey)} rolled a ${selection.payload.diceRoll}`;
        case "damage":
          return t("gameStep.stack.stackElement.damage", {
            entity1: selection.payload.from.nameKey,
            value: selection.payload.damage,
            entity2: selection.payload.receiver.nameKey,
          });
        case "effect":
          return `${ts(selection.payload.issuer.nameKey)} - ${ts(selection.payload.card.nameKey)}`;
        case "LootCardEffect":
          return t("gameStep.stack.stackElement.lootCardEffect", {
            player: selection.payload.issuer.nameKey,
            card: selection.payload.card.nameKey,
          });
        case "lootStep":
          return t("gameStep.stack.stackElement.lootStep", {
            player: selection.payload.player.nameKey,
            value: selection.payload.nbLoots,
          });
        case "endOfTurn":
          return t("gameStep.stack.stackElement.endOfTurn", {
            player: selection.payload.player.nameKey,
          });
        case "diceWillRoll":
          return t("gameStep.stack.stackElement.endOfTurn", {
            player: selection.payload.issuer.nameKey,
          });
      }
    case "deck":
      return t(`startStep.gameParams.decks.${selection.payload as DeckName}s`);
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
      return t("gameStep.stack.stackElement.hand", {
        player: selection.payload.player.nameKey,
      });
    case "object":
    case "character":
    case "array":
    case "null":
    case "unknown":
      return "Unknown";
  }
};
