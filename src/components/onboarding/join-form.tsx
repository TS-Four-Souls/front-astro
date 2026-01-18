import { useState } from "react";
import type { Issuer } from "@/shared/api";
import { socket } from "@/utils/socket";
import { useLocalStorage } from "@/utils/use-local-storage";

interface JoinFormProps {
  onJoin: (issuer: Issuer) => void;
}

export const JoinForm = ({ onJoin }: JoinFormProps) => {
  const [name, setName] = useLocalStorage<string>("name", "");
  const [error, setError] = useState<string | null>(null);

  const joinGame = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("joining game with name", name);
    socket.emit("join", name, (response) => {
      if (response.status === 200) {
        onJoin({ id: name, secret: response.secret });
      } else {
        setError(response.error);
      }
    });
  };

  return (
    <div className="grid h-screen place-content-center place-items-center">
      <div className="flex flex-col gap-4 rounded-lg border-2 border-stone-700 p-4 text-center">
        <h1 className="text-xl font-bold">Join the game</h1>
        <form onSubmit={joinGame} className="flex flex-col gap-2">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            type="text"
            placeholder="Enter your name..."
            autoComplete="off"
            minLength={1}
            required
            className="rounded-md bg-stone-800 px-4 py-2 text-white focus:ring-2 focus:ring-stone-500 focus:outline-none"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "error-message" : undefined}
          />
          {error && (
            <p id="error-message" className="mb-8 text-red-500">
              {error}
            </p>
          )}
          <button
            className="cursor-pointer rounded-md bg-stone-600 px-4 py-2 text-white transition-colors hover:bg-stone-500"
            type="submit">
            Join
          </button>
        </form>
      </div>
    </div>
  );
};
