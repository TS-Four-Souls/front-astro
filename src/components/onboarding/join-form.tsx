import { socket } from "@/utils/socket";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { useEffect, useState } from "react";
import { storage } from "@/utils/storage";

export const JoinForm = () => {
  const [name, setName] = useState("");
  const { toast } = useToastContext();

  useEffect(() => {
    const name = storage.getItem("name");
    if (name) {
      setName(name);
    }
  }, []);

  const joinGame = () => {
    storage.setItem("name", name);
    socket.emit("setName", name, (response) => {
      if (response.status === 400)
        toast("error", "Failed to join game", response.error);
    });
  };

  const onLeaveRoomPress = () => {
    socket.emit("leaveRoom", (response) => {
      if (response.status === 400)
        toast("error", "Failed to leave room", response.error);
    });
  };

  return (
    <>
      <img src="/logo.png" alt="Logo" className="mb-16 w-[50vh]" />
      <div className="flex flex-col gap-8 rounded-lg border-2 border-space-400 bg-space p-8 text-center text-lg max-sm:w-full max-sm:px-4">
        <h1 className="font-main text-3xl font-bold">Welcome!</h1>
        <div className="flex flex-col gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                joinGame();
              } else if (e.key === "Escape") {
                onLeaveRoomPress();
              }
            }}
            type="text"
            placeholder="Enter your name..."
            autoComplete="off"
            minLength={1}
            required
            autoFocus
            className="rounded-md border-2 border-space-300 bg-space-500 px-4 py-2 text-white focus:ring-2 focus:ring-space-500 focus:outline-none"
          />
          <Button
            label="Join"
            onClick={joinGame}
            hotkey="enter"
            theme="onSpace"
          />
          <Button
            label="Leave"
            onClick={onLeaveRoomPress}
            hotkey="escape"
            theme="onSpace"
          />
        </div>
      </div>
    </>
  );
};
