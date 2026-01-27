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
import { Dice } from "@/icons/dice";
import { CardImage } from "./card";
import { useEffect, useRef } from "react";
import { Button } from "../button";
import { tooltip } from "@/utils/tooltip";
import { cn } from "@/utils/cn";
import { usePopoverContext } from "./contexts/popover-context";
import { receiverName, selectionToText } from "@/utils/selection-text";

export const Stack = () => {
  const { state, issuer } = useGameContext();
  const { toast, block } = useToastContext();

  const scrollViewRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex h-86 w-60 flex-col gap-2 rounded-xl bg-stone-900 p-2 inset-shadow-sm inset-shadow-stone-950/30 transform-3d">
      <div
        ref={scrollViewRef}
        className={cn(
          "grow place-content-start gap-4 overflow-auto p-2 text-sm",
          state.stack.length > 0 ? "grid" : "flex place-items-center",
        )}>
        {state.stack.map((element, index) => (
          <StackElement key={index} element={element} />
        ))}
        {state.stack.length === 0 && (
          <div className="flex text-center">
            <p className="font-time-fcuk text-sm leading-normal text-stone-600">
              NOTHING ON THE STACK YET...
            </p>
          </div>
        )}
      </div>
      <Button
        onClick={() =>
          block(
            "Cannot resolve stack",
            state.me.capabilities.resolve,
            resolveStack,
          )
        }
        disabled={state.me.capabilities.resolve !== true}
        tooltip={tooltip("Cannot resolve stack", state.me.capabilities.resolve)}
        label="Resolve"
        className="translate-z-1"
        theme="onDark"
      />
    </div>
  );
};

export const StackElement = ({ element }: { element: StackElementType }) => {
  return <StackElementContent element={element} />;
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

const DiceRollElement = ({ element }: { element: DiceRollJson }) => {
  const { setPopover, closePopover } = usePopoverContext();

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = element.card;
    if (!card) return;

    const rect = e.currentTarget.getBoundingClientRect();

    setPopover({
      anchor: rect,
      content: (
        <>
          <CardImage card={card} className="w-64" />
          <div className="mt-3 flex max-w-64 flex-wrap place-content-center gap-1 text-center leading-tight text-stone-400">
            <span>{element.issuer.name} rolled a</span>
            <span className="font-bold whitespace-pre-line text-stone-300">
              {element.diceRoll}
            </span>
            <span>for</span>
            <span className="font-bold whitespace-pre-line text-stone-300">
              {element.card?.name ?? "an attack roll"}
            </span>
          </div>
        </>
      ),
    });
  };

  return (
    <div
      className="flex flex-row items-center gap-4"
      onMouseEnter={onHover}
      onMouseLeave={closePopover}>
      <Dice value={element.diceRoll} className="size-12 text-red-500" />
      <div className="flex flex-col">
        <p className="text-2xs leading-6 text-stone-500">
          {element.card?.name ?? "Attack roll"}
        </p>

        <p className="text-stone-200">
          {element.issuer.name} rolled a {element.diceRoll}
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
  const { setPopover, closePopover } = usePopoverContext();

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = element.card;
    if (!card) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const selectionText = element.targets
      .map((target) => selectionToText(target))
      .join("\n");

    setPopover({
      anchor: rect,
      content: (
        <>
          <CardImage card={card} className="w-64" />
          {selectionText.length > 0 && (
            <div className="mt-3 flex max-w-64 flex-col gap-2 text-center leading-tight text-stone-400">
              <span>{element.issuer.name} used this card on</span>
              <span className="font-bold whitespace-pre-line text-stone-300">
                {selectionText}
              </span>
            </div>
          )}
        </>
      ),
    });
  };

  return (
    <div className="flex flex-row items-center gap-4">
      <div
        className="size-12 shrink-0 scale-100 overflow-hidden rounded-lg transition-transform hover:scale-110"
        onMouseEnter={onHover}
        onMouseLeave={closePopover}>
        <CardImage card={element.card} className="translate-y-[5%] scale-155" />
      </div>
      <div>
        <p className="text-stone-200">
          {element.issuer.name} used {element.card.name}
        </p>
      </div>
    </div>
  );
};

const EffectElement = ({ element }: { element: EffectOnStackJson }) => {
  const { setPopover, closePopover } = usePopoverContext();

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = element.card;
    if (!card) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const selectionText = element.targets
      .map((target) => selectionToText(target))
      .join("\n");
    setPopover({
      anchor: rect,
      content: (
        <>
          <CardImage card={card} className="w-64" />
          <div className="mt-3 flex max-w-64 flex-col gap-2 text-center leading-tight text-stone-400">
            <span>{element.issuer.name} selected</span>
            <span className="font-bold text-stone-300">{element.effect}</span>
            {selectionText.length > 0 && (
              <>
                <span>on</span>
                <span className="font-bold whitespace-pre-line text-stone-300">
                  {selectionText}
                </span>
              </>
            )}
          </div>
        </>
      ),
    });
  };

  return (
    <div className="flex flex-row items-center gap-4">
      <div
        className="size-12 shrink-0 scale-100 overflow-hidden rounded-lg transition-transform hover:scale-110"
        onMouseEnter={onHover}
        onMouseLeave={closePopover}>
        <CardImage card={element.card} className="translate-y-[5%] scale-155" />
      </div>
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
  const { setPopover, closePopover } = usePopoverContext();

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({
      anchor: rect,
      content: (
        <>
          {"slug" in element.source && (
            <CardImage card={element.source} className="w-64" />
          )}
          <div className="mt-3 max-w-64 text-center leading-tight text-stone-400">
            <span className="font-bold text-stone-300">
              {element.from.name}
            </span>{" "}
            dealt{" "}
            <span className="font-bold text-stone-300">{element.damage}</span>{" "}
            damage to{" "}
            <span className="font-bold text-stone-300">
              {receiverName(element)}
            </span>{" "}
            using{" "}
            <span className="font-bold text-stone-300">
              {"slug" in element.source
                ? element.source.name
                : "an attack roll"}
            </span>
          </div>
        </>
      ),
    });
  };

  return (
    <div className="flex flex-row items-center gap-4">
      <img
        src={`/heart.png`}
        className="size-12 shrink-0"
        onMouseEnter={onHover}
        onMouseLeave={closePopover}
      />
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
  const { setPopover, closePopover } = usePopoverContext();

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({
      anchor: rect,
      content: (
        <>
          {"slug" in element.source && (
            <CardImage card={element.source} className="w-64" />
          )}
          <div className="mt-3 max-w-64 text-center leading-tight text-stone-400">
            <span className="font-bold text-stone-300">
              {element.from.name}
            </span>{" "}
            killed{" "}
            <span className="font-bold text-stone-300">
              {receiverName(element)}
            </span>{" "}
            using{" "}
            <span className="font-bold text-stone-300">
              {"slug" in element.source
                ? element.source.name
                : "an attack roll"}
            </span>
          </div>
        </>
      ),
    });
  };

  return (
    <div className="flex flex-row items-center gap-4">
      <img
        src={`/skull.webp`}
        className="size-12 shrink-0"
        style={{ imageRendering: "pixelated" }}
        onMouseEnter={onHover}
        onMouseLeave={closePopover}
      />
      <div>
        <p className="text-stone-200">
          {element.from.name} killed {receiverName(element)}
        </p>
      </div>
    </div>
  );
};
