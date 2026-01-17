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
  top?: boolean;
}

export const Card = ({ card, style, className, thickness = 1, top = true }: CardProps) => {

  const onClick = () => {
    console.log("clicked", typeof card === "string" ? card : card?.slug);
  };

  if (!card) {
    return (
      <div
        className={cn(
          "aspect-750/1024 h-40 rounded-md shadow-sm inset-shadow-sm shadow-stone-700 inset-shadow-stone-900",
          className,
        )}
        style={style}
      ></div>
    );
  }

  const src =
    typeof card === "string"
      ? `http://localhost:4321/images/back/${card}.webp`
      : `http://localhost:4321/images/front/${card.slug}.webp`;

  const alt = typeof card === "string" ? card : card.slug;

  return (
    <div
      className={cn("relative transform-3d aspect-750/1024", className)}
      style={{ ...style }}
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className={cn("pointer-events-auto h-full w-full", !top && "brightness-40")}
        draggable={false}
      />
     <img
        src={src}
        alt={alt}
        className="absolute top-0 bottom-0 left-0 h-full origin-left rotate-y-90 object-cover object-left brightness-60"
        style={{ width: `${thickness}rem` }}
        draggable={false}
      />
      <img
        src={src}
        alt={alt}
        className="absolute top-0 bottom-0 right-0 h-full origin-right -rotate-y-90 object-cover object-right brightness-70"
        style={{ width: `${thickness}rem` }}
        draggable={false}
      />
      <img
        src={src}
        alt={alt}
        className="absolute left-0 right-0 top-0 w-full origin-top -rotate-x-90 object-cover object-top brightness-150"
        style={{ height: `${thickness}rem` }}
        draggable={false}
      />
      <img
        src={src}
        alt={alt}
        className="absolute left-0 right-0 bottom-0 w-full origin-bottom rotate-x-90 object-cover object-bottom brightness-20"
        style={{ height: `${thickness}rem` }}
        draggable={false}
      />
    </div>
  );
};
