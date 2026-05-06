import { useState } from "react";
import { Button } from "../button";
import { socket } from "@/utils/socket";

interface RoomJoinFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const RoomJoinForm = ({ onCancel, onSuccess }: RoomJoinFormProps) => {
  const [roomId, setRoomId] = useState<string>("");

  const joinRoom = () => {
    socket.emit("joinRoom", { roomId }, (response) => {
      switch (response.status) {
        case 200:
          onSuccess();
          break;
      }
    });
  };

  return (
    <div className="flex flex-col gap-8 rounded-lg border-2 border-taupe-700 bg-taupe-800/60 p-8 text-center backdrop-blur-md">
      <h1 className="font-main text-3xl font-bold">Join a room</h1>
      <div className="flex flex-col gap-4">
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
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
          minLength={1}
          required
          autoFocus
          className="rounded-md border-2 border-taupe-700 bg-taupe-800 px-4 py-2 text-white focus:ring-2 focus:ring-taupe-500 focus:outline-none"
        />
        <Button label="Join" onClick={joinRoom} hotkey="enter" />
        <Button label="Leave" onClick={onCancel} hotkey="escape" />
      </div>
    </div>
  );
};
