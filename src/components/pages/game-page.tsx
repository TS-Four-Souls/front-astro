import { type Room, type RoomBroadcast } from "@/shared/api";
import { socket } from "@/utils/socket";
import { storage } from "@/utils/storage";
import { useEffect, useState } from "react";
import { Board } from "../board/board";
import { BoardSelectionProvider } from "../board/contexts/board-selection-context";
import { GameAnimationProvider } from "../board/contexts/game-animation";
import { GameProvider } from "../board/contexts/game-context";
import { MainMenuProvider } from "../board/contexts/main-menu-context";
import { useToastContext } from "../board/contexts/toast-context";
import { OnboardingLayout } from "../onboarding-layout";
import { About } from "../onboarding/about";
import { CreateRoomForm } from "../onboarding/create-room-form";
import { Loading } from "../onboarding/loading";
import { RoomJoinForm } from "../onboarding/room-join-form";
import { RoomOptions } from "../onboarding/room-options";
import { StartStep } from "../onboarding/start-step";
import { translateError, ts } from "../../utils/translate";

export const GamePage = () => {
  const [room, setRoom] = useState<Room | null>(null);
  const { toast } = useToastContext();
  const [tryingToRejoin, setTryingToRejoin] = useState<boolean>(true);

  useEffect(() => {
    function onConnect() {
      console.log("[🔌 Socket] Connected to socket");

      const roomId = storage.getItem("roomId");
      const userId = storage.getItem("userId");

      if (userId && roomId) {
        socket.emit(
          "enterRoom",
          { type: "rejoin", roomId, userId },
          (response) => {
            if (response.status === 400)
              console.log(
                "[🔌 Socket] Failed to join as user",
                translateError(response.error),
              );
          },
        );
      }
      setTryingToRejoin(false);
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
      toast(broadcast.type, ts(broadcast.title), ts(broadcast.message));
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
    <OnboardingLayout
      withHeader={room?.players.find((player) => player.isMe) === undefined}>
      <BoardSelectionProvider>
        <OnboardingPages room={room} tryingToRejoin={tryingToRejoin} />
      </BoardSelectionProvider>
    </OnboardingLayout>
  );
};

interface OnboardingPagesProps {
  room: Room | null;
  tryingToRejoin: boolean;
}

export const OnboardingPages = ({
  room,
  tryingToRejoin,
}: OnboardingPagesProps) => {
  const [subPage, setSubPage] = useState<
    | { type: "join"; code: string }
    | { type: "create" }
    | { type: "about" }
    | undefined
  >();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      const url = new URL(window.location.href);
      url.searchParams.delete("code");
      window.history.replaceState({}, "", url.toString());
      setSubPage({ type: "join", code });
    }
  }, []);

  if (tryingToRejoin) {
    return <Loading />;
  }

  if (room) {
    return <StartStep room={room} />;
  }

  if (subPage?.type === "about") {
    return <About onClose={() => setSubPage(undefined)} />;
  }

  if (subPage?.type === "join") {
    return (
      <RoomJoinForm
        code={subPage.code}
        onSuccess={() => setSubPage(undefined)}
        onCancel={() => setSubPage(undefined)}
      />
    );
  }

  if (subPage?.type === "create") {
    return <CreateRoomForm onCancel={() => setSubPage(undefined)} />;
  }

  return (
    <RoomOptions
      onCreateRoom={() =>
        setTimeout(() => {
          setSubPage({ type: "create" });
        }, 30)
      }
      onAbout={() => {
        setTimeout(() => {
          setSubPage({ type: "about" });
        }, 30);
      }}
      onJoinRoom={() => {
        setTimeout(() => {
          setSubPage({ type: "join", code: "" });
        }, 30);
      }}
    />
  );
};
