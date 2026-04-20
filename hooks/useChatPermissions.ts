"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";

import { useChatUiMode } from "@/components/chat/chat-ui-mode";
import type { RootState } from "@/redux/store";
import type { UserRole } from "@/types/chat";

function normalizeRole(raw: unknown): UserRole | null {
  let val = "";
  if (typeof raw === "string") {
    val = raw.trim().toLowerCase();
  } else if (typeof raw === "number") {
    val = String(raw).trim().toLowerCase();
  }
  if (!val) return null;

  const normalized = val
    .replaceAll("_", "-")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-");

  if (normalized === "super-admin" || normalized === "superadmin") return "super-admin";
  if (normalized === "estate-admin" || normalized === "estateadmin") return "estate-admin";
  if (normalized === "admin") return "admin";
  if (normalized === "resident") return "resident";
  if (normalized === "security") return "security";

  // Back-compat: some parts of the app may use "super admin" / "estate admin"
  if (val === "super admin") return "super-admin";
  if (val === "estate admin") return "estate-admin";

  return null;
}

export function useChatPermissions() {
  const roleRaw = useSelector((state: RootState) => state.auth.user?.role);
  const role = useMemo(() => normalizeRole(roleRaw), [roleRaw]);
  const uiMode = useChatUiMode();

  return useMemo(() => {
    const isAgentInbox = uiMode === "agent" && role === "super-admin";

    return {
      role,
      uiMode,
      // Super-admin uses the agent inbox to respond, but should not start chats.
      canCreateChat: role !== null && role !== "super-admin",
      canAssignAgent: isAgentInbox,
      canCloseChat: isAgentInbox,
      canViewAgentChats: isAgentInbox,
      canDeleteMessage: isAgentInbox,
    };
  }, [role, uiMode]);
}

