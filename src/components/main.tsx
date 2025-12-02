import { useEffect, useState } from "react";
import { JoinForm } from "./join-form";
import type { Issuer, JoinResponse } from "../types/api";
import { StartStep } from "./start-step";
import { Board } from "./board";

const DEBUG = true;

export const Main = () => {
  const [issuer, setIssuer] = useState<Issuer | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const startGame = async () => {
      let response = await fetch("http://localhost:3000/join", {
        method: "POST",
        body: JSON.stringify({ id: "DrMint" }),
      });
      await fetch("http://localhost:3000/join", {
        method: "POST",
        body: JSON.stringify({ id: "Sylvain" }),
      });
      if (!response.ok) {
        throw new Error("Failed to join game");
      }
      const joinResponse: JoinResponse = await response.json();
      const player1Issuer = { id: "DrMint", secret: joinResponse.secret };
      setIssuer(player1Issuer);
      response = await fetch("http://localhost:3000/start", {
        method: "POST",
        body: JSON.stringify({ issuer: player1Issuer, }),
      });
      if (!response.ok) {
        throw new Error("Failed to start game");
      }
      setHasStarted(true);
    };

    if (DEBUG) {
      startGame();
    }
  }, []);

  if (!issuer) {
    return <JoinForm onJoin={setIssuer} />;
  } else if (!hasStarted) {
    return <StartStep onStart={() => setHasStarted(true)} issuer={issuer} />;
  } else {
    return <Board issuer={issuer} />;
  }
};
