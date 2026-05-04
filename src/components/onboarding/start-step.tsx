import { Fragment, useRef } from "react";
import { socket } from "@/utils/socket";
import type { Requests, Room, RoomPlayer } from "@/shared/api";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { isBooleanParameterKey, isParameterKey } from "@/shared/api";
import { Person } from "@/icons/person";
import { CardImage, CardType } from "../board/card";
import { cn } from "@/utils/cn";
import { usePromptContext } from "../board/contexts/prompt-context";

interface StartStepProps {
  room: Extract<Room["room"], { state: "joined" }>;
}

export const StartStep = ({ room }: StartStepProps) => {
  const { issuer, gameParameters, players, me } = room;
  const { toast } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();
  const loadGameInputRef = useRef<HTMLInputElement>(null);
  const loadParametersInputRef = useRef<HTMLInputElement>(null);

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
    socket.emit("start", null, (response) => {
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

      socket.emit("loadGame", { logs }, (response) => {
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

  const onLoadParametersPress = () => {
    loadParametersInputRef.current?.click();
  };

  const onLoadParametersFileSelected = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const settings = reader.result;
      if (typeof settings !== "string") {
        toast("error", "Load parameters", "Could not read selected file");
        return;
      }

      socket.emit(
        "loadGameSettings",
        {
          settings,
        },
        (response) => {
          if (response.status === 200) {
            toast("success", "Load parameters", "Game parameters loaded");
          } else {
            toast("error", "Load parameters", response.error);
          }
        },
      );
    };

    reader.onerror = () => {
      toast("error", "Load parameters", "Could not read selected file");
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const onSaveParametersPress = () => {
    const now = new Date();
    const datePart = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const timePart = [
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("-");
    const filename = `four-souls_settings_${datePart}_${timePart}.txt`;

    downloadTextFile(JSON.stringify(gameParameters, null, 2), filename);
    toast("success", "Save parameters", `Saved as ${filename}`);
  };

  const onNextCharacterPress = () => {
    const currentIndex = room.characters.findIndex(
      (character) => character.character === me.character.character,
    );
    const nextIndex = (currentIndex + 1) % room.characters.length;
    const nextCharacter = room.characters[nextIndex];

    socket.emit("selectCharacter", { character: nextCharacter }, (response) => {
      switch (response.status) {
        case 200:
          break;
      }
    });
  };

  const onPreviousCharacterPress = () => {
    const currentIndex = room.characters.findIndex(
      (character) => character.character === me.character.character,
    );
    const previousIndex =
      (currentIndex - 1 + room.characters.length) % room.characters.length;
    const previousCharacter = room.characters[previousIndex];

    socket.emit(
      "selectCharacter",
      { character: previousCharacter },
      (response) => {
        switch (response.status) {
          case 200:
            break;
        }
      },
    );
  };

  const onCharacterSelectionPress = () => {
    addPrompt({
      promptId: "character-selection",
      isUnique: false,
      prompt: "Select your character card",
      options: room.characters.map((character) => ({
        type: "character",
        payload: character,
      })),
      minCount: 1,
      maxCount: 1,
      onSubmit: (selectedOptions) => {
        socket.emit(
          "selectCharacter",
          { character: selectedOptions[0].payload },
          (response) => {
            switch (response.status) {
              case 200:
                break;
              case 400:
                toast("error", "Failed to select character", response.error);
                break;
            }
          },
        );
        removePrompt("character-selection");
      },
      onCancel: () => {
        removePrompt("character-selection");
      },
    });
  };

  return (
    <div className="flex w-full items-start gap-8">
      <div className="flex flex-1 justify-between gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 rounded-lg border-2 border-stone-700 bg-stone-800/60 p-6 backdrop-blur-md">
            <div className="flex flex-col gap-8">
              <h2 className="font-main text-2xl font-bold">
                {players.length === 0
                  ? "Waiting for a least another player to join..."
                  : `Starting a game with ${players.length + 1} players`}
              </h2>
              <div className="flex flex-wrap gap-6">
                <PlayerCard
                  player={me}
                  actions={{
                    onPreviousCharacterPress,
                    onNextCharacterPress,
                    onCharacterSelectionPress,
                  }}
                />
                {players.map((player, index) => (
                  <PlayerCard key={index} player={player} />
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
                    hotkey="c"
                    onClick={() => {
                      navigator.clipboard.writeText(room.id);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col place-items-start gap-6 self-start rounded-lg border-2 border-stone-700 bg-stone-800/60 p-6 backdrop-blur-md">
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
              className="h-16 w-full font-alt-stats text-xl font-bold"
            />
            <Button
              onClick={onLoadGamePress}
              label="Load game"
              className="w-full"
            />
            <input
              ref={loadGameInputRef}
              type="file"
              accept=".log,text/plain"
              className="hidden"
              onChange={onLoadGameFileSelected}
            />
            <input
              ref={loadParametersInputRef}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={onLoadParametersFileSelected}
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

      <div className="flex max-h-[calc(100vh-400px)] flex-col gap-12 overflow-auto rounded-lg border-2 border-stone-700 bg-stone-800/60 p-6 pb-8 backdrop-blur-md">
        <h2 className="font-main text-2xl font-bold">Game parameters</h2>
        <div className="flex gap-4">
          <Button
            onClick={onSaveParametersPress}
            label="Save"
            className="flex-1"
          />
          <Button
            onClick={onLoadParametersPress}
            label="Load"
            className="flex-1"
          />
        </div>
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

const PlayerCard = ({
  player,
  actions,
}: {
  player: RoomPlayer;
  actions?: {
    onPreviousCharacterPress: () => void;
    onNextCharacterPress: () => void;
    onCharacterSelectionPress: () => void;
  };
}) => (
  <div className="flex shrink-0 flex-col items-center gap-1">
    <div className="flex items-center gap-1">
      <Person className="size-4" />
      {player.name ?? "Joining..."}
    </div>
    <div className="flex items-center gap-1">
      {actions && (
        <Button
          label="<"
          onClick={actions.onPreviousCharacterPress}
          className="size-8"
        />
      )}
      {player.character.character === "random" ? (
        <div className="grid items-center gap-2">
          <CardImage
            card={CardType.CharacterCard}
            className={cn(
              "col-start-1 row-start-1 h-32",
              player.name ? "opacity-100" : "opacity-50",
              actions && "cursor-pointer",
            )}
            onClick={actions?.onCharacterSelectionPress}
          />
          <p className="pointer-events-none col-start-1 row-start-1 touch-none text-center font-main text-[400%] font-bold text-black uppercase text-shadow-amber-50 text-shadow-lg">
            ?
          </p>
        </div>
      ) : (
        <CardImage
          card={{ slug: player.character.character }}
          className={cn(
            "h-32",
            player.name ? "opacity-100" : "opacity-50",
            actions && "cursor-pointer",
          )}
          onClick={actions?.onCharacterSelectionPress}
        />
      )}
      {actions && (
        <Button
          label=">"
          onClick={actions.onNextCharacterPress}
          className="size-8"
        />
      )}
    </div>
  </div>
);

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
