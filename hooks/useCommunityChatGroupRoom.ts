"use client";

import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";

import { getSocket } from "@/lib/socket";
import { getChatGroupById } from "@/redux/slice/community-group/community-group-thunks";
import {
  clearGroupUnread,
  socketMessageDeleted,
  socketMessageEdited,
  socketMessageReceived,
  socketMessagesRead,
} from "@/redux/slice/community-group/community-group-slice";
import type {
  SocketMemberEventPayload,
  SocketMessageDeletedPayload,
  SocketMessageEditedPayload,
  SocketMessageReceivedPayload,
  SocketMessagesReadPayload,
} from "@/types/community-chat-socket";
import type { AppDispatch } from "@/redux/store";

type Options = {
  groupId: string | null;
  token: string | null | undefined;
  currentUserId?: string | null;
};

/**
 * Joins a chat group room and applies live message / membership updates to Redux.
 * Call when the user opens a group thread; cleans up on unmount or group change.
 */
export function useCommunityChatGroupRoom({
  groupId,
  token,
  currentUserId,
}: Options) {
  const dispatch = useDispatch<AppDispatch>();

  const refreshGroupMeta = useCallback(() => {
    if (!groupId) return;
    void dispatch(getChatGroupById({ groupId }));
  }, [dispatch, groupId]);

  useEffect(() => {
    if (!groupId) return;
    dispatch(clearGroupUnread({ groupId }));
  }, [dispatch, groupId]);

  useEffect(() => {
    if (!token || !groupId) return;

    const socket = getSocket(token);

    const join = () => {
      socket.emit("join_group", { groupId });
    };

    join();

    const onReceived = (payload: SocketMessageReceivedPayload) => {
      if (payload.groupId !== groupId) return;
      dispatch(
        socketMessageReceived({
          payload,
          currentUserId: currentUserId ?? null,
        }),
      );
    };

    const onEdited = (payload: SocketMessageEditedPayload) => {
      if (payload.groupId !== groupId) return;
      dispatch(socketMessageEdited(payload));
    };

    const onDeleted = (payload: SocketMessageDeletedPayload) => {
      if (payload.groupId !== groupId) return;
      dispatch(socketMessageDeleted(payload));
    };

    const onRead = (payload: SocketMessagesReadPayload) => {
      if (payload.groupId !== groupId) return;
      dispatch(socketMessagesRead(payload));
    };

    const onMemberChange = (payload: SocketMemberEventPayload) => {
      if (payload.groupId !== groupId) return;
      refreshGroupMeta();
    };

    socket.on("connect", join);
    socket.on("message_received", onReceived);
    socket.on("message_edited", onEdited);
    socket.on("message_deleted", onDeleted);
    socket.on("messages_read", onRead);
    socket.on("member_joined", onMemberChange);
    socket.on("member_removed", onMemberChange);
    socket.on("admin_promoted", onMemberChange);

    return () => {
      socket.emit("leave_group", { groupId });
      socket.off("connect", join);
      socket.off("message_received", onReceived);
      socket.off("message_edited", onEdited);
      socket.off("message_deleted", onDeleted);
      socket.off("messages_read", onRead);
      socket.off("member_joined", onMemberChange);
      socket.off("member_removed", onMemberChange);
      socket.off("admin_promoted", onMemberChange);
    };
  }, [token, groupId, currentUserId, dispatch, refreshGroupMeta]);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!token || !groupId) return;
      const socket = getSocket(token);
      if (isTyping) {
        socket.emit("typing", { groupId, isTyping: true });
      } else {
        socket.emit("stop_typing", { groupId });
      }
    },
    [token, groupId],
  );

  return { emitTyping };
}
