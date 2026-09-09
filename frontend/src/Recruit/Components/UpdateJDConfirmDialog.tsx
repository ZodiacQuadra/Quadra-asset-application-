import * as React from "react";
import DOMPurify from "dompurify";
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Spinner,
  Body1Strong,
} from "@fluentui/react-components";
import { DocumentEditRegular, Warning24Regular } from "@fluentui/react-icons";

interface UpdateJDConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  onConfirm: () => void;
  editorContent: string;
}

const UpdateJDConfirmDialog: React.FC<UpdateJDConfirmDialogProps> = ({
  isOpen,
  onOpenChange,
  isLoading,
  onConfirm,
  editorContent,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(e, data) => onOpenChange(data.open)}
      modalType="alert"
    >
      <DialogSurface>
        <DialogBody>
          <DialogContent>
            <div className="text-center mb-4">
              <div className="mx-auto bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Warning24Regular className="text-orange-600" />
              </div>
              <DialogTitle className="font-bold text-gray-900 mb-2">
                Suggest Job Description
              </DialogTitle>
              <p className="text-gray-600 mb-4">
                Are you sure you want to update the job description with the
                current content?
              </p>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 h-full">
                <Spinner />
                <Body1Strong className="mt-2">
                  Updating job description...
                </Body1Strong>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-500 mb-2">
                  Current content preview:
                </p>
                <div
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editorContent) }}
                  className="whitespace-pre-wrap border border-gray-200 rounded-lg p-3 bg-gray-50 text-gray-800 text-sm"
                />
              </div>
            )}
          </DialogContent>
          <DialogActions className="flex justify-end gap-2 mt-4">
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" disabled={isLoading}>
                Cancel
              </Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={handleConfirm}
              disabled={isLoading}
              icon={
                isLoading ? <Spinner size="tiny" /> : <DocumentEditRegular />
              }
            >
              {isLoading ? "Suggesting..." : "Confirm Suggest"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default UpdateJDConfirmDialog;
