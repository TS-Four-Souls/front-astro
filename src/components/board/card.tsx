import { useEffect, useState } from "react";
import { cn } from "../../utils/cn";
import { DEFAULT_LANGUAGE } from "../../utils/translate";
import type { TemporaryEffect, VisualEffectBox } from "@/shared/api";
import { TemporaryEffectCard } from "./temporary-effect-card";
import { SELF_BASE_URL } from "astro:env/client";
import { PileIndicator } from "@/icons/pile-indicator";
import { SelectionIndexIndicator } from "./selection-index-indicator";
import { useLanguageContext } from "../contexts/language-context";

export enum CardType {
  BonusSoul = "bsoul",
  CharacterCard = "character",
  EternalCard = "eternal",
  LootCard = "loot",
  MonsterCard = "monster",
  TreasureCard = "treasure",
  RoomCard = "room",
}

type Orientation = "portrait" | "landscape";

interface CardProps {
  card?: { slug: string } | CardType;
  style?: React.CSSProperties;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  className?: string;
  brightness?: number;
  hotkey?: string;
  globalId?: number;
  selectionIndex?: number;
  effects?: TemporaryEffect[];
  visualEffectBox?: {
    startIndex: number;
    endIndex: number;
  };
  onPileDetailsClick?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  size: number;
  orientation?: Orientation;
  stats?: {
    healthPoints: number;
    attackPoints: number;
    evasionPoints?: number | undefined;
  };
  counter?: number;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const CARD_RADIUS = 5;

const getOrientationParameters = (
  orientation: Orientation,
): { aspectRatio: number; borderRadius: string } => {
  const aspectRatio = orientation === "portrait" ? 750 / 1024 : 1024 / 750;

  const rx =
    orientation === "portrait"
      ? `${CARD_RADIUS}%`
      : `${(CARD_RADIUS * 750) / 1024}%`;

  const ry =
    orientation === "portrait"
      ? `${(CARD_RADIUS * 750) / 1024}%`
      : `${CARD_RADIUS}%`;
  const borderRadius = `${rx} ${rx} ${rx} ${rx} / ${ry} ${ry} ${ry} ${ry}`;

  return { aspectRatio, borderRadius };
};

const plusLeftPosition: Record<Orientation, Record<number, number>> = {
  portrait: {
    0: 0,
    1: 55.5,
    2: 56.5,
    3: 56.5,
    4: 56.0,
    5: 57.0,
    6: 0,
  },
  landscape: {
    0: 0,
    1: 54,
    2: 54.5,
    3: 54.5,
    4: 54,
    5: 55,
    6: 0,
  },
};

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
  visualEffectBox,
  disabled,
  stats,
  size = 160,
  orientation = "portrait",
  effects,
  counter,
  globalId = 0,
  onMouseEnter,
  onMouseLeave,
}: CardProps) => {
  size = orientation === "portrait" ? size : size * (750 / 1024);
  const { aspectRatio, borderRadius } = getOrientationParameters(orientation);

  if (!card) {
    return (
      <div
        className={cn(
          "rounded-md bg-taupe-600/50 shadow-sm inset-shadow-sm shadow-taupe-700 inset-shadow-taupe-700",
          onClick && (disabled ? "cursor-not-allowed" : "cursor-pointer"),
          className,
        )}
        style={{
          ...style,
          height: size + "em",
          borderRadius,
          aspectRatio,
        }}
        onClick={onClick}
      />
    );
  }

  const statsSize = orientation === "portrait" ? size * 0.09 : size * 0.12;

  const positionStatOverlay =
    orientation === "portrait"
      ? "absolute top-[57.3%] right-[17.1%] left-[17.7%]"
      : "absolute top-[54.5%] right-[26.5%] left-[26%] opacity-100";
  const HealthOverlay =
    orientation === "portrait"
      ? "absolute top-[55.7%] left-[30.5%] font-statblock text-black"
      : "absolute top-[52.1%] left-[36%] font-statblock text-black";
  const atkOverlay =
    orientation === "portrait"
      ? "absolute top-[55.7%] left-[72.6%] font-statblock text-black"
      : "absolute top-[52.1%] left-[66.6%] font-statblock text-black";
  const evasionOverlay =
    stats && stats.evasionPoints !== undefined
      ? orientation === "portrait"
        ? stats.evasionPoints === 6 || stats.evasionPoints === 0
          ? "absolute font-statblock text-black top-[55.7%] left-[51.9%]"
          : "absolute font-statblock text-black top-[55.7%] left-[51.2%]"
        : stats.evasionPoints === 6 || stats.evasionPoints === 0
          ? "absolute font-statblock text-black top-[52.1%] left-[51.4%]"
          : "absolute font-statblock text-black top-[52.1%] left-[50.7%]"
      : "";
  return (
    <div
      className={cn("relative", containerClassName)}
      style={{
        borderRadius,
        height: size + "em",
        aspectRatio,
        ...containerStyle,
      }}>
      <div
        className={className}
        style={{
          borderRadius,
          ...style,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}>
        <CardImage
          sizes={`${size * aspectRatio}em`}
          card={card}
          onClick={onClick}
          className={cn(
            "h-full w-full",
            onClick && (disabled ? "cursor-not-allowed" : "cursor-pointer"),
          )}
          style={{
            filter: `brightness(${Math.max(0, brightness * brightness)})`,
            borderRadius,
          }}
          orientation={orientation}
        />

        {hotkey && (
          <div className="pointer-events-none absolute top-1 left-1 flex size-4 place-items-center overflow-hidden rounded-sm bg-taupe-700 outline-[0.1em]">
            <img
              src={`/input-prompts/keyboard_${hotkey.split(",")[0]}_outline.svg`}
              className="scale-150"
            />
          </div>
        )}

        {typeof card === "object" && visualEffectBox && (
          <VisualEffectBoxComponent
            card={card}
            visualEffectBox={visualEffectBox}
          />
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

        {counter !== undefined && counter > 0 && (
          <div className="absolute top-[38%] bottom-[45%] left-[6%] size-[25%]">
            <img
              src="/counter.png"
              alt="Logo"
              className="size-full object-contain"
              style={{
                filter: `brightness(150%) hue-rotate(${globalId ** 3 + globalId * 17}deg)`,
              }}
            />
            <span
              className="absolute inset-0 flex items-center justify-center font-alt-stats font-bold text-black text-shadow-[0_0_0.2em] text-shadow-white"
              style={{
                fontSize: size * 0.09 * (counter > 9 ? 0.8 : 1) + "em",
              }}>
              {counter}
            </span>
          </div>
        )}

        {stats && stats.evasionPoints === undefined && (
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

        {stats && stats.evasionPoints !== undefined && (
          <div
            className="pointer-events-none"
            style={{ fontSize: statsSize + "em" }}>
            <div className={positionStatOverlay}>
              <img src="/monster-card-overlay.png" draggable={false} />
            </div>

            <div className={HealthOverlay}>{stats.healthPoints}</div>
            <p className={atkOverlay}>{stats.attackPoints}</p>
            <p className={evasionOverlay}>{stats.evasionPoints}</p>
            <p
              className={cn(
                orientation === "portrait" &&
                  "absolute top-[58.8%] font-main text-[60%] text-black",
                orientation === "landscape" &&
                  "absolute top-[56.5%] font-main text-[60%] text-black",
                stats.evasionPoints === 0 ||
                  (stats.evasionPoints === 6 && "hidden"),
              )}
              style={{
                left: plusLeftPosition[orientation][stats.evasionPoints] + "%",
              }}>
              +
            </p>
            {stats.attackPoints === 6 && (
              <p
                className={cn(
                  "absolute font-statblock text-black",
                  orientation === "portrait"
                    ? "top-[55.7%] left-[77%]"
                    : "top-[52%] left-[70%]",
                )}>
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
  className,
  onClick,
  children,
}: {
  card: { slug: string };
  onClick?: () => void;
  visualEffectBox: VisualEffectBox;
  className?: string;
  children?: React.ReactNode;
}) => {
  const { boxes } = useLanguageContext();
  const dic = boxes;
  const cardBoxes = dic[card.slug as keyof typeof dic];
  if (
    !cardBoxes ||
    visualEffectBox.startIndex < 0 ||
    visualEffectBox.endIndex >= cardBoxes.length
  ) {
    return null;
  }

  const minTop = Math.min(
    ...cardBoxes
      .slice(visualEffectBox.startIndex, visualEffectBox.endIndex + 1)
      .map(({ top }) => top),
  );

  const minBottom = Math.min(
    ...cardBoxes
      .slice(visualEffectBox.startIndex, visualEffectBox.endIndex + 1)
      .map(({ bottom }) => bottom),
  );

  const minLeft = Math.min(
    ...cardBoxes
      .slice(visualEffectBox.startIndex, visualEffectBox.endIndex + 1)
      .map(({ left }) => left),
  );

  const minRight = Math.min(
    ...cardBoxes
      .slice(visualEffectBox.startIndex, visualEffectBox.endIndex + 1)
      .map(({ right }) => right),
  );

  const box = {
    top: minTop * 100 - 0.5 + "%",
    bottom: minBottom * 100 - 0.5 + "%",
    left: minLeft * 100 - 0.5 + "%",
    right: minRight * 100 - 0.5 + "%",
  };

  return (
    <div className="absolute" style={box}>
      <div
        onClick={onClick}
        className={cn(
          "h-full w-full rounded-[0.3em] shadow-xl/50 inset-shadow-sm inset-shadow-white backdrop-brightness-120",
          className,
        )}
      />
      {children}
    </div>
  );
};

const PORTRAIT_WIDTHS = [128, 180, 256, 360, 512];
const LANDSCAPE_WIDTHS = [175, 245, 350, 490, 700];

export const CardImage = ({
  card,
  sizes = "256px",
  className,
  onClick,
  style,
  tooltip,
  orientation = "portrait",
}: {
  card: { slug: string } | CardType;
  sizes: string;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  tooltip?: string;
  orientation?: "portrait" | "landscape";
}) => {
  const { aspectRatio, borderRadius } = getOrientationParameters(orientation);
  const { language } = useLanguageContext();
  const [useEnglishFallback, setUseEnglishFallback] = useState(false);

  const cardKey = typeof card === "string" ? card : card.slug;

  useEffect(() => {
    setUseEnglishFallback(false);
  }, [cardKey, language]);

  const imageLanguage = useEnglishFallback ? DEFAULT_LANGUAGE : language;

  const src =
    typeof card === "string"
      ? `${SELF_BASE_URL}/images/back/${card}_256_${imageLanguage}.webp`
      : `${SELF_BASE_URL}/images/front/${card.slug}_256_${imageLanguage}.webp`;

  const alt = typeof card === "string" ? card : card.slug;

  const widths =
    orientation === "portrait" ? PORTRAIT_WIDTHS : LANDSCAPE_WIDTHS;

  const srcSet =
    "\n" +
    widths
      .map((size) =>
        typeof card === "string"
          ? `${SELF_BASE_URL}/images/back/${card}_${size}_${imageLanguage}.webp ${size}w`
          : `${SELF_BASE_URL}/images/front/${card.slug}_${size}_${imageLanguage}.webp ${size}w`,
      )
      .join(",\n");

  return (
    <img
      srcSet={srcSet}
      sizes={sizes}
      src={src}
      alt={alt}
      title={tooltip}
      className={className}
      draggable={false}
      onClick={onClick}
      onError={() => {
        if (language !== DEFAULT_LANGUAGE) {
          setUseEnglishFallback(true);
        }
      }}
      style={{ borderRadius, aspectRatio, ...style }}
    />
  );
};
