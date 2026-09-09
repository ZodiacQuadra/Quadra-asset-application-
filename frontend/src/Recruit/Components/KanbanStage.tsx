// components/KanbanStage.tsx
import React, { useEffect, useRef } from "react";
import {
  Card,
  CardHeader,
  Button,
  Badge,
  Checkbox,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { InterviewStage, Applicant } from "../../Types/interview";
import ApplicantCard from "./ApplicantCard";
import KanbanApplicantCard from "./KanbanApplicantCard";

interface KanbanStageProps {
  jobId: string;
  stage: InterviewStage;
  stages: InterviewStage[];
  applicants: Applicant[];
  selectedApplicants: Set<string>;
  onApplicantSelect: (applicantId: string, checked: boolean) => void;
  onSelectAllInStage: () => void;
  onDeselectAllInStage: () => void;
  onRemoveStage: () => void;
  onScheduleApplicant: (applicantId: string,stageId:string,stageName:string) => void;
  onNavigateToApplicant: (applicantId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (applicantId: string) => void;
  onRescheduleInterview?: (applicantId: string, interviewId: string) => void;
  onCancelInterview?: (applicantId: string, interviewId: string) => void;
  onApprove?: (applicant: Applicant,feedback:string,salary:string,shouldSaveFeedback:boolean) => void; // New prop for approve action
  onReject?: (applicant: Applicant, reason: string) => void;
  isManualStage?: boolean; // Optional prop to indicate if this is a manual stage
  onBulkApprove?: () => void;
  onBulkReject?: () => void;
  isDefault?: boolean;
  isProcessing: boolean;
  refreshData?: () => void;
  isSubordinate:boolean;
  designation?:string | null
}

export const KanbanStage: React.FC<KanbanStageProps> = ({
  jobId,
  stage,
  stages,
  applicants,
  selectedApplicants,
  onApplicantSelect,
  onSelectAllInStage,
  onDeselectAllInStage,
  onRemoveStage,
  onScheduleApplicant,
  onNavigateToApplicant,
  onDragOver,
  onDrop,
  onDragStart,
  onRescheduleInterview,
  onCancelInterview,
  onApprove,
  onReject,
  onBulkApprove,
  isDefault,
  onBulkReject,
  isProcessing,
  refreshData,
  isManualStage = false, // Default to false if not provided
  isSubordinate = false,
  designation
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const canRemove = !stage.isDefault;

  // Calculate checkbox state
  const applicantIds = applicants.map((a) => a.ID);
  const selectedInStage = applicantIds.filter((ID) =>
    selectedApplicants.has(ID)
  );
  const isAllSelected =
    applicants.length > 0 && selectedInStage.length === applicants.length;
  const isIndeterminate =
    selectedInStage.length > 0 && selectedInStage.length < applicants.length;

  // Set indeterminate state using useEffect
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // Handle stage checkbox change
  const handleStageCheckboxChange = (checked: boolean) => {
    if (checked) {
      onSelectAllInStage();
    } else {
      onDeselectAllInStage();
    }
  };

  return (
    <div className="space-y-2">
      {/* Stage Header */}
      <Card
        className={`${stage.color} border-t-4 shadow-lg rounded-lg min-w-90`}
      >
        <CardHeader
          className="pb-2"
          action={
            <div className="flex justify-end items-center">
              <Badge appearance="filled" color="informative" size="small">
                {applicants.length} applicants
              </Badge>
            </div>
          }
          image={
            <div>
              {applicants.length > 0 &&
                (stage.InterviewName === "Hired" ? (
                  <></>
                ) : (
                  <div className="flex items-center gap-1">
                    <Checkbox
                      checked={isAllSelected}
                      input={{ ref: checkboxRef }}
                      onChange={(e, data) =>
                        handleStageCheckboxChange(!!data.checked)
                      }
                      className="text-xs transition-transform hover:scale-110"
                    />
                  </div>
                ))}
            </div>
          }
          header={
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {stage.InterviewName}
              </h3>
              <div className="text-xs mt-1 flex items-center justify-between text-gray-600">
                <span>{stage.Description}</span>
              </div>
            </div>
          }
        />
      </Card>

      {/* Applicants in Stage */}
      <div className="h-96 overflow-y-auto group">
        <div
          className="h-full overflow-y-auto group-hover:overflow-y-scroll scroll-smooth !scrollbar-thin !scrollbar-thumb-gray-400 scrollbar-track-gray-100"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {applicants.map((applicant) => (
            <KanbanApplicantCard
              stages={stages}
              jobId={jobId}
              isManualStage={isManualStage}
              key={applicant.ID}
              applicant={applicant}
              isSelected={selectedApplicants.has(applicant.ID)}
              onSelect={(checked) => onApplicantSelect(applicant.ID, checked)}
              onSchedule={() => onScheduleApplicant(applicant.ID,stage.ID,stage.InterviewName)}
              onNavigate={() => onNavigateToApplicant(applicant.ID)}
              // onDragStart={() => onDragStart(applicant.ID)}
              // isDraggable={true}
              onReschedule={(interviewId) =>
                onRescheduleInterview?.(applicant.ID, interviewId)
              }
              onCancelInterview={(interviewId) =>
                onCancelInterview?.(applicant.ID, interviewId)
              }
              onApprove={onApprove}
              onReject={onReject}
              refreshData={refreshData}
              isSubordinate={isSubordinate}
              designation={designation}
            />
          ))}

          {applicants.length === 0 && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 text-sm">
              No applicants in this stage
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
