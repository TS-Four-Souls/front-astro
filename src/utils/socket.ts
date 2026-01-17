import { BASE_URL } from "astro:env/client";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../shared/api";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(BASE_URL,  { transports: ["websocket"], timeout: 5000 });
