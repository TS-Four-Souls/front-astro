import { Copy } from "@/icons/copy";
import { Crown } from "@/icons/crown";
import { Person } from "@/icons/person";
import { TeamIcon } from "@/icons/team-icon";
import {
  isBooleanParameterKey,
  isNumberParameterKey,
  isParameterKey,
  Team,
  type Requests,
  type Room,
  type RoomPlayer,
  type SelectionItem,
} from "@/shared/api";
import { cn } from "@/utils/cn";
import { socket } from "@/utils/socket";
import { Fragment, useRef, useState } from "react";
import { CardImage, CardType } from "../board/card";
import { usePromptContext } from "../board/contexts/prompt-context";
import { useToastContext } from "../board/contexts/toast-context";
import { Pile } from "../board/pile";
import { useTooltip } from "../board/use-tooltip";
import { Button } from "../button";
import { DeckConfigPopup, type DeckTypes } from "./deck-config-popup";
import { useLanguageContext } from "../contexts/language-context";

interface StartStepProps {
  room: Room;
}

export const StartStep = ({ room }: StartStepProps) => {
  const { ts, t, translateError } = useLanguageContext();
  const { gameParameters } = room;
  const { toast } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();
  const loadGameInputRef = useRef<HTMLInputElement>(null);
  const loadParametersInputRef = useRef<HTMLInputElement>(null);
  const [deckPilePopup, setDeckPilePopup] = useState<DeckTypes | null>(null);

  const isHost = room.players.some((player) => player.isMe && player.isHost);

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
        toast(
          "error",
          t("startStep.gameParams.inputs.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  const requestStart = async () => {
    socket.emit("start", (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("startStep.startButton.errorToast.title"),
          translateError(response.error),
        );
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
        toast(
          "error",
          t("startStep.loadButton.errorToast.title"),
          t("startStep.loadButton.errorToast.readErrorMessage"),
        );
        return;
      }

      socket.emit("loadGame", logs, (response) => {
        if (response.status === 400)
          toast(
            "error",
            t("startStep.loadButton.errorToast.title"),
            translateError(response.error),
          );
      });
    };

    reader.onerror = () => {
      toast(
        "error",
        t("startStep.loadButton.errorToast.title"),
        t("startStep.loadButton.errorToast.readErrorMessage"),
      );
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
        toast(
          "error",
          t("startStep.gameParams.loadButton.errorToast.title"),
          t("startStep.gameParams.loadButton.errorToast.readErrorMessage"),
        );
        return;
      }

      socket.emit("loadGameParameters", settings, (response) => {
        if (response.status === 200) {
          toast(
            "success",
            t("startStep.gameParams.loadButton.successToast.title"),
            t("startStep.gameParams.loadButton.successToast.message"),
          );
        } else {
          toast(
            "error",
            t("startStep.gameParams.loadButton.errorToast.title"),
            translateError(response.error),
          );
        }
      });
    };

    reader.onerror = () => {
      toast(
        "error",
        t("startStep.gameParams.loadButton.errorToast.title"),
        t("startStep.gameParams.loadButton.errorToast.readErrorMessage"),
      );
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
    toast(
      "success",
      t("startStep.gameParams.saveButton.successToast.title"),
      t("startStep.gameParams.saveButton.successToast.message", {
        filename: filename,
      }),
    );
  };

  const onResetPress = () => {
    socket.emit("resetGameParameters", (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("startStep.gameParams.resetButton.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  const onKickPlayerPress = (player: RoomPlayer) => {
    socket.emit("kickFromRoom", { name: player.name }, (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("startStep.playerList.kickButton.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  const onAddCopyPress = () => {
    const promptId = "add-copy";
    const options: Extract<SelectionItem, { type: "string" }>[] =
      room.players.flatMap((player) => {
        if (player.isCopy) return [];
        return {
          type: "string",
          payload: player.name,
        };
      });

    if (options.length === 0) {
      return;
    }

    if (options.length === 1) {
      socket.emit(
        "makeCopyOfPlayer",
        { name: options[0].payload },
        (response) => {
          switch (response.status) {
            case 400:
              toast(
                "error",
                t("startStep.playerList.addCopyButton.errorToast.title"),
                translateError(response.error),
              );
              break;
          }
        },
      );
      return;
    }

    addPrompt({
      promptId,
      isUnique: false,
      prompt: t("startStep.playerList.addCopyButton.popup.title"),
      options,
      minCount: 1,
      maxCount: 1,
      onCancel: () => {
        removePrompt(promptId);
      },
      onSubmit: (selectedOptions) => {
        socket.emit(
          "makeCopyOfPlayer",
          { name: selectedOptions[0].payload },
          (response) => {
            switch (response.status) {
              case 400:
                toast(
                  "error",
                  t("startStep.playerList.addCopyButton.errorToast.title"),
                  translateError(response.error),
                );
                break;
              case 200:
                removePrompt(promptId);
                break;
            }
          },
        );
      },
    });
  };

  const onLeaveRoomPress = () => {
    socket.emit("leaveRoom", (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("startStep.playerList.leaveButton.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  const onTeamSelectionPress = (user: RoomPlayer, team: Team) => {
    socket.emit("setTeam", { name: user.name, team }, (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("startStep.playerList.teams.joinTeamButton.errorToast.title"),
          translateError(response.error),
        );
    });
  };

  const onCharacterSelectionPress = (user: RoomPlayer) => {
    addPrompt({
      promptId: "character-selection",
      isUnique: false,
      prompt: t("startStep.playerList.selectCharacterButton.popup.title"),
      options: room.characters.map((character) => ({
        type: "character",
        payload: character,
      })),
      minCount: 1,
      maxCount: 1,
      onSubmit: (selectedOptions) => {
        socket.emit(
          "selectCharacter",
          { name: user.name, character: selectedOptions[0].payload },
          (response) => {
            if (response.status === 400)
              toast(
                "error",
                t(
                  "startStep.playerList.selectCharacterButton.errorToast.title",
                ),
                translateError(response.error),
              );
          },
        );
        removePrompt("character-selection");
      },
      onCancel: () => {
        removePrompt("character-selection");
      },
    });
  };

  const playerSlots = Array.from({ length: 4 }).map<RoomPlayer | undefined>(
    (_, index) => room.players[index] ?? undefined,
  );

  return (
    <div className="grid h-full grid-rows-[300px_calc(100vh-300px-3em)] gap-4 p-4 max-[85rem]:grid-rows-none">
      <div className="flex place-items-center justify-between gap-18 rounded-lg border-2 border-space-400 bg-space p-6 max-[85rem]:flex-col max-[85rem]:py-16">
        <div className="flex flex-col gap-2">
          <p className="font-main text-lg">{t("startStep.roomInfo.title")}</p>
          <p
            className="mb-2 cursor-pointer text-3xl font-bold"
            onClick={() => {
              navigator.clipboard.writeText(room.id);
              toast(
                "success",
                t("startStep.roomInfo.copyCodeButton.successToast.title"),
                t("startStep.roomInfo.copyCodeButton.successToast.message"),
              );
            }}>
            {t("startStep.roomInfo.copyCodeButton.label", { code: room.id })}
          </p>
          <Button
            label={t("startStep.roomInfo.copyLinkButton.label")}
            hotkey="c"
            onClick={() => {
              const currentUrl = new URL(window.location.href);
              const link = new URL(`/?code=${room.id}`, currentUrl.origin);
              navigator.clipboard.writeText(link.toString());
              toast(
                "success",
                t("startStep.roomInfo.copyLinkButton.successToast.title"),
                t("startStep.roomInfo.copyLinkButton.successToast.message"),
              );
            }}
            theme="onSpace"
          />
        </div>

        <div className="flex place-items-center gap-8 max-[60rem]:flex-col">
          <div className="mb-2 flex gap-8 max-[60rem]:flex-col">
            {playerSlots.map((player, index) => (
              <PlayerCard
                key={index}
                player={player}
                actions={
                  player?.isMe
                    ? {
                        onTeamSelectionPress: (team: Team) =>
                          onTeamSelectionPress(player, team),
                        onCharacterSelectionPress: () =>
                          onCharacterSelectionPress(player),
                      }
                    : undefined
                }
                bottomButton={
                  player && (isHost || (player.isMe && !player.isCopy))
                    ? {
                        label: player.isCopy
                          ? t("startStep.playerList.removeButton.label")
                          : player.isMe
                            ? t("common.leaveButton")
                            : t("startStep.playerList.kickButton.label"),
                        onClick: () => {
                          if (player.isMe && !player.isCopy) {
                            onLeaveRoomPress();
                          } else {
                            onKickPlayerPress(player);
                          }
                        },
                      }
                    : undefined
                }
                index={index + 1}
              />
            ))}
          </div>
          {isHost && (
            <Button
              hotkey="a"
              label={t("startStep.playerList.addCopyButton.label")}
              onClick={onAddCopyPress}
              theme="onSpace"
              disabled={room.players.length >= 4}
            />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <Button
            onClick={requestStart}
            hotkey="enter"
            label={t("startStep.startButton.label")}
            className="p-4 px-8 text-lg"
            disabled={!isHost}
            theme="onSpace"
            tooltip={{
              title: t("startStep.startButton.nonHostTooltip.title"),
              content: t("startStep.startButton.nonHostTooltip.message"),
              enabled: !isHost,
            }}
          />
          {isHost && (
            <>
              <Button
                onClick={onLoadGamePress}
                hotkey="l"
                label={t("startStep.loadButton.label")}
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
          <h2 className="font-main text-2xl font-bold">
            {t("startStep.gameParams.title")}
          </h2>
          <div className="mt-4 mb-16 flex gap-4">
            <Button
              onClick={onSaveParametersPress}
              label={t("startStep.gameParams.saveButton.label")}
              className="flex-1"
              theme="onSpace"
            />
            <Button
              onClick={onResetPress}
              label={t("startStep.gameParams.resetButton.label")}
              className="flex-1"
              theme="onSpace"
              disabled={!isHost}
              tooltip={{
                title: t(
                  "startStep.gameParams.resetButton.nonHostTooltip.title",
                ),
                content: t(
                  "startStep.gameParams.resetButton.nonHostTooltip.message",
                ),
                enabled: !isHost,
              }}
            />
            <Button
              onClick={onLoadParametersPress}
              label={t("startStep.gameParams.loadButton.label")}
              className="flex-1"
              theme="onSpace"
              disabled={!isHost}
              tooltip={{
                title: t(
                  "startStep.gameParams.loadButton.nonHostTooltip.title",
                ),
                content: t(
                  "startStep.gameParams.loadButton.nonHostTooltip.message",
                ),
                enabled: !isHost,
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
                      <p>{ts(gameParameters[parameter].translationKey)}</p>
                      <BooleanInput
                        value={gameParameters[parameter].value}
                        onChange={(value) => {
                          onChangeGameParameter({
                            parameter: parameter,
                            value,
                          });
                        }}
                        disabled={!isHost}
                      />
                    </>
                  ) : (
                    isNumberParameterKey(parameter) && (
                      <>
                        <p>{ts(gameParameters[parameter].translationKey)}</p>
                        <NumericInput
                          value={gameParameters[parameter].value}
                          replaceZeroWith={
                            gameParameters[parameter].replaceZeroWith
                          }
                          onChange={(value) => {
                            onChangeGameParameter({
                              parameter: parameter,
                              value,
                            });
                          }}
                          disabled={!isHost}
                        />
                      </>
                    )
                  )}
                </Fragment>
              ))}
          </div>
        </div>

        <div className="flex h-full w-full flex-col place-content-center-safe place-items-center gap-24 overflow-auto max-lg:pt-4">
          <div className="grid grid-cols-[auto_auto] items-center gap-x-12 gap-y-6">
            <p>{ts(gameParameters.decksConfig.useBonusSouls.translationKey)}</p>
            <BooleanInput
              value={gameParameters.decksConfig.useBonusSouls.value}
              onChange={(value) =>
                onChangeGameParameter({
                  parameter: "decksConfig",
                  value: {
                    useBonusSouls: {
                      text: gameParameters.decksConfig.useBonusSouls.text,
                      translationKey:
                        gameParameters.decksConfig.useBonusSouls.translationKey,
                      value,
                    },
                  },
                })
              }
              disabled={!isHost}
            />
            {gameParameters.decksConfig.useRooms && (
              <>
                <p>{ts(gameParameters.decksConfig.useRooms.translationKey)}</p>
                <BooleanInput
                  value={gameParameters.decksConfig.useRooms.value}
                  onChange={(value) =>
                    onChangeGameParameter({
                      parameter: "decksConfig",
                      value: {
                        useRooms: {
                          text: gameParameters.decksConfig.useRooms!.text,
                          translationKey:
                            gameParameters.decksConfig.useRooms!.translationKey,
                          value,
                        },
                      },
                    })
                  }
                  disabled={!isHost}
                />
              </>
            )}
            {gameParameters.decksConfig.nbPlayerCardRestriction && (
              <>
                <div className="flex items-center gap-2">
                  <p>
                    {ts(
                      gameParameters.decksConfig.nbPlayerCardRestriction
                        .translationKey,
                    )}
                  </p>
                  <Button
                    label={t("startStep.gameParams.helpButton.label")}
                    tooltip={{
                      title: ts(
                        gameParameters.decksConfig.nbPlayerCardRestriction
                          .translationKey,
                      ),
                      content: t(
                        "startStep.gameParams.helpButton.nbPlayerCardRestriction",
                      ),
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
                          translationKey:
                            gameParameters.decksConfig.nbPlayerCardRestriction!
                              .translationKey,
                          value,
                        },
                      },
                    })
                  }
                  disabled={!isHost}
                />
              </>
            )}
            {gameParameters.decksConfig.useFSP2Cards && (
              <>
                <div className="flex items-center gap-2">
                  <p>
                    {ts(gameParameters.decksConfig.useFSP2Cards.translationKey)}
                  </p>
                  <Button
                    label={t("startStep.gameParams.helpButton.label")}
                    tooltip={{
                      title: ts(
                        gameParameters.decksConfig.useFSP2Cards.translationKey,
                      ),
                      content: t(
                        "startStep.gameParams.helpButton.useFSP2Cards",
                      ),
                      enabled: true,
                    }}
                    className="size-8 cursor-help rounded-full text-sm shadow-sm"
                    theme="onSpace"
                  />
                </div>
                <BooleanInput
                  value={gameParameters.decksConfig.useFSP2Cards.value}
                  onChange={(value) =>
                    onChangeGameParameter({
                      parameter: "decksConfig",
                      value: {
                        useFSP2Cards: {
                          text: gameParameters.decksConfig.useFSP2Cards!.text,
                          translationKey:
                            gameParameters.decksConfig.useFSP2Cards!
                              .translationKey,
                          value,
                        },
                      },
                    })
                  }
                  disabled={!isHost}
                />
              </>
            )}
            {gameParameters.decksConfig.useG2Cards && (
              <>
                <div className="flex items-center gap-2">
                  <p>
                    {ts(gameParameters.decksConfig.useG2Cards.translationKey)}
                  </p>
                  <Button
                    label={t("startStep.gameParams.helpButton.label")}
                    tooltip={{
                      title: ts(
                        gameParameters.decksConfig.useG2Cards.translationKey,
                      ),
                      content: t("startStep.gameParams.helpButton.useG2Cards"),
                      enabled: true,
                    }}
                    className="size-8 cursor-help rounded-full text-sm shadow-sm"
                    theme="onSpace"
                  />
                </div>
                <BooleanInput
                  value={gameParameters.decksConfig.useG2Cards.value}
                  onChange={(value) =>
                    onChangeGameParameter({
                      parameter: "decksConfig",
                      value: {
                        useG2Cards: {
                          text: gameParameters.decksConfig.useG2Cards!.text,
                          translationKey:
                            gameParameters.decksConfig.useG2Cards!
                              .translationKey,
                          value,
                        },
                      },
                    })
                  }
                  disabled={!isHost}
                />
              </>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-24 gap-y-16 max-xl:gap-x-16">
            <DeckPile
              type={CardType.CharacterCard}
              label={t("startStep.gameParams.decks.characters")}
              count={gameParameters.decksConfig.character.total}
              onClick={() => setDeckPilePopup(CardType.CharacterCard)}
            />
            <DeckPile
              type={CardType.TreasureCard}
              label={t("startStep.gameParams.decks.treasures")}
              count={gameParameters.decksConfig.treasure.total}
              onClick={() => setDeckPilePopup(CardType.TreasureCard)}
            />
            <DeckPile
              type={CardType.LootCard}
              label={t("startStep.gameParams.decks.loots")}
              count={gameParameters.decksConfig.loot.total}
              onClick={() => setDeckPilePopup(CardType.LootCard)}
            />
            <DeckPile
              type={CardType.MonsterCard}
              label={t("startStep.gameParams.decks.monsters")}
              count={gameParameters.decksConfig.monster.total}
              onClick={() => setDeckPilePopup(CardType.MonsterCard)}
            />
            {gameParameters.decksConfig.bsoul && (
              <DeckPile
                type={CardType.BonusSoul}
                label={t("startStep.gameParams.decks.bonusSouls")}
                count={gameParameters.decksConfig.bsoul.total}
                onClick={() => setDeckPilePopup(CardType.BonusSoul)}
              />
            )}
            {gameParameters.decksConfig.room && (
              <DeckPile
                type={CardType.RoomCard}
                label={t("startStep.gameParams.decks.rooms")}
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
          onClose={() => setDeckPilePopup(null)}
          editable={isHost}
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
}: {
  player?: RoomPlayer;
  actions?: {
    onCharacterSelectionPress: () => void;
    onTeamSelectionPress: (team: Team) => void;
  };
  bottomButton?: {
    label: string;
    onClick: () => void;
  };
  index: number;
}) => {
  const { t } = useLanguageContext();
  const { setTooltip, closeTooltip } = useTooltip({
    title: t("startStep.playerList.selectCharacterButton.tooltip.title"),
    content: t("startStep.playerList.selectCharacterButton.tooltip.message"),
    enabled: actions?.onCharacterSelectionPress !== undefined,
  });

  return (
    <div className="flex shrink-0 flex-col items-center">
      <div
        className="mb-1 ml-10 flex h-8 items-center gap-1 font-bold"
        title={
          player?.isCopy
            ? t("startStep.playerList.hoverName.copy", {
                playerName: player.name,
              })
            : player?.isHost
              ? t("startStep.playerList.hoverName.host", {
                  playerName: player.name,
                })
              : undefined
        }>
        {player && (
          <>
            {player.isCopy ? (
              <Copy className="size-4" />
            ) : player.isHost ? (
              <Crown className="size-4" />
            ) : (
              <Person className="size-4" />
            )}
            {player.name}
          </>
        )}
      </div>
      {player ? (
        <div className="flex items-center gap-2">
          <div className="flex flex-col justify-center gap-1">
            <TeamButton
              team={Team.Team1}
              active={player.team === Team.Team1}
              onClick={actions?.onTeamSelectionPress}
              player={player}
            />
            <TeamButton
              team={Team.Team2}
              active={player.team === Team.Team2}
              onClick={actions?.onTeamSelectionPress}
              player={player}
            />
            <TeamButton
              team={Team.Team3}
              active={player.team === Team.Team3}
              onClick={actions?.onTeamSelectionPress}
              player={player}
            />
            <TeamButton
              onClick={actions?.onTeamSelectionPress}
              team={Team.Team4}
              active={player.team === Team.Team4}
              player={player}
            />
          </div>
          <div onMouseEnter={setTooltip} onMouseLeave={closeTooltip}>
            {player.character.character === "random" ? (
              <div className="grid items-center gap-2">
                <CardImage
                  card={CardType.CharacterCard}
                  sizes="7em"
                  className={cn(
                    "col-start-1 row-start-1 w-28 shadow-lg/30",
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
                sizes="7em"
                className={cn("w-28 shadow-lg/30", actions && "cursor-pointer")}
                onClick={actions?.onCharacterSelectionPress}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="aspect-750/1024 w-28 place-content-center rounded-md bg-space-500/30 inset-shadow-sm inset-shadow-black">
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
          className="mt-2 ml-10"
        />
      )}
    </div>
  );
};

const TeamButton = ({
  team,
  active,
  onClick,
  player,
}: {
  team: Team;
  active: boolean;
  onClick?: (team: Team) => void;
  player: RoomPlayer;
}) => {
  const { t } = useLanguageContext();
  const isDisabled = onClick === undefined;

  const teamNames: Record<Team, string> = {
    [Team.Team1]: t("common.teams.heart"),
    [Team.Team2]: t("common.teams.coin"),
    [Team.Team3]: t("common.teams.pill"),
    [Team.Team4]: t("common.teams.bomb"),
  };
  return (
    <Button
      onClick={() => onClick?.(team)}
      label={<TeamIcon team={team} className="size-5 shrink-0" />}
      active={active}
      tooltip={{
        title: t("common.currentTeam", { team: teamNames[team] }),
        content:
          active && player.isMe
            ? t("startStep.playerList.teams.hoverSelfSelected", {
                team: teamNames[team],
              })
            : active
              ? t("startStep.playerList.teams.hoverPlayerSelected", {
                  player: player.name,
                  team: teamNames[team],
                })
              : t("startStep.playerList.teams.joinTeamButton.label"),
        enabled: player.isMe || active,
      }}
      theme="onSpace"
      className={cn(
        "size-8",
        isDisabled &&
          (active ? "opacity-100 filter-none" : "opacity-20 filter-none"),
      )}
      disabled={isDisabled}
    />
  );
};

const NumericInput = ({
  value,
  replaceZeroWith,
  onChange,
  disabled,
}: {
  value: number;
  replaceZeroWith: string | undefined;
  onChange: (value: number) => void;
  disabled: boolean;
}) => {
  const { t } = useLanguageContext();
  return (
    <div className="flex items-center justify-end">
      <Button
        onClick={() => onChange(value - 1)}
        label={t("startStep.gameParams.inputs.numeric.decreaseButton")}
        className="rounded-r-none font-sans font-bold shadow-none"
        theme="onSpace"
        disabled={disabled}
        tooltip={{
          title: t("startStep.gameParams.inputs.numeric.nonHostTooltip.title"),
          content: t(
            "startStep.gameParams.inputs.numeric.nonHostTooltip.message",
          ),
          enabled: disabled,
        }}
      />
      <p className="flex h-10 min-w-13 items-center justify-center border-y-2 border-space-500 text-center font-bold">
        {value === 0 && replaceZeroWith !== undefined ? replaceZeroWith : value}
      </p>
      <Button
        onClick={() => onChange(value + 1)}
        label={t("startStep.gameParams.inputs.numeric.increaseButton")}
        className="rounded-l-none font-sans font-bold shadow-none"
        theme="onSpace"
        disabled={disabled}
        tooltip={{
          title: t("startStep.gameParams.inputs.numeric.nonHostTooltip.title"),
          content: t(
            "startStep.gameParams.inputs.numeric.nonHostTooltip.message",
          ),
          enabled: disabled,
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
  const { t } = useLanguageContext();
  return (
    <Button
      onClick={() => onChange(!value)}
      label={
        value
          ? t("startStep.gameParams.inputs.boolean.enableButton")
          : t("startStep.gameParams.inputs.boolean.disableButton")
      }
      active={value}
      className={cn(
        "font-sans font-bold",
        !value && !disabled && "text-space/40",
      )}
      theme="onSpace"
      disabled={disabled}
      tooltip={{
        title: t("startStep.gameParams.inputs.boolean.nonHostTooltip.title"),
        content: t(
          "startStep.gameParams.inputs.boolean.nonHostTooltip.message",
        ),
        enabled: disabled,
      }}
    />
  );
};
