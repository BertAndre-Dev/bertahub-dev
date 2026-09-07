"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import {
  WORKFLOW_FIELD_TYPE_OPTIONS,
  createEmptyWorkflowField,
  type RequestWorkflowField,
  type WorkflowFieldType,
} from "@/redux/slice/admin/request/admin-request";

interface WorkflowFieldsEditorProps {
  readonly fields: RequestWorkflowField[];
  readonly onChange: (fields: RequestWorkflowField[]) => void;
  readonly disabled?: boolean;
}

export default function WorkflowFieldsEditor({
  fields,
  onChange,
  disabled = false,
}: Readonly<WorkflowFieldsEditorProps>) {
  const updateField = (
    index: number,
    patch: Partial<RequestWorkflowField>,
  ) => {
    onChange(
      fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field,
      ),
    );
  };

  const addField = () => {
    onChange([...fields, createEmptyWorkflowField()]);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
            Request form fields
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground leading-snug">
            Extra questions staff fill when they submit this workflow.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
          disabled={disabled}
          className="shrink-0 active:scale-[0.97] transition-transform duration-100 ease-out"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add field
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 bg-[#F7F8FA] px-4 py-8 text-center text-sm text-muted-foreground">
          No extra fields. Click Add field if this request needs more details.
        </p>
      ) : null}

      <ul className="space-y-3">
        {fields.map((field, index) => {
          const fieldTitle = field.label?.trim() || `Field ${index + 1}`;
          return (
          <li
            key={`field-${index}`}
            className="rounded-2xl border border-black/5 bg-[#F7F8FA] p-4 space-y-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0150AC]/10 text-sm font-semibold text-[#0150AC] tabular-nums hover:text-[#01408A]"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <p className="text-sm font-medium text-foreground truncate">
                  {fieldTitle}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${fieldTitle}`}
                onClick={() => removeField(index)}
                disabled={disabled}
                className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5"> */}
            <div>
              {/* <div>
                <Label htmlFor={`workflow-field-label-${index}`}>Label</Label>
                <Input
                  id={`workflow-field-label-${index}`}
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  placeholder="Vendor invoice"
                  className="mt-1.5 rounded-xl"
                  disabled={disabled}
                  required
                />
              </div> */}
              <div>
                <Label htmlFor={`workflow-field-type-${index}`}>Type</Label>
                <Select
                  id={`workflow-field-type-${index}`}
                  options={WORKFLOW_FIELD_TYPE_OPTIONS}
                  value={field.type}
                  onChange={(e) =>
                    updateField(index, {
                      type: e.target.value as WorkflowFieldType,
                    })
                  }
                  className="mt-1.5 rounded-xl"
                  disabled={disabled}
                />
              </div>
            </div>

            <div>
              <Label htmlFor={`workflow-field-placeholder-${index}`}>
                Placeholder
              </Label>
              <Input
                id={`workflow-field-placeholder-${index}`}
                value={field.placeholder ?? ""}
                onChange={(e) =>
                  updateField(index, { placeholder: e.target.value })
                }
                placeholder="Hint shown inside the field"
                className="mt-1.5 rounded-xl"
                disabled={disabled}
              />
            </div>

            {field.type === "select" ? (
              <div>
                <Label htmlFor={`workflow-field-options-${index}`}>
                  Dropdown options
                </Label>
                <Input
                  id={`workflow-field-options-${index}`}
                  value={(field.options ?? []).join(", ")}
                  onChange={(e) =>
                    updateField(index, {
                      options: e.target.value
                        .split(",")
                        .map((option) => option.trim()),
                    })
                  }
                  placeholder="low, medium, high"
                  className="mt-1.5 rounded-xl"
                  disabled={disabled}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Separate options with commas.
                </p>
              </div>
            ) : null}

            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <Label
                  htmlFor={`workflow-field-help-${index}`}
                  className="mb-0"
                >
                  Help text
                </Label>
                <HelpTooltip text="Shown as a question mark next to the field when staff submit a request." />
              </div>
              <Input
                id={`workflow-field-help-${index}`}
                value={field.helpText ?? ""}
                onChange={(e) =>
                  updateField(index, { helpText: e.target.value })
                }
                placeholder="Upload the signed vendor invoice"
                className="rounded-xl"
                disabled={disabled}
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(field.required)}
                onChange={(e) =>
                  updateField(index, { required: e.target.checked })
                }
                disabled={disabled}
                className="size-4 rounded border-input accent-[#0150AC]"
              />
              Required
            </label>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
