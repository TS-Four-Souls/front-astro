import type { RoomStatus } from "@/shared/api";
import { socket } from "@/utils/socket";
import { storage } from "@/utils/storage";
import { useEffect, useRef, useState } from "react";
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
  const { t, ts, translateError } = useLanguageContext();
  const [roomId, setRoomId] = useState<string>(code);
  const [subscribedRoomId, setSubscribedRoomId] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const [name, setName] = useState<string>("");
  const isSubscribedRef = useRef(false);
  const { toast } = useToastContext();

  useEffect(() => {
    const storedName = storage.getItem("name");
    if (storedName) {
      setName(storedName);
    }
  }, []);

  useEffect(() => {
    function onRoomStatusChanged(status: RoomStatus) {
      setRoomStatus(status);
    }

    socket.on("on:room-status:changed", onRoomStatusChanged);
    return () => {
      socket.off("on:room-status:changed", onRoomStatusChanged);
      if (isSubscribedRef.current) {
        isSubscribedRef.current = false;
        socket.emit("unsubscribeRoomStatus", () => {});
      }
    };
  }, []);

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

  const subscribeToRoom = (id: string, { validate = true } = {}) => {
    if (validate && !isValidRoomId(id)) {
      return;
    }

    socket.emit("subscribeRoomStatus", { roomId: id }, (response) => {
      switch (response.status) {
        case 200:
          isSubscribedRef.current = true;
          setSubscribedRoomId(id);
          break;
        case 400:
          isSubscribedRef.current = false;
          setSubscribedRoomId(null);
          setRoomStatus(null);
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
      subscribeToRoom(code, { validate: false });
    }
  }, []);

  const joinRoom = () => {
    if (!subscribedRoomId) {
      return;
    }

    socket.emit(
      "enterRoom",
      { type: "join", roomId: subscribedRoomId, name },
      (response) => {
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
      },
    );
  };

  if (subscribedRoomId === null) {
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
                  subscribeToRoom(roomId);
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
              onClick={() => subscribeToRoom(roomId)}
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
  }

  return (
    <>
      <img src="/logo.png" alt="Logo" className="mb-16 w-140" />
      <div className="flex flex-col gap-8 rounded-lg border-2 border-space-400 bg-space p-8 text-center text-lg max-sm:w-full max-sm:px-4">
        <h1 className="font-main text-3xl font-bold">
          {t("introStep.joinRoomForm.title")}
        </h1>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="font-main text-2xl font-bold">{subscribedRoomId}</p>
          </div>
          {roomStatus &&
            (roomStatus.canJoin === true ? (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      joinRoom();
                    } else if (e.key === "Escape") {
                      onCancel();
                    }
                  }}
                  type="text"
                  placeholder={t("introStep.joinRoomForm.name.placeholder")}
                  autoComplete="off"
                  minLength={1}
                  maxLength={16}
                  autoFocus
                  className="rounded-md border-2 border-space-300 bg-space-500 px-4 py-2 text-white focus:ring-2 focus:ring-space-500 focus:outline-none"
                />
                <Button
                  label={t("common.joinButton")}
                  onClick={joinRoom}
                  hotkey="enter"
                  theme="onSpace"
                />
              </>
            ) : (
              <p className="text-red-300">{ts(roomStatus.canJoin)}</p>
            ))}
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
