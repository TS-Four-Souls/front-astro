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
      setGameOngoing(response.gameOngoing);
    });
  }, []);

  const joinGame: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
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

  return (
    <div className="flex h-screen gap-8">
      <div className="planetarium flex flex-2 flex-col">
        <div className="flex flex-1 place-content-center place-items-center">
          <img src="/logo.png" alt="Logo" className="mb-16a w-[30vw]" />
        </div>
        <p className="mx-16 mb-4 text-center font-alt-stats text-blue-200/60">
          This is an unofficial, fan-made website and is not affiliated with
          <br /> or endorsed by Maestro Media and Edmund McMillen.
        </p>
      </div>
      <div className="flex flex-1 flex-col place-content-center place-items-center gap-8">
        {gameOngoing ? (
          <div className="flex flex-col gap-4 rounded-lg border-2 border-stone-700 p-8 text-center">
            <h1 className="font-main text-3xl font-bold">Game ongoing</h1>
            <p>
              A game is already ongoing.
              <br />
              You can reset it to start a new one.
            </p>
            <Button
              type="button"
              label="Reset game"
              className="mt-4"
              onClick={onResetPress}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-8 rounded-lg border-2 border-stone-700 p-8 text-center">
            <h1 className="font-main text-3xl font-bold">Join the game</h1>
            <form onSubmit={joinGame} className="flex flex-col gap-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="Enter your name..."
                autoComplete="off"
                minLength={1}
                required
                className="rounded-md border-2 border-stone-700 bg-stone-800 px-4 py-2 text-white focus:ring-2 focus:ring-stone-500 focus:outline-none"
              />
              <Button type="submit" label="Join" onClick={() => {}} />
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
