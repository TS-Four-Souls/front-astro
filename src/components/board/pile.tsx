import type { TemporaryEffect } from "@/shared/api";
import { HotkeyScope, shouldUseKey } from "@/utils/hotkey";
import { clamp } from "@/utils/numbers";
import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import seedrandom from "seedrandom";
import { cn } from "../../utils/cn";
import { Card, CardType } from "./card";
import { useBoardSelectionContext } from "./contexts/board-selection-context";
import { usePopoverContext } from "./contexts/popover-context";
import { useToastContext } from "./contexts/toast-context";
import type { Tooltip } from "./use-tooltip";
import { useTooltip } from "./use-tooltip";
import { useLanguageContext } from "../contexts/language-context";
import { usePromptContext } from "./contexts/prompt-context";
import { useGameContext } from "./contexts/game-context";
import { CheatButtons, discardCardCheat, type CheatActions } from "./cheats";

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
  orientation?: "portrait" | "landscape";
  disabled?: boolean;
  className?: string;
  topCardClassName?: string;
  onClickTopCard?: () => void;
  onClickTopCardHotkey?: string;
  onPileDetailsClick?: () => void;
  onHoverPopover?: () => React.ReactNode;
  tooltip?: Tooltip | Tooltip[] | undefined;
  enableRandomRotation?: boolean;
  globalId?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  cheats?: CheatActions;
}

const BRIGHTNESS_MIN = 0.4;

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
  orientation,
  cheats,
}: PileProps) => {
  const { t } = useLanguageContext();
  const { parameters, state, cheatRemovableCards } = useGameContext();
  const { prompt } = usePromptContext();
  const size = sizePx / 16;
  const pileHeight = orientation === "landscape" ? size * (750 / 1024) : size;
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
            t("gameStep.boardSelection.blockedTooltip.title"),
            { key: "gameStep.boardSelection.blockedTooltip.message" },
            () => {},
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
      className={cn("relative", className)}
      style={{ height: pileHeight + "em", ...style }}>
      <div
        className={cn("grid shrink-0", className)}
        style={{ height: pileHeight + "em" }}>
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
              typeof card === "string"
                ? false
                : (card.engagedInCombat ?? false);

            const engagedInPurchase =
              typeof card === "string"
                ? false
                : (card.engagedInPurchase ?? false);

            const eternal =
              typeof card === "string" ? false : (card.eternal ?? false);

            const counter = typeof card === "string" ? undefined : card.counter;

            const isRequiredAttack =
              typeof card === "object" ? card.isRequiredAttack : false;

            const removableCard =
              globalId !== undefined &&
              state !== undefined &&
              parameters.allowCheatOptions.value &&
              cheats !== undefined &&
              !prompt &&
              typeof card === "object" &&
              "slug" in card &&
              cheatRemovableCards.values().some((c) => c.globalId === globalId);

            const cardsIndex = (index / array.length) * cards.length;

            const transformStyle = {
              transform: `
                ${enableRandomRotation ? `rotate(${(rng() - 0.5) * 5}deg)` : ""}
                translateY(-${cardsIndex * 0.02}em)
                scale(${1 + cardsIndex * 0.0002})
              `,
            };

            const isTopCard = index === array.length - 1;

            return (
              <div
                key={index}
                className={cn("relative col-start-1 row-start-1")}
                style={transformStyle}>
                <Card
                  onClick={isTopCard ? onClickTopCard : undefined}
                  onRemove={
                    removableCard && isTopCard
                      ? () =>
                          typeof card === "object" && "slug" in card
                            ? (
                                cheats.discard ??
                                ((id) =>
                                  discardCardCheat(cheatRemovableCards, id))
                              )(globalId)
                            : undefined
                      : undefined
                  }
                  card={
                    typeof card === "object" && "type" in card
                      ? card.type
                      : card
                  }
                  containerClassName={cn(
                    "col-start-1 row-start-1",

                    engagedInCombat &&
                      "outline-[0.3em] outline-red-500/60 glow-combat",

                    engagedInPurchase &&
                      "outline-[0.3em] outline-yellow-400/60 glow-purchase",

                    isRequiredAttack &&
                      "outline-[0.3em] outline-red-500/60 outline-dashed glow-combat",

                    entityBoardSelectionState &&
                      entityBoardSelectionState.isSelected &&
                      isTopCard &&
                      "outline-[0.3em] outline-blue-400 shadow-2xl/50 glow-selection",
                  )}
                  className={cn(
                    !charged && "brightness-50 contrast-90",
                    eternal && "glow-eternal glow-6",
                    cards.length > 0 && index === 0 && "pile-md-shadow",
                    cards.length > 5 && index === 0 && "pile-lg-shadow",
                    cards.length > 10 && index === 0 && "pile-xl-shadow",
                    cards.length > 40 && index === 0 && "pile-2xl-shadow",
                    cards.length > 80 && index === 0 && "pile-3xl-shadow",
                    isTopCard && topCardClassName,
                  )}
                  disabled={
                    isBoardSelectionActive
                      ? entityBoardSelectionState === undefined ||
                        entityBoardSelectionState.isSelectable === false
                      : disabled
                  }
                  size={size}
                  brightness={brightness}
                  stats={typeof card === "string" ? undefined : card.stats}
                  effects={typeof card === "string" ? undefined : card.effects}
                  counter={counter}
                  onMouseEnter={
                    isTopCard
                      ? onHoverPopover
                        ? onMouseEnter
                        : setTooltip
                      : undefined
                  }
                  onMouseLeave={
                    isTopCard
                      ? onHoverPopover
                        ? closePopover
                        : closeTooltip
                      : undefined
                  }
                  onPileDetailsClick={
                    isTopCard ? onPileDetailsClick : undefined
                  }
                  hotkey={isTopCard ? onClickTopCardHotkey : undefined}
                  selectionIndex={
                    isTopCard
                      ? entityBoardSelectionState?.selectionIndex
                      : undefined
                  }
                  globalId={isTopCard ? globalId : undefined}
                  orientation={orientation}
                />
                {isTopCard && <div>{children}</div>}
                {isTopCard && cheats && <CheatButtons {...cheats} />}
              </div>
            );
          })}
        {cards.length === 0 && (
          <div className="relative col-start-1 row-start-1">
            <Card
              size={size}
              onClick={onClickTopCard}
              disabled={disabled}
              orientation={orientation}
              className={topCardClassName}
            />
            {cheats && <CheatButtons {...cheats} />}
          </div>
        )}
      </div>
    </div>
  );
};
