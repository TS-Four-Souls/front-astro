import { useEffect, useState } from "react";
import { JoinForm } from "../onboarding/join-form";
import { StartStep } from "../onboarding/start-step";
import { Board } from "../board/board";
import { socket } from "@/utils/socket";
import type { DetailedState, Issuer } from "@/shared/api";
import { GameProvider } from "../board/contexts/game-context";
import { Loading } from "../onboarding/loading";
import { useLocalStorage } from "@/utils/use-local-storage";

export const GamePage = () => {
  const [issuer, setIssuer] = useLocalStorage<Issuer | null>("issuer", null);
  const [hasStarted, setHasStarted] = useState(false);
  const [state, setState] = useState<DetailedState | null>(null);

  const [tryingToRejoin, setTryingToRejoin] = useState<boolean | null>(null);

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

  // Retrieve the secret from local storage
  useEffect(() => {
    if (!issuer) {
      setTryingToRejoin(false);
      return;
    }
    setTryingToRejoin(true);
    socket.emit("rejoin", issuer, (response) => {
      if (response.status === 200) {
        if (response.gameState) {
          setHasStarted(true);
          setState(response.gameState);
        }
      } else {
        setIssuer(null);
      }
      setTryingToRejoin(false);
    });
  }, []);

  if (tryingToRejoin === null || tryingToRejoin === true) {
    return <Loading />;
  } else if (!issuer) {
    return <JoinForm onJoin={setIssuer} />;
  } else if (!hasStarted) {
    return <StartStep issuer={issuer} />;
  } else if (state) {
    return (
      <GameProvider state={state} issuer={issuer}>
        <Board />
      </GameProvider>
    );
  } else {
    return <Loading />;
  }
};
