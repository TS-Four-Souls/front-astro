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
import { usePopoverContext } from "./contexts/popover-context";
import { HotkeyScope, shouldUseKey } from "@/utils/hotkey";
import { useHotkeys } from "react-hotkeys-hook";
import type { Tooltip } from "./use-tooltip";
import { useTooltip } from "./use-tooltip";

type CardMetadata = {
  isRequiredAttack?: boolean;
  charged?: boolean;
  eternal?: boolean;
  engagedInCombat?: boolean;
  counter?: number;
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
  effects?: TemporaryEffect[];
};

interface PileProps {
  cards: (
    | CardType
    | (CardMetadata &
        (
          | {
              slug: string;
              charged?: boolean;
            }
          | {
              type: CardType;
            }
        ))
  )[];
  size?: number;
  disabled?: boolean;
  className?: string;
  topCardClassName?: string;
  onClickTopCard?: () => void;
  onClickTopCardHotkey?: string;
  onPileDetailsClick?: () => void;
  optimizations?: {
    maxCards: number;
    enableSides: boolean;
    enable3D: boolean;
  };
  onHoverPopover?: () => React.ReactNode;
  tooltip?: Tooltip;
  enableRandomRotation?: boolean;
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
  onClickTopCardHotkey,
  onPileDetailsClick,
  className,
  tooltip,
  optimizations,
  topCardClassName,
  onHoverPopover,
  enableRandomRotation = true,
}: PileProps) => {
  const size = sizePx / 16;
  const seed = useRef(Math.random().toString());
  const rng = seedrandom(seed.current);

  useHotkeys(onClickTopCardHotkey ?? "enter", () => onClickTopCard?.(), {
    enabled: onClickTopCardHotkey !== undefined && onClickTopCard !== undefined,
    scopes: [HotkeyScope.Main],
    useKey: shouldUseKey(onClickTopCardHotkey ?? ""),
  });

  const { setPopover, closePopover } = usePopoverContext();
  const { setTooltip, closeTooltip } = useTooltip(tooltip);

  const onMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onHoverPopover) {
      setPopover({
        anchor: e.currentTarget.getBoundingClientRect(),
        content: onHoverPopover(),
      });
    }
  };

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

          const counter = typeof card === "string" ? undefined : card.counter;

          const isRequiredAttack =
            typeof card === "object" ? card.isRequiredAttack : false;

          return (
            <Card
              onClick={index === array.length - 1 ? onClickTopCard : undefined}
              thickness={thickness}
              key={index}
              card={
                typeof card === "object" && "type" in card ? card.type : card
              }
              className={cn(
                "col-start-1 row-start-1",
                !charged && "brightness-50 contrast-90",
                engagedInCombat && "outline-[0.2em] outline-red-500/60",
                isRequiredAttack &&
                  "outline-[0.2em] outline-red-500/60 outline-dashed",
                cards.length > 0 && index === 0 && "shadow-lg/20",
                cards.length > 5 && index === 3 && "shadow-lg/20",
                cards.length > 10 && index === 2 && "shadow-xl/30",
                cards.length > 40 && index === 1 && "shadow-2xl/30",
                cards.length > 80 && index === 0 && "shadow-3xl/30",
                index === array.length - 1 && topCardClassName,
              )}
              disabled={index === array.length - 1 && disabled}
              style={{
                transform: `
                  ${enable3D ? `translateZ(${thickness * (index + 1)}em)` : ""}
                  ${enableRandomRotation ? `rotate(${(rng() - 0.5) * 5}deg)` : ""}
                `,
              }}
              size={size}
              brightness={brightness}
              enableSides={enableSides}
              stats={typeof card === "string" ? undefined : card.stats}
              effects={typeof card === "string" ? undefined : card.effects}
              eternal={eternal}
              counter={counter}
              onMouseEnter={
                index === array.length - 1 ? onHoverPopover ? onMouseEnter : setTooltip : undefined
              }
              onMouseLeave={
                index === array.length - 1 ? onHoverPopover ? closePopover : closeTooltip : undefined
              }
              onPileDetailsClick={
                index === array.length - 1 ? onPileDetailsClick : undefined
              }
              hotkey={
                index === array.length - 1 ? onClickTopCardHotkey : undefined
              }
            />
          );
        })}
      {cards.length === 0 && (
        <Card
          onClick={onClickTopCard}
          disabled={disabled}
          style={{ height: size + "em" }}
        />
      )}
    </div>
  );
};
