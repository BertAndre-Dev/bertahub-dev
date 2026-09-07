"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import Modal from "@/components/modal/page";
import { getApiErrorMessage } from "@/lib/api-error";
import axiosInstance from "@/utils/axiosInstance";
import {
  extractWorkflowList,
  type RequestWorkflow,
} from "@/redux/slice/admin/request/admin-request";
import type {
  CreateStaffRequestPayload,
  StaffRequestCategory,
} from "@/redux/slice/staff/request/staff-request";
import WorkflowRequestFields from "@/components/request-mgt/WorkflowRequestFields";
import { MultiFileUploadInput } from "@/components/upload/MultiFileUploadInput";
import { useMultiFileUpload } from "@/hooks/useMultiFileUpload";

const MAX_ATTACHMENTS = 5;

type FormPayload = Omit<CreateStaffRequestPayload, "estateId">;

interface StaffRequestFormModalProps {
  readonly visible: boolean;
  readonly estateId: string;
  readonly categories: StaffRequestCategory[];
  readonly categoriesLoading?: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (payload: FormPayload) => Promise<void>;
  readonly loading?: boolean;
}

export default function StaffRequestFormModal({
  visible,
  estateId,
  categories,
  categoriesLoading = false,
  onClose,
  onSubmit,
  loading = false,
}: StaffRequestFormModalProps) {
  const attachmentsUpload = useMultiFileUpload({
    kind: "general",
    maxFiles: MAX_ATTACHMENTS,
  });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [workflows, setWorkflows] = useState<RequestWorkflow[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [encoding, setEncoding] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldFileNames, setFieldFileNames] = useState<Record<string, string>>(
    {},
  );

  const categoryOptions = categories.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  const workflowOptions = useMemo(() => {
    const named = workflows
      .map((workflow) => {
        const value = (workflow.id ?? workflow._id ?? "").trim();
        const label = workflow.name.trim();
        if (!value || !label) return null;
        return { value, label };
      })
      .filter((option): option is { value: string; label: string } =>
        Boolean(option),
      );

    if (named.length === 0) {
      return [
        {
          value: "",
          label: workflowsLoading
            ? "Loading workflows..."
            : "No workflow configured",
        },
      ];
    }

    return [{ value: "", label: "Use estate default" }, ...named];
  }, [workflows, workflowsLoading]);

  const selectedWorkflow = useMemo(
    () =>
      workflows.find(
        (workflow) =>
          (workflow.id ?? workflow._id ?? "").trim() === workflowId.trim(),
      ) ?? null,
    [workflows, workflowId],
  );
  const extraFields = selectedWorkflow?.fields ?? [];

  useEffect(() => {
    if (!categories.length) {
      setCategory("");
      return;
    }
    setCategory((prev) =>
      categories.some((c) => c.value === prev) ? prev : categories[0].value,
    );
  }, [categories]);

  useEffect(() => {
    if (!visible || !estateId) return;

    let cancelled = false;
    setWorkflowsLoading(true);

    axiosInstance
      .get("/api/v1/requests/workflows", { params: { estateId } })
      .then((res) => {
        if (cancelled) return;
        const list = extractWorkflowList(res.data);
        setWorkflows(list);
        setWorkflowId((prev) => {
          const ids = list
            .map((workflow) => (workflow.id ?? workflow._id ?? "").trim())
            .filter(Boolean);
          if (prev && ids.includes(prev)) return prev;
          return ids[0] ?? "";
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) {
          setWorkflows([]);
          setWorkflowId("");
          return;
        }
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
        setWorkflows([]);
      })
      .finally(() => {
        if (!cancelled) setWorkflowsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, estateId]);

  useEffect(() => {
    setFieldValues({});
    setFieldFileNames({});
  }, [workflowId]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory(categories[0]?.value ?? "");
    setWorkflowId("");
    attachmentsUpload.reset();
    setFieldValues({});
    setFieldFileNames({});
  };

  const handleClose = () => {
    if (loading || encoding || attachmentsUpload.isUploading) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category || !estateId) return;

    const missing = extraFields.find(
      (field) => field.required && !(fieldValues[field.key] ?? "").trim(),
    );
    if (missing) {
      toast.error(`${missing.label} is required.`);
      return;
    }

    const fieldValuePayload = extraFields
      .map((field) => {
        const raw = fieldValues[field.key] ?? "";
        return {
          key: field.key,
          value: field.type === "file" ? raw : raw.trim(),
        };
      })
      .filter((field) => field.value);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        attachments:
          attachmentsUpload.fileUrls.length > 0
            ? attachmentsUpload.fileUrls
            : undefined,
        workflowId: workflowId.trim() || undefined,
        fieldValues: fieldValuePayload.length > 0 ? fieldValuePayload : undefined,
      });
      resetForm();
    } catch {
      // Parent surfaces the error toast; keep form values for retry.
    }
  };

  const valid = Boolean(
    title.trim() &&
      category &&
      estateId &&
      categories.length > 0 &&
      extraFields.every(
        (field) => !field.required || (fieldValues[field.key] ?? "").trim(),
      ),
  );
  // Only block the whole form while submitting or encoding files.
  // Category loading should not disable title/description/etc.
  const busy = loading || encoding || attachmentsUpload.isUploading;

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      contentClassName="max-w-lg w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="p-5 sm:p-6">
        <h2 className="font-heading text-xl font-semibold mb-1">
          New request
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Submit a request for approval.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="staff-request-title">Title</Label>
            <Input
              id="staff-request-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Gate motor replacement"
              className="mt-1"
              required
              disabled={busy}
            />
          </div>

          <div>
            <Label htmlFor="staff-request-description">Description</Label>
            <textarea
              id="staff-request-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the request in detail..."
              className="mt-1 w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={busy}
            />
          </div>

          <div>
            <Label htmlFor="staff-request-category">Category</Label>
            <Select
              id="staff-request-category"
              options={
                categoryOptions.length > 0
                  ? categoryOptions
                  : [{ value: "", label: categoriesLoading ? "Loading..." : "No categories" }]
              }
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full"
              disabled={
                busy || categoriesLoading || categoryOptions.length === 0
              }
            />
          </div>

          <div>
            <Label htmlFor="staff-request-workflow">Workflow</Label>
            <Select
              id="staff-request-workflow"
              options={workflowOptions}
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              className="mt-1 w-full"
              disabled={busy || workflowsLoading || workflows.length === 0}
            />
          </div>

          {extraFields.length > 0 ? (
            <WorkflowRequestFields
              fields={extraFields}
              values={fieldValues}
              fileNames={fieldFileNames}
              onValueChange={(key, value) =>
                setFieldValues((prev) => ({ ...prev, [key]: value }))
              }
              onFileNameChange={(key, fileName) =>
                setFieldFileNames((prev) => ({ ...prev, [key]: fileName }))
              }
              disabled={busy}
              encoding={encoding}
              onEncodingChange={setEncoding}
            />
          ) : null}

          <div>
            <MultiFileUploadInput
              items={attachmentsUpload.items}
              onAddFiles={attachmentsUpload.addFiles}
              onRemove={attachmentsUpload.remove}
              acceptAttr={attachmentsUpload.acceptAttr}
              maxFiles={MAX_ATTACHMENTS}
              isUploading={attachmentsUpload.isUploading}
              disabled={busy}
              label="Attachments"
              hint={`Up to ${MAX_ATTACHMENTS} files, 10MB each. Images, PDF, DOC, DOCX, XLS, XLSX.`}
            />
            {attachmentsUpload.error ? (
              <p className="mt-1 text-xs text-destructive">
                {attachmentsUpload.error}
              </p>
            ) : null}
          </div>

          <div className="flex gap-2 pt-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || busy}>
              {loading ? "Submitting..." : "Submit for approval"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
