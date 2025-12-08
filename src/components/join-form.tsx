import { useState } from "react";
import type { Issuer, JoinResponse } from "../types/api";

interface JoinFormProps {
    onJoin: (issuer: Issuer) => void;
}

export const JoinForm = ({ onJoin }: JoinFormProps) => {
    const [name, setName] = useState("");

    const joinGame = async () => {
        const response = await fetch("http://localhost:3000/join", {
          method: "POST",
          body: JSON.stringify({ id: name }),
          headers: {
            "Content-Type": "application/json",
          },
        });
    
        const data: JoinResponse = await response.json();
        onJoin({ id: name, secret: data.secret });
      }
    
    return (
        <div>
          <h1>Join the game</h1>
          <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Enter your name" required />
          <button onClick={joinGame}>Join</button>
        </div>
      );
}