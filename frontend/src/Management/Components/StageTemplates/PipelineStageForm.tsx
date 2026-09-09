import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Input,
  Textarea,
  Checkbox,
  Field,
} from "@fluentui/react-components";
import { Person } from "../../../Types/interview";

interface InterviewStage {
  ID: string;
  StageSequence: number;
  JobPostingID: string;
  InterviewName: string;
  Description: string;
  Order: number;
  isDefault: boolean;
  Show: boolean;
  IsManual: boolean;
  CreatedByUserID: string;
  ModifiedByUserID?: string;
  CreatedAt: string;
  ModifiedAt?: string;
  Notify?: boolean
}

interface StageFormData {
  InterviewName: string;
  Description: string;
  Show: boolean;
  IsManual: boolean;
  Notify: boolean;
  notifyUsers?: Person []
}

interface StageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    interviewName: string;
    description: string;
    show: boolean;
    isManual: boolean;
  }) => void;
  stage?: InterviewStage | null;
  title: string;
  description: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  notify?:string
}

const getInitialFormState = (stage?: InterviewStage | null): StageFormData => {
  if (stage) {
    return {
      InterviewName: stage.InterviewName,
      Description: stage.Description,
      Show: stage.Show,
      IsManual: stage.IsManual,
      Notify: stage.Notify?stage.Notify:false
    };
  }
  return {
    InterviewName: "",
    Description: "",
    Show: true,
    IsManual: false,
    Notify: false
  };
};

const PipelineStageForm: React.FC<StageFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  stage,
  title,
  description,
}) => {
  const [form, setForm] = useState<StageFormData>(getInitialFormState(stage));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(getInitialFormState(stage));
      setErrors({});
      setIsSubmitting(false);
    }
  }, [stage, isOpen]);

  const handleChange = (
    field: keyof StageFormData,
    value: string | boolean
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Clear error for the field being edited
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.InterviewName.trim()) {
      newErrors.name = "Stage name is required";
    } else if (form.InterviewName.trim().length < 2) {
      newErrors.name = "Stage name must be at least 2 characters";
    } else if (form.InterviewName.trim().length > 50) {
      newErrors.name = "Stage name must be less than 50 characters";
    }

    if (!form.Description.trim()) {
      newErrors.description = "Description is required";
    } else if (form.Description.trim().length < 5) {
      newErrors.description = "Description must be at least 5 characters";
    } else if (form.Description.trim().length > 200) {
      newErrors.description = "Description must be less than 200 characters";
    }

     if (form.Notify){
      if(Array.isArray(form.notifyUsers)&&form.notifyUsers?.length<1){
        newErrors.notify = "Add atleast one user to trigger notification"
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Transform the data to match the expected format in the service layer
      const formData = {
        interviewName: form.InterviewName.trim(),
        description: form.Description.trim(),
        show: form.Show,
        isManual: form.IsManual,
      };

      onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting

    setForm(getInitialFormState(stage));
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleDialogOpenChange = (event: any, data: { open: boolean }) => {
    if (!data.open && !isSubmitting) {
      handleClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      modalType="alert"
      onOpenChange={handleDialogOpenChange}
    >
      <DialogSurface className="max-w-md">
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <p className="text-sm text-gray-600 mb-6">{description}</p>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <Field
                label="Stage Name"
                validationMessage={errors.name}
                validationState={errors.name ? "error" : "none"}
                required
              >
                <Input
                  value={form.InterviewName}
                  onChange={(_, data) =>
                    handleChange("InterviewName", data.value)
                  }
                  placeholder="Enter stage name (e.g., Phone Interview)"
                  disabled={isSubmitting}
                  maxLength={50}
                />
              </Field>

              <Field
                label="Description"
                validationMessage={errors.description}
                validationState={errors.description ? "error" : "none"}
                required
              >
                <Textarea
                  value={form.Description}
                  onChange={(_, data) =>
                    handleChange("Description", data.value)
                  }
                  placeholder="Enter stage description (e.g., Initial phone screening with HR)"
                  rows={3}
                  resize="vertical"
                  disabled={isSubmitting}
                  maxLength={200}
                />
              </Field>

              <div className="space-y-4">
                <Field label="Stage Options">
                  <div className="flex flex-col space-y-3">
                    <Field>
                      {" "}
                      <Checkbox
                        checked={form.Show}
                        onChange={(_, data) =>
                          handleChange("Show", data.checked === true)
                        }
                        disabled
                        label="Visible"
                      />
                      <div className="text-xs text-gray-500 ml-6 mt-1">
                        Show this stage in the interview pipeline
                      </div>
                    </Field>
                    <Field>
                      {" "}
                      <Checkbox
                        checked={form.IsManual}
                        onChange={(_, data) =>
                          handleChange("IsManual", data.checked === true)
                        }
                        label="Manual"
                        disabled={isSubmitting}
                      />
                      <div className="text-xs text-gray-500 ml-6 mt-1">
                        Requires manual progression to the next stage
                      </div>
                    </Field>
                  </div>
                </Field>
              </div>

              <DialogActions className="mt-8">
                <Button
                  appearance="secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  appearance="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving..."
                    : stage
                    ? "Update Stage"
                    : "Add Stage"}
                </Button>
              </DialogActions>
            </form>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default PipelineStageForm;
