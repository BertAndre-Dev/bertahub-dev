"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  APPROVAL_MODE_OPTIONS,
  type ApprovalMode,
  type WorkflowStep,
  createEmptyWorkflowStep,
} from "@/redux/slice/admin/request/admin-request";
import type { AppDispatch } from "@/redux/store";
import {
  WORKFLOW_USER_ROLES,
  fetchWorkflowEstateUsers,
  formatWorkflowRoleLabel,
  type WorkflowEstateUser,
  type WorkflowUserRole,
} from "@/components/request-mgt/workflow-users";

const pickerSpring = { type: "spring" as const, bounce: 0, duration: 0.32 };

interface WorkflowStepsEditorProps {
  readonly steps: WorkflowStep[];
  readonly onChange: (steps: WorkflowStep[]) => void;
  readonly estateId?: string | null;
  readonly companyId?: string | null;
  readonly disabled?: boolean;
}

function AddStepButton({
  disabled,
  onClick,
}: Readonly<{
  disabled?: boolean;
  onClick: () => void;
}>) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="w-full sm:w-auto active:scale-[0.97] transition-transform duration-100 ease-out"
    >
      <Plus className="h-4 w-4 mr-1.5" />
      Add step
    </Button>
  );
}

function SettingToggle({
  checked,
  disabled,
  label,
  onCheckedChange,
}: Readonly<{
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (next: boolean) => void;
}>) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 border border-black/5 px-3.5 py-2.5 min-w-[180px] flex-1">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5",
          "transition-[background-color,transform] duration-100 ease-out active:scale-[0.97]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0150AC]/40",
          "disabled:opacity-40 disabled:pointer-events-none",
          checked ? "bg-[#0150AC]" : "bg-black/15",
        )}
      >
        <motion.span
          layout
          className="block size-6 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 16 : 0 }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { type: "spring", bounce: 0, duration: 0.32 }
          }
        />
      </button>
    </div>
  );
}

function renumber(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((step, index) => ({ ...step, order: index + 1 }));
}

export default function WorkflowStepsEditor({
  steps,
  onChange,
  estateId,
  companyId,
  disabled = false,
}: WorkflowStepsEditorProps) {
  const dispatch = useDispatch<AppDispatch>();
  const reduceMotion = useReducedMotion();
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [userOptions, setUserOptions] = useState<WorkflowEstateUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);
  const [activeRole, setActiveRole] = useState<WorkflowUserRole | null>(null);

  useEffect(() => {
    if (!estateId) return;
    let cancelled = false;
    (async () => {
      setUsersLoading(true);
      try {
        const next = await fetchWorkflowEstateUsers(
          dispatch,
          estateId,
          companyId,
        );
        if (!cancelled) setUserOptions(next);
      } catch {
        if (!cancelled) setUserOptions([]);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, estateId, companyId]);

  useEffect(() => {
    if (openPickerIndex == null) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpenPickerIndex(null);
        setActiveRole(null);
        setUserSearch("");
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openPickerIndex]);

  const usersByRole = useMemo(() => {
    const grouped = new Map<WorkflowUserRole, WorkflowEstateUser[]>();
    WORKFLOW_USER_ROLES.forEach((role) => grouped.set(role.value, []));
    userOptions.forEach((user) => {
      grouped.get(user.role)?.push(user);
    });
    return grouped;
  }, [userOptions]);

  const usersById = useMemo(() => {
    const map = new Map<string, WorkflowEstateUser>();
    userOptions.forEach((user) => map.set(user.id, user));
    return map;
  }, [userOptions]);

  const filteredRoleUsers = useMemo(() => {
    if (!activeRole) return [];
    const q = userSearch.trim().toLowerCase();
    const list = usersByRole.get(activeRole) ?? [];
    if (!q) return list;
    return list.filter(
      (u) =>
        u.label.toLowerCase().includes(q) || u.id.toLowerCase().includes(q),
    );
  }, [activeRole, userSearch, usersByRole]);

  const updateStep = (index: number, patch: Partial<WorkflowStep>) => {
    onChange(
      steps.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    );
  };

  const addStep = () => {
    onChange(renumber([...steps, createEmptyWorkflowStep(steps.length + 1)]));
  };

  const removeStep = (index: number) => {
    onChange(renumber(steps.filter((_, i) => i !== index)));
  };

  const toggleUser = (index: number, userId: string) => {
    const step = steps[index];
    const current = step.userIds ?? [];
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    updateStep(index, { userIds: next });
  };

  const closePicker = () => {
    setOpenPickerIndex(null);
    setActiveRole(null);
    setUserSearch("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
          Approval steps
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground leading-snug">
          Add ordered approval steps, then pick users for each step.
        </p>
      </div>

      {steps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-[#F7F8FA] px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No steps yet. Add an approval step to get started.
          </p>
          <div className="mt-4 flex justify-center">
            <AddStepButton disabled={disabled} onClick={addStep} />
          </div>
        </div>
      ) : null}

      <ol className="space-y-3">
        {steps.map((step, index) => {
          const selectedIds = step.userIds ?? [];
          const selectedUsers = selectedIds
            .map((id) => usersById.get(id))
            .filter(Boolean) as WorkflowEstateUser[];
          const isOpen = openPickerIndex === index;

          return (
            <li
              key={`step-${index}`}
              className="rounded-2xl border border-black/5 bg-[#F7F8FA] p-4 space-y-4 transition-[background-color,box-shadow] duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0150AC]/10 text-sm font-semibold text-[#0150AC] tabular-nums"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium text-foreground truncate">
                    {step.name?.trim() || `Step ${index + 1}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  disabled={disabled}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-[#D31510] hover:bg-[#D31510]/8 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97] transition-[transform,background-color] duration-100 ease-out cursor-pointer"
                  aria-label={`Remove step ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                <div>
                  <Label htmlFor={`step-name-${index}`}>Step name</Label>
                  <Input
                    id={`step-name-${index}`}
                    value={step.name}
                    onChange={(e) =>
                      updateStep(index, { name: e.target.value })
                    }
                    placeholder="Step name"
                    className="mt-1.5 rounded-xl"
                    disabled={disabled}
                  />
                </div>

                <div>
                  <Label htmlFor={`step-mode-${index}`}>Approval mode</Label>
                  <Select
                    id={`step-mode-${index}`}
                    options={APPROVAL_MODE_OPTIONS}
                    value={step.approvalMode}
                    onChange={(e) =>
                      updateStep(index, {
                        approvalMode: e.target.value as ApprovalMode,
                      })
                    }
                    className="mt-1.5 w-full rounded-xl"
                    disabled={disabled}
                  />
                </div>

                <div className="space-y-2.5">
                  <Label>Users</Label>
                  <div
                    ref={isOpen ? pickerRef : undefined}
                    className="relative"
                  >
                      <button
                        type="button"
                        disabled={disabled || !estateId}
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        onClick={() => {
                          if (isOpen) {
                            closePicker();
                            return;
                          }
                          setOpenPickerIndex(index);
                          setActiveRole(null);
                          setUserSearch("");
                        }}
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-white px-3 text-sm text-left",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0150AC]/40",
                          "active:scale-[0.99] transition-transform duration-100 ease-out",
                          "disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
                        )}
                      >
                        <span
                          className={
                            selectedIds.length
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {selectedIds.length
                            ? `${selectedIds.length} user${selectedIds.length === 1 ? "" : "s"} selected`
                            : "Select users"}
                        </span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-90",
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {isOpen ? (
                          <motion.div
                            initial={
                              reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: -6, scale: 0.98 }
                            }
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={
                              reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: -4, scale: 0.98 }
                            }
                            transition={
                              reduceMotion ? { duration: 0.15 } : pickerSpring
                            }
                            className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_12px_32px_rgba(16,24,40,0.12)] origin-top"
                          >
                            {activeRole ? (
                              <div>
                                <div className="flex items-center gap-2 border-b border-black/5 px-2 py-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveRole(null);
                                      setUserSearch("");
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-[#0150AC] hover:bg-[#0150AC]/8 active:scale-[0.97] transition-[transform,background-color] duration-100 ease-out cursor-pointer"
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                    {formatWorkflowRoleLabel(activeRole)}
                                  </button>
                                </div>
                                <div className="p-2">
                                  <Input
                                    value={userSearch}
                                    onChange={(e) =>
                                      setUserSearch(e.target.value)
                                    }
                                    placeholder="Search users..."
                                    className="rounded-lg"
                                    disabled={disabled}
                                  />
                                </div>
                                <div className="max-h-52 overflow-y-auto">
                                  {usersLoading ? (
                                    <p className="px-3 py-4 text-sm text-muted-foreground">
                                      Loading users...
                                    </p>
                                  ) : null}
                                  {!usersLoading &&
                                  filteredRoleUsers.length === 0 ? (
                                    <p className="px-3 py-4 text-sm text-muted-foreground">
                                      No users in this role.
                                    </p>
                                  ) : null}
                                  {!usersLoading &&
                                    filteredRoleUsers.map((user) => {
                                      const checked = selectedIds.includes(
                                        user.id,
                                      );
                                      return (
                                        <label
                                          key={user.id}
                                          className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-black/3 active:bg-black/5 transition-colors duration-100"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              toggleUser(index, user.id)
                                            }
                                            disabled={disabled}
                                            className="size-4 rounded border-input accent-[#0150AC]"
                                          />
                                          <span className="min-w-0 truncate">
                                            {user.label}
                                          </span>
                                        </label>
                                      );
                                    })}
                                </div>
                              </div>
                            ) : (
                              <div className="py-1">
                                {WORKFLOW_USER_ROLES.map((role) => {
                                  const count =
                                    usersByRole.get(role.value)?.length ?? 0;
                                  const selectedInRole = selectedIds.filter(
                                    (id) =>
                                      usersByRole
                                        .get(role.value)
                                        ?.some((user) => user.id === id),
                                  ).length;
                                  return (
                                    <button
                                      key={role.value}
                                      type="button"
                                      onClick={() => setActiveRole(role.value)}
                                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-black/3 active:bg-black/5 active:scale-[0.99] transition-[transform,background-color] duration-100 ease-out cursor-pointer"
                                    >
                                      <span className="font-medium">
                                        {role.label}
                                      </span>
                                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                                        {selectedInRole > 0 ? (
                                          <span className="text-xs text-[#0150AC]">
                                            {selectedInRole} selected
                                          </span>
                                        ) : (
                                          <span className="text-xs">
                                            {usersLoading ? "…" : count}
                                          </span>
                                        )}
                                        <ChevronRight className="h-4 w-4" />
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>

                    {selectedUsers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUsers.map((user) => (
                          <span
                            key={user.id}
                            className="inline-flex max-w-full items-center gap-1 rounded-full bg-white border border-black/8 px-2.5 py-1 text-xs"
                          >
                            <span className="truncate">{user.label}</span>
                            <button
                              type="button"
                              aria-label={`Remove ${user.label}`}
                              disabled={disabled}
                              onClick={() => toggleUser(index, user.id)}
                              className="rounded-full p-0.5 hover:bg-black/5 active:scale-[0.97] cursor-pointer disabled:opacity-40"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : selectedIds.length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {selectedIds.length} user
                        {selectedIds.length === 1 ? "" : "s"} selected
                      </p>
                    ) : null}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <SettingToggle
                  label="Allow reject"
                  checked={step.allowReject}
                  disabled={disabled}
                  onCheckedChange={(next) =>
                    updateStep(index, { allowReject: next })
                  }
                />
                <SettingToggle
                  label="Enable reminders"
                  checked={step.reminderEnabled}
                  disabled={disabled}
                  onCheckedChange={(next) =>
                    updateStep(index, { reminderEnabled: next })
                  }
                />
              </div>

              {step.reminderEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <Label htmlFor={`step-interval-${index}`}>
                      Reminder interval (hours)
                    </Label>
                    <Input
                      id={`step-interval-${index}`}
                      type="number"
                      min={1}
                      value={
                        step.reminderIntervalHours != null
                          ? step.reminderIntervalHours
                          : ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        updateStep(index, {
                          reminderIntervalHours:
                            raw === "" ? undefined : Number(raw),
                        });
                      }}
                      className="mt-1.5 rounded-xl"
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`step-max-${index}`}>Max reminders</Label>
                    <Input
                      id={`step-max-${index}`}
                      type="number"
                      min={1}
                      value={
                        step.reminderMaxCount != null
                          ? step.reminderMaxCount
                          : ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        updateStep(index, {
                          reminderMaxCount:
                            raw === "" ? undefined : Number(raw),
                        });
                      }}
                      className="mt-1.5 rounded-xl"
                      disabled={disabled}
                    />
                  </div>
                </div>
              )}

              {index === steps.length - 1 ? (
                <AddStepButton disabled={disabled} onClick={addStep} />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
