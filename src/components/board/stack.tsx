import { socket } from "@/utils/socket";
import { useGameContext } from "./contexts/game-context";
import { useToastContext } from "./contexts/toast-context";
import type {
  DamageOnStackJson,
  DeathOnStackJson,
  DiceRollJson,
  EffectOnStackJson,
  LootCardOnStackJson,
  SelectionItem,
  StackElement as StackElementType,
} from "@/shared/api";
import { Dice } from "@/icons/dice";
import { CardImage } from "./card";

export const Stack = () => {
  const { state, issuer } = useGameContext();
  const { toast } = useToastContext();

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

  return (
    <div className="flex h-86 w-60 flex-col gap-2 rounded-xl bg-stone-900 p-4 transform-3d">
      <div className="scroll-priority grid grow place-content-start overflow-auto text-sm">
        {state.stack.map((element, index) => (
          <StackElement key={index} element={element} />
        ))}
        {state.stack.length === 0 && (
          <div className="flex text-center">
            <p className="text-stone-500">Nothing is on the stack</p>
          </div>
        )}
      </div>
      <button
        disabled={!state.me.capabilities.resolve}
        onClick={resolveStack}
        className="w-full translate-z-2 rounded-md bg-stone-600 px-2 py-1 text-white transition-colors not-disabled:cursor-pointer not-disabled:hover:bg-stone-500 disabled:cursor-not-allowed disabled:opacity-50">
        Resolve
      </button>
    </div>
  );
};

export const StackElement = ({ element }: { element: StackElementType }) => {
  return (
    <div className="flex flex-col items-start gap-2 text-white">
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

const DiceRollElement = ({ element }: { element: DiceRollJson }) => {
  return (
    <div className="flex flex-row items-center gap-2 p-2">
      <Dice value={element.diceRoll} className="size-12 text-red-500" />
      <div className="flex flex-col">
        {element.card && (
          <p className="text-2xs leading-6 text-stone-500">
            {element.card.name}
          </p>
        )}
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
  return (
    <div className="flex flex-row items-center gap-2 p-2">
      {element.card && (
        <div className="size-12 shrink-0 overflow-hidden rounded-lg">
          <CardImage
            card={element.card}
            className="translate-y-[5%] scale-155"
          />
        </div>
      )}
      <div>
        <p className="text-stone-200">
          {element.issuer.name} used {element.card?.name}
        </p>
      </div>
    </div>
  );
};

const EffectElement = ({ element }: { element: EffectOnStackJson }) => {
  return (
    <div className="flex flex-row items-center gap-2 p-2">
      <div className="size-12 shrink-0 overflow-hidden rounded-lg">
        <CardImage card={element.card} className="translate-y-[5%] scale-155" />
      </div>
      <div>
        <p className="text-xs leading-6 text-stone-500">
          {element.issuer.name}
        </p>
        <p className="text-stone-200">{element.card?.name}</p>
      </div>
    </div>
  );
};

const DamageElement = ({ element }: { element: DamageOnStackJson }) => {
  return (
    <div className="flex flex-row items-center gap-2 p-2">
      <img src={`/heart.png`} className="size-12 shrink-0" />
      <div>
        <p className="text-stone-200">
          {element.from.name} dealt {element.damage} damage to{" "}
          {element.receiver.name}
        </p>
      </div>
    </div>
  );
};

const DeathElement = ({ element }: { element: DeathOnStackJson }) => {
  return (
    <div className="flex flex-row items-center gap-2 p-2">
      <img
        src={`/skull.webp`}
        className="size-12 shrink-0"
        style={{ imageRendering: "pixelated" }}
      />
      <div>
        <p className="text-stone-200">
          {element.from.name} killed {element.receiver.name}
        </p>
      </div>
    </div>
  );
};
