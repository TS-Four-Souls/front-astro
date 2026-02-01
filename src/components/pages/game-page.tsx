import { useEffect, useState } from "react";
import { JoinForm } from "../onboarding/join-form";
import { StartStep } from "../onboarding/start-step";
import { Board } from "../board/board";
import { socket } from "@/utils/socket";
import { schemas, type Room } from "@/shared/api";
import { GameProvider } from "../board/contexts/game-context";
import { Loading } from "../onboarding/loading";
import { MainMenuProvider } from "../board/contexts/main-menu-context";

export const GamePage = () => {
  const [room, setRoom] = useState<Room | null>(null);
  const [tryingToRejoin, setTryingToRejoin] = useState<boolean>(true);

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

    function onRoomChanged(room: Room | null) {
      console.log("[🔌 Socket] Room changed", room);
      setRoom(room);
    }

    function onAnyOutgoing(event: string, ...args: any[]) {
      console.log("[🔌 Socket] Outgoing event", event, args);
    }

    function onAnyIncoming(event: string, ...args: any[]) {
      console.log("[🔌 Socket] Incoming event", event, args);
    }

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("on:room:changed", onRoomChanged);
    socket.onAnyOutgoing(onAnyOutgoing);
    socket.onAny(onAnyIncoming);

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("on:room:changed", onRoomChanged);
      socket.offAnyOutgoing(onAnyOutgoing);
      socket.offAny(onAnyIncoming);
    };
  }, []);

  // Retrieve the secret from local storage
  useEffect(() => {
    // Read the secret from local storage
    try {
      const textLocalStorageIssuer = localStorage.getItem("issuer") ?? "";
      const objectLocalStorageIssuer = JSON.parse(textLocalStorageIssuer);
      const localStorageIssuer = schemas.issuer.parse(objectLocalStorageIssuer);
      socket.emit("rejoin", localStorageIssuer, (response) => {
        console.log("[🔌 Socket] Rejoin response", response);
        setTryingToRejoin(false);
      });
    } catch (error) {
      console.log("[🔌 Socket] Invalid issuer", error);
      setTryingToRejoin(false);
      return;
    }
  }, []);

  useEffect(() => {
    if (room) {
      localStorage.setItem("issuer", JSON.stringify(room.issuer));
    }
  }, [room?.issuer]);

  if (tryingToRejoin) {
    return <Loading />;
  } else if (!room) {
    return <JoinForm />;
  } else if (!room.gameState) {
    return <StartStep room={room} />;
  } else if (room.gameState) {
    return (
      <GameProvider state={room.gameState} issuer={room.issuer}>
        <MainMenuProvider>
          <Board />
        </MainMenuProvider>
      </GameProvider>
    );
  }
};
