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
import { About } from "../onboarding/about";

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
      if (room?.id) {
        storage.setItem("roomId", room.id);
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

  if (room?.game) {
    return (
      <GameProvider state={room.game} parameters={room.gameParameters}>
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
    <OnboardingLayout withHeader={room?.me === undefined}>
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
  const [viewingAbout, setViewingAbout] = useState<boolean>(false);
  const { toast } = useToastContext();

  // Retrieve the room ID and code from local storage
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    const roomId = storage.getItem("roomId");
    const name = storage.getItem("name");

    // Remove the code from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    window.history.replaceState({}, "", url.toString());

    if (code && code !== roomId) {
      socket.emit("enterRoom", { roomId: code }, (response) => {
        switch (response.status) {
          case 200:
            if (name) {
              socket.emit("setName", name, (response) => {
                if (response.status === 400)
                  toast("error", "Failed to join game", response.error);
              });
            }
            break;
          case 400:
            toast("error", "Incorrect room link", response.error);
            break;
        }
      });
      setTryingToRejoin(false);
      return;
    }

    const userId = storage.getItem("userId");

    if (userId && roomId) {
      socket.emit("enterRoom", { roomId, userId }, (response) => {
        if (response.status === 400)
          console.log("[🔌 Socket] Failed to join as user", response.error);
      });
    }
    setTryingToRejoin(false);
  }, []);

  const createRoom = () => {
    socket.emit("createRoom", (response) => {
      if (response.status === 400)
        toast("error", "Failed to create room", response.error);
    });
  };

  if (tryingToRejoin) {
    return <Loading />;
  }

  if (room) {
    if (room.me === undefined) {
      return <JoinForm />;
    }
    return <StartStep room={room} me={room.me} />;
  }

  if (viewingAbout) {
    return <About onClose={() => setViewingAbout(false)} />;
  }

  if (joiningRoom) {
    return (
      <RoomJoinForm
        onSuccess={() => setJoiningRoom(false)}
        onCancel={() => setJoiningRoom(false)}
      />
    );
  }

  return (
    <RoomOptions
      onCreateRoom={createRoom}
      onAbout={() => {
        setTimeout(() => {
          setViewingAbout(true);
        }, 30);
      }}
      onJoinRoom={() => {
        setTimeout(() => {
          setJoiningRoom(true);
        }, 30);
      }}
    />
  );
};
