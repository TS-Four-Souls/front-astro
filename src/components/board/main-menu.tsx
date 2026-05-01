import { socket } from "@/utils/socket";
import { usePromptContext } from "./contexts/prompt-context";
import { useToastContext } from "./contexts/toast-context";
import { Button } from "../button";
import { useMainMenuContext } from "./contexts/main-menu-context";
import { useGameContext } from "./contexts/game-context";
import { HotkeyScope } from "@/utils/hotkey";

export const MainMenu = () => {
  const { addPrompt, removePrompt } = usePromptContext();
  const { toast } = useToastContext();
  const { closeMenu: closeMainMenu } = useMainMenuContext();
  const { issuer } = useGameContext();

  const onResetPress = (confirmed?: true) => {
    if (confirmed === undefined) {
      const promptId = `reset-confirm-${Date.now()}`;
      addPrompt({
        promptId,
        isUnique: true,
        prompt: "Are you sure you want to reset the game?",
        options: [
          { type: "boolean", payload: true },
          { type: "boolean", payload: false },
        ],
        minCount: 1,
        maxCount: 1,
        onSubmit: (selectedOptions) => {
          if (selectedOptions[0].payload === true) {
            onResetPress(true);
          }
          removePrompt(promptId);
        },
        onCancel: () => {
          removePrompt(promptId);
        },
      });
      return;
    }
    socket.emit("reset", null, (response) => {
      switch (response.status) {
        case 200:
          toast("success", "Reset", "The game has been reset");
          break;
        default:
        case 400:
          toast("error", "Failed to reset", response.error);
          break;
      }
    });
  };

  const onSaveGamePress = () => {
    socket.emit("getGameLogs", issuer, (response) => {
      if (response.status === 200) {
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

        toast("success", "Save game", `Saved as ${filename}`);
      } else {
        toast("error", "Save game", response.error);
      }
    });
  };

  const debugGainLoot = () => {
    socket.emit("debugListLoot", issuer, (response) => {
      if (response.status === 200) {
        const promptId = `debug-list-loot-${Date.now()}`;
        addPrompt({
          promptId,
          isUnique: false,
          prompt: "Select a loot card to loot",
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
                ...issuer,
                cards: selections.map((selection) => selection.payload),
              },
              (response) => {
                if (response.status === 200) {
                } else {
                  toast("error", "CHEAT MODE", response.error);
                }
              },
            );
            removePrompt(promptId);
          },
          onCancel: () => {
            removePrompt(promptId);
          },
        });
      } else {
        toast("error", "CHEAT MODE", response.error);
      }
    });
  };

  const rollback = () => {
    socket.emit("rollback", issuer, (response) => {
      if (response.status === 200) {
      } else {
        toast("error", "Rollback", response.error);
      }
    });
  };

  const debugGainTreasure = () => {
    socket.emit("debugListTreasure", issuer, (response) => {
      if (response.status === 200) {
        const promptId = `debug-list-treasure-${Date.now()}`;
        addPrompt({
          promptId,
          isUnique: false,
          prompt: "Select a treasure card to gain",
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
                ...issuer,
                cards: selections.map((selection) => selection.payload),
              },
              (response) => {
                if (response.status === 200) {
                } else {
                  toast("error", "CHEAT MODE", response.error);
                }
              },
            );
            removePrompt(promptId);
          },
          onCancel: () => {
            removePrompt(promptId);
          },
        });
      } else {
        toast("error", "CHEAT MODE", response.error);
      }
    });
  };

  const debugRemoveCard = () => {
    socket.emit("debugListCardsICanRemove", issuer, (response) => {
      if (response.status === 200) {
        const promptId = `debug-list-cards-i-can-remove-${Date.now()}`;
        addPrompt({
          promptId,
          isUnique: false,
          prompt: "Select cards to remove",
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
                ...issuer,
                cards: selections.map((selection) => selection.payload),
              },
              (response) => {
                if (response.status === 200) {
                } else {
                  toast("error", "CHEAT MODE", response.error);
                }
              },
            );
            removePrompt(promptId);
          },
          onCancel: () => {
            removePrompt(promptId);
          },
        });
      } else {
        toast("error", "CHEAT MODE", response.error);
      }
    });
  };

  const debugGainCoins = () => {
    const promptId = `debug-gain-coins-${Date.now()}`;
    addPrompt({
      promptId,
      isUnique: false,
      prompt: "Select amount of coins to gain",
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
            ...issuer,
            coins,
          },
          (response) => {
            if (response.status === 200) {
            } else {
              toast("error", "CHEAT MODE", response.error);
            }
          },
        );
        removePrompt(promptId);
      },
      onCancel: () => {
        removePrompt(promptId);
      },
    });
  };

  const debugPutMonsterCardInSlot = () => {
    socket.emit("debugListMonsterDeck", issuer, (response) => {
      if (response.status === 200) {
        const promptId = `debug-list-monster-deck-${Date.now()}`;
        addPrompt({
          promptId,
          isUnique: false,
          prompt: "Select a monster card to put in a slot",
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
              prompt: "Select a card to cover",
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
                    ...issuer,
                    card,
                    toCover,
                  },
                  (response) => {
                    if (response.status === 200) {
                    } else {
                      toast("error", "CHEAT MODE", response.error);
                    }
                  },
                );
                removePrompt(promptId2);
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
      } else {
        toast("error", "CHEAT MODE", response.error);
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
          label="Close"
        />
      </div>
      <Button
        onClick={() => {
          // closeMainMenu();
          rollback();
        }}
        hotkey="r"
        hotkeyScope={[HotkeyScope.Popup]}
        label="Rollback"
      />
      <Button
        onClick={() => {
          closeMainMenu();
          debugGainLoot();
        }}
        label="[CHEAT] Loot"
      />
      <Button
        onClick={() => {
          closeMainMenu();
          debugGainTreasure();
        }}
        label="[CHEAT] Gain treasure"
      />
      <Button
        onClick={() => {
          closeMainMenu();
          debugPutMonsterCardInSlot();
        }}
        label="[CHEAT] Put monster card in slot"
      />
      <Button
        onClick={() => {
          closeMainMenu();
          debugGainCoins();
        }}
        label="[CHEAT] Gain coins"
      />
      <Button
        onClick={() => {
            closeMainMenu();
            debugRemoveCard();
        }}
        label="[CHEAT] Discard card"
      />
      <Button
        onClick={() => {
          closeMainMenu();
          onSaveGamePress();
        }}
        label="Save game"
      />
      <Button
        onClick={() => {
          closeMainMenu();
          onResetPress();
        }}
        label="Quit game"
      />
    </div>
  );
};
