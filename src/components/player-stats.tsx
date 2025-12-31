import type { DetailedStateResponse } from "../types/api";
import { Card } from "./card";

interface Props {
  player:
    | DetailedStateResponse["players"][number]
    | DetailedStateResponse["me"];
  state: "playing" | "waiting";
  isPlayer?: boolean;
  onLootCardClick?: (index: number) => void;
  onTreasureCardClick?: (index: number) => void;
}

export const PlayerStats = ({
  player,
  state,
  isPlayer = false,
  onLootCardClick,
  onTreasureCardClick,
}: Props) => {
  return (
    <div className="player" data-is-player={isPlayer}>
      <div>
        <h2>{player.name}</h2>
        <ul>
          <li>State: {state}</li>
          <li>Coins: {player.coins}</li>
          <li>Health: {player.currentHealthPoints}</li>
          <li>Attack: {player.currentAttackPoints}</li>
          <li>Loot play: {player.remainingLootPlay}</li>
        </ul>
      </div>

      <div className="cards">
        <div className="in-play">
          {player.inPlay.map((card, index) => (
            <Card
              card={card}
              face="front"
              key={card.slug}
              onClick={() => onTreasureCardClick?.(index)}
            />
          ))}
        </div>

        <div className="loot">
          {"handSize" in player
            ? Array.from({ length: player.handSize }).map((_, index) => (
                <Card card={{ slug: "b2-a_dime" }} face="back" key={index} />
              ))
            : player.hand.map((card, index, array) => (
                <Card
                  style={{
                    rotate: `${
                      (10 / array.length) * (0.5 + index - array.length / 2)
                    }deg`,
                    translate: `0px ${
                      (20 / array.length) *
                      Math.abs(0.5 + index - array.length / 2) ** 2
                    }px`,
                  }}
                  card={card}
                  face="front"
                  key={card.slug}
                  onClick={() => onLootCardClick?.(index)}
                />
              ))}
        </div>

        <div className="souls">
          {player.souls.map((card) => (
            <Card card={card} face="front" key={card.slug} />
          ))}
        </div>
      </div>
    </div>
  );
};
