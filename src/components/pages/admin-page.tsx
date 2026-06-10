import { useEffect, useMemo, useState } from "react";
import type { AdminMessage, AdminResponse, AdminRoom } from "@/shared/api";
import { OnboardingLayout } from "../onboarding-layout";
import { Button } from "../button";
import { useToastContext } from "../board/contexts/toast-context";
import { socket } from "@/utils/socket";
import { storage } from "@/utils/storage";
import { LoginForm } from "../admin/login-form";
import { Checkbox } from "@/icons/checkbox";
import { Download } from "@/icons/download";
import { Reply } from "@/icons/reply";
import {
  ReplyProvider,
  useReplyContext,
} from "../admin/contexts/reply-context";

export const AdminPage = () => {
  const [adminResponse, setAdminResponse] = useState<AdminResponse | null>(
    null,
  );

  useEffect(() => {
    function onConnect() {
      const adminPassword = storage.getItem("adminPassword");

      if (!adminPassword) {
        return;
      }

      socket.emit("adminLogin", { password: adminPassword }, (response) => {
        if (response.status === 400)
          console.log("[🔌 Socket] Failed to login as admin", response.error);
      });
    }

    function onConnectError(error: any) {
      console.error("[🔌 Socket] Failed to connect to socket", error);
    }

    function onDisconnect() {
      console.log("[🔌 Socket] Disconnected from socket");
    }

    function onAdminChanged(adminResponse: AdminResponse | null) {
      console.log("[🔌 Socket] Admin response changed", adminResponse);
      setAdminResponse(adminResponse);
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
    socket.on("on:admin:changed", onAdminChanged);
    socket.onAnyOutgoing(onAnyOutgoing);
    socket.onAny(onAnyIncoming);

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("on:admin:changed", onAdminChanged);
      socket.offAnyOutgoing(onAnyOutgoing);
      socket.offAny(onAnyIncoming);
    };
  }, []);

  return (
    <>
      {adminResponse ? (
        <OnboardingLayout withHeader={false}>
          <ReplyProvider>
            <AdminPostLoginPage adminResponse={adminResponse} />
          </ReplyProvider>
        </OnboardingLayout>
      ) : (
        <LoginForm />
      )}
    </>
  );
};

export const AdminPostLoginPage = ({
  adminResponse: data,
}: {
  adminResponse: AdminResponse;
}) => {
  const { toast } = useToastContext();
  const { openReplyPopup } = useReplyContext();
  const { rooms } = data;
  const [displayingResolved, setDisplayingResolved] = useState(false);

  function handleStatusChange(message: AdminMessage): void {
    socket.emit(
      "adminChangeMessageStatus",
      { id: message.id, resolved: !message.resolved },
      (response) => {
        if (response.status === 400)
          toast("error", "Failed to change message status", response.error);
      },
    );
  }

  function handleDownloadLogs(message: AdminMessage): void {
    socket.emit("adminGetLogs", { id: message.id }, (response) => {
      switch (response.status) {
        case 200:
          const logs = response.logs;
          const blob = new Blob([JSON.stringify(logs, null, 2)], {
            type: "application/json",
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = message.logs ?? `logs-${message.id}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          break;
        case 400:
        case 500:
          toast("error", "Failed to get logs", response.error);
          break;
      }
    });
  }

  function handleReply(message: AdminMessage): void {
    openReplyPopup(message);
  }

  const messages = useMemo(() => {
    return data.messages.filter((message) => {
      if (displayingResolved) {
        return true;
      }
      return !message.resolved;
    });
  }, [data.messages, displayingResolved]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-main text-3xl font-bold">Admin Page</h1>
        <Button
          label="Logout"
          onClick={() => {
            storage.removeItem("adminPassword");
            window.location.reload();
          }}
          theme="onSpace"
        />
      </div>
      <div className="mt-12 min-h-64 rounded-lg border-2 border-space-400 bg-space p-4">
        <h2 className="mb-4 font-main text-2xl font-bold">Rooms</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2">
          {rooms.map((room) => (
            <AdminRoomCard key={room.id} room={room} />
          ))}
          {rooms.length === 0 && (
            <p className="text-sm text-gray-500">No rooms</p>
          )}
        </div>
      </div>
      <div className="mt-12 min-h-64 rounded-lg border-2 border-space-400 bg-space p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-main text-2xl font-bold">Messages</h2>
          <Button
            onClick={() => setDisplayingResolved(!displayingResolved)}
            label={
              displayingResolved
                ? "Hide resolved messages"
                : "Show resolved messages"
            }
            theme="onSpace"
          />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(500px,1fr))] gap-2">
          {messages.map((message) => (
            <AdminMessageCard
              key={message.id}
              message={message}
              onStatusToggle={() => handleStatusChange(message)}
              onDownloadLogs={() => handleDownloadLogs(message)}
              onReply={() => handleReply(message)}
            />
          ))}
          {messages.length === 0 && (
            <p className="text-sm text-gray-500">No messages</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminRoomCard = ({ room }: { room: AdminRoom }) => {
  return (
    <div className="flex flex-col gap-2 rounded-md border-2 border-space-300 bg-space-500/30 p-4 select-text">
      <h2 className="text-lg font-bold">{room.id}</h2>
      <p className="text-sm">
        Created at: {new Date(room.createdAt).toLocaleString()}
      </p>
      <p className="text-sm">
        Last action: {new Date(room.lastAction).toLocaleString()}
      </p>
      <p className="text-sm">
        There are {room.users} user{room.users > 1 ? "s" : ""}
      </p>
      <p className="text-sm">
        {room.game === false
          ? "No game"
          : `Game is ongoing, ${room.game.round} round${room.game.round > 1 ? "s" : ""}, max soul: ${room.game.maxSoul}`}
      </p>
    </div>
  );
};

export const AdminMessageCard = ({
  message,
  onStatusToggle,
  onDownloadLogs,
  onReply,
}: {
  message: AdminMessage;
  onStatusToggle: () => void;
  onDownloadLogs: () => void;
  onReply: () => void;
}) => {
  return (
    <div className="flex flex-col gap-2 rounded-md border-2 border-space-300 bg-space-500/30 p-4 select-text">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold">
            Message #{message.id} ({message.type})
          </h2>
          <p className="text-sm text-space-100">
            {new Date(message.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {message.email && !message.reply && (
            <div
              onClick={onReply}
              title="Reply"
              className="cursor-pointer transition-transform duration-200 hover:scale-110">
              <Reply />
            </div>
          )}
          {message.logs && (
            <div
              onClick={onDownloadLogs}
              title="Download Logs"
              className="cursor-pointer transition-transform duration-200 hover:scale-110">
              <Download />
            </div>
          )}
          <div
            onClick={onStatusToggle}
            title={
              message.resolved ? "Mark as unresolved" : "Mark as resolved"
            }>
            <Checkbox
              checked={message.resolved}
              className="h-8 w-8 cursor-pointer transition-transform duration-200 hover:scale-110"
            />
          </div>
        </div>
      </div>

      <p>
        <span className="text-sm text-space-100">From:</span>{" "}
        <span className="font-bold">{message.email ?? "Anonymous"}</span>
      </p>
      <p className="border-t border-space-500 pt-6 font-mono text-sm leading-snug whitespace-pre-wrap">
        {message.description}
      </p>

      {message.reply && (
        <div className="mt-4 rounded-md bg-space-500/30 p-4">
          <p className="text-sm text-space-100">Reply:</p>
          <p className="mt-4 font-mono text-sm whitespace-pre-wrap">
            {message.reply}
          </p>
        </div>
      )}
    </div>
  );
};
