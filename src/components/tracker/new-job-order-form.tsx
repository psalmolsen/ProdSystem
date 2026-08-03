import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrors {
  workOrderNumber?: string;
  brandName?: string;
}

export function NewJobOrderForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (workOrderNumber: string, brandName: string) => void;
  onCancel: () => void;
}) {
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [brandName, setBrandName] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: FormErrors = {};
    if (!workOrderNumber.trim()) next.workOrderNumber = "Work order number is required.";
    if (!brandName.trim()) next.brandName = "Brand name is required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit(workOrderNumber.trim(), brandName.trim());
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="new-wo"
            className="mb-1.5 block text-[12px] font-medium"
          >
            Work order #
          </label>
          <input
            id="new-wo"
            value={workOrderNumber}
            onChange={(e) => setWorkOrderNumber(e.target.value)}
            placeholder="e.g. WO-2411"
            className={cn(
              "input-field",
              errors.workOrderNumber && "border-destructive",
            )}
          />
          {errors.workOrderNumber && (
            <p className="mt-1.5 text-[12px] font-medium text-destructive">
              {errors.workOrderNumber}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="new-brand" className="mb-1.5 block text-[12px] font-medium">
            Brand name
          </label>
          <input
            id="new-brand"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. SafeAir"
            className={cn(
              "input-field",
              errors.brandName && "border-destructive",
            )}
          />
          {errors.brandName && (
            <p className="mt-1.5 text-[12px] font-medium text-destructive">
              {errors.brandName}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          className="btn-primary"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Create job order
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
          Cancel
        </button>
      </div>
    </form>
  );
}
