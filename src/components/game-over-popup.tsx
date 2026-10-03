import type { GameOverBroadcast, Player } from "@/shared/api";
import { Popup } from "./popup";
import { CardType } from "./board/card";
import { Pile } from "./board/pile";
import { useState } from "react";
import { Button } from "./button";
import { cn } from "@/utils/cn";

interface GameOverPopupProps {
  gameOverBroadcast: GameOverBroadcast;
  onClose: () => void;
  onQuit: () => void;
}

type Step = "summary" | "details";

export const GameOverPopup = ({
  gameOverBroadcast,
  onClose,
  onQuit,
}: GameOverPopupProps) => {
  const [step, setStep] = useState<Step>("summary");

  return (
    <Popup>
      <div className="flex flex-row justify-between gap-8">
        <h1 className="font-main text-2xl leading-tight font-bold uppercase">
          Game over!
        </h1>
      </div>
      {step === "summary" && (
        <SummaryStep
          gameOverBroadcast={gameOverBroadcast}
          onNext={() => setStep("details")}
        />
      )}
      {step === "details" && (
        <DetailsStep
          gameOverBroadcast={gameOverBroadcast}
          onQuit={onQuit}
          onContinue={onClose}
        />
      )}
    </Popup>
  );
};

const SummaryStep = ({
  gameOverBroadcast,
  onNext,
}: {
  gameOverBroadcast: GameOverBroadcast;
  onNext: () => void;
}) => {
  const winners = gameOverBroadcast.data.filter(
    (player) => player.type === "win",
  );
  const losers = gameOverBroadcast.data.filter(
    (player) => player.type === "lose",
  );
  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-16">
        {winners.length > 0 && (
          <div className="flex flex-col gap-8">
            <h2 className="text-center font-main text-2xl font-bold">
              Winners
            </h2>
            <div className="flex gap-8">
              {winners.map((winner) => (
                <PlayerCard key={winner.player.name} player={winner.player} />
              ))}
            </div>
          </div>
        )}
        {losers.length > 0 && (
          <div className="flex flex-col gap-8">
            <h2 className="text-center font-main text-2xl font-bold">Losers</h2>
            <div className="flex gap-8">
              {losers.map((loser) => (
                <PlayerCard key={loser.player.name} player={loser.player} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <Button onClick={onNext} className="px-16 py-4 text-lg" label="Next" />
      </div>
    </div>
  );
};

const HEADER_ROW = "flex bg-taupe-800 text-lg font-bold py-2";
const FIRST_COLUMN = "w-[200px] shrink-0 text-left px-4 py-1";
const COLUMNS = "w-[180px] shrink-0 text-center px-4 py-1";
const EVEN_ROW = "bg-taupe-700";
const ODD_ROW = "bg-taupe-600/50";
const TABLE = "flex flex-col";

const DetailsStep = ({
  gameOverBroadcast,
  onQuit,
  onContinue,
}: {
  gameOverBroadcast: GameOverBroadcast;
  onQuit: () => void;
  onContinue: () => void;
}) => {
  return (
    <div className="flex flex-col gap-8 overflow-y-auto pr-4 pb-4 font-main">
      <div className={TABLE}>
        <div className={HEADER_ROW}>
          <div className={FIRST_COLUMN}>Purchases</div>
          <div className={COLUMNS}>Total</div>
          <div className={COLUMNS}>Incl. top deck</div>
          <div className={COLUMNS}>Cancelled</div>
        </div>
        {gameOverBroadcast.data.map((player, index) => (
          <div className={cn("flex", index % 2 === 0 ? EVEN_ROW : ODD_ROW)}>
            <div className={FIRST_COLUMN}>{player.player.name}</div>
            <div className={COLUMNS}>{player.playerStats.nbPurchases}</div>
            <div className={COLUMNS}>
              {player.playerStats.nbPurchaseTopDeck}
            </div>
            <div className={COLUMNS}>
              {player.playerStats.nbPurchaseCancelled}
            </div>
          </div>
        ))}
      </div>

      <div className={TABLE}>
        <div className={HEADER_ROW}>
          <div className={FIRST_COLUMN}>Coins</div>
          <div className={COLUMNS}>Gained</div>
          <div className={COLUMNS}>Given</div>
          <div className={COLUMNS}>Paid</div>
        </div>
        {gameOverBroadcast.data.map((player, index) => (
          <div className={cn("flex", index % 2 === 0 ? EVEN_ROW : ODD_ROW)}>
            <div className={FIRST_COLUMN}>{player.player.name}</div>
            <div className={COLUMNS}>{player.playerStats.nbCoinsGained}</div>
            <div className={COLUMNS}>{player.playerStats.coinsGiven}</div>
            <div className={COLUMNS}>{player.playerStats.coinsPaid}</div>
          </div>
        ))}
      </div>

      <div className={TABLE}>
        <div className={HEADER_ROW}>
          <div className={FIRST_COLUMN}>Items</div>
          <div className={COLUMNS}>Gained</div>
          <div className={COLUMNS}>Activated</div>
        </div>
        {gameOverBroadcast.data.map((player, index) => (
          <div className={cn("flex", index % 2 === 0 ? EVEN_ROW : ODD_ROW)}>
            <div className={FIRST_COLUMN}>{player.player.name}</div>
            <div className={COLUMNS}>{player.playerStats.nbItemGained}</div>
            <div className={COLUMNS}>{player.playerStats.nbItemActivated}</div>
          </div>
        ))}
      </div>

      <div className={TABLE}>
        <div className={HEADER_ROW}>
          <div className={FIRST_COLUMN}>Loots</div>
          <div className={COLUMNS}>Gained</div>
          <div className={COLUMNS}>Played</div>
        </div>
        {gameOverBroadcast.data.map((player, index) => (
          <div className={cn("flex", index % 2 === 0 ? EVEN_ROW : ODD_ROW)}>
            <div className={FIRST_COLUMN}>{player.player.name}</div>
            <div className={COLUMNS}>{player.playerStats.nbLootGained}</div>
            <div className={COLUMNS}>{player.playerStats.nbLootPlayed}</div>
          </div>
        ))}
      </div>

      <div className={TABLE}>
        <div className={HEADER_ROW}>
          <div className={FIRST_COLUMN}>Attacks</div>
          <div className={COLUMNS}>Declared</div>
          <div className={COLUMNS}>Top deck</div>
          <div className={COLUMNS}>Rolled values</div>
        </div>
        {gameOverBroadcast.data.map((player, index) => (
          <div className={cn("flex", index % 2 === 0 ? EVEN_ROW : ODD_ROW)}>
            <div className={FIRST_COLUMN}>{player.player.name}</div>
            <div className={COLUMNS}>
              {player.playerStats.nbAttacksDeclared}
            </div>
            <div className={COLUMNS}>{player.playerStats.nbAttackTopDeck}</div>
            <div className={COLUMNS}>
              {player.playerStats.nbAttackRolledValues.join(", ")}
            </div>
          </div>
        ))}
      </div>

      <div className={TABLE}>
        <div className={HEADER_ROW}>
          <div className={FIRST_COLUMN}></div>
          <div className={COLUMNS}>Damage dealt</div>
          <div className={COLUMNS}>Mob killed</div>
          <div className={COLUMNS}>Player killed</div>
        </div>
        {gameOverBroadcast.data.map((player, index) => (
          <div className={cn("flex", index % 2 === 0 ? EVEN_ROW : ODD_ROW)}>
            <div className={FIRST_COLUMN}>{player.player.name}</div>
            <div className={COLUMNS}>{player.playerStats.nbDamageDealt}</div>
            <div className={COLUMNS}>{player.playerStats.nbMobKilled}</div>
            <div className={COLUMNS}>{player.playerStats.nbPlayerKilled}</div>
          </div>
        ))}
      </div>

      <div className={TABLE}>
        <div className={HEADER_ROW}>
          <div className={FIRST_COLUMN}></div>
          <div className={COLUMNS}>Damage taken</div>
          <div className={COLUMNS}>Deaths</div>
          <div className={COLUMNS}>Suicides</div>
        </div>
        {gameOverBroadcast.data.map((player, index) => (
          <div className={cn("flex", index % 2 === 0 ? EVEN_ROW : ODD_ROW)}>
            <div className={FIRST_COLUMN}>{player.player.name}</div>
            <div className={COLUMNS}>{player.playerStats.nbDamageTaken}</div>
            <div className={COLUMNS}>{player.playerStats.nbDeaths}</div>
            <div className={COLUMNS}>{player.playerStats.nbSuicides}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <Button
          onClick={onContinue}
          className="px-16 py-4 text-lg"
          label="Continue"
        />
        <Button onClick={onQuit} className="px-16 py-4 text-lg" label="Quit" />
      </div>
    </div>
  );
};

const PlayerCard = ({ player }: { player: Player }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <Pile
        cards={[
          player.character
            ? { slug: player.character.slug }
            : CardType.CharacterCard,
        ]}
        size={240}
      />
      <h2 className="text-center font-bold">{player.name}</h2>
    </div>
  );
};
