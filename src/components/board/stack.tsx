import { socket } from "@/utils/socket";
import { useGameContext } from "./contexts/game-context";
import { useToastContext } from "./contexts/toast-context";
import type {
  DamageOnStackJson,
  DeathOnStackJson,
  DiceRollJson,
  EffectOnStackJson,
  EndOfTurnJson,
  LootCardOnStackJson,
  LootStepJson,
  StackElement as StackElementType,
} from "@/shared/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../button";
import { cn } from "@/utils/cn";
import { receiverName } from "@/utils/selection-text";
import { StackElementIcon } from "./stack-element-icon";
import {
  stackElementIdShift,
  useBoardSelectionContext,
} from "./contexts/board-selection-context";
import { useHotkeys } from "react-hotkeys-hook";
import { HotkeyScope, shouldUseKey } from "@/utils/hotkey";
import { useGameAnimation } from "./contexts/game-animation";

export const Stack = () => {
  const { state } = useGameContext();
  const { toast, block } = useToastContext();
  const { setStackEl } = useGameAnimation();

  const stackContainerRef = useRef<HTMLDivElement>(null);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const [selectedStackElementId, setSelectedStackElementId] = useState<
    number | null
  >(null);

  useEffect(() => {
    setStackEl(stackContainerRef.current);
    return () => setStackEl(null);
  }, [setStackEl]);

  const resolveStack = () => {
    socket.emit("resolve", (response) => {
      if (response.status === 400)
        toast("error", "Failed to resolve stack", response.error);
    });
  };

  /* Add scroll-priority class to the scroll view if it is overflowing */
  useEffect(() => {
    const scrollView = scrollViewRef.current;
    if (!scrollView) return;

    // Measure if the scroll view is overflowing
    const isOverflowing = scrollView.scrollHeight > scrollView.clientHeight;
    if (isOverflowing) {
      scrollView.classList.add("scroll-priority");
    } else {
      scrollView.classList.remove("scroll-priority");
    }
  }, [state.stack.length]);

  /* Reset selected stack element if it is not in the stack */
  useEffect(() => {
    if (!state.stack.some((element) => element.id === selectedStackElementId)) {
      setSelectedStackElementId(null);
    }
  }, [state.stack, selectedStackElementId]);

  const onStackElementClick = useCallback(
    (element: StackElementType) => {
      if (selectedStackElementId === null && element.reordering) {
        setSelectedStackElementId(element.id);
        return;
      }

      if (selectedStackElementId === element.id) {
        setSelectedStackElementId(null);
        return;
      }

      moveStackElementBefore(element.id);
    },
    [selectedStackElementId],
  );

  const moveStackElementBefore = useCallback(
    (targetStackId: number | "start") => {
      if (selectedStackElementId === null) {
        return;
      }

      const elementToMoveStackId = selectedStackElementId;
      setSelectedStackElementId(null);

      socket.emit(
        "insertStackElementBefore",
        { elementToMoveStackId, targetStackId },
        (response) => {
          if (response.status === 400)
            toast("error", "Failed to move stack element", response.error);
        },
      );
    },
    [selectedStackElementId],
  );

  const { boardSelectionState, isBoardSelectionActive, toggleSelection } =
    useBoardSelectionContext();

  return (
    <div
      ref={stackContainerRef}
      className="flex h-86 w-60 flex-col gap-2 rounded-xl bg-taupe-800 p-2 inset-shadow-sm inset-shadow-taupe-950/30">
      <div
        ref={scrollViewRef}
        className={cn(
          "no-scrollbar grow place-content-start justify-center overflow-auto p-2",
          state.stack.length > 0
            ? "grid grid-cols-1"
            : "flex place-items-center",
        )}>
        {state.stack.map((element, index) => {
          const targetGroupId: string | undefined = state.stack.find(
            (e) => e.id === selectedStackElementId,
          )?.reordering?.groupId;
          const isElementInSameGroup =
            element.reordering?.groupId === targetGroupId;
          const isNotFirst = index > 0;
          const isPreviousElementDifferentGroup =
            index > 0 &&
            state.stack[index - 1].reordering?.groupId !== targetGroupId;

          const isNextElementSelectedElement =
            selectedStackElementId === state.stack[index + 1]?.id;

          const isSelectedElement = selectedStackElementId === element.id;

          const isFirstElementAndSameGroup =
            index === 0 && isElementInSameGroup;
          const isFirstOfGroup =
            isFirstElementAndSameGroup ||
            (isNotFirst &&
              isElementInSameGroup &&
              isPreviousElementDifferentGroup);

          const entityBoardSelectionState = boardSelectionState?.get(
            element.id + stackElementIdShift,
          );

          return (
            <div key={element.id} className="relative w-full">
              {isFirstOfGroup &&
                selectedStackElementId !== null &&
                !isSelectedElement && (
                  <InsertionBar
                    onClick={() => moveStackElementBefore("start")}
                    label="Move here"
                  />
                )}
              <StackElement
                element={element}
                onClick={
                  isBoardSelectionActive &&
                  entityBoardSelectionState?.isSelectable
                    ? () =>
                        toggleSelection(entityBoardSelectionState.selectionItem)
                    : (selectedStackElementId === null ||
                          selectedStackElementId === element.id) &&
                        element.reordering
                      ? () => onStackElementClick(element)
                      : undefined
                }
                isSelected={
                  isBoardSelectionActive &&
                  entityBoardSelectionState?.isSelected
                    ? true
                    : selectedStackElementId === element.id
                }
                hotkey={
                  isBoardSelectionActive &&
                  entityBoardSelectionState &&
                  entityBoardSelectionState?.optionIndex < 9
                    ? `${entityBoardSelectionState.optionIndex + 1}`
                    : undefined
                }
              />
              {selectedStackElementId !== null &&
                isElementInSameGroup &&
                !isSelectedElement &&
                !isNextElementSelectedElement && (
                  <InsertionBar
                    onClick={() =>
                      moveStackElementBefore(state.stack[index].id)
                    }
                    label="Move here"
                  />
                )}
            </div>
          );
        })}
        {state.stack.length === 0 && (
          <p className="text-center font-time-fcuk text-sm leading-normal text-taupe-600">
            NOTHING ON
            <br />
            THE STACK...
          </p>
        )}
      </div>
      <Button
        hotkey="space"
        onClick={() =>
          block(
            "Cannot resolve stack",
            state.me.capabilities.resolve,
            resolveStack,
          )
        }
        disabled={state.me.capabilities.resolve !== true}
        tooltip={{
          title: "Cannot resolve stack",
          capable: state.me.capabilities.resolve,
        }}
        label="Resolve"
        theme="onDark"
      />
    </div>
  );
};

export const StackElement = ({
  element,
  onClick,
  isSelected = false,
  className,
  hotkey,
}: {
  element: StackElementType;
  onClick?: () => void;
  isSelected?: boolean;
  hotkey?: string;
  className?: string;
}) => {
  useHotkeys(hotkey ?? "", () => onClick?.(), {
    enabled: hotkey !== undefined && onClick !== undefined,
    scopes: [HotkeyScope.Selection],
    useKey: shouldUseKey(hotkey ?? ""),
  });

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative w-full rounded-lg p-2",
        onClick && "cursor-pointer",
        isSelected && "outline-[0.2em] outline-blue-400",
        className,
      )}>
      <StackElementContent element={element} />

      {hotkey && (
        <div className="absolute top-0 left-0 flex aspect-square w-5 place-items-center overflow-hidden rounded-sm bg-taupe-700 outline-[0.1em] -outline-offset-[0.1em]">
          <img
            src={`/input-prompts/keyboard_${hotkey.split(",")[0]}_outline.svg`}
            className="scale-150"
          />
        </div>
      )}
    </div>
  );
};

const StackElementContent = ({ element }: { element: StackElementType }) => {
  switch (element.type) {
    case "diceRoll":
      return <DiceRollElement element={element} />;
    case "LootCardEffect":
      return <LootCardEffectElement element={element} />;
    case "effect":
      return <EffectElement element={element} />;
    case "damage":
      return <DamageElement element={element} />;
    case "death":
      return <DeathElement element={element} />;
    case "lootStep":
      return <LootStepElement element={element} />;
    case "endOfTurn":
      return <EndOfTurnElement element={element} />;
  }
};

const InsertionBar = ({
  onClick,
  label,
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group absolute z-20 grid h-8 w-full -translate-y-1/2 translate-z-10 cursor-pointer place-items-center",
        className,
      )}>
      <span className="col-start-1 row-start-1 w-full border-t-[0.1em] border-dotted border-blue-400/50 group-hover:border-solid" />
      {label && (
        <span className="col-start-1 row-start-1 bg-taupe-900 p-2 text-2xs text-blue-300 opacity-0 transition-opacity group-hover:opacity-100">
          {label}
        </span>
      )}
    </button>
  );
};

const DiceRollElement = ({ element }: { element: DiceRollJson }) => {
  return (
    <div className="flex flex-row items-center gap-4">
      <StackElementIcon element={element} />
      <div className="flex flex-col">
        <p className="text-2xs leading-6 text-taupe-500">
          {element.card?.name ?? "Attack roll"}
        </p>

        <p className="text-taupe-200">
          <span style={{ color: element.issuer.color }}>
            {element.issuer.name}
          </span>{" "}
          rolled a {element.diceRoll}{" "}
          {element.modifier !== 0 ? `(+${element.modifier})` : ""}
        </p>
      </div>
    </div>
  );
};

const LootCardEffectElement = ({
  element,
}: {
  element: LootCardOnStackJson;
}) => {
  return (
    <div className="flex flex-row items-center gap-4">
      <StackElementIcon element={element} />
      <div className="text-sm">
        <p className="text-taupe-200">
          <span style={{ color: element.issuer.color }}>
            {element.issuer.name}
          </span>{" "}
          used {element.card.name}
        </p>
      </div>
    </div>
  );
};

const EffectElement = ({ element }: { element: EffectOnStackJson }) => {
  return (
    <div className="flex flex-row items-center gap-4">
      <StackElementIcon element={element} />
      <div className="text-sm">
        <p
          className="text-xs leading-6"
          style={{ color: element.issuer.color }}>
          {element.issuer.name}
        </p>
        <p className="text-taupe-200">{element.card.name}</p>
      </div>
    </div>
  );
};

const LootStepElement = ({ element }: { element: LootStepJson }) => {
  return (
    <div className="flex flex-row items-center gap-4">
      <StackElementIcon element={element} />
      <div className="text-sm">
        <p className="text-taupe-200">
          <span style={{ color: element.player.color }}>
            {element.player.name}
          </span>{" "}
          is about to loot {element.nbLoots} card
          {element.nbLoots > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

const EndOfTurnElement = ({ element }: { element: EndOfTurnJson }) => {
  return (
    <div className="flex flex-row items-center gap-4">
      <StackElementIcon element={element} />
      <div className="text-sm">
        <p className="text-taupe-200">
          <span style={{ color: element.player.color }}>
            {element.player.name}
          </span>{" "}
          is about to end their turn.
        </p>
      </div>
    </div>
  );
};

const DamageElement = ({ element }: { element: DamageOnStackJson }) => {
  return (
    <div className="flex flex-row items-center gap-4">
      <StackElementIcon element={element} />
      <div className="text-sm">
        <p className="text-taupe-200">
          <span style={{ color: element.from.color }}>{element.from.name}</span>{" "}
          dealt {element.damage} damage to{" "}
          <span style={{ color: element.receiver.color }}>
            {receiverName(element)}
          </span>
        </p>
      </div>
    </div>
  );
};

const DeathElement = ({ element }: { element: DeathOnStackJson }) => {
  return (
    <div className="flex flex-row items-center gap-4">
      <StackElementIcon element={element} />
      <div className="text-sm">
        <p className="text-taupe-200">
          <span style={{ color: element.from.color }}>{element.from.name}</span>{" "}
          killed{" "}
          <span style={{ color: element.receiver.color }}>
            {receiverName(element)}
          </span>
        </p>
      </div>
    </div>
  );
};
