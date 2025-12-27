import { useEffect, useState } from "react";
import type { DetailedStateResponse, Issuer } from "../types/api";
import { PlayerStats } from "./player-stats";
import { ChoicePopup } from "./choice-popup";

interface BoardProps {
  issuer: Issuer;
}

interface PendingCardPlay {
  index: number;
  effectTargets: {
    description: string;
    choices: string[];
    choice: string | null;
  }[];
}

export const Board = ({ issuer }: BoardProps) => {
  const [state, setState] = useState<DetailedStateResponse | null>(null);
  const [pendingCardPlay, setPendingCardPlay] =
    useState<PendingCardPlay | null>(null);
  const pendingChoices =
    pendingCardPlay?.effectTargets.flatMap((et, index) =>
      et.choice === null
        ? [
            {
              description: et.description,
              choices: et.choices,
              onChoice: (choice: string) => {
                // Update the pendingCardPlay state with the chosen choice
                const newPendingCardPlay = { ...pendingCardPlay! };
                newPendingCardPlay.effectTargets[index].choice = choice;
                if (index === pendingCardPlay.effectTargets.length - 1) {
                  activateTreasureCard(newPendingCardPlay);
                } else {
                  setPendingCardPlay(newPendingCardPlay);
                }
              },
            },
          ]
        : []
    ) ?? [];

  const activateTreasureCard = async (pendingCardPlay: PendingCardPlay) => {
    if (!pendingCardPlay) return;

    await fetch("http://localhost:3000/activate", {
      method: "POST",
      body: JSON.stringify({
        issuer,
        index: pendingCardPlay.index + 1,
        choices: pendingCardPlay.effectTargets.map((et) => et.choice),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    setPendingCardPlay(null);
  };

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

  const onTreasureCardClick = async (index: number) => {
    const result = await fetch("http://localhost:3000/getEffectTarget", {
      method: "POST",
      body: JSON.stringify({ issuer, index: index + 1 }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await result.json();
    if (data) {
      setPendingCardPlay({
        index,
        effectTargets: data.map((et: any) => ({
          description: et.description,
          choices: et.choices,
          choice: null,
        })),
      });
    }
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

  const endTurn = () => {
    fetch("http://localhost:3000/endturn", {
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
        <button onClick={endTurn}>End Turn</button>
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
          onTreasureCardClick={onTreasureCardClick}
        />
      </div>
      <section id="board-center">
        <div id="monsters">
          <h2>Monsters</h2>
          <div>
            <img
              src={`http://localhost:3000/images/b2-monstro/back`}
              alt="Monster back"
            />
            {state.monsters.map((monster) => (
              <img
                src={`http://localhost:3000/images/${monster.slug}/front`}
                alt={monster.slug}
                key={monster.slug}
              />
            ))}
          </div>
        </div>
        <div id="stack">
          <h2>The stack</h2>
          <ol>
            {state.stack.toReversed().map((entry) => (
              <li>{entry}</li>
            ))}
          </ol>
        </div>
        <div id="shop">
          <h2>Shop</h2>
          <div>
            <img
              src={`http://localhost:3000/images/b2-no/back`}
              alt="Monster back"
            />
            {state.shop.map((card) => (
              <img
                src={`http://localhost:3000/images/${card.slug}/front`}
                alt={card.slug}
                key={card.slug}
              />
            ))}
          </div>
        </div>
      </section>

      {pendingChoices.length > 0 && <ChoicePopup {...pendingChoices[0]} />}
    </div>
  );
};
