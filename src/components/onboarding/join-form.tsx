import { socket } from "@/utils/socket";
import { useLocalStorage } from "@/utils/use-local-storage";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { useEffect, useState } from "react";

export const JoinForm = () => {
  const [name, setName] = useLocalStorage<string>("name", "");
  const { toast } = useToastContext();

  const [gameOngoing, setGameOngoing] = useState<boolean>(false);

  useEffect(() => {
    socket.emit("isGameOngoing", (response) => {
      switch (response.status) {
        case 200:
          setGameOngoing(response.gameOngoing);
          break;
        case 400:
          toast("error", "Failed to check if game is ongoing", response.error);
          break;
      }
    });
  }, []);

  const joinGame = () => {
    socket.emit("join", name, (response) => {
      switch (response.status) {
        case 200:
          break;
        case 400:
        default:
          toast("error", "Failed to join game", response.error);
          break;
      }
    });
  };

  const onResetPress = () => {
    socket.emit("reset", null, (response) => {
      switch (response.status) {
        case 200:
          toast("success", "Reset", "The game has been reset");
          setGameOngoing(false);
          break;
      }
    });
  };

  const onLeaveRoomPress = () => {
    socket.emit("leaveRoom", (response) => {
      switch (response.status) {
        case 200:
          break;
        case 400:
          toast("error", "Failed to leave room", response.error);
          break;
      }
    });
  };

  if (gameOngoing) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border-2 border-taupe-700 p-8 text-center">
        <h1 className="font-main text-3xl font-bold">Game ongoing</h1>
        <p>
          A game is already ongoing.
          <br />
          You can reset it to start a new one or leave the room.
        </p>
        <Button
          type="button"
          label="Reset game"
          className="mt-4"
          onClick={onResetPress}
          hotkey="enter"
        />
        <Button
          type="button"
          label="Leave"
          onClick={onLeaveRoomPress}
          hotkey="escape"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 rounded-lg border-2 border-taupe-700 bg-taupe-800/60 p-8 text-center backdrop-blur-md">
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
          className="rounded-md border-2 border-taupe-700 bg-taupe-800 px-4 py-2 text-white focus:ring-2 focus:ring-taupe-500 focus:outline-none"
        />
        <Button label="Join" onClick={joinGame} hotkey="enter" />
        <Button label="Leave" onClick={onLeaveRoomPress} hotkey="escape" />
      </div>
    </div>
  );
};
