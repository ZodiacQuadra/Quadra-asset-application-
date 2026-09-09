// EntraDepartmentForm.tsx (New File)
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Field,
  Input,
  Textarea,
  Button,
  Spinner,
} from "@fluentui/react-components";
import { Edit20Regular, Tag20Regular } from "@fluentui/react-icons";
import { EntraDepartment } from "../../../Services/Department";

interface EntraDepartmentUpdateData {
  Code: string;
  Description: string;
}

interface FormErrors {
  Code?: string;
}

interface EntraDepartmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  department: EntraDepartment | null;
  onSave: (data: EntraDepartmentUpdateData) => void;
  isLoading?: boolean;
}

const EntraDepartmentForm: React.FC<EntraDepartmentFormProps> = ({
  isOpen,
  onClose,
  department,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<EntraDepartmentUpdateData>({
    Code: "",
    Description: "",
  });
  const [errors, setErrors]: any = useState<FormErrors>({});

  useEffect(() => {
    if (department) {
      setFormData({
        Code: department.Code || "",
        Description: department.Description || "",
      });
    }
    setErrors({});
  }, [department, isOpen]);

  const handleInputChange = (
    field: keyof EntraDepartmentUpdateData,
    value: string
  ) => {
    if (field == "Code") {
      setFormData((prev) => ({
        ...prev,
        [field]: value.toUpperCase(),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (formData.Code && !/^[A-Z0-9_-]{2,50}$/i.test(formData.Code)) {
      newErrors.Code = "Code must be 2-50 chars (letters, numbers, -, _)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(e, data) => !data.open && onClose()}>
      <DialogSurface style={{ maxWidth: "500px" }}>
        <DialogBody>
          <DialogTitle>Edit Department: {department?.Name}</DialogTitle>
          <DialogContent
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <Field label="Department Name (from Entra ID)">
              <Input value={department?.Name || ""} disabled />
            </Field>

            <Field
              label="Department Code"
              validationState={errors.Code ? "error" : "none"}
              validationMessage={errors.Code}
            >
              <Input
                contentBefore={<Tag20Regular />}
                value={formData.Code}
                onChange={(e) => handleInputChange("Code", e.target.value)}
                placeholder="e.g., HR-01"
                disabled={isLoading}
              />
            </Field>

            <Field label="Description">
              <Textarea
                value={formData.Description}
                onChange={(e) =>
                  handleInputChange("Description", e.target.value)
                }
                placeholder="Add a local description..."
                rows={3}
                disabled={isLoading}
              />
            </Field>
          </DialogContent>
          <DialogActions>
            <Button
              appearance="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={isLoading}
              icon={isLoading ? <Spinner size="tiny" /> : undefined}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default EntraDepartmentForm;
