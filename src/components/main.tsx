import { useEffect, useState } from "react";
import { JoinForm } from "./onboarding/join-form";
import { StartStep } from "./onboarding/start-step";
import { Board } from "./board/board";
import { socket } from "@/utils/socket";
import type { DetailedState, Issuer } from "@/shared/api";
import { GameContext } from "./board/useGameContext";

export const Main = () => {
  const [issuer, setIssuer] = useState<Issuer | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [state, setState] = useState<DetailedState | null>(null);

  useEffect(() => {
    function onConnect() {
      console.log("connected to socket");
    }
    function onConnectError(error: any) {
      console.error("failed to connect to socket", error);
    }
    function onDisconnect() {
      console.log("disconnected from socket");
    }
    function onGameStart() {
      console.log("game started");
      setHasStarted(true);
    }

    function onGameChanged(state: DetailedState) {
      setState(state);
    }

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("on:game:start", onGameStart);
    socket.on("on:game:changed", onGameChanged);

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("on:game:start", onGameStart);
      socket.off("on:game:changed", onGameChanged);
    };
  }, []);

  // Store the secret in local storage
  useEffect(() => {
    if (issuer) {
      localStorage.setItem("issuer", JSON.stringify(issuer));
    }
  }, [issuer]);

  // Retrieve the secret from local storage
  useEffect(() => {
    const storedIssuer = JSON.parse(localStorage.getItem("issuer") || "{}");
    if (storedIssuer) {
      socket.emit("rejoin", storedIssuer, (response) => {
        if (response.status === 200) {
          setIssuer(storedIssuer);
          if (response.gameState) {
            setHasStarted(true);
            setState(response.gameState);
          }
        }
      });
    }
  }, []);

  if (!issuer) {
    return <JoinForm onJoin={setIssuer} />;
  } else if (!hasStarted) {
    return <StartStep issuer={issuer} />;
  } else if (state) {
    return (
      <GameContext.Provider value={{ state, issuer }}>
        <Board />
      </GameContext.Provider>);
  } else {
    return "Loading...";
  }
};
