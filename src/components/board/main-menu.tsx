import { HotkeyScope } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { Button } from "../button";
import { ReportBugButton } from "../onboarding-layout";
import { useGameContext } from "./contexts/game-context";
import { useMainMenuContext } from "./contexts/main-menu-context";
import { usePromptContext } from "./contexts/prompt-context";
import { useToastContext } from "./contexts/toast-context";
import { useLanguageContext } from "../contexts/language-context";
import { LanguageSelection } from "../language-selection";
import { ElapsedTime } from "../elapsed-time";
import { Share } from "@/icons/share";
import { Eye } from "@/icons/eye";

export const MainMenu = () => {
  const { addPrompt, removePrompt } = usePromptContext();
  const { toast } = useToastContext();
  const { closeMenu: closeMainMenu } = useMainMenuContext();
  const { parameters, isCheatViewOpen, setIsCheatViewOpen, room } =
    useGameContext();
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
          const filename = `four-souls_save_${datePart}_${timePart}.json`;

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

  const shareRoom = () => {
    const currentUrl = new URL(window.location.href);
    const link = new URL(`/?code=${room.id}`, currentUrl.origin);
    navigator.clipboard.writeText(link.toString());
    toast(
      "success",
      t("gameStep.spectatorBar.shareButton.successToast.title"),
      t("gameStep.spectatorBar.shareButton.successToast.message"),
    );
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
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
      <div className="mt-4 flex flex-col gap-2 rounded-md bg-taupe-800/50 p-3 shadow-sm inset-shadow-sm shadow-taupe-800 inset-shadow-taupe-800">
        <p className="mt-1 mb-2 text-center font-main text-lg font-bold">
          Game information
        </p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded-full bg-taupe-900 px-4 py-1">
            <span
              className="size-2 shrink-0 animate-pulse rounded-full bg-red-500"
              aria-hidden
            />
            <ElapsedTime since={room.createdAt} className="text-taupe-300" />
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="size-5" />
            <span className="font-alt-stats text-xs">
              {room.spectatorCount}
            </span>
          </div>
          <Button
            label={<Share className="size-5" />}
            onClick={shareRoom}
            className="size-10 p-0"
            tooltip={{
              title: t("gameStep.spectatorBar.shareButton.label"),
              enabled: true,
            }}
          />
        </div>
      </div>
      <div className="mt-3 flex place-content-stretch gap-2">
        <ReportBugButton className="bg-taupe-600 shadow-lg" />
        <LanguageSelection className="w-full bg-taupe-600 shadow-lg" />
      </div>
    </>
  );
};
