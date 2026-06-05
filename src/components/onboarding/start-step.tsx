import { Fragment, useRef, useState } from "react";
import { socket } from "@/utils/socket";
import {
  isBooleanParameterKey,
  isNumberParameterKey,
  isParameterKey,
  type Requests,
  type Room,
  type RoomPlayer,
} from "@/shared/api";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { Person } from "@/icons/person";
import { CardImage, CardType } from "../board/card";
import { cn } from "@/utils/cn";
import { usePromptContext } from "../board/contexts/prompt-context";
import { Crown } from "@/icons/crown";
import { Pile } from "../board/pile";
import { DeckConfigPopup, type DeckTypes } from "./deck-config-popup";

interface StartStepProps {
  room: Room;
  me: RoomPlayer;
}

export const StartStep = ({ room, me }: StartStepProps) => {
  const { gameParameters } = room;
  const { toast } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();
  const loadGameInputRef = useRef<HTMLInputElement>(null);
  const loadParametersInputRef = useRef<HTMLInputElement>(null);
  const [deckPilePopup, setDeckPilePopup] = useState<DeckTypes | null>(null);

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
      if (response.status === 400)
        toast("error", "Failed to change game parameter", response.error);
    });
  };

  const requestStart = async () => {
    socket.emit("start", (response) => {
      if (response.status === 400)
        toast("error", "Failed to start game", response.error);
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
        toast("error", "Failed to load game", "Could not read selected file");
        return;
      }

      socket.emit("loadGame", logs, (response) => {
        if (response.status === 400)
          toast("error", "Failed to load game", response.error);
      });
    };

    reader.onerror = () => {
      toast("error", "Failed to load game", "Could not read selected file");
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

      socket.emit("loadGameParameters", settings, (response) => {
        if (response.status === 200) {
          toast("success", "Load parameters", "Game parameters loaded");
        } else {
          toast("error", "Load parameters", response.error);
        }
      });
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

  const onResetPress = () => {
    socket.emit("resetGameParameters", (response) => {
      if (response.status === 400)
        toast("error", "Failed to reset game settings", response.error);
    });
  };

  const onNextCharacterPress = () => {
    const currentIndex = room.characters.findIndex(
      (character) => character.character === me.character.character,
    );
    const nextIndex = (currentIndex + 1) % room.characters.length;
    const nextCharacter = room.characters[nextIndex];

    socket.emit("selectCharacter", { character: nextCharacter }, (response) => {
      if (response.status === 400)
        toast("error", "Failed to select character", response.error);
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
        if (response.status === 400)
          toast("error", "Failed to select character", response.error);
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
            if (response.status === 400)
              toast("error", "Failed to select character", response.error);
          },
        );
        removePrompt("character-selection");
      },
      onCancel: () => {
        removePrompt("character-selection");
      },
    });
  };

  const onKickPlayerPress = (player: RoomPlayer) => {
    socket.emit("kickFromRoom", { name: player.name }, (response) => {
      if (response.status === 400)
        toast("error", "Failed to kick player", response.error);
    });
  };

  const onLeaveRoomPress = () => {
    socket.emit("leaveRoom", (response) => {
      if (response.status === 400)
        toast("error", "Failed to leave room", response.error);
    });
  };

  const playerSlots = Array.from({ length: 3 }).map<RoomPlayer | undefined>(
    (_, index) => room.players[index] ?? undefined,
  );

  return (
    <div className="grid h-full grid-rows-[270px_calc(100vh-270px-3em)] gap-4 p-4 max-lg:grid-rows-none">
      <div className="flex place-items-center justify-between gap-18 rounded-lg border-2 border-space-400 bg-space p-6 max-lg:flex-col max-lg:py-16">
        <div className="flex flex-col gap-2">
          <p className="font-main text-lg">Room</p>
          <p
            className="mb-2 cursor-pointer text-3xl font-bold"
            onClick={() => {
              navigator.clipboard.writeText(room.id);
              toast("success", "Copied code", "Code copied to clipboard");
            }}>
            {room.id}
          </p>
          <Button
            label="Copy link"
            hotkey="c"
            onClick={() => {
              const currentUrl = new URL(window.location.href);
              const link = new URL(`/?code=${room.id}`, currentUrl.origin);
              navigator.clipboard.writeText(link.toString());
              toast("success", "Copied link", "Link copied to clipboard");
            }}
            theme="onSpace"
          />
        </div>

        <div className="mb-3 flex gap-6 max-sm:flex-col">
          <PlayerCard
            player={me}
            actions={{
              onPreviousCharacterPress,
              onNextCharacterPress,
              onCharacterSelectionPress,
            }}
            bottomButton={{
              label: "Leave",
              onClick: onLeaveRoomPress,
            }}
            index={1}
            isHost={me.isHost}
          />
          {playerSlots.map((player, index) => (
            <PlayerCard
              key={index}
              player={player}
              bottomButton={
                player && me.isHost
                  ? {
                      label: "Kick",
                      onClick: () => onKickPlayerPress(player),
                    }
                  : undefined
              }
              index={index + 2}
              isHost={player?.isHost ?? false}
            />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Button
            onClick={requestStart}
            hotkey="enter"
            label="Start"
            className="p-4 px-8 font-alt-stats text-lg"
            disabled={!me.isHost}
            theme="onSpace"
            tooltip={{
              title: "Cannot start the game",
              capable: me.isHost ? true : "Only the host can start the game",
            }}
          />
          {me.isHost && (
            <>
              <Button
                onClick={onLoadGamePress}
                label="Load game"
                className="w-full"
                theme="onSpace"
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
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-[auto_1fr] place-items-center gap-18 rounded-lg border-2 border-space-400 bg-space p-6 max-lg:grid-cols-1 max-lg:pt-16">
        <div className="h-full overflow-auto pr-6 max-sm:pr-0">
          <h2 className="font-main text-2xl font-bold">Game parameters</h2>
          <div className="mt-4 mb-16 flex gap-4">
            <Button
              onClick={onSaveParametersPress}
              label="Save"
              className="flex-1"
              theme="onSpace"
            />
            <Button
              onClick={onResetPress}
              label="Reset"
              className="flex-1"
              theme="onSpace"
              disabled={!me.isHost}
              tooltip={{
                title: "Cannot reset game settings",
                capable: me.isHost
                  ? true
                  : "Only the host can reset game settings",
              }}
            />
            <Button
              onClick={onLoadParametersPress}
              label="Load"
              className="flex-1"
              theme="onSpace"
              disabled={!me.isHost}
              tooltip={{
                title: "Cannot load game settings",
                capable: me.isHost
                  ? true
                  : "Only the host can load game settings",
              }}
            />
          </div>
          <div className="grid grid-cols-[auto_auto] items-center gap-x-12 gap-y-6">
            {Object.keys(gameParameters)
              .filter(isParameterKey)
              .map((parameter) => (
                <Fragment key={parameter}>
                  {isBooleanParameterKey(parameter) ? (
                    <>
                      <p>{gameParameters[parameter].text}</p>
                      <BooleanInput
                        value={gameParameters[parameter].value}
                        onChange={(value) => {
                          onChangeGameParameter({
                            parameter: parameter,
                            value,
                          });
                        }}
                        disabled={!me.isHost}
                      />
                    </>
                  ) : (
                    isNumberParameterKey(parameter) && (
                      <>
                        <p>{gameParameters[parameter].text}</p>
                        <NumericInput
                          value={gameParameters[parameter].value}
                          onChange={(value) => {
                            onChangeGameParameter({
                              parameter: parameter,
                              value,
                            });
                          }}
                          disabled={!me.isHost}
                        />
                      </>
                    )
                  )}
                </Fragment>
              ))}
          </div>
        </div>

        <div className="flex h-full w-full flex-col place-items-center gap-24 overflow-auto py-[10vh] pt-[calc(50vh-400px)] max-lg:pt-4">
          <div className="grid grid-cols-[auto_auto] items-center gap-x-12 gap-y-6">
            <p>{gameParameters.decksConfig.useBonusSouls.text}</p>
            <BooleanInput
              value={gameParameters.decksConfig.useBonusSouls.value}
              onChange={(value) =>
                onChangeGameParameter({
                  parameter: "decksConfig",
                  value: {
                    useBonusSouls: {
                      text: gameParameters.decksConfig.useBonusSouls.text,
                      value,
                    },
                  },
                })
              }
              disabled={!me.isHost}
            />
            {gameParameters.decksConfig.useRooms && (
              <>
                <p>{gameParameters.decksConfig.useRooms.text}</p>
                <BooleanInput
                  value={gameParameters.decksConfig.useRooms.value}
                  onChange={(value) =>
                    onChangeGameParameter({
                      parameter: "decksConfig",
                      value: {
                        useRooms: {
                          text: gameParameters.decksConfig.useRooms!.text,
                          value,
                        },
                      },
                    })
                  }
                  disabled={!me.isHost}
                />
              </>
            )}
            {gameParameters.decksConfig.nbPlayerCardRestriction && (
              <>
                <div className="flex items-center gap-2">
                  <p>
                    {gameParameters.decksConfig.nbPlayerCardRestriction.text}
                  </p>
                  <Button
                    label="?"
                    tooltip={{
                      title: "Number player card restriction",
                      content:
                        "Some cards are only available when there are 3 players or more.\nTurn it off if you want to play with these cards despite the minimum player requirement not being met.",
                      enabled: true,
                    }}
                    className="size-8 cursor-help rounded-full text-sm shadow-sm"
                    theme="onSpace"
                  />
                </div>
                <BooleanInput
                  value={
                    gameParameters.decksConfig.nbPlayerCardRestriction.value
                  }
                  onChange={(value) =>
                    onChangeGameParameter({
                      parameter: "decksConfig",
                      value: {
                        nbPlayerCardRestriction: {
                          text: gameParameters.decksConfig
                            .nbPlayerCardRestriction!.text,
                          value,
                        },
                      },
                    })
                  }
                  disabled={!me.isHost}
                />
              </>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-24 gap-y-16 max-xl:gap-x-16">
            <DeckPile
              type={CardType.CharacterCard}
              label="Characters"
              count={gameParameters.decksConfig.character.total}
              onClick={() => setDeckPilePopup(CardType.CharacterCard)}
            />
            <DeckPile
              type={CardType.TreasureCard}
              label="Treasures"
              count={gameParameters.decksConfig.treasure.total}
              onClick={() => setDeckPilePopup(CardType.TreasureCard)}
            />
            <DeckPile
              type={CardType.LootCard}
              label="Loots"
              count={gameParameters.decksConfig.loot.total}
              onClick={() => setDeckPilePopup(CardType.LootCard)}
            />
            <DeckPile
              type={CardType.MonsterCard}
              label="Monsters"
              count={gameParameters.decksConfig.monster.total}
              onClick={() => setDeckPilePopup(CardType.MonsterCard)}
            />
            {gameParameters.decksConfig.bsoul && (
              <DeckPile
                type={CardType.BonusSoul}
                label="Bonus Souls"
                count={gameParameters.decksConfig.bsoul.total}
                onClick={() => setDeckPilePopup(CardType.BonusSoul)}
              />
            )}
            {gameParameters.decksConfig.room && (
              <DeckPile
                type={CardType.RoomCard}
                label="Rooms"
                count={gameParameters.decksConfig.room.total}
                onClick={() => setDeckPilePopup(CardType.RoomCard)}
              />
            )}
          </div>
        </div>
      </div>
      {deckPilePopup && gameParameters.decksConfig[deckPilePopup] && (
        <DeckConfigPopup
          type={deckPilePopup}
          cards={gameParameters.decksConfig[deckPilePopup].cards}
          onPressBackdrop={() => setDeckPilePopup(null)}
          editable={me.isHost}
        />
      )}
    </div>
  );
};

const DeckPile = ({
  type,
  count,
  label,
  onClick,
}: {
  type: CardType;
  label: string;
  count: number;
  onClick: () => void;
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <Pile
        topCardClassName={cn(
          count === 0 &&
            "bg-space-500/30 inset-shadow-sm inset-shadow-black shadow-none",
        )}
        cards={Array.from({ length: count }).map(() => type)}
        orientation={type === CardType.RoomCard ? "landscape" : "portrait"}
        onClickTopCard={onClick}
      />
      <p className="text-center font-main">{`${label} (${count})`}</p>
    </div>
  );
};

const PlayerCard = ({
  player,
  actions,
  bottomButton,
  index,
  isHost,
}: {
  player?: RoomPlayer;
  actions?: {
    onPreviousCharacterPress: () => void;
    onNextCharacterPress: () => void;
    onCharacterSelectionPress: () => void;
  };
  bottomButton?: {
    label: string;
    onClick: () => void;
  };
  index: number;
  isHost: boolean;
}) => (
  <div className="flex shrink-0 flex-col items-center gap-1">
    <div
      className="flex h-8 items-center gap-1 font-bold"
      title={isHost ? `${player?.name} is the host` : undefined}>
      {player && (
        <>
          {isHost ? (
            <Crown className="size-4" />
          ) : (
            <Person className="size-4" />
          )}
          {player.name ?? "Joining..."}
        </>
      )}
    </div>
    {player ? (
      <div className="flex items-center gap-1">
        {actions && (
          <Button
            label="<"
            onClick={actions.onPreviousCharacterPress}
            className="size-8"
            theme="onSpace"
          />
        )}
        {player.character.character === "random" ? (
          <div className="grid items-center gap-2">
            <CardImage
              card={CardType.CharacterCard}
              className={cn(
                "col-start-1 row-start-1 h-32 shadow-lg/30",
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
              "h-32 shadow-lg/30",
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
            theme="onSpace"
          />
        )}
      </div>
    ) : (
      <div className="aspect-750/1024 h-32 place-content-center rounded-md bg-space-500/30 inset-shadow-sm inset-shadow-black">
        <p className="text-center text-6xl font-bold text-space-400/30">
          {index}
        </p>
      </div>
    )}
    {bottomButton && (
      <Button
        label={bottomButton.label}
        onClick={bottomButton.onClick}
        theme="onSpace"
      />
    )}
  </div>
);

const NumericInput = ({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) => {
  return (
    <div className="flex items-center justify-end">
      <Button
        onClick={() => onChange(value - 1)}
        label="−"
        className="rounded-r-none font-sans font-bold shadow-none"
        theme="onSpace"
        disabled={disabled}
        tooltip={{
          title: "Cannot change game parameters",
          capable: disabled ? "Only the host can change game parameters" : true,
        }}
      />
      <p className="flex h-10 min-w-13 items-center justify-center border-y-2 border-space-500 text-center font-bold">
        {value}
      </p>
      <Button
        onClick={() => onChange(value + 1)}
        label="+"
        className="rounded-l-none font-sans font-bold shadow-none"
        theme="onSpace"
        disabled={disabled}
        tooltip={{
          title: "Cannot change game parameters",
          capable: disabled ? "Only the host can change game parameters" : true,
        }}
      />
    </div>
  );
};

const BooleanInput = ({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
}) => {
  return (
    <Button
      onClick={() => onChange(!value)}
      label={value ? "On" : "Off"}
      active={value}
      className={cn(
        "font-sans font-bold",
        !value && !disabled && "text-space/40",
      )}
      theme="onSpace"
      disabled={disabled}
      tooltip={{
        title: "Cannot toggle game parameters",
        capable: disabled ? "Only the host can toggle game parameters" : true,
      }}
    />
  );
};
