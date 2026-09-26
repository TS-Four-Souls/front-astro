import type { Room } from "@/shared/api";
import { Eye } from "@/icons/eye";
import { Joystick } from "@/icons/joystick";
import { HotkeyScope, shouldUseKey } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { storage } from "@/utils/storage";
import { useEffect, useState, type ReactNode } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { useLanguageContext } from "../contexts/language-context";
import { Popup } from "../popup";
import { LanguageSelection } from "../language-selection";

interface SpectatorJoinPopupProps {
  room: Room;
  onDismiss: () => void;
  /** entry = first spectate prompt; join = upgrade from spectator bar */
  intent?: "entry" | "join";
}

const optionButtonClassName =
  "min-h-28 flex-1 flex-col gap-3 px-3 py-5 sm:min-w-36";

const OptionLabel = ({ icon, label }: { icon: ReactNode; label: string }) => (
  <>
    {icon}
    <span className="text-center text-sm leading-tight">{label}</span>
  </>
);

export const SpectatorJoinPopup = ({
  room,
  onDismiss,
  intent = "entry",
}: SpectatorJoinPopupProps) => {
  const { t, translateError } = useLanguageContext();
  const { toast } = useToastContext();
  const [name, setName] = useState("");
  const [step, setStep] = useState<"options" | "name">(
    intent === "join" ? "name" : "options",
  );

  const canJoin = room.capabilities.join === true;

  useEffect(() => {
    const storedName = storage.getItem("name");
    if (storedName) {
      setName(storedName);
    }
  }, []);

  const leaveRoom = () => {
    socket.emit("leaveRoom", (response) => {
      if (response.status === 400) {
        toast(
          "error",
          t("introStep.joinRoomForm.errorToast.genericErrorTitle"),
          translateError(response.error),
        );
        return;
      }
      onDismiss();
    });
  };

  const openJoinStep = () => {
    if (!canJoin) return;
    setStep("name");
  };

  const joinAsPlayer = () => {
    if (!canJoin) return;
    socket.emit(
      "enterRoom",
      { type: "join", roomId: room.id, name },
      (response) => {
        storage.setItem("name", name);
        switch (response.status) {
          case 200:
            onDismiss();
            break;
          case 400:
            toast(
              "error",
              t("introStep.joinRoomForm.errorToast.genericErrorTitle"),
              translateError(response.error),
            );
            break;
        }
      },
    );
  };

  useHotkeys("enter", openJoinStep, {
    scopes: [HotkeyScope.Popup],
    enabled: step === "options" && canJoin,
    useKey: shouldUseKey("enter"),
  });
  useHotkeys("escape", leaveRoom, {
    scopes: [HotkeyScope.Popup],
    enabled: step === "options",
    useKey: shouldUseKey("escape"),
  });

  return (
    <Popup onPressBackdrop={onDismiss}>
      <div className="flex min-w-80 flex-col gap-4 sm:min-w-xl">
        {step === "options" ? (
          <>
            <div className="flex gap-4 place-content-between place-items-center">
              <h1 className="text-center font-main text-2xl font-bold uppercase">
                {t("introStep.joinRoomForm.spectatorPopup.welcomeTitle")}
              </h1>
              <LanguageSelection className="shadow-lg bg-taupe-600" />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className={optionButtonClassName}
                label={
                  <OptionLabel
                    icon={<Joystick className="size-10" />}
                    label={t(
                      "introStep.joinRoomForm.spectatorPopup.joinButton",
                    )}
                  />
                }
                onClick={openJoinStep}
                disabled={!canJoin}
                tooltip={{ capable: room.capabilities.join }}
                hotkeyScope={[HotkeyScope.Popup]}
              />
              <Button
                className={optionButtonClassName}
                label={
                  <OptionLabel
                    icon={<Eye className="size-10" />}
                    label={t(
                      "introStep.joinRoomForm.spectatorPopup.stayButton",
                    )}
                  />
                }
                onClick={onDismiss}
                hotkeyScope={[HotkeyScope.Popup]}
              />
              <Button
                className={optionButtonClassName}
                label={
                  <OptionLabel
                    icon={
                      <img
                        src="/input-prompts/keyboard_escape_outline.svg"
                        alt=""
                        className="size-10"
                      />
                    }
                    label={t("common.leaveButton")}
                  />
                }
                onClick={leaveRoom}
                hotkeyScope={[HotkeyScope.Popup]}
              />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-center font-main text-2xl font-bold uppercase">
              {t("introStep.joinRoomForm.spectatorPopup.joinButton")}
            </h1>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  joinAsPlayer();
                }
              }}
              type="text"
              placeholder={t("introStep.joinRoomForm.name.placeholder")}
              autoComplete="off"
              minLength={1}
              maxLength={16}
              autoFocus
              className="rounded-md border-2 border-taupe-500 bg-taupe-800 px-4 py-2 text-white focus:ring-2 focus:ring-taupe-400 focus:outline-none"
            />
            <div className="flex flex-col gap-2">
              <Button
                label={t("common.submitButton")}
                onClick={joinAsPlayer}
                disabled={!canJoin}
                tooltip={{ capable: room.capabilities.join }}
                hotkey={canJoin ? "enter" : undefined}
                hotkeyScope={[HotkeyScope.Popup]}
              />
              {intent === "entry" ? (
                <Button
                  label={t("introStep.joinRoomForm.spectatorPopup.backButton")}
                  onClick={() => setStep("options")}
                  hotkey="escape"
                  hotkeyScope={[HotkeyScope.Popup]}
                />
              ) : (
                <Button
                  label={t("common.closeButton")}
                  onClick={onDismiss}
                  hotkey="escape"
                  hotkeyScope={[HotkeyScope.Popup]}
                />
              )}
            </div>
          </>
        )}
      </div>
    </Popup>
  );
};
