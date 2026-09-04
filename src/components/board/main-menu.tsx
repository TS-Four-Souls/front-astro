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

export const MainMenu = () => {
  const { addPrompt, removePrompt } = usePromptContext();
  const { toast } = useToastContext();
  const { closeMenu: closeMainMenu } = useMainMenuContext();
  const { parameters, isCheatViewOpen, setIsCheatViewOpen } = useGameContext();
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

  return (
    <>
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
      <div className="flex flex-col gap-4 overflow-auto p-4 pb-8">
        {parameters.allowCheatOptions.value && (
          <Button
            hotkey="c"
            hotkeyScope={[HotkeyScope.Popup]}
            onClick={() => {
              const nextValue = !isCheatViewOpen;
              setIsCheatViewOpen(nextValue);
              closeMainMenu();
            }}
            label={isCheatViewOpen ? "Normal view" : "Cheat view"}
          />
        )}
        <Button
          hotkey="s"
          hotkeyScope={[HotkeyScope.Popup]}
          onClick={() => {
            closeMainMenu();
            onSaveGamePress();
          }}
          label={t("gameStep.mainMenu.saveButtom.label")}
        />
        <Button
          hotkey="q"
          hotkeyScope={[HotkeyScope.Popup]}
          onClick={() => {
            closeMainMenu();
            onResetPress();
          }}
          label={t("gameStep.mainMenu.quitButton.label")}
        />
      </div>
      <LanguageSelection />
      <DiscordButton />
      <ReportBugButton />
    </>
  );
};
