import { useRef } from "react";
import { cn } from "../../utils/cn";
import { Card, CardType } from "./card";
import seedrandom from "seedrandom";
import { clamp } from "@/utils/numbers";
import type { TemporaryEffect } from "@/shared/api";
import { usePopoverContext } from "./contexts/popover-context";
import { HotkeyScope, shouldUseKey } from "@/utils/hotkey";
import { useHotkeys } from "react-hotkeys-hook";
import type { Tooltip } from "./use-tooltip";
import { useTooltip } from "./use-tooltip";
import { useBoardSelectionContext } from "./contexts/board-selection-context";
import { useToastContext } from "./contexts/toast-context";

type CardMetadata = {
  isRequiredAttack?: boolean;
  charged?: boolean;
  eternal?: boolean;
  engagedInCombat?: boolean;
  engagedInPurchase?: boolean;
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
  onHoverPopover?: () => React.ReactNode;
  tooltip?: Tooltip;
  enableRandomRotation?: boolean;
  globalId?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const BRIGHTNESS_MIN = 0.3;

export const Pile = ({
  cards,
  size: sizePx = 160,
  disabled,
  onClickTopCard: propsOnClickTopCard,
  onClickTopCardHotkey: propsOnClickTopCardHotkey,
  onPileDetailsClick,
  className,
  tooltip,
  topCardClassName,
  onHoverPopover,
  enableRandomRotation = true,
  style,
  globalId,
  children,
}: PileProps) => {
  const size = sizePx / 16;
  const seed = useRef(Math.random().toString());
  const rng = seedrandom(seed.current);

  const { boardSelectionState, isBoardSelectionActive, toggleSelection } =
    useBoardSelectionContext();

  const { block } = useToastContext();

  const entityBoardSelectionState =
    globalId === undefined ? undefined : boardSelectionState?.get(globalId);

  const onClickTopCard = isBoardSelectionActive
    ? entityBoardSelectionState?.isSelectable
      ? () => {
          toggleSelection(entityBoardSelectionState.selectionItem);
        }
      : () => {
          block(
            "Cannot select this card",
            "You cannot select this card",
            () => {
              console.log("Cannot select this card");
            },
          );
        }
    : propsOnClickTopCard;

  const onClickTopCardHotkey = isBoardSelectionActive
    ? entityBoardSelectionState
      ? entityBoardSelectionState.optionIndex < 9 &&
        entityBoardSelectionState.isSelectable
        ? `${entityBoardSelectionState.optionIndex + 1}`
        : undefined
      : undefined
    : propsOnClickTopCardHotkey;

  const hotkeyScope = isBoardSelectionActive
    ? HotkeyScope.Selection
    : HotkeyScope.Main;

  useHotkeys(onClickTopCardHotkey ?? "enter", () => onClickTopCard?.(), {
    enabled: onClickTopCardHotkey !== undefined && onClickTopCard !== undefined,
    scopes: [hotkeyScope],
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

  const maxCards = 16;

  return (
    <div
      className={cn("grid shrink-0", className)}
      style={{ height: size + "em", ...style }}>
      {cards
        .filter((_, index) => index >= cards.length - maxCards)
        .map((card, index, array) => {
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

          const engagedInPurchase =
            typeof card === "string"
              ? false
              : (card.engagedInPurchase ?? false);

          const eternal =
            typeof card === "string" ? false : (card.eternal ?? false);

          const counter = typeof card === "string" ? undefined : card.counter;

          const isRequiredAttack =
            typeof card === "object" ? card.isRequiredAttack : false;

          const cardsIndex = (index / array.length) * cards.length;

          const transformStyle = {
            transform: `
              ${enableRandomRotation ? `rotate(${(rng() - 0.5) * 5}deg)` : ""}
              translateY(-${cardsIndex * 0.02}em)
              scale(${1 + cardsIndex * 0.0002})
            `,
          };

          return (
            <>
              <Card
                onClick={
                  index === array.length - 1 ? onClickTopCard : undefined
                }
                key={index}
                card={
                  typeof card === "object" && "type" in card ? card.type : card
                }
                containerClassName={cn(
                  "col-start-1 row-start-1",

                  engagedInCombat &&
                    "outline-[0.2em] outline-red-500/60 glow-combat",
                  engagedInPurchase &&
                    "outline-[0.2em] outline-yellow-400/60 glow-purchase",

                  isRequiredAttack &&
                    "outline-[0.2em] outline-red-500/60 outline-dashed glow-combat",

                  entityBoardSelectionState &&
                    entityBoardSelectionState.isSelected &&
                    index === array.length - 1 &&
                    "outline-[0.2em] outline-blue-500 glow-selection",
                )}
                className={cn(
                  !charged && "brightness-50 contrast-90",
                  eternal && "glow-6",
                  cards.length > 0 && index === 0 && "shadow-lg/20",
                  cards.length > 5 && index === 3 && "shadow-lg/20",
                  cards.length > 10 && index === 2 && "shadow-xl/30",
                  cards.length > 40 && index === 1 && "shadow-2xl/30",
                  cards.length > 80 && index === 0 && "shadow-3xl/30",
                  index === array.length - 1 && topCardClassName,
                )}
                disabled={
                  isBoardSelectionActive
                    ? entityBoardSelectionState === undefined ||
                      entityBoardSelectionState.isSelectable === false
                    : disabled
                }
                containerStyle={transformStyle}
                size={size}
                brightness={brightness}
                stats={typeof card === "string" ? undefined : card.stats}
                effects={typeof card === "string" ? undefined : card.effects}
                counter={counter}
                onMouseEnter={
                  index === array.length - 1
                    ? onHoverPopover
                      ? onMouseEnter
                      : setTooltip
                    : undefined
                }
                onMouseLeave={
                  index === array.length - 1
                    ? onHoverPopover
                      ? closePopover
                      : closeTooltip
                    : undefined
                }
                onPileDetailsClick={
                  index === array.length - 1 ? onPileDetailsClick : undefined
                }
                hotkey={
                  index === array.length - 1 ? onClickTopCardHotkey : undefined
                }
                selectionIndex={
                  index === array.length - 1
                    ? entityBoardSelectionState?.selectionIndex
                    : undefined
                }
              />
              {index === array.length - 1 && (
                <div style={transformStyle}>{children}</div>
              )}
            </>
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
