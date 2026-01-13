import { useCallback, useEffect, useState } from "react";
import type {
  DetailedStateResponse,
  GenericCardType,
  Issuer,
  TargetSelectorResponse,
  PendingSelection,
} from "../types/api";
import { PlayerStats } from "./player-stats";
import { ChoicePopup } from "./choice-popup";
import { CursorCard } from "./cursor-card";
import { Card } from "./card";
import { BASE_URL } from "astro:env/client";

interface BoardProps {
  issuer: Issuer;
}

type CardActivationFlow = {
  currentTargetSelector: TargetSelectorResponse;
  onChoice: (choices: string[]) => void;
  selectedChoices?: string[];
  cancellable: boolean;
};

type EffectSelectionFlow = {
  choices: { label: string; value: number | "tap" }[];
  onChoice: (choice: (number | "tap")[]) => void;
  count: number;
  asMany: boolean;
};

export const Board = ({ issuer }: BoardProps) => {
  const [state, setState] = useState<DetailedStateResponse | null>(null);
  const [cursorCard, setCursorCard] = useState<{
    card: GenericCardType;
    face: "front" | "back";
  } | null>(null);

  const [activationFlow, setActivationFlow] = useState<CardActivationFlow>();
  const [effectSelectionFlow, setEffectSelectionFlow] =
    useState<EffectSelectionFlow>();
  const [handledRequestId, setHandledRequestId] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(`${BASE_URL}/sse`);
    url.searchParams.set("id", issuer.id);
    url.searchParams.set("secret", issuer.secret);
    const stream = new EventSource(url.toString());

    stream.addEventListener("open", () => {
      console.log("SSE connection opened");
    });
    // Named event: "stateChange"
    stream.addEventListener("stateChange", (event) => {
      const data = JSON.parse(event.data);

      if (
        data.pendingSelection &&
        data.pendingSelection.requestId !== handledRequestId
      ) {
        setHandledRequestId(data.pendingSelection.requestId);
        onPendingSelectionReceived(data.pendingSelection);
      } else if (!data.pendingSelection && handledRequestId) {
        setHandledRequestId(null);
      }

      setState(data);
    });
  }, []);

  const drawLoot = () => {
    fetch(`${BASE_URL}/loot`, {
      method: "POST",
      body: JSON.stringify({ issuer }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const onTreasureCardClick = useCallback(
    async (
      index: number,
      effectIndex?: number | "tap",
      choices: string[] = []
    ) => {
      const card = state?.me.inPlay[index];
      if (!card) throw new Error("Card not found");

      if (!card.effects) {
        console.error("Card has no active effects", card.slug);
        return;
      }

      if (effectIndex === undefined) {
        if (card.effects.length > 1) {
          setEffectSelectionFlow({
            choices: card.effects.map(({ index, description }) => ({
              label: description,
              value: index,
            })),
            count: 1,
            asMany: false,
            onChoice: (choice: (number | "tap")[]) => {
              setEffectSelectionFlow(undefined);
              onTreasureCardClick(index, choice[0], choices);
            },
          });
          return;
        }
        effectIndex = card.effects[0].index;
      }

      const result = await fetch(`${BASE_URL}/activate`, {
        method: "POST",
        body: JSON.stringify({
          issuer,
          index: index,
          effectIndex,
          targetChoices: choices,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data: TargetSelectorResponse = await result.json();

      if (data.complete) {
        setActivationFlow(undefined);
        return;
      }

      setActivationFlow({
        currentTargetSelector: data,
        cancellable: true,
        onChoice: (newChoices: string[]) => {
          onTreasureCardClick(index, effectIndex, [...choices, ...newChoices]);
        },
      });
    },
    [state, activationFlow]
  );

  const onLootCardClick = useCallback(
    async (index: number, choices: string[] = []) => {
      const effectIndex = "tap";
      const result = await fetch(`${BASE_URL}/playcard`, {
        method: "POST",
        body: JSON.stringify({
          issuer,
          index: index,
          effectIndex,
          targetChoices: choices,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data: TargetSelectorResponse = await result.json();

      if (data.complete) {
        setActivationFlow(undefined);
        return;
      }

      setActivationFlow({
        currentTargetSelector: data,
        cancellable: true,
        onChoice: (newChoices: string[]) => {
          onLootCardClick(index, [...choices, ...newChoices]);
        },
      });
    },
    [state, activationFlow]
  );

  const onPendingSelectionReceived = useCallback(
    async (pendingSelection: PendingSelection) => {
      const { requestId, description, options, count, asMany } =
        pendingSelection;

      // Set up the activation flow
      setActivationFlow({
        currentTargetSelector: {
          description,
          count,
          asMany,
          options,
          complete: false,
          isChooseOne: false,
        },
        selectedChoices: [],
        cancellable: false,
        onChoice: async (selectedOptions: string[]) => {
          const result = await fetch(`${BASE_URL}/submitSelection`, {
            method: "POST",
            body: JSON.stringify({
              issuer,
              requestId,
              selectedOptions,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (result.ok) {
            setActivationFlow(undefined);
          } else {
            console.error("Failed to submit selection", result.statusText);
          }
        },
      });
    },
    [state, issuer]
  );

  if (!state) {
    return <div>Loading...</div>;
  }

  const resolveStack = () => {
    fetch(`${BASE_URL}/resolve`);
  };

  const gainTreasure = () => {
    fetch(`${BASE_URL}/gaintreasure`, {
      method: "POST",
      body: JSON.stringify({ issuer }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const onShopCardClick = (index: number) => {
    fetch(`${BASE_URL}/purchase`, {
      method: "POST",
      body: JSON.stringify({ issuer, index }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const endTurn = () => {
    fetch(`${BASE_URL}/endturn`, {
      method: "POST",
      body: JSON.stringify({ issuer }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const declareAttack = () => {
    fetch(`${BASE_URL}/declareAttack`, {
      method: "POST",
      body: JSON.stringify({ issuer }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const onMonsterCardClick = (index: number) => {
    const body = cursorCard
      ? { issuer, index: "top", replaceIndex: index }
      : { issuer, index };
    fetch(`${BASE_URL}/attackMonster`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    setCursorCard(null);
  };

  const attackRoll = () => {
    fetch(`${BASE_URL}/attackRoll`, {
      method: "POST",
      body: JSON.stringify({ issuer }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const onMonsterTopCardClick = () => {
    setCursorCard({ card: { slug: "b2-monstro" }, face: "back" });
  };

  return (
    <div id="board">
      <nav>
        <button onClick={declareAttack}>Declare Attack</button>
        <button onClick={attackRoll}>Attack roll</button>
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
            <Card
              card={{ slug: "b2-monstro" }}
              face="back"
              cursor="grab"
              onClick={onMonsterTopCardClick}
            />
            {state.monsters.map((monster, index) => (
              <div>
                <Card
                card={monster}
                face="front"
                key={monster.slug}
                cursor="url('/sword.png') 50 50, grab"
                onClick={() => onMonsterCardClick(index)}
              />
              {monster.stats && (
                
                <ul>
                  <h4 style={{ color: monster.stats.isEngagedInCombat ? 'red' : 'inherit' }}>{monster.name}</h4>
                  <li>Health: {monster.stats.healthPoints}</li>
                  <li>Attack: {monster.stats.attackPoints}</li>
                  <li>Evasion: {monster.stats.evasionPoints}</li>
                </ul>
              )}
              </div>
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
            <Card
              card={{ slug: "b2-no" }}
              face="back"
              onClick={() => onShopCardClick(0)}
            />
            {state.shop.map((card, index) => (
              <Card
                card={card}
                face="front"
                key={card.slug}
                onClick={() => onShopCardClick(index + 1)}
              />
            ))}
          </div>
        </div>
      </section>
      {cursorCard && (
        <CursorCard card={cursorCard.card} face={cursorCard.face} />
      )}
      {activationFlow && (
        <ChoicePopup
          choices={activationFlow.currentTargetSelector.options}
          onChoice={activationFlow.onChoice}
          description={activationFlow.currentTargetSelector.description}
          onCancel={() => setActivationFlow(undefined)}
          count={activationFlow.currentTargetSelector.count}
          asMany={activationFlow.currentTargetSelector.asMany}
          cancellable={activationFlow.cancellable}
        />
      )}
      {effectSelectionFlow && (
        <ChoicePopup
          count={effectSelectionFlow.count}
          asMany={effectSelectionFlow.asMany}
          cancellable={true}
          choices={effectSelectionFlow.choices}
          onChoice={effectSelectionFlow.onChoice}
          description="Choose an effect"
          onCancel={() => setEffectSelectionFlow(undefined)}
        />
      )}
    </div>
  );
};
