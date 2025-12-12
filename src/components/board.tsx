import { useEffect, useState } from "react";
import type { DetailedStateResponse, Issuer } from "../types/api";
import { PlayerStats } from "./player-stats";

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

  const onLootCardClick = (index: number) => {
    fetch("http://localhost:3000/playcard", {
      method: "POST",
      body: JSON.stringify({ issuer, index: index + 1 }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  if (!state) {
    return <div>Loading...</div>;
  }

  const resolveStack = () => {
    fetch("http://localhost:3000/resolve");
  };

  const gainTreasure = () => {
    fetch("http://localhost:3000/gaintreasure", {
      method: "POST",
      body: JSON.stringify({ issuer }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  return (
    <div id="board">
      <nav>
        <button onClick={drawLoot}>Draw loot</button>
        <button onClick={resolveStack}>Resolve stack</button>
        <button onClick={gainTreasure}>Gain a treasure</button>
      </nav>
      <div>
        {state.players.map((player) => (
          <PlayerStats
            player={player}
            state={state.turn === player.name ? "playing" : "waiting"}
          />
        ))}
        <PlayerStats
          player={state.me}
          state={state.turn === state.me.name ? "playing" : "waiting"}
          isPlayer
          onLootCardClick={onLootCardClick}
        />
      </div>
      <div id="stack">
        <h2>The stack</h2>
        <ol>
          {state.stack.toReversed().map((entry) => (
            <li>{entry}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};
