import { useCallback, useEffect, useState } from "react";
import { BASE_URL } from "astro:env/client";
import type { AdminMessage, AdminResponse, AdminRoom } from "@/shared/api";
import { OnboardingLayout } from "../onboarding-layout";
import { Button } from "../button";
import { useToastContext } from "../board/contexts/toast-context";

export const AdminPage = () => {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToastContext();

  const handleLogin = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin`, {
        headers: {
          "X-API-Key": password,
        },
      });
      if (!response.ok) {
        setIsLoggedIn(false);
        toast("error", "Invalid password", "The password is incorrect");
        return;
      }
      setIsLoggedIn(true);
    } catch (error) {
      toast("error", "Something went wrong", "Something went wrong");
      setIsLoggedIn(false);
      return;
    }
  };

  return (
    <>
      {isLoggedIn ? (
        <OnboardingLayout withHeader={false}>
          <AdminPostLoginPage password={password} />
        </OnboardingLayout>
      ) : (
        <OnboardingLayout withHeader>
          <img src="/logo.png" alt="Logo" className="mb-16 w-140" />
          <div className="flex flex-col gap-8 rounded-lg border-2 border-space-400 bg-space p-8 text-center text-lg max-sm:w-full max-sm:px-4">
            <h1 className="font-main text-3xl font-bold">Admin Login</h1>
            <div className="flex flex-col gap-4">
              <input
                type="password"
                placeholder="Password"
                value={password}
                className="rounded-md border-2 border-space-300 bg-space-500 px-4 py-2 text-white focus:ring-2 focus:ring-space-500 focus:outline-none"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
              />
              <Button
                onClick={handleLogin}
                label="Login"
                hotkey="enter"
                theme="onSpace"
              />
            </div>
          </div>
        </OnboardingLayout>
      )}
    </>
  );
};

export const AdminPostLoginPage = ({ password }: { password: string }) => {
  const [data, setData] = useState<AdminResponse | null>(null);
  const [displayingResolved, setDisplayingResolved] = useState(false);

  const updateData = useCallback(async () => {
    const response = await fetch(`${BASE_URL}/admin`, {
      headers: {
        "X-API-Key": password,
      },
    });
    const data: AdminResponse = await response.json();
    setData(data);
  }, [password]);

  useEffect(() => {
    updateData();
  }, [updateData]);

  const messages = displayingResolved
    ? (data?.messages ?? [])
    : (data?.messages.filter((message) => !message.resolved) ?? []);

  const handleResolve = async (id: string) => {
    const response = await fetch(`${BASE_URL}/admin/message/${id}/resolve`, {
      headers: {
        "X-API-Key": password,
      },
    });
    if (response.ok) {
      setData(await response.json());
    }
  };

  const handleDownloadLogs = async (logs: string | null) => {
    if (!logs) return;
    const response = await fetch(`${BASE_URL}/admin/logs/${logs}`, {
      headers: {
        "X-API-Key": password,
      },
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = logs;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-4">
        <h1 className="font-main text-3xl font-bold">Admin Page</h1>
        <Button onClick={updateData} label="Refresh data" theme="onSpace" />
      </div>
      {data ? (
        <>
          <div className="mt-12 min-h-64 rounded-lg border-2 border-space-400 bg-space p-4">
            <h2 className="mb-4 font-main text-2xl font-bold">Rooms</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2">
              {data.rooms.map((room) => (
                <AdminRoomCard key={room.id} room={room} />
              ))}
              {data.rooms.length === 0 && (
                <p className="text-sm text-gray-500">No rooms</p>
              )}
            </div>
          </div>
          <div className="mt-12 min-h-64 rounded-lg border-2 border-space-400 bg-space p-4">
            <div className="flex items-center justify-between">
              <h2 className="mb-4 font-main text-2xl font-bold">Messages</h2>
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
                  onResolve={() => handleResolve(message.id)}
                  onDownloadLogs={() => handleDownloadLogs(message.logs)}
                />
              ))}
              {messages.length === 0 && (
                <p className="text-sm text-gray-500">No messages</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      )}
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
  onResolve,
  onDownloadLogs,
}: {
  message: AdminMessage;
  onResolve: () => void;
  onDownloadLogs: () => void;
}) => {
  return (
    <div className="flex flex-col gap-2 rounded-md border-2 border-space-300 bg-space-500/30 p-4 select-text">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          Message #{message.id} ({message.type})
        </h2>
        {message.resolved ? (
          <span className="text-sm text-green-500">Resolved</span>
        ) : (
          <button
            className="cursor-pointer rounded-md bg-green-500/30 px-2 py-1 text-white hover:bg-green-600"
            onClick={onResolve}>
            Mark as resolved
          </button>
        )}
      </div>
      <p className="text-sm">
        Created at: {new Date(message.createdAt).toLocaleString()}
      </p>
      <p className="text-sm">
        Logs:{" "}
        {message.logs ? (
          <button
            className="cursor-pointer text-blue-500 hover:text-blue-600"
            onClick={onDownloadLogs}>
            Download
          </button>
        ) : (
          "No logs"
        )}
      </p>
      {message.email && <p className="text-sm">Email: {message.email}</p>}
      <p className="text-sm">
        Description:
        <br />
        {message.description}
      </p>
    </div>
  );
};
