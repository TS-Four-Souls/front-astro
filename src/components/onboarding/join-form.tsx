import { useState } from "react";
import type { Issuer, Requests } from "@/shared/api";
import { socket } from "@/utils/socket";

interface JoinFormProps {
  onJoin: (issuer: Issuer) => void;
}

export const JoinForm = ({ onJoin }: JoinFormProps) => {
  const [name, setName] = useState("");

  const joinGame = async () => {
    socket.emit("join", name, (response) => {
      if (response.status === 200) {
        onJoin({ id: name, secret: response.secret });
      } else {
        console.error("Failed to join the game", response);
      }
    });
  };

  return (
    <div>
      <h1>Join the game</h1>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        type="text"
        placeholder="Enter your name"
        required
      />
      <button onClick={joinGame}>Join</button>
    </div>
  );
};
