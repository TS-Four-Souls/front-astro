import { useEffect, useState } from "react";
import type { DetailedStateResponse, Issuer } from "../types/api";

interface BoardProps {
  issuer: Issuer;
}

export const Board = ({ issuer }: BoardProps) => {
  const [state, setState] = useState<DetailedStateResponse | null>(null);

  useEffect(() => {
    const url = new URL("http://localhost:3000/sse");
    url.searchParams.set("id", issuer.id);
    url.searchParams.set("secret", issuer.secret);
    const stream = new EventSource(url.toString());

    stream.addEventListener("open", () => {
      console.log("SSE connection opened");
    });
    // Named event: "stateChange"
    stream.addEventListener("stateChange", (event) => {
      const data = JSON.parse(event.data);
      setState(data);
    });
  }, []);

  const drawLoot = () => {
    fetch("http://localhost:3000/loot", {
      method: "POST",
      body: JSON.stringify({ issuer }),
      headers: {
        "Content-Type": "application/json",
      },
    });
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
            Hand:<br />
            {Array.from({ length: player.handSize }).map((_, index) => (
              <img
                style={{ width: "200px" }}
                src={`http://localhost:3000/images/b2-a_dime/back`}
                alt="b2-a_dime"
                key={index}
              />
            ))}
          </p>
          <p>
            In Play:<br />
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
        In Play:<br />
        {state.me.inPlay.map((card) => (
          <img
            style={{ width: "200px" }}
            src={`http://localhost:3000/images/${card.slug}/front`}
            alt={card.slug}
            key={card.slug}
          />
        ))}
      </p>
      <p>
        Hand:<br />
        {state.me.hand.map((card) => (
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
