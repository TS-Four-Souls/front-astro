import type { DetailedStateResponse } from "../types/api";

interface Props {
  player:
    | DetailedStateResponse["players"][number]
    | DetailedStateResponse["me"];
  state: "playing" | "waiting";
  isPlayer?: boolean;
  onLootCardClick?: (index: number) => void;
}

export const PlayerStats = ({
  player,
  state,
  isPlayer = false,
  onLootCardClick,
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
        </ul>
      </div>

      <div className="cards">
        <div className="in-play">
          {player.inPlay.map((card) => (
            <img
              src={`http://localhost:3000/images/${card.slug}/front`}
              alt={card.slug}
              key={card.slug}
            />
          ))}
        </div>

        <div className="loot">
          {"handSize" in player
            ? Array.from({ length: player.handSize }).map((_, index) => (
                <img
                  src={`http://localhost:3000/images/b2-a_dime/back`}
                  alt="b2-a_dime"
                  key={index}
                />
              ))
            : player.hand.map((card, index, array) => (
                <img
                  style={{
                    rotate: `${
                      (10 / array.length) * (0.5 + index - array.length / 2)
                    }deg`,
                    translate: `0px ${
                      (20 / array.length) *
                      Math.abs(0.5 + index - array.length / 2) ** 2
                    }px`,
                  }}
                  src={`http://localhost:3000/images/${card.slug}/front`}
                  alt={card.slug}
                  key={card.slug}
                  onClick={() => onLootCardClick?.(index)}
                />
              ))}
        </div>

        <div className="souls">
          {player.souls.map((card) => (
            <img
              src={`http://localhost:3000/images/${card.slug}/front`}
              alt="b2-a_dime"
              key={card.slug}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
