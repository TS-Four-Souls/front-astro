import { HotkeyScope } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { Button } from "../button";
import { DiscordButton, ReportBugButton } from "../onboarding-layout";
import { useGameContext } from "./contexts/game-context";
import { useMainMenuContext } from "./contexts/main-menu-context";
import { usePromptContext } from "./contexts/prompt-context";
import { useToastContext } from "./contexts/toast-context";
import { useLanguageContext } from "../contexts/language-context";
import { LanguageSelection } from "../language-selection";
import type { SelectionItem, StackElement, StackElementJson } from "@/shared/api";

export const MainMenu = () => {
  const { addPrompt, removePrompt } = usePromptContext();
  const { toast } = useToastContext();
  const { closeMenu: closeMainMenu } = useMainMenuContext();
  const { parameters } = useGameContext();
  const { translateError, t } = useLanguageContext();

  const onResetPress = () => {
    const promptId = `reset-confirm`;
    addPrompt({
      promptId,
      isUnique: false,
      prompt: t("gameStep.mainMenu.quitButton.popup.title"),
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
              toast(
                "error",
                t("gameStep.mainMenu.quitButton.errorToast.title"),
                translateError(response.error),
              );
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

          toast(
            "success",
            t("gameStep.mainMenu.saveButtom.successToast.title"),
            t("gameStep.mainMenu.saveButtom.successToast.message", {
              filename,
            }),
          );
          break;
        case 400:
          toast(
            "error",
            t("gameStep.mainMenu.saveButtom.errorToast.title"),
            translateError(response.error),
          );
          break;
      }
    });
  };

  const debugGainLootTop = () => {
    socket.emit("debugLootTop", (response) => {
      if (response.status === 400) {
        toast(
          "error",
          t("gameStep.cheats.getLootTopDeck.errorToast.title"),
          translateError(response.error),
        );
      }
    });
  };

  const debugGainTreasureTop = () => {
    socket.emit("debugGainTreasureTop", (response) => {
      if (response.status === 400) {
        toast(
          "error",
          t("gameStep.cheats.getTreasureTopDeck.errorToast.title"),
          translateError(response.error),
        );
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
            prompt: t("gameStep.cheats.selectCardToLoot.popup.title"),
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
                    toast(
                      "error",
                      t(
                        "gameStep.cheats.selectCardToLoot.popup.errorToast.title",
                      ),
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
          toast(
            "error",
            t("gameStep.cheats.selectCardToLoot.errorToast.title"),
            translateError(response.error),
          );
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
            prompt: t("gameStep.cheats.selectTreasureToLoot.popup.title"),
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
                      t(
                        "gameStep.cheats.selectTreasureToLoot.popup.errorToast.title",
                      ),
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
          toast(
            "error",
            t("gameStep.cheats.selectTreasureToLoot.errorToast.title"),
            translateError(response.error),
          );
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
            prompt: t("gameStep.cheats.discardCard.popup.title"),
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
                    toast(
                      "error",
                      t("gameStep.cheats.discardCard.popup.errorToast"),
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
          toast(
            "error",
            t("gameStep.cheats.discardCard.errorToast.title"),
            translateError(response.error),
          );
          break;
      }
    });
  };

  const debugGainCoins = () => {
    const promptId = `debug-gain-coins-${Date.now()}`;
    addPrompt({
      promptId,
      isUnique: false,
      prompt: t("gameStep.cheats.gainGoin.popup.title"),
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
              toast(
                "error",
                t("gameStep.cheats.gainGoin.popup.errorToast.title"),
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
  };
  
  const debugPutMonsterCardInSlot = () => {
    socket.emit("debugListMonsterDeck", (response) => {
      switch (response.status) {
        case 200:
          const promptId = `debug-list-monster-deck-${Date.now()}`;
          addPrompt({
            promptId,
            isUnique: false,
            prompt: t("gameStep.cheats.putMonsterCardInSlot.popup.title"),
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
                prompt: t("gameStep.attack.popup.title"),
                options: 
                [ { type: "deck" as const, payload: "monster" as const }, 
                  ...response.coverable.map((card) => ({
                    type: "card" as const,
                    payload: card,
                  }))
                ],
                minCount: 1,
                maxCount: 1,
                onSubmit: (selections2) => {
                  const toCover = selections2[0].type === "deck" ? "top" : selections2[0].payload;
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
                          t(
                            "gameStep.cheats.putMonsterCardInSlot.popup.errorToast.title",
                          ),
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
          toast(
            "error",
            t("gameStep.cheats.putMonsterCardInSlot.errorToast.title"),
            translateError(response.error),
          );
          break;
      }
    });
  };

  const selectDiceValue = (selections: SelectionItem[]) => {
    if(selections[0].type !== "stackElement" || selections[0].payload.type !== "diceRoll")
      return
    const dice = selections[0].payload;

    const promptId2 = `debug-dice-value-${Date.now()}`;
    addPrompt({
      promptId: promptId2,
      isUnique: false,
      prompt: t("pending.changeDiceRoll"),
      options: 
      [1,2,3,4,5,6].map(value => {return { type: "number" as const, payload: value }}),
      minCount: 1,
      maxCount: 1,
      onSubmit: (selections2) => {
        const value = selections2[0].payload;
        socket.emit(
          "debugChangeDiceResult",
          {
            dice,
            value
          },
          (response) => {
            if (response.status === 200) {
              removePrompt(promptId2);
            } else {
              toast(
                "error",
                t(
                  "gameStep.cheats.changeDice.errorToast.title",
                ),
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
  }
  const debugChangeDiceResult = () => {
    socket.emit("debugListAvailableDices", (response) => {
      switch (response.status) {
        case 200:
          if(response.dices.length === 0)
            return;
          if(response.dices.length === 1)
          {
            selectDiceValue(response.dices.map((dice) => ({
              type: "stackElement",
              payload: dice,
            })));
          }
          else{
            const promptId = `debug-list-dices-${Date.now()}`;
            addPrompt({
              promptId,
              isUnique: false,
              prompt: t("selector.diceRoll"),
              options: response.dices.map((dice) => ({
                type: "stackElement",
                payload: dice,
              })),
              minCount: 1,
              maxCount: 1,
              onSubmit: (selections:SelectionItem[]) => {
                removePrompt(promptId);
                selectDiceValue(selections);
              },
              onCancel: () => {
                removePrompt(promptId);
              },
            });
          }
          break;
        case 400:
          toast(
            "error",
            t("gameStep.cheats.changeDice.listDicesErrorToast.title"),
            translateError(response.error),
          );
          break;
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-main text-3xl font-bold">
          {t("gameStep.mainMenu.title")}
        </h1>
        <Button
          hotkey="escape"
          hotkeyScope={[HotkeyScope.Popup]}
          onClick={closeMainMenu}
          label={t("common.closeButton")}
        />
      </div>
      {parameters.allowCheatOptions.value && (
        <>
          <Button
            onClick={() => {
              debugGainLootTop();
            }}
            label={t("gameStep.cheats.getLootTopDeck.label")}
          />
          <Button
            onClick={() => {
              closeMainMenu();
              debugGainLoot();
            }}
            label={t("gameStep.cheats.selectCardToLoot.label")}
          />
          <Button
            onClick={() => {
              debugGainTreasureTop();
            }}
            label={t("gameStep.cheats.getTreasureTopDeck.label")}
          />
          <Button
            onClick={() => {
              closeMainMenu();
              debugGainTreasure();
            }}
            label={t("gameStep.cheats.selectTreasureToLoot.label")}
          />
          <Button
            onClick={() => {
              closeMainMenu();
              debugPutMonsterCardInSlot();
            }}
            label={t("gameStep.cheats.putMonsterCardInSlot.label")}
          />
          <Button
            onClick={() => {
              closeMainMenu();
              debugChangeDiceResult();
            }}
            label={t("gameStep.cheats.changeDice.label")}
          />
          <Button
            onClick={() => {
              closeMainMenu();
              debugGainCoins();
            }}
            label={t("gameStep.cheats.gainGoin.label")}
          />
          <Button
            onClick={() => {
              closeMainMenu();
              debugRemoveCard();
            }}
            label={t("gameStep.cheats.discardCard.label")}
          />
        </>
      )}
      <Button
        onClick={() => {
          closeMainMenu();
          onSaveGamePress();
        }}
        label={t("gameStep.mainMenu.saveButtom.label")}
      />
      <Button
        onClick={() => {
          closeMainMenu();
          onResetPress();
        }}
        label={t("gameStep.mainMenu.quitButton.label")}
      />
      <LanguageSelection />
      <DiscordButton />
      <ReportBugButton />
    </div>
  );
};
