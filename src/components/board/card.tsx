import { CARD_RADIUS } from "@/constants";
import { cn } from "../../utils/cn";
import type { TemporaryEffect } from "@/shared/api";
import { TemporaryEffectCard } from "./temporary-effect-card";
import { SELF_BASE_URL } from "astro:env/client";
import { PileIndicator } from "@/icons/pile-indicator";

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
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  className?: string;
  thickness?: number;
  brightness?: number;
  enableSides?: boolean;
  hotkey?: string;
  effects?: TemporaryEffect[];
  onPileDetailsClick?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  size?: number;
  stats?:
    | { healthPoints: number; attackPoints: number; evasionPoints: number }
    | { healthPoints: number; attackPoints: number };
  counter?: number;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const RX = `${CARD_RADIUS}%`;
const RY = `${(CARD_RADIUS * 750) / 1024}%`;
const BORDER_RADIUS = `${RX} ${RX} ${RX} ${RX} / ${RY} ${RY} ${RY} ${RY}`;

export const Card = ({
  card,
  containerStyle,
  style,
  containerClassName,
  className,
  thickness = 1,
  brightness = 1,
  enableSides = true,
  onClick,
  hotkey,
  onPileDetailsClick,
  disabled,
  stats,
  size = 160,
  effects,
  counter,
  onMouseEnter,
  onMouseLeave,
}: CardProps) => {
  if (!card) {
    return (
      <div
        className={cn(
          "aspect-750/1024 h-40 rounded-md shadow-sm inset-shadow-sm shadow-stone-700 inset-shadow-stone-900",
          onClick && (disabled ? "cursor-not-allowed" : "cursor-pointer"),
          className,
        )}
        style={{ ...style, borderRadius: BORDER_RADIUS }}
        onClick={onClick}
      />
    );
  }

  const src =
    typeof card === "string"
      ? `${SELF_BASE_URL}/images/back/${card}.webp`
      : `${SELF_BASE_URL}/images/front/${card.slug}.webp`;

  const alt = typeof card === "string" ? card : card.slug;

  const statsSize = size * 0.09;

  return (
    <div
      className={cn(
        "relative aspect-750/1024 select-none transform-3d",
        containerClassName,
      )}
      style={{
        borderRadius: enableSides ? undefined : BORDER_RADIUS,
        height: size + "em",
        ...containerStyle,
      }}>
      <div
        className={cn("transform-3d", className)}
        style={{
          borderRadius: enableSides ? undefined : BORDER_RADIUS,
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
            filter: `brightness(${Math.max(0.2, brightness * brightness)})`,
            borderRadius: enableSides ? undefined : BORDER_RADIUS,
          }}
        />

        {hotkey && (
          <div className="absolute top-[1.5%] left-[2%] flex aspect-square w-[15%] place-items-center overflow-hidden rounded-sm bg-stone-700 outline-[0.1em] -outline-offset-[0.1em]">
            <img
              src={`/input-prompts/keyboard_${hotkey.split(",")[0]}_outline.svg`}
              className="scale-150"
            />
          </div>
        )}

        {onPileDetailsClick && (
          <div
            className="absolute bottom-0.5 left-0.5 cursor-pointer rounded-md bg-stone-700 p-0.5"
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
            className="absolute bottom-[3%] left-[5%] flex items-center justify-center rounded-full font-statblock text-black shadow-lg"
            style={{
              fontSize: size * 0.09 + "em",
              width: size * 0.75 + "em",
              height: size * 0.005 + "em",
            }}>
            {counter > 0 ? counter.toString().replaceAll("0", "O") : counter}
          </div>
        )}

        {stats && !("evasionPoints" in stats) && (
          <div style={{ fontSize: statsSize + "em" }}>
            <div className="pointer-events-none absolute top-[57.3%] right-[28.5%] left-[27.5%]">
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
          <div style={{ fontSize: statsSize + "em" }}>
            <div className="pointer-events-none absolute top-[57.3%] right-[17.1%] left-[17.7%]">
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
    </div>
  );
};

export const CardImage = ({
  card,
  className,
  onClick,
  style,
  tooltip,
}: {
  card: { slug: string } | CardType;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  tooltip?: string;
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
      className={cn("aspect-750/1024 select-none", className)}
      draggable={false}
      onClick={onClick}
      style={{ borderRadius: BORDER_RADIUS, ...style }}
    />
  );
};
