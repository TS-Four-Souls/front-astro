import { socket } from "@/utils/socket";
import { usePromptContext } from "./contexts/prompt-context";
import { useToastContext } from "./contexts/toast-context";
import { Button } from "../button";
import { useMainMenuContext } from "./contexts/main-menu-context";
import { useUserSettingsContext } from "./contexts/user-settings-context";
import { useGameContext } from "./contexts/game-context";
import { HotkeyScope } from "@/utils/hotkey";

export const MainMenu = () => {
  const { addPrompt, removePrompt } = usePromptContext();
  const { toast } = useToastContext();
  const { closeMenu: closeMainMenu } = useMainMenuContext();
  const { openMenu: openUserSettingsMenu } = useUserSettingsContext();
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
                slugs: selections.map((selection) => selection.payload.slug),
              },
              (response) => {
                if (response.status === 200) {
                  toast(
                    "success",
                    "CHEAT MODE",
                    "You've looted the selected cards",
                  );
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
                slugs: selections.map((selection) => selection.payload.slug),
              },
              (response) => {
                if (response.status === 200) {
                  toast(
                    "success",
                    "CHEAT MODE",
                    "You've gained the selected treasures",
                  );
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
          closeMainMenu();
          openUserSettingsMenu();
        }}
        label="Graphics"
        className="translate-z-1"
      />
      <Button
        onClick={() => {
          closeMainMenu();
          debugGainLoot();
        }}
        label="[CHEAT] Loot"
        className="translate-z-1"
      />
      <Button
        onClick={() => {
          closeMainMenu();
          debugGainTreasure();
        }}
        label="[CHEAT] Gain treasure"
        className="translate-z-1"
      />
      <Button
        onClick={() => {
          closeMainMenu();
          onResetPress();
        }}
        label="Quit game"
        className="translate-z-1"
      />
    </div>
  );
};
