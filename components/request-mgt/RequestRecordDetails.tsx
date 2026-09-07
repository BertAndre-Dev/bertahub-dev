"use client";

import { Paperclip } from "lucide-react";
import {
  getAttachmentFilename,
  openAttachmentInNewTab,
} from "@/lib/download-attachment";
import {
  formatRequestStatusLabel,
  getRequestStatusStyle,
  isFileRequestField,
  formatStepAssignees,
  type RequestRecordField,
  type RequestWorkflowStep,
} from "@/lib/request-record";

export function RequestRecordDetails({
  fieldValues,
  steps,
  currentStepOrder,
}: {
  fieldValues?: RequestRecordField[];
  steps?: RequestWorkflowStep[];
  currentStepOrder?: number;
}) {
  const fields = fieldValues ?? [];
  const workflowSteps = steps ?? [];

  if (fields.length === 0 && workflowSteps.length === 0) return null;

  return (
    <>
      {fields.length > 0 ? (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Submitted fields</p>
          <ul className="space-y-2">
            {fields.map((field, index) => {
              const label = field.label?.trim() || field.key || `Field ${index + 1}`;
              const value = field.value.trim();
              return (
                <li
                  key={`${field.key || label}-${index}`}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {value && isFileRequestField(field) ? (
                    <button
                      type="button"
                      onClick={() => openAttachmentInNewTab(value)}
                      className="mt-1 inline-flex items-center gap-2 text-sm text-[#2563EB] hover:underline cursor-pointer"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {getAttachmentFilename(value, index)}
                    </button>
                  ) : (
                    <p className="mt-1 font-medium whitespace-pre-wrap break-words">
                      {value || "—"}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {workflowSteps.length > 0 ? (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Workflow steps</p>
          <ul className="space-y-2">
            {workflowSteps.map((step, index) => {
              const isCurrent =
                currentStepOrder != null && step.order === currentStepOrder;
              const assignees = formatStepAssignees(step);
              return (
                <li
                  key={`${step.order ?? index}-${step.name ?? "step"}`}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    isCurrent
                      ? "border-[#0150AC]/40 bg-[#0150AC]/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {step.order != null ? `${step.order}. ` : ""}
                      {step.name || `Step ${index + 1}`}
                      {isCurrent ? (
                        <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-[#0150AC]">
                          Current
                        </span>
                      ) : null}
                    </span>
                    {step.status ? (
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize shrink-0 ${getRequestStatusStyle(step.status)}`}
                      >
                        {formatRequestStatusLabel(step.status)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assignees: {assignees}
                  </p>
                  {(step.assignedRecipients ?? [])
                    .map((recipient) => recipient.email?.trim())
                    .filter(Boolean)
                    .map((email) => (
                      <p
                        key={email}
                        className="text-xs text-muted-foreground"
                      >
                        {email}
                      </p>
                    ))}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </>
  );
}
