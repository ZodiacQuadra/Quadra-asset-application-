import React, { useState, useRef, useEffect } from "react";
import { Button } from "@fluentui/react-components";
import {
  ChevronLeft24Regular,
  ChevronRight24Regular,
} from "@fluentui/react-icons";
import { KanbanStage } from "./KanbanStage";
import { InterviewStage, Applicant } from "../../Types/interview";

interface KanbanViewProps {
  jobRole:string;
  jobId: string;
  stages: InterviewStage[];
  selectedApplicants: Set<string>;
  onApplicantSelect: (applicantId: string, checked: boolean) => void;
  onSelectAllInStage: (stageId: string) => void;
  onDeselectAllInStage: (stageId: string) => void;
  onRemoveStage: (stageId: string) => void;
  onScheduleApplicant: (applicantId: string,stageId:string,stageName:string) => void;
  onNavigateToApplicant: (applicantId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragStart: (applicantId: string) => void;
  getApplicantsByStage: (stageId: string) => Applicant[];
  onRescheduleInterview?: (applicantId: string, interviewId: string) => void;
  onCancelInterview?: (applicantId: string, interviewId: string) => void;
  onApprove?: (applicant: Applicant, feedback:string,salary:string,shouldSaveFeedback:boolean) => void;
  onReject?: (applicant: Applicant, reason: string) => void;
  onBulkApprove?: () => void;
  onBulkReject?: () => void;
  isProcessing: boolean;
  refreshData?: () => void;
  isSubordinate:boolean;
  designation?:string | null
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  jobRole,
  jobId,
  stages,
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
  getApplicantsByStage,
  onRescheduleInterview,
  onCancelInterview,
  onApprove,
  onReject,
  onBulkApprove,
  onBulkReject,
  isProcessing,
  refreshData,
  isSubordinate = false,
  designation
}) => {
  const sortedStages = [...stages].sort((a, b) => a.Order - b.Order);

  // --- Start of new code ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkForScrollPosition = () => {
    const { current } = scrollContainerRef;
    if (current) {
      const { scrollLeft, scrollWidth, clientWidth } = current;
      setCanScrollLeft(scrollLeft > 0);
      // Use a small buffer (1px) to handle potential floating point inaccuracies
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const handleScroll = (direction: "left" | "right") => {
    const { current } = scrollContainerRef;
    if (current) {
      // A typical stage width is ~360px (min-w-90) + gap. Let's scroll by a generous amount.
      const scrollAmount = 400;
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      // Check initial position and on content/size changes
      checkForScrollPosition();

      scrollContainer.addEventListener("scroll", checkForScrollPosition);
      window.addEventListener("resize", checkForScrollPosition);

      // Cleanup
      return () => {
        scrollContainer.removeEventListener("scroll", checkForScrollPosition);
        window.removeEventListener("resize", checkForScrollPosition);
      };
    }
  }, [stages]); // Re-run effect if the number of stages changes
  // --- End of new code ---

  return (
    <div className="h-full overflow-hidden w-full flex flex-col">
      {/* --- Start of modified section --- */}
      <div className="relative flex-1">
        {canScrollLeft && (
          <Button
            icon={<ChevronLeft24Regular />}
            appearance="primary"
            shape="circular"
            onClick={() => handleScroll("left")}
            className="absolute top-1/2 -translate-y-1/2 left-2 z-10 !bg-gradient-to-r !from-[#0153A5] !to-[#2FC2FE] !text-white !rounded-3xl !border-0 shadow-md"
            aria-label="Scroll left"
          />
        )}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 flex-1 overflow-x-auto px-2 py-4 h-full scroll-smooth !scrollbar-hide" // Hiding scrollbar for a cleaner look
        >
          {sortedStages
            .filter((stage) => stage.Show)
            .map((stage, index) => (
              <KanbanStage
                jobId={jobId}
                key={stage.ID}
                stages={stages}
                isManualStage={stage.IsManual}
                stage={stage}
                applicants={getApplicantsByStage(stage.ID)}
                selectedApplicants={selectedApplicants}
                onApplicantSelect={onApplicantSelect}
                onSelectAllInStage={() => onSelectAllInStage(stage.ID)}
                onDeselectAllInStage={() => onDeselectAllInStage(stage.ID)}
                onRemoveStage={() => onRemoveStage(stage.ID)}
                onScheduleApplicant={onScheduleApplicant}
                onNavigateToApplicant={onNavigateToApplicant}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, stage.ID)}
                onDragStart={onDragStart}
                onRescheduleInterview={onRescheduleInterview}
                onCancelInterview={onCancelInterview}
                onApprove={onApprove}
                onReject={onReject}
                isDefault={stage.isDefault}
                onBulkApprove={onBulkApprove}
                onBulkReject={onBulkReject}
                isProcessing={isProcessing}
                refreshData={refreshData}
                isSubordinate={isSubordinate}
                designation={designation}
              />
            ))}
        </div>
        {canScrollRight && (
          <Button
            icon={<ChevronRight24Regular />}
            appearance="primary"
            shape="circular"
            onClick={() => handleScroll("right")}
            className="absolute top-1/2 -translate-y-1/2 right-2 z-10 !bg-gradient-to-r !from-[#0153A5] !to-[#2FC2FE] !text-white !rounded-3xl !border-0 shadow-md"
            aria-label="Scroll right"
          />
        )}
      </div>
      {/* --- End of modified section --- */}
    </div>
  );
};
