import { useRef } from "react";
import { cn } from "../../utils/cn";
import { Card, CardType } from "./card";
import seedrandom from "seedrandom";
import { clamp } from "@/utils/numbers";
import {
  ZoomResolutionPreset,
  useUserSettingsContext,
} from "./contexts/user-settings-context";
import type { TemporaryEffect } from "@/shared/api";

interface PileProps {
  cards: (
    | {
        slug: string;
        charged?: boolean;
        effects?: TemporaryEffect[];
        engagedInCombat?: boolean;
        eternal?: boolean;
        stats?:
          | {
              healthPoints: number;
              attackPoints: number;
              evasionPoints: number;
            }
          | {
              healthPoints: number;
              attackPoints: number;
            }
          | undefined;
      }
    | CardType
  )[];
  size?: number;
  disabled?: boolean;
  className?: string;
  topCardClassName?: string;
  onClickTopCard?: () => void;
  tooltip?: string;
  optimizations?: {
    maxCards: number;
    enableSides: boolean;
    enable3D: boolean;
  };
}

const BRIGHTNESS_MIN = 0.3;

const maxCardsByResolution = {
  [ZoomResolutionPreset.HIGH]: 20,
  [ZoomResolutionPreset.MEDIUM]: 20,
  [ZoomResolutionPreset.LOW]: 15,
  [ZoomResolutionPreset.VERY_LOW]: 10,
};

export const Pile = ({
  cards,
  size: sizePx = 160,
  disabled,
  onClickTopCard,
  className,
  tooltip,
  optimizations,
  topCardClassName,
}: PileProps) => {
  const size = sizePx / 16;
  const seed = useRef(Math.random().toString());
  const rng = seedrandom(seed.current);

  const userSettings = useUserSettingsContext();

  const enable3D = optimizations?.enable3D ?? userSettings.enable3D;
  const enableSides =
    optimizations?.enableSides ?? userSettings.enableCardSides;
  const maxCards =
    optimizations?.maxCards ??
    maxCardsByResolution[userSettings.zoomResolutionPreset];

  return (
    <div
      className={cn("grid shrink-0 transform-3d", className)}
      style={{ height: size + "em" }}>
      {cards
        .filter((_, index) => index >= cards.length - maxCards)
        .map((card, index, array) => {
          const thickness = Math.max(0.05 * (cards.length / array.length), 0.1);
          const distanceFromTop = array.length - index - 1;
          const brightness = clamp(
            1 - ((1 - BRIGHTNESS_MIN) / array.length) * distanceFromTop,
            BRIGHTNESS_MIN,
            1,
          );

          const charged =
            typeof card === "string" ? true : (card.charged ?? true);

          const engagedInCombat =
            typeof card === "string" ? false : (card.engagedInCombat ?? false);

          const eternal =
            typeof card === "string" ? false : (card.eternal ?? false);

          return (
            <Card
              onClick={index === array.length - 1 ? onClickTopCard : undefined}
              thickness={thickness}
              key={index}
              card={card}
              className={cn(
                "col-start-1 row-start-1",
                !charged && "brightness-50 contrast-90",
                engagedInCombat && "outline-[0.2em] outline-red-500/60",
                cards.length > 0 && index === 0 && "shadow-lg/20",
                cards.length > 5 && index === 3 && "shadow-lg/20",
                cards.length > 10 && index === 2 && "shadow-xl/30",
                cards.length > 40 && index === 1 && "shadow-2xl/30",
                cards.length > 80 && index === 0 && "shadow-3xl/30",
                index === array.length - 1 &&
                  onClickTopCard &&
                  (disabled ? "cursor-not-allowed" : "cursor-pointer"),
                index === array.length - 1 && topCardClassName,
              )}
              style={{
                transform: `
                  ${enable3D ? `translateZ(${thickness * (index + 1)}em)` : ""}
                  rotate(${(rng() - 0.5) * 5}deg)
                `,
              }}
              size={size}
              brightness={brightness}
              enableSides={enableSides}
              tooltip={index === array.length - 1 ? tooltip : undefined}
              stats={typeof card === "string" ? undefined : card.stats}
              effects={typeof card === "string" ? undefined : card.effects}
              eternal={eternal}
            />
          );
        })}
      {cards.length === 0 && (
        <Card
          onClick={onClickTopCard}
          style={{ height: size + "em" }}
          tooltip={tooltip}
        />
      )}
    </div>
  );
};
