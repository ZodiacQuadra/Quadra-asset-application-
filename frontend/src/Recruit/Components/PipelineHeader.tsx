// components/PipelineHeader.tsx
import React from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  Input,
  Label,
  Caption1,
  Subtitle1,
  Subtitle2,
} from "@fluentui/react-components";
import {
  Add24Regular,
  Board24Regular,
  List24Regular,
} from "@fluentui/react-icons";
import { ViewMode } from "../../Types/interview";

interface PipelineHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isAddStageOpen: boolean;
  onAddStageOpenChange: (open: boolean) => void;
  newStageName: string;
  onNewStageNameChange: (name: string) => void;
  newStageDescription: string;
  onNewStageDescriptionChange: (description: string) => void;
  onAddStage: () => void;
}

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({
  viewMode,
  onViewModeChange,
  isAddStageOpen,
  onAddStageOpenChange,
  newStageName,
  onNewStageNameChange,
  newStageDescription,
  onNewStageDescriptionChange,
  onAddStage,
}) => {
  return (
    <div className="flex justify-between items-center flex-wrap pt-2">
      <div>
        <Subtitle2 className="text-gray-900">
          Interview Pipeline - {viewMode === "kanban" ? "Kanban" : "Stepper"}{" "}
          View
        </Subtitle2>
        {/* <div>
          {" "}
          <Caption1 className="text-gray-600">
            {viewMode === "kanban"
              ? "Drag & drop applicants between stages or use bulk actions"
              : "Track applicant progress through interview stages"}
          </Caption1>
        </div> */}
      </div>

      <div className="flex items-center gap-3 flex-wrap flex-col md:flex-row">
        {/* View Toggle */}
        {/* <div className="flex items-center border border-gray-300 rounded-lg p-1 bg-[#04040410] mb-[12px]">
          <Button
            appearance={viewMode === "kanban" ? "primary" : "subtle"}
            size="small"
            onClick={() => onViewModeChange("kanban")}
            icon={<Board24Regular />}
            style={{ backgroundColor: viewMode === "kanban" ? '#fff' : 'transparent', color: viewMode === "kanban" ? '#4B5563' : '#4B5563' }}
            className="flex items-center gap-2"
          >
            Kanban
          </Button>
          <Button
            appearance={viewMode === "stepper" ? "primary" : "subtle"}
            size="small"
            onClick={() => onViewModeChange("stepper")}
            icon={<List24Regular />}
            style={{ backgroundColor: viewMode === "stepper" ? '#fff' : 'transparent', color: viewMode === "stepper" ? '#4B5563' : '#4B5563' }}
            className="flex items-center gap-2"
          >
            Stepper
          </Button>
        </div> */}

        {/* <Dialog
          open={isAddStageOpen}
          onOpenChange={(event, data) => onAddStageOpenChange(data.open)}
        >
          <DialogTrigger disableButtonEnhancement>
            <Button
              appearance="outline"
              icon={<Add24Regular />}
              className="flex items-center gap-2"
            >
              Add Stage
            </Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Add New Interview Stage</DialogTitle>
              <DialogContent className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Create a custom interview stage that will be inserted between
                  HR Screening and Final Interview.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="stageName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Stage Name
                    </Label>
                    <Input
                      id="stageName"
                      value={newStageName}
                      onChange={(e) => onNewStageNameChange(e.target.value)}
                      placeholder="e.g., Panel Interview, HR Round"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="stageDescription"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description (Optional)
                    </Label>
                    <Input
                      id="stageDescription"
                      value={newStageDescription}
                      onChange={(e) =>
                        onNewStageDescriptionChange(e.target.value)
                      }
                      placeholder="Brief description of this stage"
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={onAddStage}
                      appearance="primary"
                      className="flex-1"
                    >
                      Add Stage
                    </Button>
                    <Button
                      appearance="subtle"
                      onClick={() => onAddStageOpenChange(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </DialogBody>
          </DialogSurface>
        </Dialog> */}
      </div>
    </div>
  );
};
