import { socket } from "@/utils/socket";
import { useGameContext } from "./contexts/game-context";
import { useToastContext } from "./contexts/toast-context";
import type {
  DamageOnStackJson,
  DeathOnStackJson,
  DiceRollJson,
  EffectOnStackJson,
  LootCardOnStackJson,
  StackElement as StackElementType,
} from "@/shared/api";
import { useEffect, useRef, useState } from "react";
import { Button } from "../button";
import { cn } from "@/utils/cn";
import { receiverName } from "@/utils/selection-text";
import { StackElementIcon } from "./stack-element-icon";
import { useBoardSelectionContext } from "./contexts/board-selection-context";
import { boardSelectionTargetId } from "./contexts/board-selection-context";
import { useHotkeys } from "react-hotkeys-hook";
import { HotkeyScope } from "@/utils/hotkey";

export const Stack = () => {
  const { state, issuer } = useGameContext();
  const { toast, block } = useToastContext();
  const {
    activeRequestId,
    getTargetSelectionState,
    getTargetSelectionHotkey,
    selectTarget,
    cancelBoardSelection,
  } = useBoardSelectionContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const [selectedStackElementId, setSelectedStackElementId] = useState<
    number | null
  >(null);

  const resolveStack = () => {
    socket.emit("resolve", { issuer }, (response) => {
      switch (response.status) {
        case 200:
          break;
        default:
        case 400:
          toast("error", "Failed to resolve stack", response.error);
          break;
      }
    });
  };

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

  useEffect(() => {
    if (selectedStackElementId === null) {
      return;
    }

    if (!state.stack.some((element) => element.id === selectedStackElementId)) {
      setSelectedStackElementId(null);
    }
  }, [state.stack, selectedStackElementId]);

  useEffect(() => {
    if (selectedStackElementId === null) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest('[data-insertion-bar="true"]')) {
        return;
      }

      setSelectedStackElementId(null);
    };

    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [selectedStackElementId]);

  const onStackElementClick = (element: StackElementType) => {
    if (selectedStackElementId === null && element.reordering) {
      setSelectedStackElementId(element.id);
      return;
    }

    if (selectedStackElementId === element.id) {
      setSelectedStackElementId(null);
      return;
    }

    moveStackElementBefore(element.id);
  };

  const moveStackElementBefore = (targetStackId: number | "start") => {
    if (selectedStackElementId === null) {
      return;
    }

    const elementToMoveStackId = selectedStackElementId;
    setSelectedStackElementId(null);

    socket.emit(
      "insertStackElementBefore",
      { issuer, elementToMoveStackId, targetStackId },
      (response) => {
        switch (response.status) {
          case 200:
            toast("success", "Stack updated", "Stack element moved");
            break;
          case 400:
          default:
            toast("error", "Failed to move stack element", response.error);
            break;
        }
      },
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex h-86 w-60 flex-col gap-2 rounded-xl bg-stone-900 p-2 inset-shadow-sm inset-shadow-stone-950/30 transform-3d">
      <div
        ref={scrollViewRef}
        className={cn(
          "no-scrollbar grow translate-z-1 place-content-start overflow-auto p-2 text-sm",
          state.stack.length > 0
            ? "grid grid-cols-1 items-stretch"
            : "flex place-items-center",
        )}>
        {state.stack.map((element, index) => { 
          const targetGroupId: string | undefined = state.stack.find((e) => e.id === selectedStackElementId)?.reordering?.groupId;
          const isElementInSameGroup = element.reordering?.groupId === targetGroupId;
          const isNotFirst = index > 0;
          const isPreviousElementDifferentGroup = index > 0 && state.stack[index - 1].reordering?.groupId !== targetGroupId;
          const isFirstElementAndSameGroup = index === 0 && isElementInSameGroup;
          const isFirstOfGroup = isFirstElementAndSameGroup || (isNotFirst && isElementInSameGroup && isPreviousElementDifferentGroup);
          return (
          <div
            key={element.id}
            className={cn(
              "relative w-full",
              index < state.stack.length - 1 && "mb-4",
            )}>
            {isFirstOfGroup && selectedStackElementId !== null && (
              <InsertionBar
                className="-top-2"
                // label="Insert at top"
                onClick={() => !activeRequestId && moveStackElementBefore("start")}
              />
            )}
            {(() => {
              const targetId = boardSelectionTargetId.stackElement(element.id);
              const selectionState = getTargetSelectionState(targetId);
              const selectionHotkey = getTargetSelectionHotkey(targetId);

              return (
            <StackElement
              element={element}
              hotkey={selectionHotkey}
              onClick={
                selectionState.selectable
                  ? () => selectTarget(targetId)
                  : activeRequestId
                    ? () => cancelBoardSelection()
                    : selectedStackElementId === null ||
                        selectedStackElementId === element.id
                      ? () => onStackElementClick(element)
                      : undefined
              }
              isSelected={
                selectionState.selected || selectedStackElementId === element.id
              }
            />
              );
            })()}
            {selectedStackElementId !== null && isElementInSameGroup && (
              <InsertionBar
                className="top-full translate-y-2"
                onClick={() =>
                  !activeRequestId && moveStackElementBefore(state.stack[index].id)
                }
                // label="Insert at top"
              />
            )}
          </div>
        )})}
        {state.stack.length === 0 && (
          <div className="flex text-center">
            <p className="font-time-fcuk text-sm leading-normal text-stone-600">
              NOTHING ON THE STACK YET...
            </p>
          </div>
        )}
      </div>
      <Button
        hotkey={activeRequestId ? undefined : "space"}
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
        className="translate-z-1"
        theme="onDark"
      />
    </div>
  );
};

export const StackElement = ({
  element,
  hotkey,
  onClick,
  isSelected = false,
  className,
}: {
  element: StackElementType;
  hotkey?: string;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}) => {
  useHotkeys(hotkey ?? "", () => onClick?.(), {
    scopes: [HotkeyScope.Selection],
    enabled: hotkey !== undefined && onClick !== undefined,
  });

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative w-full rounded-lg transition-colors",
        onClick && "cursor-pointer hover:bg-stone-800/45",
        isSelected && "bg-blue-500/15 ring-1 ring-blue-500/60",
        className,
      )}>
      {hotkey && (
        <div className="absolute top-0 left-0 z-10 flex aspect-square w-5 place-items-center overflow-hidden rounded-sm bg-stone-700 outline-[0.1em] -outline-offset-[0.1em] outline-stone-200">
          <img
            src={`/input-prompts/keyboard_${hotkey}_outline.svg`}
            className="scale-170"
          />
        </div>
      )}
      <StackElementContent element={element} />
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
      data-insertion-bar="true"
      className={cn(
        "group absolute inset-x-0 z-20 h-0 w-full cursor-pointer translate-z-1",
        className,
      )}
      aria-label={label ?? "Insert stack element here"}>
      <span className="peer absolute -top-7 right-0 left-10 z-20 h-14" />
      <span className="peer absolute -top-2 right-0 left-0 z-2 h-4" />
      <span className="absolute inset-x-2 top-0 z-20 -translate-y-1/10 border-t border-dashed border-blue-400/70 peer-hover:border-solid" />
      {label && (
        <span className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded bg-stone-900/90 px-1 py-0.5 text-[10px] text-blue-300 opacity-0 transition-opacity group-hover:opacity-100">
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
        <p className="text-2xs leading-6 text-stone-500">
          {element.card?.name ?? "Attack roll"}
        </p>

        <p className="text-stone-200">
          {element.issuer.name} rolled a {element.diceRoll}{" "}
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
      <div>
        <p className="text-stone-200">
          {element.issuer.name} used {element.card.name}
        </p>
      </div>
    </div>
  );
};

const EffectElement = ({ element }: { element: EffectOnStackJson }) => {
  return (
    <div className="flex flex-row items-center gap-4">
      <StackElementIcon element={element} />
      <div>
        <p className="text-xs leading-6 text-stone-500">
          {element.issuer.name}
        </p>
        <p className="text-stone-200">{element.card.name}</p>
      </div>
    </div>
  );
};

const DamageElement = ({ element }: { element: DamageOnStackJson }) => {
  return (
    <div className="flex flex-row items-center gap-4">
      <StackElementIcon element={element} />
      <div>
        <p className="text-stone-200">
          {element.from.name} dealt {element.damage} damage to{" "}
          {receiverName(element)}
        </p>
      </div>
    </div>
  );
};

const DeathElement = ({ element }: { element: DeathOnStackJson }) => {
  return (
    <div className="flex flex-row items-center gap-4">
      <StackElementIcon element={element} />
      <div>
        <p className="text-stone-200">
          {element.from.name} killed {receiverName(element)}
        </p>
      </div>
    </div>
  );
};
