import type { DetailedState } from "@/shared/api";
import { Pile } from "./pile";
import { CardType } from "./card";
import { Stack } from "./stack";
import { socket } from "@/utils/socket";
import { useGameContext } from "./contexts/game-context";
import { CHEAT_MODE } from "@/constants";
import { useToastContext } from "./contexts/toast-context";

interface CenterProps {
  state: DetailedState;
}

export const Center = ({ state }: CenterProps) => {
  const { issuer } = useGameContext();
  const { toast } = useToastContext();

  const onLootDeckClick = () => {
    socket.emit("debugLoot", issuer, (response) => {
      if (response.status === 200) {
        toast(
          "success",
          "CHEAT MODE",
          "You have looted a card from the loot deck",
        );
      } else {
        toast("error", "CHEAT MODE", response.error);
      }
    });
  };

  const onTreasureDeckClick = () => {
    socket.emit("debugGainTreasure", issuer, (response) => {
      if (response.status === 200) {
        toast(
          "success",
          "CHEAT MODE",
          "You have gained a treasure card from the treasure deck",
        );
      } else {
        toast("error", "CHEAT MODE", response.error);
      }
    });
  };

  return (
    <div className="flex place-items-center gap-12 transform-3d">
      <Stack />
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
          onClickTopCard={CHEAT_MODE ? onLootDeckClick : undefined}
        />
        <Pile cards={state.loot.discard} />
      </div>
      <div className="flex flex-col gap-8 transform-3d">
        <div className="flex place-items-center gap-2 transform-3d">
          <Pile cards={state.treasure.discard} />
          <Pile
            cards={Array.from({ length: state.treasure.deckSize }).map(
              () => CardType.TreasureCard,
            )}
            onClickTopCard={CHEAT_MODE ? onTreasureDeckClick : undefined}
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
