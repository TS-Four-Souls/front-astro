import { useState } from "react";
import type { Issuer, Requests } from "@/shared/api";
import { socket } from "@/utils/socket";

interface JoinFormProps {
  onJoin: (issuer: Issuer) => void;
}

export const JoinForm = ({ onJoin }: JoinFormProps) => {
  const [name, setName] = useState("");
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
    <div className="grid place-items-center place-content-center h-screen">
      <div className="flex flex-col gap-4 border-2 border-stone-700 p-4 rounded-lg text-center">
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
            className="bg-stone-800 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "error-message" : undefined}
          />
          {error && (
            <p id="error-message" className="text-red-500 mb-8">
              {error}
            </p>
          )}
          <button className="bg-stone-600 text-white px-4 py-2 rounded-md hover:bg-stone-500 transition-colors cursor-pointer" type="submit">Join</button>
        </form>
      </div>
    </div>
  );
};
