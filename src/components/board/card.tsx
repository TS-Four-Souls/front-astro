import { cn } from "../../utils/cn";
import type { TemporaryEffect, VisualEffectBox } from "@/shared/api";
import { TemporaryEffectCard } from "./temporary-effect-card";
import { SELF_BASE_URL } from "astro:env/client";
import { PileIndicator } from "@/icons/pile-indicator";
import { SelectionIndexIndicator } from "./selection-index-indicator";
import boxes from "@/data/boxes.json";

export enum CardType {
  BonusSoul = "bsoul",
  CharacterCard = "character",
  EternalCard = "eternal",
  LootCard = "loot",
  MonsterCard = "monster",
  TreasureCard = "treasure",
  RoomCard = "room",
}

interface CardProps {
  card?: { slug: string } | CardType;
  style?: React.CSSProperties;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  className?: string;
  brightness?: number;
  hotkey?: string;
  selectionIndex?: number;
  effects?: TemporaryEffect[];
  visualEffectBox?: {
    startIndex: number;
    endIndex: number;
  };
  onPileDetailsClick?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  size?: number;
  aspectRatio?: number;
  stats?:
    | { healthPoints: number; attackPoints: number; evasionPoints: number }
    | { healthPoints: number; attackPoints: number };
  counter?: number;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const CARD_RADIUS = 5;

const RX = `${CARD_RADIUS}%`;
const RY = `${(CARD_RADIUS * 750) / 1024}%`;
const BORDER_RADIUS = `${RX} ${RX} ${RX} ${RX} / ${RY} ${RY} ${RY} ${RY}`;

export const Card = ({
  card,
  containerStyle,
  style,
  containerClassName,
  className,
  brightness = 1,
  onClick,
  hotkey,
  selectionIndex,
  onPileDetailsClick,
  disabled,
  stats,
  size = 160,
  aspectRatio = 750 / 1024,
  effects,
  visualEffectBox,
  counter,
  onMouseEnter,
  onMouseLeave,
}: CardProps) => {
  if (!card) {
    return (
      <div
        className={cn(
          "rounded-md bg-taupe-600/50 shadow-sm inset-shadow-sm shadow-taupe-700 inset-shadow-taupe-700",
          onClick && (disabled ? "cursor-not-allowed" : "cursor-pointer"),
          className,
        )}
        style={{ ...style, borderRadius: BORDER_RADIUS, aspectRatio }}
        onClick={onClick}
      />
    );
  }

  const statsSize = size * 0.09;

  return (
    <div
      className={cn("relative", containerClassName)}
      style={{
        borderRadius: BORDER_RADIUS,
        height: size + "em",
        aspectRatio,
        ...containerStyle,
      }}>
      <div
        className={className}
        style={{
          borderRadius: BORDER_RADIUS,
          ...style,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}>
        <CardImage
          card={card}
          onClick={onClick}
          className={cn(
            "h-full w-full",
            onClick && (disabled ? "cursor-not-allowed" : "cursor-pointer"),
          )}
          style={{
            filter: `brightness(${Math.max(0, brightness * brightness)})`,
            borderRadius: BORDER_RADIUS,
          }}
          aspectRatio={aspectRatio}
        />

        {hotkey && (
          <div className="pointer-events-none absolute top-1 left-1 flex aspect-square size-4 place-items-center overflow-hidden rounded-sm bg-taupe-700 outline-[0.1em]">
            <img
              src={`/input-prompts/keyboard_${hotkey.split(",")[0]}_outline.svg`}
              className="scale-150"
            />
          </div>
        )}

        {selectionIndex && (
          <SelectionIndexIndicator
            index={selectionIndex}
            className="pointer-events-none top-1 right-1 size-5 text-2xs outline-[0.15em]"
          />
        )}

        {onPileDetailsClick && (
          <div
            className="absolute bottom-0.5 left-0.5 cursor-pointer rounded-md bg-taupe-700 p-0.5"
            onClick={onPileDetailsClick}>
            <PileIndicator className="h-3 w-3" />
          </div>
        )}

        {effects && effects.length > 0 && (
          <div className="absolute top-[16%] right-[4%] bottom-[45%] flex flex-col flex-wrap-reverse gap-1">
            {effects.map((effect, index) => (
              <TemporaryEffectCard
                key={index}
                effect={effect}
                size={size * 1.8}
                className="glow-5"
              />
            ))}
          </div>
        )}

        {counter !== undefined && (
          <div
            className="pointer-events-none absolute bottom-[3%] left-[50%] flex items-center justify-center rounded-full font-statblock text-black"
            style={{
              fontSize: size * 0.09 + "em",
              width: "0%",
              height: size * 0.005 + "em",
            }}>
            {counter > 0 ? counter.toString().replaceAll("0", "O") : counter}
          </div>
        )}

        {stats && !("evasionPoints" in stats) && (
          <div
            className="pointer-events-none"
            style={{ fontSize: statsSize + "em" }}>
            <div className="absolute top-[57.3%] right-[28.5%] left-[27.5%]">
              <img src="/character-card-overlay.png" draggable={false} />
            </div>
            <div className="absolute top-[55.7%] left-[40.5%] font-statblock text-black">
              {stats.healthPoints}
            </div>
            <p className="absolute top-[55.7%] left-[62.3%] font-statblock text-black">
              {stats.attackPoints}
            </p>
          </div>
        )}

        {stats && "evasionPoints" in stats && (
          <div
            className="pointer-events-none"
            style={{ fontSize: statsSize + "em" }}>
            <div className="absolute top-[57.3%] right-[17.1%] left-[17.7%]">
              <img src="/monster-card-overlay.png" draggable={false} />
            </div>

            <div className="absolute top-[55.7%] left-[30.5%] font-statblock text-black">
              {stats.healthPoints}
            </div>
            <p className="absolute top-[55.7%] left-[72.6%] font-statblock text-black">
              {stats.attackPoints}
            </p>
            <p
              className={cn(
                "absolute font-statblock text-black",
                stats.evasionPoints === 6 || stats.evasionPoints === 0
                  ? "top-[55.7%] left-[51.9%]"
                  : "top-[55.7%] left-[51.2%]",
              )}>
              {stats.evasionPoints}
            </p>
            <p
              className={cn(
                "absolute top-[58.8%] font-main text-[60%] text-black",
                stats.evasionPoints === 0 && "hidden",
                stats.evasionPoints === 1 && "left-[55.5%]",
                stats.evasionPoints === 2 && "left-[56.5%]",
                stats.evasionPoints === 3 && "left-[56.5%]",
                stats.evasionPoints === 4 && "left-[56.0%]",
                stats.evasionPoints === 5 && "left-[57.0%]",
                stats.evasionPoints === 6 && "hidden",
              )}>
              +
            </p>
            {stats.attackPoints === 6 && (
              <p className="absolute top-[55.7%] left-[77%] font-statblock text-black">
                !
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const VisualEffectBoxComponent = ({
  card,
  visualEffectBox,
}: {
  card: { slug: string };
  visualEffectBox: VisualEffectBox;
}) => {
  const cardBoxes = boxes[card.slug as keyof typeof boxes];
  if (
    !cardBoxes ||
    visualEffectBox.startIndex < 0 ||
    visualEffectBox.endIndex >= cardBoxes.length
  ) {
    return null;
  }

  const box = {
    top: cardBoxes[visualEffectBox.startIndex].top * 100 - 0.5 + "%",
    bottom: cardBoxes[visualEffectBox.endIndex].bottom * 100 - 0.5 + "%",
    left: cardBoxes[visualEffectBox.endIndex].left * 100 - 0.5 + "%",
    right: cardBoxes[visualEffectBox.endIndex].right * 100 - 0.5 + "%",
  };

  return (
    <div
      className="absolute rounded-[0.3em] shadow-xl/50 inset-shadow-sm inset-shadow-white backdrop-brightness-120"
      style={box}></div>
  );
};

export const CardImage = ({
  card,
  className,
  onClick,
  style,
  tooltip,
  aspectRatio = 750 / 1024,
}: {
  card: { slug: string } | CardType;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  tooltip?: string;
  aspectRatio?: number;
}) => {
  const src =
    typeof card === "string"
      ? `${SELF_BASE_URL}/images/back/${card}.webp`
      : `${SELF_BASE_URL}/images/front/${card.slug}.webp`;

  const alt = typeof card === "string" ? card : card.slug;

  return (
    <img
      src={src}
      alt={alt}
      title={tooltip}
      className={cn("aspect-750/1024", className)}
      draggable={false}
      onClick={onClick}
      style={{ borderRadius: BORDER_RADIUS, aspectRatio, ...style }}
    />
  );
};
