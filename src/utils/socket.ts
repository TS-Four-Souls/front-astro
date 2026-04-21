import { BASE_URL, SERVER_API_KEY } from "astro:env/client";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../shared/api";

const isBrowser = typeof window !== "undefined";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  BASE_URL,
  {
    auth: {
      apiKey: SERVER_API_KEY,
    },
    autoConnect: isBrowser,
    transports: ["websocket"],
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  },
);
