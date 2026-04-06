import { Fragment, useRef } from "react";
import { socket } from "@/utils/socket";
import type { Requests, Room } from "@/shared/api";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { isBooleanParameterKey, isParameterKey } from "@/shared/api";
import { Person } from "@/icons/person";

interface StartStepProps {
  room: Extract<Room["room"], { state: "joined" }>;
}

export const StartStep = ({ room }: StartStepProps) => {
  const { issuer, gameParameters, players } = room;
  const { toast } = useToastContext();
  const loadGameInputRef = useRef<HTMLInputElement>(null);

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

  const onLoadGamePress = () => {
    loadGameInputRef.current?.click();
  };

  const onLoadGameFileSelected = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const logs = reader.result;
      if (typeof logs !== "string") {
        toast("error", "Load game", "Could not read selected file");
        return;
      }

      socket.emit("loadGame", { issuer, logs }, (response) => {
        switch (response.status) {
          case 200:
            toast("success", "Load game", "Saved game loaded successfully");
            break;
          case 400:
          default:
            toast("error", "Load game", response.error);
            break;
        }
      });
    };

    reader.onerror = () => {
      toast("error", "Load game", "Could not read selected file");
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <div className="flex w-full items-start gap-16">
      <div className="flex flex-1 justify-between gap-16">
        <div className="flex flex-col gap-16">
          <div className="flex flex-col gap-6 rounded-lg border-2 border-stone-700 bg-stone-800/60 p-6 backdrop-blur-md">
            <div className="flex flex-col gap-8">
              <h2 className="font-main text-2xl font-bold">
                {players.length === 1
                  ? "Waiting for a least another player to join..."
                  : `Starting a game with ${players.length} players`}
              </h2>
              <div className="flex gap-4">
                {players.map((player) => (
                  <div className="flex items-center gap-2 rounded-lg border-2 border-stone-700 p-4 pr-5">
                    <Person className="size-6" />
                    {player}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                Share the room ID with your friends to invite them to join the
                game.
                <div className="flex items-center gap-2">
                  <p>
                    Room ID: <span className="font-bold">{room.id}</span>
                  </p>
                  <Button
                    label="Copy"
                    onClick={() => {
                      navigator.clipboard.writeText(room.id);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col place-items-start gap-6 self-start rounded-lg border-2 border-stone-700 bg-stone-800/60 p-6 backdrop-blur-md">
            <h2 className="font-main text-2xl font-bold">Ready?</h2>
            <p className="leading-relaxed">
              When everyone joined and is ready,
              <br />
              click the button below to start the game.
            </p>
            <Button
              onClick={requestStart}
              hotkey="enter"
              label="Let's go!"
              className="h-16 w-120 font-alt-stats text-xl font-bold"
            />
            <Button
              onClick={onLoadGamePress}
              label="Load game"
              className="w-120"
            />
            <input
              ref={loadGameInputRef}
              type="file"
              accept=".log,text/plain"
              className="hidden"
              onChange={onLoadGameFileSelected}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 self-start rounded-lg border-2 border-stone-700 bg-stone-800/60 p-6 backdrop-blur-md">
          <h2 className="font-main text-2xl font-bold">Game reset</h2>
          <p>
            Not happy with your playmates?
            <br />
            You can reset the game and start over.
          </p>
          <Button onClick={onResetPress} label="Reset" className="mt-4" />
        </div>
      </div>

      <div className="flex max-h-[calc(100vh-220px)] flex-col gap-12 overflow-auto rounded-lg border-2 border-stone-700 bg-stone-800/60 p-6 pb-8 backdrop-blur-md">
        <h2 className="font-main text-2xl font-bold">Game parameters</h2>
        <div className="grid grid-cols-[auto_auto] items-center gap-x-12 gap-y-6">
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
    <div className="flex items-center justify-end">
      <Button
        onClick={() => onChange(value - 1)}
        label="−"
        className="rounded-r-none font-sans"
      />
      <p className="flex h-10 min-w-13 items-center justify-center border-y-2 border-stone-700 text-center font-bold text-stone-400">
        {value}
      </p>
      <Button
        onClick={() => onChange(value + 1)}
        label="+"
        className="rounded-l-none font-sans"
      />
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
    <div className="grid grid-cols-2 items-center justify-end">
      <Button
        onClick={() => onChange(false)}
        label="No"
        active={!value}
        className="rounded-r-none font-sans font-bold"
      />
      <Button
        onClick={() => onChange(true)}
        label="Yes"
        active={value}
        className="rounded-l-none font-sans font-bold"
      />
    </div>
  );
};
