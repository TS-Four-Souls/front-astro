import { HotkeyScope } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { Button } from "../button";
import { ReportBugButton } from "../onboarding-layout";
import { translateError, t } from "../translation/translate";
import { useGameContext } from "./contexts/game-context";
import { useMainMenuContext } from "./contexts/main-menu-context";
import { usePromptContext } from "./contexts/prompt-context";
import { useToastContext } from "./contexts/toast-context";
import { toSeriTrans } from "../translation/translate";

export const MainMenu = () => {
  const { addPrompt, removePrompt } = usePromptContext();
  const { toast } = useToastContext();
  const { closeMenu: closeMainMenu } = useMainMenuContext();
  const { parameters } = useGameContext();

  const onResetPress = () => {
    const promptId = `reset-confirm`;
    addPrompt({
      promptId,
      isUnique: false,
      prompt: t(toSeriTrans("front.confirmQuitGame")),
      options: [
        { type: "boolean", payload: true },
        { type: "boolean", payload: false },
      ],
      minCount: 1,
      maxCount: 1,
      onSubmit: (selectedOptions) => {
        if (selectedOptions[0].payload) {
          socket.emit("quitGame", (response) => {
            if (response.status === 200) {
              removePrompt(promptId);
            } else {
              toast("error", toSeriTrans("front.failQuitGame"), translateError(response.error));
            }
          });
        }
      },
      onCancel: () => {
        removePrompt(promptId);
      },
    });
  };

  const onSaveGamePress = () => {
    socket.emit("saveGame", (response) => {
      switch (response.status) {
        case 200:
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
          const filename = `four-souls_save_${datePart}_${timePart}.log`;

          const blob = new Blob([response.logs], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast("success", toSeriTrans("front.saveTitle"), toSeriTrans("front.saveMessage", { filename }));
          break;
        case 400:
          toast("error", toSeriTrans("front.failSaveGame"), translateError(response.error));
          break;
      }
    });
  };

  const debugGainLootTop = () => {
    socket.emit("debugLootTop", (response) => {
      if (response.status === 200) {
      } else {
        toast("error", toSeriTrans("front.failLoot"), translateError(response.error));
      }
    });
  };

  const debugGainTreasureTop = () => {
    socket.emit("debugGainTreasureTop", (response) => {
      if (response.status === 200) {
      } else {
        toast("error", toSeriTrans("front.failGainTreasure"), translateError(response.error));
      }
    });
  };

  const debugGainLoot = () => {
    socket.emit("debugListLoot", (response) => {
      switch (response.status) {
        case 200:
          const promptId = `debug-list-loot-${Date.now()}`;
          addPrompt({
            promptId,
            isUnique: false,
            prompt: t(toSeriTrans("front.selectCardToLoot"))
            ,
            options: response.cards.map((card) => ({
              type: "card",
              payload: card,
            })),
            minCount: 1,
            maxCount: 50,
            onSubmit: (selections) => {
              socket.emit(
                "debugLoot",
                {
                  cards: selections.map((selection) => selection.payload),
                },
                (response) => {
                  if (response.status === 200) {
                    removePrompt(promptId);
                  } else {
                    toast("error", toSeriTrans("front.failGainLootCards"), translateError(response.error));
                  }
                },
              );
            },
            onCancel: () => {
              removePrompt(promptId);
            },
          });
          break;
        case 400:
          toast("error", toSeriTrans("front.failListLoot"), translateError(response.error));
          break;
      }
    });
  };

  const debugGainTreasure = () => {
    socket.emit("debugListTreasure", (response) => {
      switch (response.status) {
        case 200:
          const promptId = `debug-list-treasure-${Date.now()}`;
          addPrompt({
            promptId,
            isUnique: false,
            prompt: t(toSeriTrans("front.selectTreasureToGain")),
            options: response.cards.map((card) => ({
              type: "card",
              payload: card,
            })),
            minCount: 1,
            maxCount: 50,
            onSubmit: (selections) => {
              socket.emit(
                "debugGainTreasure",
                {
                  cards: selections.map((selection) => selection.payload),
                },
                (response) => {
                  if (response.status === 200) {
                    removePrompt(promptId);
                  } else {
                    toast(
                      "error",
                      toSeriTrans("front.failGainTreasureCards"),
                      translateError(response.error),
                    );
                  }
                },
              );
            },
            onCancel: () => {
              removePrompt(promptId);
            },
          });
          break;
        case 400:
          toast("error", toSeriTrans("front.failListTreasure"), translateError(response.error));
          break;
      }
    });
  };

  const debugRemoveCard = () => {
    socket.emit("debugListCardsICanRemove", (response) => {
      switch (response.status) {
        case 200:
          const promptId = `debug-list-cards-i-can-remove-${Date.now()}`;
          addPrompt({
            promptId,
            isUnique: false,
            prompt: t(toSeriTrans("front.selectCardsToRemove")),
            options: response.cards.map((card) => ({
              type: "card",
              payload: card,
            })),
            minCount: 1,
            maxCount: 50,
            onSubmit: (selections) => {
              socket.emit(
                "debugRemoveCards",
                {
                  cards: selections.map((selection) => selection.payload),
                },
                (response) => {
                  if (response.status === 200) {
                    removePrompt(promptId);
                  } else {
                    toast("error", toSeriTrans("front.failRemoveCards"), translateError(response.error));
                  }
                },
              );
            },
            onCancel: () => {
              removePrompt(promptId);
            },
          });
          break;
        case 400:
          toast("error", toSeriTrans("front.failListRemovableCards"), translateError(response.error));
          break;
      }
    });
  };

  const debugGainCoins = () => {
    const promptId = `debug-gain-coins-${Date.now()}`;
    addPrompt({
      promptId,
      isUnique: false,
      prompt: t(toSeriTrans("front.selectAmountOfCoinsToGain")),
      options: Array.from({ length: 10 }, (_, i) => ({
        type: "number",
        payload: i + 1,
      })),
      minCount: 1,
      maxCount: 1,
      onSubmit: (selections) => {
        const coins = selections[0].payload as number;
        socket.emit(
          "debugGainCoins",
          {
            coins,
          },
          (response) => {
            if (response.status === 200) {
              removePrompt(promptId);
            } else {
              toast("error", toSeriTrans("front.failGainCoins"), translateError(response.error));
            }
          },
        );
      },
      onCancel: () => {
        removePrompt(promptId);
      },
    });
  };

  const debugPutMonsterCardInSlot = () => {
    socket.emit("debugListMonsterDeck", (response) => {
      switch (response.status) {
        case 200:
          const promptId = `debug-list-monster-deck-${Date.now()}`;
          addPrompt({
            promptId,
            isUnique: false,
            prompt: t(toSeriTrans("front.selectMonsterCardToPutInSlot")),
            options: response.cards.map((card) => ({
              type: "card",
              payload: card,
            })),
            minCount: 1,
            maxCount: 1,
            onSubmit: (selections) => {
              const card = selections[0].payload;
              removePrompt(promptId);

              const promptId2 = `debug-list-monster-cover-${Date.now()}`;
              addPrompt({
                promptId: promptId2,
                isUnique: false,
                prompt: t(toSeriTrans("front.selectCardToCover")),
                options: response.coverable.map((card) => ({
                  type: "card",
                  payload: card,
                })),
                minCount: 1,
                maxCount: 1,
                onSubmit: (selections2) => {
                  const toCover = selections2[0].payload;
                  socket.emit(
                    "debugPutMonsterCardInSlot",
                    {
                      card,
                      toCover,
                    },
                    (response) => {
                      if (response.status === 200) {
                        removePrompt(promptId2);
                      } else {
                        toast(
                          "error",
                          toSeriTrans("front.FailPutMonster"),
                          translateError(response.error),
                        );
                      }
                    },
                  );
                },
                onCancel: () => {
                  removePrompt(promptId2);
                },
              });
            },
            onCancel: () => {
              removePrompt(promptId);
            },
          });
          break;
        case 400:
          toast("error", toSeriTrans("front.failListMonsterDeck"), translateError(response.error));
          break;
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-main text-3xl font-bold">Main menu</h1>
        <Button
          hotkey="escape"
          hotkeyScope={[HotkeyScope.Popup]}
          onClick={closeMainMenu}
          label={t(toSeriTrans("front.close"))}
        />
      </div>
      {parameters.allowCheatOptions.value && (
        <>
          <Button
            onClick={() => {
              debugGainLootTop();
            }}
            label={t(toSeriTrans("front.cheatLoot"))}
          />
          <Button
            onClick={() => {
              closeMainMenu();
              debugGainLoot();
            }}
            label={t(toSeriTrans("front.cheatSelectLoot"))}
          />
          <Button
            onClick={() => {
              debugGainTreasureTop();
            }}
            label={t(toSeriTrans("front.cheatGainTreasure"))}
          />
          <Button
            onClick={() => {
              closeMainMenu();
              debugGainTreasure();
            }}
            label={t(toSeriTrans("front.cheatSelectTreasure"))}
          />
          <Button
            onClick={() => {
              closeMainMenu();
              debugPutMonsterCardInSlot();
            }}
            label={t(toSeriTrans("front.cheatPutMonster"))}
          />
          <Button
            onClick={() => {
              closeMainMenu();
              debugGainCoins();
            }}
            label={t(toSeriTrans("front.cheatGainCoins"))}
          />
          <Button
            onClick={() => {
              closeMainMenu();
              debugRemoveCard();
            }}
            label={t(toSeriTrans("front.cheatDiscardCard"))}
          />
        </>
      )}
      <Button
        onClick={() => {
          closeMainMenu();
          onSaveGamePress();
        }}
        label={t(toSeriTrans("front.saveGame"))}
      />
      <Button
        onClick={() => {
          closeMainMenu();
          onResetPress();
        }}
        label={t(toSeriTrans("front.quitGame"))}
      />
      <ReportBugButton />
    </div>
  );
};
