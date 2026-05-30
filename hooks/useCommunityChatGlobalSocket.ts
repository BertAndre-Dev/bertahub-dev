"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { getSocket } from "@/lib/socket";
import {
  socketGroupAdded,
  socketGroupDeleted,
  socketGroupRemoved,
  socketGroupUpdated,
} from "@/redux/slice/community-group/community-group-slice";
import type {
  SocketGroupAddedPayload,
  SocketGroupDeletedPayload,
  SocketGroupRemovedPayload,
  SocketGroupUpdatedPayload,
} from "@/types/community-chat-socket";
import type { AppDispatch } from "@/redux/store";

/** App-level listeners for group list changes (sidebar / badges). */
export function useCommunityChatGlobalSocket(token: string | null | undefined) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);

    const onAdded = (payload: SocketGroupAddedPayload) => {
      dispatch(socketGroupAdded(payload));
    };
    const onRemoved = (payload: SocketGroupRemovedPayload) => {
      dispatch(socketGroupRemoved(payload));
    };
    const onUpdated = (payload: SocketGroupUpdatedPayload) => {
      dispatch(socketGroupUpdated(payload));
    };
    const onDeleted = (payload: SocketGroupDeletedPayload) => {
      dispatch(socketGroupDeleted(payload));
    };

    socket.on("group_added", onAdded);
    socket.on("group_removed", onRemoved);
    socket.on("group_updated", onUpdated);
    socket.on("group_deleted", onDeleted);

    return () => {
      socket.off("group_added", onAdded);
      socket.off("group_removed", onRemoved);
      socket.off("group_updated", onUpdated);
      socket.off("group_deleted", onDeleted);
    };
  }, [token, dispatch]);
}
