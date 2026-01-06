import { useCallback, useEffect, useState } from "react";
import type {
  ActiveEffectEntry,
  DetailedStateResponse,
  GenericCardType,
  Issuer,
  TargetSelectorResponse,
  SubmitSelectionResponse,
} from "../types/api";
import { PlayerStats } from "./player-stats";
import { ChoicePopup } from "./choice-popup";
import { CursorCard } from "./cursor-card";
import { Card } from "./card";

interface BoardProps {
  issuer: Issuer;
}

type CardActivationFlow = {
  currentTargetSelector: TargetSelectorResponse;
  onChoice: (choice: string) => void;
  selectedChoices?: string[];
};

type EffectSelectionFlow = {
  choices: { label: string; value: number | "tap" }[];
  onChoice: (choice: number | "tap") => void;
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
            onChoice: (choice: number | "tap") => {
              console.log("You made a choice", choice);
              setEffectSelectionFlow(undefined);
              onTreasureCardClick(index, choice, choices);
            },
          });
          return;
        }
        effectIndex = card.effects[0].index;
      }

      const result = await fetch("http://localhost:3000/activate", {
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
        onChoice: (choice: string) => {
          const newChoices = [...choices, choice];
          onTreasureCardClick(index, effectIndex, newChoices);
        },
      });
    },
    [state, activationFlow]
  );

  const onLootCardClick = useCallback(
    async (
      index: number,
      choices: string[] = []
    ) => {
      
      const effectIndex = "tap";
      const result = await fetch("http://localhost:3000/playcard", {
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
        onChoice: (choice: string) => {
          const newChoices = [...choices, choice];
          onLootCardClick(index, newChoices);
        },
      });
    },
    [state, activationFlow]
  );

  const handlePendingSelection = useCallback(
    async (choices: string[] = []) => {
      if (!state?.pendingSelection) return;

      const { requestId, options, count, asMany } = state.pendingSelection;

      // Set up the activation flow
      setActivationFlow({
        currentTargetSelector: {
          description: `Select ${asMany ? 'up to' : ''} ${count} option${count > 1 ? 's' : ''} (${choices.length}/${count} selected)`,
          count: count - choices.length,
          asMany,
          options: options, // Keep all options visible
          complete: false,
          isChooseOne: false,
        },
        selectedChoices: choices,
        onChoice: (choice: string) => {
          // Toggle selection: if already selected, remove it; otherwise add it
          const isAlreadySelected = choices.includes(choice);
          const newChoices = isAlreadySelected
            ? choices.filter(c => c !== choice)
            : [...choices, choice];
          // Continue selecting without auto-submission
          handlePendingSelection(newChoices);
        },
      });
    },
    [state, issuer]
  );

  // Set up activation flow when pendingSelection appears
  useEffect(() => {
    if (state?.pendingSelection && state.pendingSelection.requestId !== handledRequestId) {
      setHandledRequestId(state.pendingSelection.requestId);
      handlePendingSelection([]);
    } else if (!state?.pendingSelection && handledRequestId) {
      // Clear handled request when pendingSelection is gone
      setHandledRequestId(null);
    }
  }, [state?.pendingSelection, handledRequestId, handlePendingSelection]);

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

  const onShopCardClick = (index: number) => {
    fetch("http://localhost:3000/purchase", {
      method: "POST",
      body: JSON.stringify({ issuer, index }),
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

  const declareAttack = () => {
    fetch("http://localhost:3000/declareAttack", {
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
    fetch("http://localhost:3000/attackMonster", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    setCursorCard(null);
  };

  const attackRoll = () => {
    fetch("http://localhost:3000/attackRoll", {
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
              <Card
                card={monster}
                face="front"
                key={monster.slug}
                cursor="url('/sword.png') 50 50, grab"
                onClick={() => onMonsterCardClick(index)}
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
          onCancel={() => {
            // If this is a pending selection, submit the selected choices
            if (state?.pendingSelection) {
              const { asMany, count } = state.pendingSelection;
              const selectedCount = activationFlow.selectedChoices?.length || 0;
              
              // Only submit if valid: either exactly count, or at least 1 if asMany
              if ((asMany && selectedCount > 0 && selectedCount <= count) || selectedCount === count) {
                fetch("http://localhost:3000/submitSelection", {
                  method: "POST",
                  body: JSON.stringify({
                    issuer,
                    requestId: state.pendingSelection.requestId,
                    selectedOptions: activationFlow.selectedChoices || [],
                  }),
                  headers: {
                    "Content-Type": "application/json",
                  },
                });
              }
            }
            setActivationFlow(undefined);
          }}
          selectedChoices={activationFlow.selectedChoices}
          validateLabel={state?.pendingSelection ? "Validate" : "Cancel"}
          canValidate={
            !state?.pendingSelection || 
            (() => {
              const { asMany, count } = state.pendingSelection;
              const selectedCount = activationFlow.selectedChoices?.length || 0;
              return (asMany && selectedCount > 0 && selectedCount <= count) || selectedCount === count;
            })()
          }
          maxSelections={state?.pendingSelection?.count}
        />
      )}
      {effectSelectionFlow && (
        <ChoicePopup
          choices={effectSelectionFlow.choices}
          onChoice={effectSelectionFlow.onChoice}
          description="Choose an effect"
          onCancel={() => setEffectSelectionFlow(undefined)}
        />
      )}
    </div>
  );
};
