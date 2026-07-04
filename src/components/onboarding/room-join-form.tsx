import { socket } from "@/utils/socket";
import { storage } from "@/utils/storage";
import { useEffect, useState } from "react";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { t, translateError } from "../../utils/translate";

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
  const [roomId, setRoomId] = useState<string>(code);
  const [name, setName] = useState<string>("");
  const { toast } = useToastContext();

  useEffect(() => {
    const name = storage.getItem("name");
    if (name) {
      setName(name);
    }
  }, []);

  const joinRoom = () => {
    if (roomId.length !== 6) {
      toast(
        "error",
        t("introStep.joinRoomForm.errorToast.codeErrorTitle"),
        t("introStep.joinRoomForm.errorToast.lengthErrorMessage"),
      );
      return;
    }
    if (!/^[A-Z0-9]+$/.test(roomId)) {
      toast(
        "error",
        t("introStep.joinRoomForm.errorToast.codeErrorTitle"),
        t("introStep.joinRoomForm.errorToast.charactersErrorMessage"),
      );
      return;
    }

    socket.emit("enterRoom", { type: "join", roomId, name }, (response) => {
      storage.setItem("name", name);
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
                console.log(url);
                const code = url.searchParams.get("CODE");
                if (code) {
                  setRoomId(code);
                }
                e.preventDefault();
              } catch (error) {
                console.warn("Didn't paste a valid URL");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                joinRoom();
              } else if (e.key === "Escape") {
                onCancel();
              }
            }}
            type="text"
            placeholder={t("introStep.joinRoomForm.code.placeholder")}
            autoComplete="off"
            minLength={6}
            maxLength={6}
            autoFocus={code === ""}
            className="rounded-md border-2 border-space-300 bg-space-500 px-4 py-2 text-white focus:ring-2 focus:ring-space-500 focus:outline-none"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                joinRoom();
              }
            }}
            type="text"
            placeholder={t("introStep.joinRoomForm.name.placeholder")}
            autoComplete="off"
            minLength={1}
            maxLength={16}
            autoFocus={code !== ""}
            className="rounded-md border-2 border-space-300 bg-space-500 px-4 py-2 text-white focus:ring-2 focus:ring-space-500 focus:outline-none"
          />
          <Button
            label={t("common.joinButton")}
            onClick={joinRoom}
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
