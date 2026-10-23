import type { VisitorDetailsData } from "@/app/(platform)/dashboard/security/types";
import type {
  GateAction,
  GateNextAction,
} from "@/redux/slice/security/visitor/visitor";
import type { VisitorVerificationFlags } from "@/lib/visitor-verification-mode";

export type GateResult = {
  action: GateAction | null;
  nextAction: GateNextAction;
  visitor: VisitorDetailsData | null;
  message: string | null;
  raw: unknown;
};

const GATE_ACTIONS = new Set<string>([
  "VIEWED",
  "CHECKED_IN",
  "VERIFIED",
  "CHECKED_OUT",
]);

const GATE_NEXT = new Set<string>([
  "VIEW",
  "VERIFY",
  "CHECK_IN",
  "CHECK_OUT",
  "NONE",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickAction(value: unknown): GateAction | null {
  if (typeof value !== "string") return null;
  const upper = value.toUpperCase().trim();
  return GATE_ACTIONS.has(upper) ? (upper as GateAction) : null;
}

function pickNextAction(value: unknown): GateNextAction {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return null;
  const upper = value.toUpperCase().trim();
  if (upper === "NONE" || upper === "DONE" || upper === "COMPLETE") return "NONE";
  return GATE_NEXT.has(upper) ? (upper as Exclude<GateNextAction, null>) : null;
}

function visitorFromUnknown(value: unknown): VisitorDetailsData | null {
  const root = asRecord(value);
  if (!root) return null;

  const nested = asRecord(root.visitor) ?? asRecord(root.data);
  const candidate = nested && "visitorCode" in nested ? nested : root;
  if (!candidate || typeof candidate.visitorCode !== "string") return null;

  return candidate as unknown as VisitorDetailsData;
}

/** Normalize POST /visitor-mgt/gate success payload into a stable shape. */
export function parseGateResponse(payload: unknown): GateResult {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;

  const action =
    pickAction(data.action) ??
    pickAction(root.action) ??
    pickAction(data.gateAction);

  // API returns null when the visit is complete (e.g. after CHECKED_OUT).
  const nextAction =
    data.nextAction === null || root.nextAction === null
      ? null
      : pickNextAction(data.nextAction) ??
        pickNextAction(root.nextAction) ??
        pickNextAction(data.next);

  const message =
    (typeof root.message === "string" && root.message.trim()) ||
    (typeof data.message === "string" && data.message.trim()) ||
    null;

  const visitor =
    visitorFromUnknown(data) ??
    visitorFromUnknown(root) ??
    visitorFromUnknown(data.visitor);

  return { action, nextAction, visitor, message, raw: payload };
}

export function gateActionLabel(action: GateAction | null): string {
  switch (action) {
    case "VIEWED":
      return "Viewed";
    case "CHECKED_IN":
      return "Checked in";
    case "VERIFIED":
      return "Verified";
    case "CHECKED_OUT":
      return "Checked out";
    default:
      return "Updated";
  }
}

export function gateActionTone(
  action: GateAction | null,
): "neutral" | "success" | "info" | "exit" {
  switch (action) {
    case "VIEWED":
      return "info";
    case "CHECKED_IN":
    case "VERIFIED":
      return "success";
    case "CHECKED_OUT":
      return "exit";
    default:
      return "neutral";
  }
}

/**
 * Prefer the API message when present — it already describes the outcome
 * and next step (e.g. "Visitor checked in. The next code or scan checks them out.").
 */
export function gateStatusCopy(result: GateResult | null): string | null {
  if (!result) return null;
  if (result.message?.trim()) return result.message.trim();
  if (result.action === "CHECKED_OUT" || result.nextAction == null) {
    return "Visit complete. No further gate steps.";
  }
  return gateNextActionHint(result.nextAction);
}

export function gateNextActionHint(next: GateNextAction): string | null {
  switch (next) {
    case "VIEW":
      return "Next: another officer can view this visitor.";
    case "VERIFY":
      return "Next: a different officer should verify to check them in.";
    case "CHECK_IN":
      return "Next: scan again to check this visitor in.";
    case "CHECK_OUT":
      return "Next: scan again when they leave to check out.";
    case "NONE":
      return "Visit complete. No further gate steps.";
    default:
      return null;
  }
}

/** Mode-aware guidance shown before any scan. */
export function gateModeGuidance(
  flags: VisitorVerificationFlags,
  description?: string | null,
): string {
  if (description?.trim()) return description.trim();

  if (flags.viewOnly) {
    return "Scan or enter a code to check the visitor in. Scan the same code again to check them out.";
  }
  if (flags.verifyOnly) {
    return "Scan or enter a code to verify and check in. Scan again when they leave to check out.";
  }
  return "First scan views the visitor. A different officer verifies and checks them in. Scan again to check out.";
}

export function formatGateDateTime(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
