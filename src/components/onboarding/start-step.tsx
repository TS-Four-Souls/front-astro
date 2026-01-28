import { socket } from "@/utils/socket";
import type { GameParametersJson, Issuer, Requests } from "@/shared/api";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";

interface StartStepProps {
  issuer: Issuer;
  gameParameters: GameParametersJson;
}

export const StartStep = ({ issuer, gameParameters }: StartStepProps) => {
  const { toast } = useToastContext();

  const onChangeGameParameter = (request: Requests.SetGameParameter) => {
    socket.emit("setGameParameter", request, (response) => {
      switch (response.status) {
        case 200:
          break;
      }
    });
  };

  const requestStart = async () => {
    socket.emit("start", { issuer }, (response) => {
      switch (response.status) {
        case 200:
          break;
        case 400:
        default:
          toast("error", "Failed to start game", response.error);
          break;
      }
    });
  };

  return (
    <div className="grid h-screen place-content-center place-items-center gap-8">
      <div className="flex flex-col gap-8 rounded-lg border-2 border-stone-700 p-8 text-center">
        <h1 className="font-main text-3xl font-bold">Welcome {issuer.id}!</h1>
        <p className="leading-normal text-stone-400">
          When everyone is ready,
          <br />
          click the button below to start the game
        </p>
        <Button onClick={requestStart} label="Start" />
      </div>
      <div className="rounded-lg border-2 border-stone-700 p-8">
        <details>
          <summary className="text-2xl font-bold">Game parameters</summary>
          <div className="grid grid-cols-[auto_auto] items-center gap-8 mt-8">
            <p className="text-stone-400">Number of items in shop</p>
            <NumericInput
              value={gameParameters.nbItemsInShop}
              onChange={(value) => {
                onChangeGameParameter({
                  parameter: "nbItemsInShop",
                  value,
                  issuer,
                });
              }}
            />
            <p className="text-stone-400">Number of encounters</p>
            <NumericInput
              value={gameParameters.nbEncounters}
              onChange={(value) => {
                onChangeGameParameter({ parameter: "nbEncounters", value, issuer });
              }}
            />
            <p className="text-stone-400">Death penalty coins</p>
            <NumericInput
              value={gameParameters.deathPenaltyCoins}
              onChange={(value) => {
                onChangeGameParameter({
                  parameter: "deathPenaltyCoins",
                  value,
                  issuer,
                });
              }}
            />
            <p className="text-stone-400">Treasures on start</p>
            <NumericInput
              value={gameParameters.treasuresOnStart}
              onChange={(value) => {
                onChangeGameParameter({
                  parameter: "treasuresOnStart",
                  value,
                  issuer,
                });
              }}
            />
            <p className="text-stone-400">Loot on start</p>
            <NumericInput
              value={gameParameters.lootOnStart}
              onChange={(value) => {
                onChangeGameParameter({ parameter: "lootOnStart", value, issuer });
              }}
            />
            <p className="text-stone-400">Coins on start</p>
            <NumericInput
              value={gameParameters.coinsOnStart}
              onChange={(value) => {
                onChangeGameParameter({ parameter: "coinsOnStart", value, issuer });
              }}
            />
            <p className="text-stone-400">Shop price</p>
            <NumericInput
              value={gameParameters.shopPrice}
              onChange={(value) => {
                onChangeGameParameter({ parameter: "shopPrice", value, issuer });
              }}
            />
            <p className="text-stone-400">Number of player card restriction</p>
            <BooleanInput
              value={gameParameters.nbPlayerCardRestriction}
              onChange={(value) => {
                onChangeGameParameter({
                  parameter: "nbPlayerCardRestriction",
                  value,
                  issuer,
                });
              }}
            />
          </div>
        </details>
      </div>
    </div>
  );
};

const NumericInput = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => {
  return (
    <div className="flex items-center gap-2 justify-end">
      <Button onClick={() => onChange(value - 1)} label="-" />
      <p className="min-w-6 text-center">{value}</p>
      <Button onClick={() => onChange(value + 1)} label="+" />
    </div>
  );
};

const BooleanInput = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) => {
  return (
    <div className="flex items-center gap-2 justify-end">
      <Button onClick={() => onChange(!value)} label={value ? "Yes" : "No"} />
    </div>
  );
};
