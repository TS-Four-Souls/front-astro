import { Pile } from "../board/pile";
import { CardType } from "../board/card";
import { useToastContext } from "../board/contexts/toast-context";
import type { StackElement as StackElementType } from "@/shared/api";
import { StackElement } from "../board/stack";
import { Button } from "../button";

const fakeStack: StackElementType[] = [
  {
    type: "LootCardEffect",
    card: { name: "Dice Shard", slug: "b2-dice_shard" },
    id: 1,
    targets: [],
    issuer: { name: "Sylvain", slug: "player-1", type: "player" },
  },
  {
    type: "diceRoll",
    diceRoll: 3,
    modifier: 1,
    id: 2,
    targets: [
      { type: "player", payload: { name: "Player 1", slug: "player-1" } },
    ],
    issuer: { name: "John", slug: "player-1", type: "player" },
  },
  {
    type: "damage",
    from: { name: "Sam", slug: "player-1", type: "player" },
    receiver: { name: "Anna", slug: "player-2", type: "player" },
    damage: 3,
    source: { name: "Dice Shard", slug: "b2-dice_shard" },
    id: 3,
  },
  {
    type: "death",
    receiver: { name: "Joe", slug: "player-2", type: "player" },
    from: { name: "Marc", slug: "player-1", type: "player" },
    source: { name: "Dice Shard", slug: "b2-dice_shard" },
    id: 4,
  },
  {
    type: "effect",
    card: { name: "Dice Shard", slug: "b2-dice_shard" },
    effect: "Each time this deals combat damage to a player, they lose 2¢.",
    targets: [
      { type: "player", payload: { name: "Player 1", slug: "player-1" } },
    ],
    issuer: { name: "Sylvain", slug: "player-1", type: "player" },
    id: 5,
  },
];

export const DebugPage = () => {
  const { toast } = useToastContext();

  return (
    <div className="p-4 pb-64">
      <h1 className="mb-4 text-4xl font-bold">Debug Page</h1>

      <h2 className="mb-2 text-2xl font-bold">Stack</h2>
      <div className="scroll-priority flex h-86 w-60 flex-col gap-2 bg-stone-900 p-2">
        <div className="grid grow place-content-start overflow-auto rounded-xl text-sm">
          {fakeStack.map((element, index) => (
            <StackElement key={index} element={element} />
          ))}
        </div>
      </div>

      <h2 className="mt-16 mb-2 text-2xl font-bold">Toasts</h2>
      <div className="flex flex-row gap-2">
        <Button
          onClick={() =>
            toast("success", "Success", "This is a success message")
          }
          label="Success"
        />
        <Button
          onClick={() => toast("error", "Error", "This is an error message")}
          label="Error"
        />
        <Button
          onClick={() => toast("info", "Info", "This is an info message")}
          label="Info"
        />
      </div>

      <h2 className="mt-16 mb-2 text-2xl font-bold">Cards</h2>
      <h3 className="mb-2 text-lg font-bold">Pile size</h3>
      <div className="flex flex-row place-content-center gap-24">
        {[1, 5, 10, 20, 40, 80, 120, 200].map((size) => (
          <div key={size} className="flex flex-col gap-2 transform-3d">
            <div className="animate-iso-spin transform-3d">
              <Pile
                size={120}
                cards={Array.from({ length: size }).map(
                  () => CardType.MonsterCard,
                )}
                optimizations={{
                  maxCards: 20,
                  enableSides: true,
                  enable3D: true,
                }}
              />
            </div>
            <p className="mt-8 text-center text-sm text-gray-500">{size}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-32 mb-2 text-lg font-bold">
        Performance optimizations
      </h3>
      <p className="mb-32 text-sm leading-snug text-stone-500">
        The pile is filled with 120 cards.
        <br /> The height stays constant but the amount of instances rendered
        changes.
      </p>
      <div className="flex flex-row place-content-center gap-24">
        {[20, 10, 5, 2].map((size) => (
          <div key={size} className="flex flex-col gap-2 transform-3d">
            <div className="animate-iso-spin transform-3d">
              <Pile
                size={120}
                cards={Array.from({ length: 120 }).map(() => CardType.LootCard)}
                optimizations={{
                  maxCards: size,
                  enableSides: true,
                  enable3D: true,
                }}
              />
            </div>
            <p className="mt-8 text-center text-sm text-stone-500">
              maxCards: {size}
            </p>
          </div>
        ))}
      </div>

      <h3 className="mt-32 mb-2 text-lg font-bold">Card sides</h3>
      <p className="mb-32 text-sm leading-snug text-stone-500">
        With the sides enabled, four additional images are rendered for each
        card.
        <br />
        This gives us a pretty convincing lighting effect.
      </p>
      <div className="flex flex-row place-content-center gap-24">
        {[false, true].map((enableSides) => (
          <div
            key={enableSides ? "true" : "false"}
            className="flex flex-col gap-2 transform-3d">
            <div className="animate-iso-spin transform-3d">
              <Pile
                size={120}
                cards={Array.from({ length: 120 }).map(
                  () => CardType.TreasureCard,
                )}
                optimizations={{ maxCards: 10, enableSides, enable3D: true }}
              />
            </div>
            <p className="mt-8 text-center text-sm text-stone-500">
              enableSides: {enableSides ? "true" : "false"}
            </p>
          </div>
        ))}
      </div>

      <h3 className="mt-32 mb-2 text-lg font-bold">3D enabled</h3>
      <p className="mb-32 text-sm leading-snug text-stone-500">
        When 3D is disabled, the cards are rendered as a flat list.
        <br />
        When seen from above, the result is the same.
        <br />
        Hover to see the difference.
      </p>
      <div className="group flex flex-row place-content-center gap-24">
        {[true, false].map((enable3D) => (
          <div
            key={enable3D ? "true" : "false"}
            className="flex flex-col gap-2 transform-3d">
            <div className="rotate-x-0 transition-transform duration-300 transform-3d group-hover:rotate-x-45 group-hover:rotate-z-55">
              <Pile
                size={120}
                cards={Array.from({ length: 120 }).map(
                  () => CardType.TreasureCard,
                )}
                optimizations={{ maxCards: 20, enableSides: false, enable3D }}
              />
            </div>
            <p className="mt-8 text-center text-sm text-stone-500">
              enable3D: {enable3D ? "true" : "false"}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-16 mb-2 text-2xl font-bold">Monster cards</h2>
      <p className="mb-32 text-sm leading-snug text-stone-500">
        Monster cards can have their stats rendered on top of the card image.
      </p>
      <h3 className="my-12 text-lg font-bold">Health points</h3>
      <div className="flex flex-row place-content-center gap-8">
        {[0, 1, 2, 3, 4, 5, 6].map((healthPoints) => (
          <Pile
            cards={[
              {
                slug: "b2-monstro",
                stats: { healthPoints, attackPoints: 1, evasionPoints: 4 },
              },
            ]}
            optimizations={{ enable3D: false, enableSides: false, maxCards: 3 }}
            size={300}
          />
        ))}
      </div>
      <h3 className="my-12 text-lg font-bold">Evasion points</h3>
      <div className="flex flex-row place-content-center gap-8">
        {[0, 1, 2, 3, 4, 5, 6].map((evasionPoints) => (
          <Pile
            cards={[
              {
                slug: "b2-monstro",
                stats: { healthPoints: 4, attackPoints: 1, evasionPoints },
              },
            ]}
            optimizations={{ enable3D: false, enableSides: false, maxCards: 3 }}
            size={300}
          />
        ))}
      </div>
      <h3 className="my-12 text-lg font-bold">Attack points</h3>
      <div className="flex flex-row place-content-center gap-8">
        {[0, 1, 2, 3, 4, 5, 6].map((attackPoints) => (
          <Pile
            cards={[
              {
                slug: "b2-monstro",
                stats: { healthPoints: 4, attackPoints, evasionPoints: 4 },
              },
            ]}
            optimizations={{ enable3D: false, enableSides: false, maxCards: 3 }}
            size={300}
          />
        ))}
      </div>

      <h2 className="mt-16 mb-2 text-2xl font-bold">Character cards</h2>
      <p className="mb-32 text-sm leading-snug text-stone-500">
        Character cards can have their stats rendered on top of the card image.
      </p>
      <h3 className="my-12 text-lg font-bold">Health points</h3>
      <div className="flex flex-row place-content-center gap-8">
        {[0, 1, 2, 3, 4, 5, 6].map((healthPoints) => (
          <Pile
            cards={[
              { slug: "b2-isaac", stats: { healthPoints, attackPoints: 1 } },
            ]}
            optimizations={{ enable3D: false, enableSides: false, maxCards: 3 }}
            size={300}
          />
        ))}
      </div>
      <h3 className="my-12 text-lg font-bold">Attack points</h3>
      <div className="flex flex-row place-content-center gap-8">
        {[0, 1, 2, 3, 4, 5, 6].map((attackPoints) => (
          <Pile
            cards={[
              { slug: "b2-isaac", stats: { healthPoints: 2, attackPoints } },
            ]}
            optimizations={{ enable3D: false, enableSides: false, maxCards: 3 }}
            size={300}
          />
        ))}
      </div>
    </div>
  );
};
