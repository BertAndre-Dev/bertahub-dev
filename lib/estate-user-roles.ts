import type { ChatGroupRoleToAdd } from "@/types/community-group";

/** Values accepted by GET /api/v1/user-mgt/estate/{estateId}?role= */
export type EstateUserRoleFilter =
  | "resident"
  | "staff"
  | "security"
  | "company"
  | "admin"
  | "estate admin";

export const DEFAULT_ESTATE_USER_ROLE: EstateUserRoleFilter = "resident";

export const ESTATE_USER_ROLE_FILTER_OPTIONS: {
  label: string;
  value: EstateUserRoleFilter;
}[] = [
  { label: "Residents", value: "resident" },
  { label: "Staff", value: "staff" },
  { label: "Security", value: "security" },
  { label: "Company", value: "company" },
  { label: "Admins", value: "admin" },
  { label: "Estate admins", value: "estate admin" },
];

export function chatGroupRoleToApiRole(
  role: ChatGroupRoleToAdd,
): EstateUserRoleFilter {
  switch (role) {
    case "RESIDENT":
      return "resident";
    case "ADMIN":
      return "admin";
    case "SECURITY":
      return "security";
    case "ESTATE_ADMIN":
      return "estate admin";
    default:
      return "resident";
  }
}
