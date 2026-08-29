import { socket } from "@/utils/socket";
import { useEffect, useState } from "react";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { useLanguageContext } from "../contexts/language-context";

interface RoomJoinFormProps {
  code: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export const RoomJoinForm = ({
  code,
  onCancel,
  onSuccess,
}: RoomJoinFormProps) => {
  const { t, translateError } = useLanguageContext();
  const [roomId, setRoomId] = useState<string>(code);
  const { toast } = useToastContext();

  const isValidRoomId = (id: string) => {
    if (id.length !== 6) {
      toast(
        "error",
        t("introStep.joinRoomForm.errorToast.codeErrorTitle"),
        t("introStep.joinRoomForm.errorToast.lengthErrorMessage"),
      );
      return false;
    }
    if (!/^[A-Z0-9]+$/.test(id)) {
      toast(
        "error",
        t("introStep.joinRoomForm.errorToast.codeErrorTitle"),
        t("introStep.joinRoomForm.errorToast.charactersErrorMessage"),
      );
      return false;
    }
    return true;
  };

  const spectateRoom = (id: string, { validate = true } = {}) => {
    if (validate && !isValidRoomId(id)) {
      return;
    }

    socket.emit("enterRoom", { type: "spectate", roomId: id }, (response) => {
      switch (response.status) {
        case 200:
          onSuccess();
          break;
        case 400:
          toast(
            "error",
            t("introStep.joinRoomForm.errorToast.genericErrorTitle"),
            translateError(response.error),
          );
          break;
      }
    });
  };

  useEffect(() => {
    if (code.length === 6 && /^[A-Z0-9]+$/.test(code)) {
      spectateRoom(code, { validate: false });
    }
  }, []);

  return (
    <>
      <img src="/logo.png" alt="Logo" className="mb-16 w-140" />
      <div className="flex flex-col gap-8 rounded-lg border-2 border-space-400 bg-space p-8 text-center text-lg max-sm:w-full max-sm:px-4">
        <h1 className="font-main text-3xl font-bold">
          {t("introStep.joinRoomForm.title")}
        </h1>
        <div className="flex flex-col gap-4">
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text").toUpperCase();
              try {
                const url = new URL(text);
                const pastedCode = url.searchParams.get("CODE");
                if (pastedCode) {
                  setRoomId(pastedCode);
                }
                e.preventDefault();
              } catch {
                console.warn("Didn't paste a valid URL");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                spectateRoom(roomId);
              } else if (e.key === "Escape") {
                onCancel();
              }
            }}
            type="text"
            placeholder={t("introStep.joinRoomForm.code.placeholder")}
            autoComplete="off"
            minLength={6}
            maxLength={6}
            autoFocus
            className="rounded-md border-2 border-space-300 bg-space-500 px-4 py-2 text-white focus:ring-2 focus:ring-space-500 focus:outline-none"
          />
          <Button
            label={t("common.submitButton")}
            onClick={() => spectateRoom(roomId)}
            hotkey="enter"
            theme="onSpace"
          />
          <Button
            label={t("common.leaveButton")}
            onClick={onCancel}
            hotkey="escape"
            theme="onSpace"
          />
        </div>
      </div>
    </>
  );
};
