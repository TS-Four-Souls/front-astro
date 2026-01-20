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
      console.log("[🔌 Socket] Connected to socket");
    }

    function onConnectError(error: any) {
      console.error("[🔌 Socket] Failed to connect to socket", error);
    }

    function onDisconnect() {
      console.log("[🔌 Socket] Disconnected from socket");
    }

    function onGameStart() {
      setHasStarted(true);
    }

    function onGameChanged(state: DetailedState) {
      setState(state);
    }

    function onAnyOutgoing(event: string, ...args: any[]) {
      console.log("[🔌 Socket] Outgoing event", event, args);
    }

    function onAnyIncoming(event: string, ...args: any[]) {
      console.log("[🔌 Socket] Incoming event", event, args);
    }

    function onGameReset() {
      window.location.reload();
    }

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("on:game:start", onGameStart);
    socket.on("on:game:changed", onGameChanged);
    socket.on("on:game:reset", onGameReset);
    socket.onAnyOutgoing(onAnyOutgoing);
    socket.onAny(onAnyIncoming);

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("on:game:start", onGameStart);
      socket.off("on:game:changed", onGameChanged);
      socket.off("on:game:reset", onGameReset);
      socket.offAnyOutgoing(onAnyOutgoing);
      socket.offAny(onAnyIncoming);
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
