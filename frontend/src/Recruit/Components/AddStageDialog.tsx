import React from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Field,
  Input,
  Textarea,
} from "@fluentui/react-components";
import { Add20Regular } from "@fluentui/react-icons";

interface AddStageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newStageName: string;
  onNewStageNameChange: (name: string) => void;
  newStageDescription: string;
  onNewStageDescriptionChange: (description: string) => void;
  onAddStage: () => void;
}

export const AddStageDialog: React.FC<AddStageDialogProps> = ({
  isOpen,
  onOpenChange,
  newStageName,
  onNewStageNameChange,
  newStageDescription,
  onNewStageDescriptionChange,
  onAddStage,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStage();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Add20Regular />
              Add New Interview Stage
            </div>
          </DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Create a custom interview stage that will be inserted between HR
                Screening and Final Interview.
              </p>

              <Field label="Stage Name" required>
                <Input
                  value={newStageName}
                  onChange={(_, data) => onNewStageNameChange(data.value)}
                  placeholder="e.g., Panel Interview, HR Round"
                />
              </Field>

              <Field label="Description (Optional)">
                <Textarea
                  value={newStageDescription}
                  onChange={(_, data) =>
                    onNewStageDescriptionChange(data.value)
                  }
                  placeholder="Brief description of this stage"
                  rows={3}
                />
              </Field>
            </form>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              size="small"
              onClick={onAddStage}
              disabled={!newStageName.trim()}
            >
              Add Stage
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
