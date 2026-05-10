import { useEffect, useState } from "react";
import { JoinForm } from "../onboarding/join-form";
import { StartStep } from "../onboarding/start-step";
import { Board } from "../board/board";
import { socket } from "@/utils/socket";
import { type Room, type RoomBroadcast } from "@/shared/api";
import { GameProvider } from "../board/contexts/game-context";
import { Loading } from "../onboarding/loading";
import { MainMenuProvider } from "../board/contexts/main-menu-context";
import { RoomOptions } from "../onboarding/room-options";
import { RoomJoinForm } from "../onboarding/room-join-form";
import { OnboardingLayout } from "../onboarding-layout";
import { storage } from "@/utils/storage";
import { BoardSelectionProvider } from "../board/contexts/board-selection-context";
import { GameAnimationProvider } from "../board/contexts/game-animation";
import { useToastContext } from "../board/contexts/toast-context";

export const GamePage = () => {
  const [room, setRoom] = useState<Room | null>(null);
  const { toast } = useToastContext();

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
      if (room?.room.id) {
        storage.setItem("roomId", room.room.id);
      } else {
        storage.removeItem("roomId");
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

    function onRoomBroadcast(broadcast: RoomBroadcast) {
      console.log("[🔌 Socket] Room broadcast", broadcast);
      toast(broadcast.type, broadcast.title, broadcast.message);
    }

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("on:room:changed", onRoomChanged);
    socket.on("on:user:assigned", onUserAssigned);
    socket.on("on:room:broadcast", onRoomBroadcast);
    socket.onAnyOutgoing(onAnyOutgoing);
    socket.onAny(onAnyIncoming);

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("on:room:changed", onRoomChanged);
      socket.off("on:user:assigned", onUserAssigned);
      socket.off("on:room:broadcast", onRoomBroadcast);
      socket.offAnyOutgoing(onAnyOutgoing);
      socket.offAny(onAnyIncoming);
    };
  }, []);

  if (room?.room.state === "joined" && room.gameState) {
    return (
      <GameProvider state={room.gameState}>
        <BoardSelectionProvider>
          <MainMenuProvider>
            <GameAnimationProvider>
              <Board />
            </GameAnimationProvider>
          </MainMenuProvider>
        </BoardSelectionProvider>
      </GameProvider>
    );
  }

  return (
    <OnboardingLayout headerMode={room?.room.state === "joined"}>
      <BoardSelectionProvider>
        <OnboardingPages room={room} />
      </BoardSelectionProvider>
    </OnboardingLayout>
  );
};

interface OnboardingPagesProps {
  room: Room | null;
}

export const OnboardingPages = ({ room }: OnboardingPagesProps) => {
  const [tryingToRejoin, setTryingToRejoin] = useState<boolean>(true);
  const [joiningRoom, setJoiningRoom] = useState<boolean>(false);
  const { toast } = useToastContext();

  // Retrieve the secret from local storage
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    const roomId = storage.getItem("roomId");
    const name = storage.getItem("name");

    // Remove the code from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    window.history.replaceState({}, "", url.toString());

    if (code && code !== roomId) {
      setTryingToRejoin(false);
      socket.emit("joinRoom", { roomId: code }, (response) => {
        switch (response.status) {
          case 200:
            if (name) {
              socket.emit("join", name, (response) => {
                switch (response.status) {
                  case 200:
                    break;
                  case 400:
                    toast("error", "Failed to join game", response.error);
                    break;
                }
              });
            }
            break;
          case 400:
            toast("error", "Incorrect room link", response.error);
            break;
        }
      });
      return;
    }

    const userId = storage.getItem("userId");
    if (userId) {
      try {
        socket.emit("rejoin", { userId }, (response) => {
          console.log("[🔌 Socket] Join as user response", response);
          setTryingToRejoin(false);
        });
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
