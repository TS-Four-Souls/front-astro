import type { DetailedState } from "@/shared/api";
import { Pile } from "./pile";
import { CardType } from "./card";

interface CenterProps {
  state: DetailedState;
}

export const Center = ({ state }: CenterProps) => {
  return (
    <div className="flex place-items-center gap-12 transform-3d">
      <div className="grid h-86 w-60 place-items-center rounded-xl bg-stone-900 text-stone-500">
        Stack
      </div>
      <div className="flex shrink-0 flex-col place-items-center gap-2 transform-3d">
        {state.bonusSouls.map((soul) => (
          <Pile key={soul.slug} cards={[soul]} size={105} />
        ))}
      </div>
      <div className="flex flex-col place-items-center gap-2 transform-3d">
        <Pile
          cards={Array.from({ length: state.loot.deckSize }).map(
            () => CardType.LootCard,
          )}
        />
        <Pile cards={state.loot.discard} />
      </div>
      <div className="flex flex-col gap-8 transform-3d">
        <div className="flex place-items-center gap-2 transform-3d">
          <Pile
            cards={state.treasure.discard}
          />
          <Pile
            cards={Array.from({ length: state.treasure.deckSize }).map(
              () => CardType.TreasureCard,
            )}
          />
          {state.treasure.inPlay.map((card) => (
            <Pile key={card.slug} cards={[card]} />
          ))}
        </div>
        <div className="flex place-items-center gap-2 transform-3d">
          <Pile
            cards={state.monsters.discard.map((card) => ({
              slug: card.slug,
              face: "front",
            }))}
          />
          <Pile
            cards={Array.from({ length: state.monsters.deckSize }).map(
              () => CardType.MonsterCard,
            )}
          />
          {state.monsters.inPlay.map((card) => (
            <Pile key={card.top.slug} cards={[card.top]} />
          ))}
        </div>
      </div>
    </div>
  );
};
