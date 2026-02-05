import { Fragment } from "react";
import { socket } from "@/utils/socket";
import type { Requests, Room } from "@/shared/api";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { isBooleanParameterKey, isParameterKey } from "@/shared/api";
import { Person } from "@/icons/person";

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
    <div className="h-screen">
      <div className="planetarium w-full">
        <img src="/logo.png" alt="Logo" className="h-28 p-4" />
      </div>
      <div className="p-12">
        <div className="flex items-start gap-16">
          <div className="flex flex-1 justify-between gap-16">
            <div className="flex flex-col gap-6">
              <h1 className="font-main text-5xl font-bold">
                {players.length === 1
                  ? `Welcome ${issuer.id}!`
                  : `On your mark ${issuer.id}!`}
              </h1>
              <div>
                <h2 className="mt-2 mb-4 font-main text-2xl font-bold">
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
              </div>

              <div className="flex flex-col place-items-start gap-6 self-start mt-24">
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
                  className="mt-4 px-32 py-4 font-alt-stats text-xl font-bold"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 self-start rounded-lg border-2 border-stone-700 p-6">
              <h2 className="font-main text-2xl font-bold">Game reset</h2>
              <p>
                Not happy with your playmates?
                <br />
                You can reset the game and start over.
              </p>
              <Button onClick={onResetPress} label="Reset" className="mt-4" />
            </div>
          </div>

          <div className="flex max-h-[calc(100vh-220px)] flex-col gap-12 overflow-auto rounded-lg border-2 border-stone-700 p-6 pb-8">
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
