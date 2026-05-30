"use client";

import { useEffect, type ReactNode } from "react";
import { useSelector } from "react-redux";

import { disconnectSocket, getSocket } from "@/lib/socket";
import { useCommunityChatGlobalSocket } from "@/hooks/useCommunityChatGlobalSocket";
import type { RootState } from "@/redux/store";

type Props = {
  children: ReactNode;
};

/**
 * Keeps a single Socket.IO connection for community chat while the user is
 * authenticated. Global group events update the Redux sidebar; per-group
 * rooms are joined from community chat pages via `useCommunityChatGroupRoom`.
 */
export function CommunityChatSocketProvider({ children }: Props) {
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }
    getSocket(token);
  }, [token]);

  useCommunityChatGlobalSocket(token);

  return <>{children}</>;
}
