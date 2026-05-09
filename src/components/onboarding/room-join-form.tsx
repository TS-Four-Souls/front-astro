import { useState } from "react";
import { Button } from "../button";
import { socket } from "@/utils/socket";
import { useToastContext } from "../board/contexts/toast-context";

interface RoomJoinFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const RoomJoinForm = ({ onCancel, onSuccess }: RoomJoinFormProps) => {
  const [roomId, setRoomId] = useState<string>("");
  const { toast } = useToastContext();

  const joinRoom = () => {
    if (roomId.length !== 6) {
      toast(
        "error",
        "Invalid room ID",
        "The room ID must be 6 characters long",
      );
      return;
    }
    if (!/^[A-Z0-9]+$/.test(roomId)) {
      toast(
        "error",
        "Invalid room ID",
        "The room ID must only contain uppercase letters and numbers",
      );
      return;
    }

    socket.emit("joinRoom", { roomId }, (response) => {
      switch (response.status) {
        case 200:
          onSuccess();
          break;
        case 400:
          toast("error", "Failed to join room", response.error);
          break;
      }
    });
  };

  return (
    <div className="flex flex-col gap-8 rounded-lg border-2 border-space-400 bg-space p-8 text-center">
      <h1 className="font-main text-3xl font-bold">Join a room</h1>
      <div className="flex flex-col gap-4">
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              joinRoom();
            } else if (e.key === "Escape") {
              onCancel();
            }
          }}
          type="text"
          placeholder="Enter room ID..."
          autoComplete="off"
          minLength={6}
          maxLength={6}
          autoFocus
          className="rounded-md border-2 border-space-300 bg-space-500 px-4 py-2 text-white focus:ring-2 focus:ring-space-500 focus:outline-none"
        />
        <Button
          label="Join"
          onClick={joinRoom}
          hotkey="enter"
          theme="onSpace"
        />
        <Button
          label="Leave"
          onClick={onCancel}
          hotkey="escape"
          theme="onSpace"
        />
      </div>
    </div>
  );
};
