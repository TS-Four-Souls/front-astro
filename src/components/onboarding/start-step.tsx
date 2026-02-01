import { Fragment } from "react";
import { socket } from "@/utils/socket";
import type { Requests, Room } from "@/shared/api";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { isBooleanParameterKey, isParameterKey } from "@/shared/api";

interface StartStepProps {
  room: Room;
}

export const StartStep = ({ room }: StartStepProps) => {
  const { issuer, gameParameters, players } = room;
  const { toast } = useToastContext();

  const onChangeGameParameter = (request: Requests.SetGameParameter) => {
    socket.emit("setGameParameter", request, (response) => {
      switch (response.status) {
        case 200:
          break;
      }
    });
  };

  const onResetPress = () => {
    socket.emit("reset", null, (response) => {
      switch (response.status) {
        case 200:
          toast("success", "Reset", "The game has been reset");
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
    <div className="grid min-h-screen place-content-center place-items-center gap-8 overflow-y-auto p-12">
      <div>
        <Button
          type="button"
          label="Reset ongoing game"
          onClick={onResetPress}
        />
      </div>
      <div className="flex flex-col gap-8 rounded-lg border-2 border-stone-700 p-8 text-center">
        <h1 className="font-main text-3xl font-bold">Welcome {issuer.id}!</h1>
        <div>
          <p className="leading-normal text-stone-400">Players:</p>
          <ol>
            {players.map((player) => (
              <li key={player}>{player}</li>
            ))}
          </ol>
        </div>
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
          <div className="mt-8 grid grid-cols-[auto_auto] items-center gap-8">
            {Object.keys(gameParameters)
              .filter(isParameterKey)
              .map((parameter) => (
                <Fragment key={parameter}>
                  <p className="text-stone-400">
                    {gameParameters[parameter].text}
                  </p>
                  {isBooleanParameterKey(parameter) ? (
                    <BooleanInput
                      value={gameParameters[parameter].value}
                      onChange={(value) => {
                        onChangeGameParameter({
                          parameter: parameter,
                          value,
                          issuer,
                        });
                      }}
                    />
                  ) : (
                    <NumericInput
                      value={gameParameters[parameter].value}
                      onChange={(value) => {
                        onChangeGameParameter({
                          parameter: parameter,
                          value,
                          issuer,
                        });
                      }}
                    />
                  )}
                </Fragment>
              ))}
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
    <div className="flex items-center justify-end gap-2">
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
    <div className="flex items-center justify-end gap-2">
      <Button onClick={() => onChange(!value)} label={value ? "Yes" : "No"} />
    </div>
  );
};
