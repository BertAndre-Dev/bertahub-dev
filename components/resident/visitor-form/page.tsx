"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Trash2 } from "lucide-react";
import { AppDispatch } from "@/redux/store";
import {
  createVisitor,
  updateVisitor,
  getVisitorById,
  type CreateVisitorData,
  type VisitingType,
} from "@/redux/slice/resident/visitor/visitor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IsoDatePicker,
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
  todayIsoString,
} from "@/components/ui/iso-date-picker";
import { toast } from "react-toastify";
import { formatAddressEntryLabel } from "@/lib/address";
import { getApiErrorMessage } from "@/lib/api-error";

/** Normalize API / datetime values to YYYY-MM-DD for IsoDatePicker. */
function toDateOnlyValue(val?: string | null) {
  if (!val) return "";
  const trimmed = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toIsoOrNull(val: string, endOfDay = false) {
  if (!val) return null;
  const d = new Date(`${val}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

type VisitorDraft = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  purpose: string;
  visitingType: VisitingType;
  visitStartDate: string;
  visitEndDate: string;
};

function createEmptyDraft(): VisitorDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    firstName: "",
    lastName: "",
    phone: "",
    purpose: "",
    visitingType: "SHORT_VISIT",
    visitStartDate: "",
    visitEndDate: "",
  };
}

interface VisitorFormProps {
  visitorId?: string | null;
  residentId: string;
  estateId: string;
  addressId: string | { id: string; data: { block: string; unit: string } };
  /** When false, hides the address field (e.g. resident has only one address). */
  showAddressField?: boolean;
  onSubmitSuccess?: () => void;
  onClose?: () => void;
}

export default function VisitorForm({
  visitorId,
  residentId,
  estateId,
  addressId,
  showAddressField = true,
  onSubmitSuccess,
  onClose,
}: VisitorFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const isEdit = Boolean(visitorId);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /** Stable min for edit: preserves an existing past start date without shrinking as user changes. */
  const [visitStartMinDate, setVisitStartMinDate] = useState(todayIsoString());
  const [addressLabel, setAddressLabel] = useState("");
  const [drafts, setDrafts] = useState<VisitorDraft[]>([createEmptyDraft()]);

  useEffect(() => {
    if (addressId && typeof addressId === "object" && addressId.data) {
      const friendly = formatAddressEntryLabel(addressId.data);
      setAddressLabel(
        friendly ||
          [addressId.data?.block, addressId.data?.unit]
            .filter(Boolean)
            .join(", "),
      );
    }
  }, [addressId]);

  useEffect(() => {
    if (!visitorId) {
      setVisitStartMinDate(todayIsoString());
    }
  }, [visitorId]);

  useEffect(() => {
    if (!visitorId) return;

    const loadVisitor = async () => {
      setLoading(true);
      try {
        const res = await dispatch(getVisitorById(visitorId)).unwrap();
        const visitor = res?.data?.visitor || res?.data;
        if (visitor) {
          const start = toDateOnlyValue(visitor.visitStartDate);
          const today = todayIsoString();
          setVisitStartMinDate(start && start < today ? start : today);
          setDrafts([
            {
              id: createEmptyDraft().id,
              firstName: visitor.firstName || "",
              lastName: visitor.lastName || "",
              phone: visitor.phone || "",
              purpose: visitor.purpose || "",
              visitingType:
                (visitor.visitingType as VisitingType) || "SHORT_VISIT",
              visitStartDate: start,
              visitEndDate: toDateOnlyValue(visitor.visitEndDate),
            },
          ]);
          if (visitor.address) setAddressLabel(visitor.address);
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    loadVisitor();
  }, [visitorId, dispatch]);

  const updateDraft = <K extends keyof Omit<VisitorDraft, "id">>(
    id: string,
    field: K,
    value: VisitorDraft[K],
  ) => {
    setDrafts((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const setVisitingType = (id: string, next: VisitingType) => {
    setDrafts((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              visitingType: next,
              visitStartDate:
                next === "SHORT_VISIT" && !isEdit ? "" : row.visitStartDate,
              visitEndDate: next === "SHORT_VISIT" ? "" : row.visitEndDate,
            }
          : row,
      ),
    );
  };

  const addDraft = () => setDrafts((prev) => [...prev, createEmptyDraft()]);

  const removeDraft = (id: string) => {
    setDrafts((prev) =>
      prev.length <= 1 ? prev : prev.filter((r) => r.id !== id),
    );
  };

  const resolveAddressId = () =>
    typeof addressId === "object" && addressId !== null
      ? addressId.id
      : addressId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const addressIdString = resolveAddressId();

    if (!addressIdString) {
      toast.error(
        "No address is linked to your account. Please contact your estate admin to assign you an address before inviting visitors.",
      );
      return;
    }

    if (!residentId) {
      toast.error("Unable to identify resident. Please refresh and try again.");
      return;
    }

    if (!estateId) {
      toast.error("Unable to identify estate. Please refresh and try again.");
      return;
    }

    const today = todayIsoString();

    for (let i = 0; i < drafts.length; i++) {
      const row = drafts[i];
      const label = isEdit ? "visitor" : `visitor ${i + 1}`;

      if (!row.firstName || !row.lastName || !row.phone || !row.purpose) {
        toast.error(
          isEdit
            ? "Please fill in all required fields"
            : `Please fill in all required fields for ${label}.`,
        );
        return;
      }

      if (row.visitingType === "LONG_VISIT") {
        if (!row.visitStartDate || !row.visitEndDate) {
          toast.error(
            `Start and end dates are required for ${label}'s long visit`,
          );
          return;
        }
        if (row.visitEndDate < row.visitStartDate) {
          toast.error(
            `End date must be on or after the start date for ${label}`,
          );
          return;
        }
      } else if (isEdit && !row.visitStartDate) {
        toast.error("Visit start date is required for a short visit");
        return;
      }

      if (row.visitStartDate && row.visitStartDate < visitStartMinDate) {
        toast.error(
          visitStartMinDate === today
            ? `Visit start date for ${label} must be today or later.`
            : `Visit start date for ${label} is before the allowed range.`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isEdit && visitorId) {
        const row = drafts[0];
        const isLongVisit = row.visitingType === "LONG_VISIT";
        await dispatch(
          updateVisitor({
            id: visitorId,
            data: {
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              phone: row.phone.trim(),
              purpose: row.purpose.trim(),
              residentId,
              estateId,
              addressId: addressIdString,
              visitingType: row.visitingType,
              visitStartDate: toIsoOrNull(row.visitStartDate),
              ...(isLongVisit
                ? { visitEndDate: toIsoOrNull(row.visitEndDate, true) }
                : {}),
            },
          }),
        ).unwrap();
        toast.success("Visitor updated successfully");
      } else {
        const payload: CreateVisitorData[] = drafts.map((row) => {
          const isLongVisit = row.visitingType === "LONG_VISIT";
          return {
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            phone: row.phone.trim(),
            purpose: row.purpose.trim(),
            residentId,
            estateId,
            addressId: addressIdString,
            visitingType: row.visitingType,
            visitStartDate: toIsoOrNull(row.visitStartDate),
            ...(isLongVisit
              ? { visitEndDate: toIsoOrNull(row.visitEndDate, true) }
              : {}),
          };
        });
        await dispatch(createVisitor(payload)).unwrap();
        toast.success(
          payload.length === 1
            ? "Visitor created successfully"
            : `${payload.length} visitors created successfully`,
        );
      }

      onSubmitSuccess?.();
      onClose?.();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const createSubmitLabel =
    drafts.length === 1
      ? "Create Visitor"
      : `Create ${drafts.length} Visitors`;

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold capitalize text-blue-600">
          {isEdit ? "Update Visitor" : "Invite Visitors"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
        {loading ? (
          <p className="text-gray-500 italic">Loading visitor details...</p>
        ) : (
          <div className="space-y-4">
            {showAddressField && (
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  value={addressLabel}
                  placeholder="Address"
                  disabled
                  className="mt-1 bg-gray-50"
                />
                {!resolveAddressId() && (
                  <p className="text-xs text-amber-600 mt-1">
                    No address is linked to your account. Please contact your
                    estate admin to assign you an address before inviting
                    visitors.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  {isEdit ? "Visitor" : "Visitors"}
                </p>
                {!isEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDraft}
                    disabled={submitting}
                  >
                    + Add another
                  </Button>
                )}
              </div>

              {drafts.map((row, idx) => (
                <div
                  key={row.id}
                  className="rounded-md border border-border/60 p-3 space-y-3"
                >
                  {!isEdit && (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Visitor {idx + 1}
                      </p>
                      {drafts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => removeDraft(row.id)}
                          disabled={submitting}
                          title="Remove visitor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`firstName-${row.id}`}>First Name *</Label>
                      <Input
                        id={`firstName-${row.id}`}
                        type="text"
                        value={row.firstName}
                        onChange={(e) =>
                          updateDraft(row.id, "firstName", e.target.value)
                        }
                        placeholder="Enter first name"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`lastName-${row.id}`}>Last Name *</Label>
                      <Input
                        id={`lastName-${row.id}`}
                        type="text"
                        value={row.lastName}
                        onChange={(e) =>
                          updateDraft(row.id, "lastName", e.target.value)
                        }
                        placeholder="Enter last name"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`phone-${row.id}`}>Phone Number *</Label>
                    <Input
                      id={`phone-${row.id}`}
                      type="tel"
                      value={row.phone}
                      onChange={(e) =>
                        updateDraft(row.id, "phone", e.target.value)
                      }
                      placeholder="Enter phone number"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`purpose-${row.id}`}>
                      Purpose of Visit *
                    </Label>
                    <textarea
                      id={`purpose-${row.id}`}
                      value={row.purpose}
                      onChange={(e) =>
                        updateDraft(row.id, "purpose", e.target.value)
                      }
                      placeholder="Enter purpose of visit"
                      required
                      rows={2}
                      className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`visitingType-${row.id}`}>
                      Visiting Type *
                    </Label>
                    <select
                      id={`visitingType-${row.id}`}
                      title="Visiting Type"
                      aria-label={`Visiting type for visitor ${idx + 1}`}
                      value={row.visitingType}
                      onChange={(e) =>
                        setVisitingType(row.id, e.target.value as VisitingType)
                      }
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="SHORT_VISIT">Short Visit</option>
                      <option value="LONG_VISIT">Long Visit</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {row.visitingType === "SHORT_VISIT"
                        ? isEdit
                          ? "Choose when the short visit should start."
                          : "Short visits start when the visitor arrives."
                        : "Long visits require a start and end date."}
                    </p>
                  </div>

                  {row.visitingType === "SHORT_VISIT" ? (
                    isEdit ? (
                      <div>
                        <Label htmlFor={`visitStartDate-${row.id}`}>
                          Visit Start Date *
                        </Label>
                        <div className="mt-1">
                          <IsoDatePicker
                            id={`visitStartDate-${row.id}`}
                            value={row.visitStartDate}
                            minDate={visitStartMinDate}
                            onChange={(iso) =>
                              updateDraft(row.id, "visitStartDate", iso)
                            }
                            placeholder="Select visit start date"
                            ariaLabel="Visit start date"
                          />
                        </div>
                      </div>
                    ) : null
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`visitStartDate-${row.id}`}>
                          Visit Start Date *
                        </Label>
                        <div className="mt-1">
                          <IsoLinkedRangeStart
                            id={`visitStartDate-${row.id}`}
                            startDate={row.visitStartDate}
                            endDate={row.visitEndDate}
                            minDate={visitStartMinDate}
                            onStartChange={(iso) =>
                              updateDraft(row.id, "visitStartDate", iso)
                            }
                            onEndChange={(iso) =>
                              updateDraft(row.id, "visitEndDate", iso)
                            }
                            placeholder="Select start date"
                            ariaLabel={`Visit start date for visitor ${idx + 1}`}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`visitEndDate-${row.id}`}>
                          Visit End Date *
                        </Label>
                        <div className="mt-1">
                          <IsoLinkedRangeEnd
                            id={`visitEndDate-${row.id}`}
                            startDate={row.visitStartDate}
                            endDate={row.visitEndDate}
                            onEndChange={(iso) =>
                              updateDraft(row.id, "visitEndDate", iso)
                            }
                            placeholder="Select end date"
                            ariaLabel={`Visit end date for visitor ${idx + 1}`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading || submitting}
          >
            {submitting
              ? `${isEdit ? "Updating" : "Creating"}...`
              : isEdit
                ? "Update Visitor"
                : createSubmitLabel}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
