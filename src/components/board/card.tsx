import { CARD_RADIUS } from "@/constants";
import { cn } from "../../utils/cn";

export enum CardType {
  BonusSoul = "bsoul",
  CharacterCard = "character",
  EternalCard = "eternal",
  LootCard = "loot",
  MonsterCard = "monster",
  TreasureCard = "treasure",
}

interface CardProps {
  card?: { slug: string } | CardType;
  style?: React.CSSProperties;
  className?: string;
  thickness?: number;
  brightness?: number;
  enableSides?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

const RX = `${CARD_RADIUS}%`;
const RY = `${(CARD_RADIUS * 750) / 1024}%`;
const BORDER_RADIUS = `${RX} ${RX} ${RX} ${RX} / ${RY} ${RY} ${RY} ${RY}`;

export const Card = ({
  card,
  style,
  className,
  thickness = 1,
  brightness = 1,
  enableSides = true,
  onClick,
  tooltip,
}: CardProps) => {
  if (!card) {
    return (
      <div
        className={cn(
          "aspect-750/1024 h-40 rounded-md shadow-sm inset-shadow-sm shadow-stone-700 inset-shadow-stone-900",
          onClick && "cursor-pointer",
          className,
        )}
        style={{ ...style, borderRadius: BORDER_RADIUS }}
        title={tooltip}
        onClick={onClick}
      />
    );
  }

  const src =
    typeof card === "string"
      ? `http://localhost:4321/images/back/${card}.webp`
      : `http://localhost:4321/images/front/${card.slug}.webp`;

  const alt = typeof card === "string" ? card : card.slug;

  return (
    <div
      className={cn(
        "relative aspect-750/1024 select-none transform-3d",
        !enableSides && "overflow-hidden",
        className,
      )}
      style={{
        ...style,
        borderRadius: BORDER_RADIUS,
      }}
      onClick={onClick}
      title={tooltip}>
      <CardImage
        card={card}
        className={cn("pointer-events-auto h-full w-full")}
        style={{
          filter: `brightness(${Math.max(0.2, brightness * brightness)})`,
          borderRadius: enableSides ? "unset" : BORDER_RADIUS,
        }}
      />
      {enableSides && (
        <>
          <img
            src={src}
            alt={alt}
            className="absolute top-0 bottom-0 left-0 h-full origin-left rotate-y-90 object-cover object-left brightness-60"
            style={{
              width: `${thickness}em`,
              filter: `brightness(${0.4 * brightness + 0.2})`,
            }}
            draggable={false}
          />
          <img
            src={src}
            alt={alt}
            className="absolute top-0 right-0 bottom-0 h-full origin-right -rotate-y-90 object-cover object-right brightness-70"
            style={{
              width: `${thickness}em`,
              filter: `brightness(${0.8 * brightness + 0.2})`,
            }}
            draggable={false}
          />
          <img
            src={src}
            alt={alt}
            className="absolute top-0 right-0 left-0 w-full origin-top -rotate-x-90 object-cover object-top brightness-150"
            style={{
              height: `${thickness}em`,
              filter: `brightness(${0.4 * brightness + 1})`,
            }}
            draggable={false}
          />
          <img
            src={src}
            alt={alt}
            className="absolute right-0 bottom-0 left-0 w-full origin-bottom rotate-x-90 object-cover object-bottom brightness-20"
            style={{
              height: `${thickness}em`,
              filter: `brightness(${0.2 * brightness + 0.1})`,
            }}
            draggable={false}
          />
        </>
      )}
    </div>
  );
};

export const CardImage = ({
  card,
  className,
  onClick,
  style,
}: {
  card: { slug: string } | CardType;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) => {
  const src =
    typeof card === "string"
      ? `http://localhost:4321/images/back/${card}.webp`
      : `http://localhost:4321/images/front/${card.slug}.webp`;

  const alt = typeof card === "string" ? card : card.slug;

  return (
    <img
      src={src}
      alt={alt}
      className={cn("aspect-750/1024 select-none", className)}
      draggable={false}
      onClick={onClick}
      style={{ borderRadius: BORDER_RADIUS, ...style }}
    />
  );
};
