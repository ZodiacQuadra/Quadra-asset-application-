import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Text,
  Label,
  Card,
  CardHeader,
  CardPreview,
  FluentProvider,
  DialogBody,
  DialogSurface,
  DialogActions,
  DialogTrigger,
  Badge,
  Persona,
  CompoundButton,
} from "@fluentui/react-components";
import {
  Check24Regular as Check,
  Dismiss24Regular as X,
  Person24Regular as User,
  CalendarLtr24Regular as Calendar,
  Comma24Regular as GitCompare,
  Warning24Regular as AlertCircle,
} from "@fluentui/react-icons";
import type { JobPosting } from "../../Pages/JobPosting";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPosting;
  selectedSuggestionId: string | null;
  onApprove: (jobId: string, suggestionId: string, approvedBy: string) => void;
  onReject: (jobId: string, suggestionId: string) => void;
}

export const ApprovalModal = ({
  isOpen,
  onClose,
  job,
  selectedSuggestionId,
  onApprove,
  onReject,
}: ApprovalModalProps) => {
  const [approverName, setApproverName] = useState("Current User");
  // console.log("ApprovalModal job:", job);
  // Find the selected suggestion
  const selectedSuggestion = job.pendingSuggestions?.find(
    (s) => s.ID === selectedSuggestionId
  );

  const handleApprove = () => {
    if (selectedSuggestion) {
      onApprove(job.id, selectedSuggestion.ID, approverName);
      onClose();
    }
  };

  const handleReject = () => {
    if (selectedSuggestion) {
      onReject(job.id, selectedSuggestion.ID);
      onClose();
    }
  };

  // Don't render if no suggestion is selected or found
  if (!selectedSuggestion) return null;

  return (
    <FluentProvider style={{background:"transparent"}}>
      <Dialog open={isOpen} onOpenChange={onClose} modalType="alert">
        <DialogSurface className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogBody>
            <DialogContent className="p-0">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Review Description Suggestion
              </DialogTitle>
              <br />

              <div className="space-y-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-blue-900 text-lg flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      {job.title}
                    </h3>
                    <Badge>Pending Review</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                    <Persona
                      name={selectedSuggestion.SuggestedBy}
                      secondaryText={new Date(
                        selectedSuggestion.SuggestedAt
                      )?.toLocaleDateString()}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  <Card className="border-2 border-red-200 shadow-sm">
                    <CardHeader
                      header={
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <Text weight="semibold" className="text-red-800">
                            Current Description
                          </Text>
                        </div>
                      }
                    ></CardHeader>
                    <CardPreview className="px-6">
                      <div className="text-red-700 whitespace-pre-wrap text-sm">
                        {job.description}
                      </div>
                    </CardPreview>
                  </Card>

                  <Card className="border-2 border-green-200 shadow-sm">
                    <CardHeader
                      header={
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <Text weight="semibold" className="text-green-800">
                            Suggested Description
                          </Text>
                        </div>
                      }
                    ></CardHeader>
                    <CardPreview className="px-6">
                      <div className="text-green-700 whitespace-pre-wrap text-sm">
                        {selectedSuggestion.SuggestedDescription}
                      </div>
                    </CardPreview>
                  </Card>
                </div>

                <div className=" rounded-lg ">
                  <div className="space-y-4">
                    <div className="border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium text-amber-800 mb-2">
                        ⚠️ Important:
                      </h4>
                      <p className="text-sm text-amber-700">
                        Approving this suggestion will permanently replace the
                        current job description. This action will be logged and
                        cannot be easily undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
            <DialogActions className="flex w-max">
              <DialogTrigger disableButtonEnhancement>
                <Button
                  appearance="secondary"
                  onClick={onClose}
                  className=" px-8 text-base"
                >
                  Cancel
                </Button>
              </DialogTrigger>
              <Button appearance="outline" onClick={handleReject}>
                Reject Suggestion
              </Button>
              <Button
                appearance="primary"
                onClick={handleApprove}
                disabled={!approverName.trim()}
              >
                Approve & Apply Changes
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </FluentProvider>
  );
};
