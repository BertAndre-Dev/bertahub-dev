import { io, type Socket } from "socket.io-client";

import { getSocketApiOrigin } from "@/lib/socket-api-url";

let socket: Socket | null = null;
let activeToken: string | null = null;

export function getSocket(jwt: string): Socket {
  if (socket?.connected && activeToken === jwt) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  activeToken = jwt;
  socket = io(getSocketApiOrigin(), {
    auth: { token: jwt },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect_error", (err) => {
    console.error("[socket] connect_error", err.message);
  });

  return socket;
}

export function reconnectSocket(jwt: string): Socket {
  disconnectSocket();
  return getSocket(jwt);
}

export function disconnectSocket(): void {
  activeToken = null;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getActiveSocket(): Socket | null {
  return socket;
}
