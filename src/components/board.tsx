import { useEffect, useState } from "react";
import type { DetailedStateResponse, Issuer } from "../types/api";

interface BoardProps {
  issuer: Issuer;
}

export const Board = ({ issuer }: BoardProps) => {
  const [state, setState] = useState<DetailedStateResponse | null>(null);

  const fetchState = () => {
    fetch("http://localhost:3000/detailedstate", {
      method: "POST",
      body: JSON.stringify({ issuer }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => setState(data));
  };

  useEffect(() => {
    fetchState();
  }, []);

  const drawLoot = () => {
    fetch("http://localhost:3000/loot", {
      method: "POST",
      body: JSON.stringify({ issuer }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(() => fetchState());
  };

  if (!state) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Board</h1>
      {state.players.map((player) => (
        <div key={player.name}>
          <h2>{player.name}</h2>
          <p>
            {player.inPlay.map((card) => (
              <img
                style={{ width: "200px" }}
                src={`http://localhost:3000/images/${card.slug}/front`}
                alt={card.slug}
                key={card.slug}
              />
            ))}
          </p>
        </div>
      ))}
      <div>
        <button onClick={drawLoot}>Draw loot</button>
      </div>
      <p>{state.me.name}</p>
      <p>
        {state.me.hand.map((card) => (
          <img
            style={{ width: "200px" }}
            src={`http://localhost:3000/images/${card.slug}/front`}
            alt={card.slug}
            key={card.slug}
          />
        ))}
      </p>
      <p>
        {state.me.inPlay.map((card) => (
          <img
            style={{ width: "200px" }}
            src={`http://localhost:3000/images/${card.slug}/front`}
            alt={card.slug}
            key={card.slug}
          />
        ))}
      </p>
    </div>
  );
};
