import { useEffect, useState } from "react";
import { JoinForm } from "../onboarding/join-form";
import { StartStep } from "../onboarding/start-step";
import { Board } from "../board/board";
import { socket } from "@/utils/socket";
import { schemas, type Room } from "@/shared/api";
import { GameProvider } from "../board/contexts/game-context";
import { Loading } from "../onboarding/loading";
import { MainMenuProvider } from "../board/contexts/main-menu-context";
import { RoomOptions } from "../onboarding/room-options";
import { RoomJoinForm } from "../onboarding/room-join-form";
import { OnboardingLayout } from "../onboarding-layout";
import { storage } from "@/utils/storage";
import { BoardSelectionProvider } from "../board/contexts/board-selection-context";

export const GamePage = () => {
  const [room, setRoom] = useState<Room | null>(null);

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
      if (room?.room.state === "joined") {
        storage.setItem("issuer", JSON.stringify(room.room.issuer));
      }
    }

    function onAnyOutgoing(event: string, ...args: any[]) {
      console.log("[🔌 Socket] Outgoing event", event, args);
    }

    function onAnyIncoming(event: string, ...args: any[]) {
      console.log("[🔌 Socket] Incoming event", event, args);
    }

    function onUserAssigned(userId: string | null) {
      console.log("[🔌 Socket] User assigned", userId);
      if (userId) {
        storage.setItem("userId", userId);
      } else {
        storage.removeItem("userId");
      }
    }

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("on:room:changed", onRoomChanged);
    socket.on("on:user:assigned", onUserAssigned);
    socket.onAnyOutgoing(onAnyOutgoing);
    socket.onAny(onAnyIncoming);

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("on:room:changed", onRoomChanged);
      socket.off("on:user:assigned", onUserAssigned);
      socket.offAnyOutgoing(onAnyOutgoing);
      socket.offAny(onAnyIncoming);
    };
  }, []);

  if (room?.room.state === "joined" && room.gameState) {
    return (
      <GameProvider state={room.gameState} issuer={room.room.issuer}>
        <BoardSelectionProvider>
          <MainMenuProvider>
            <Board />
          </MainMenuProvider>
        </BoardSelectionProvider>
      </GameProvider>
    );
  }

  return (
    <OnboardingLayout headerMode={room?.room.state === "joined"}>
      <OnboardingPages room={room} />
    </OnboardingLayout>
  );
};

interface OnboardingPagesProps {
  room: Room | null;
}

export const OnboardingPages = ({ room }: OnboardingPagesProps) => {
  const [tryingToRejoin, setTryingToRejoin] = useState<boolean>(true);
  const [joiningRoom, setJoiningRoom] = useState<boolean>(false);

  // Retrieve the secret from local storage
  useEffect(() => {
    const userId = storage.getItem("userId");
    if (userId) {
      try {
        const textLocalStorageIssuer = storage.getItem("issuer") ?? "";
        const objectLocalStorageIssuer = JSON.parse(textLocalStorageIssuer);
        const localStorageIssuer = schemas.issuer.parse(
          objectLocalStorageIssuer,
        );

        socket.emit(
          "rejoin",
          { userId, issuer: localStorageIssuer },
          (response) => {
            console.log("[🔌 Socket] Join as user response", response);
            setTryingToRejoin(false);
          },
        );
        return;
      } catch (error) {
        console.log("[🔌 Socket] Invalid issuer", error);
      }

      socket.emit("rejoin", { userId }, (response) => {
        switch (response.status) {
          case 200:
            console.log("[🔌 Socket] Joined as user", userId);
            break;
          case 400:
          default:
            console.log("[🔌 Socket] Failed to join as user", response.error);
            break;
        }
      });
    }
    setTryingToRejoin(false);
  }, []);

  const createRoom = () => {
    socket.emit("createRoom", (response) => {
      console.log("[🔌 Socket] Create room response", response);
    });
  };

  if (tryingToRejoin) {
    return <Loading />;
  } else if (!room && !joiningRoom) {
    return (
      <RoomOptions
        onCreateRoom={createRoom}
        onJoinRoom={() => {
          setTimeout(() => {
            setJoiningRoom(true);
          }, 30);
        }}
      />
    );
  } else if (!room && joiningRoom) {
    return (
      <RoomJoinForm
        onSuccess={() => setJoiningRoom(false)}
        onCancel={() => setJoiningRoom(false)}
      />
    );
  } else if (room && room.room.state === "created") {
    return <JoinForm />;
  } else if (room && room.room.state === "joined" && !room.gameState) {
    return <StartStep room={room.room} />;
  }
};
