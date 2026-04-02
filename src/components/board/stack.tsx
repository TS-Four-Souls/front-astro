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
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../button";
import { cn } from "@/utils/cn";
import { receiverName } from "@/utils/selection-text";
import { StackElementIcon } from "./stack-element-icon";

export const Stack = () => {
  const { state, issuer } = useGameContext();
  const { toast, block } = useToastContext();

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
    },
    [selectedStackElementId, issuer],
  );

  return (
    <div className="flex h-86 w-60 flex-col gap-2 rounded-xl bg-stone-900 p-2 inset-shadow-sm inset-shadow-stone-950/30 transform-3d">
      <div
        ref={scrollViewRef}
        className={cn(
          "no-scrollbar grow translate-z-1 place-content-start overflow-auto p-2 text-sm transform-3d",
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
              {(() => {
                return (
                  <StackElement
                    element={element}
                    onClick={
                      (selectedStackElementId === null ||
                        selectedStackElementId === element.id) &&
                      element.reordering
                        ? () => onStackElementClick(element)
                        : undefined
                    }
                    isSelected={selectedStackElementId === element.id}
                  />
                );
              })()}
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
          <div className="flex text-center">
            <p className="font-time-fcuk text-sm leading-normal text-stone-600">
              NOTHING ON THE STACK YET...
            </p>
          </div>
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
        className="translate-z-1"
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
}: {
  element: StackElementType;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full rounded-lg p-2 transition-colors",
        onClick && "cursor-pointer hover:bg-stone-800/45",
        isSelected &&
          "bg-blue-500/15 ring-1 ring-blue-500/60 hover:bg-blue-500/30",
        className,
      )}>
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
      className={cn(
        "group absolute z-20 grid h-8 w-full -translate-y-1/2 translate-z-10 cursor-pointer place-items-center",
        className,
      )}>
      <span className="col-start-1 row-start-1 w-full border-t-[0.1em] border-dotted border-blue-400/50 group-hover:border-solid" />
      {label && (
        <span className="col-start-1 row-start-1 bg-stone-900 p-2 text-2xs text-blue-300 opacity-0 transition-opacity group-hover:opacity-100">
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
