import React, { useState } from "react";
import {
  Card,
  CardHeader,
  Badge,
  CardPreview,
  Button,
} from "@fluentui/react-components";
import { Settings24Regular } from "@fluentui/react-icons";
import { InterviewStage } from "../../Types/interview";
import PipelineManagerDrawer from "../Components/PipelineManagerDrawer";

interface PipelineStepperProps {
  applicants: any;
  stages: InterviewStage[];
  getApplicantsByStage: (stageId: string) => any[];
  currentStage?: string; // Optional prop to highlight current active stage
  jobId: string; // Add jobId prop for the drawer
  onPipelineUpdate?: () => void; // Callback when pipeline is updated
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  applicants,
  stages,
  getApplicantsByStage,
  currentStage,
  jobId,
  onPipelineUpdate,
}) => {
  const [isManagerDrawerOpen, setIsManagerDrawerOpen] = useState(false);

  const sortedStages = [...stages].sort((a, b) => a.Order - b.Order);
  const visibleStages = sortedStages.filter(
    (stage) => !["hired"].includes(stage.ID) && stage.Show
  );

  const getStageStatus = (stage: InterviewStage, index: number) => {
    const applicantCount = getApplicantsByStage(stage.ID).length;
    const isActive = currentStage === stage.ID;
    const isCompleted = index > 0 && applicantCount === 0; // Simple completion logic

    return { isActive, isCompleted, applicantCount };
  };

  const getStageStyles = (stage: InterviewStage, status: any) => {
    const { isActive, isCompleted } = status;

    if (isActive) {
      return {
        circle:
          "bg-blue-500 border-blue-500 text-white shadow-lg ring-4 ring-blue-200 animate-pulse",
        connector: "bg-gray-300",
        text: "text-blue-700 font-semibold",
        badge: "bg-blue-100 text-blue-800 border-blue-200",
      };
    }

    return {
      circle: `${
        stage.color || "bg-gray-200 border-gray-300"
      } text-gray-700 shadow-md hover:shadow-lg transition-shadow`,
      connector: "bg-gray-300",
      text: "text-gray-700",
      badge: "bg-gray-100 text-gray-700 border-gray-200",
    };
  };

  return (
    <>
      <Card className="!bg-gradient-to-br !from-gray-50 !to-white my-6 shadow-sm border border-gray-200 !rounded-xl">
        <CardHeader
          header={
            <div className="flex justify-between items-center w-full">
              <div></div>
              {applicants.length > 0 ? (
                <></>
              ) : (
                <>
                  <Button
                    appearance="secondary"
                    icon={<Settings24Regular />}
                    onClick={() => setIsManagerDrawerOpen(true)}
                    size="small"
                  />
                </>
              )}
            </div>
          }
        ></CardHeader>

        <CardPreview>
          <div className="relative">
            {/* Progress Line Background */}
            <div
              className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full"
              style={{
                left: "2rem",
                right: "2rem",
                zIndex: 0,
              }}
            />

            {/* Active Progress Line */}
            <div
              className="absolute top-6 left-0 h-1 bg-blue-400 rounded-full transition-all duration-500"
              style={{
                left: "2rem",
                width: currentStage
                  ? `${
                      ((visibleStages.findIndex((s) => s.ID === currentStage) +
                        1) /
                        visibleStages.length) *
                      100
                    }%`
                  : "0%",
                zIndex: 1,
              }}
            />

            <div className="flex items-start justify-between relative z-10">
              {visibleStages.map((stage, index, array) => {
                const status = getStageStatus(stage, index);
                const styles = getStageStyles(stage, status);

                return (
                  <div
                    key={stage.ID}
                    className="flex flex-col items-center flex-1 min-w-0"
                  >
                    {/* Stage Circle */}
                    <div className="relative mb-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 cursor-pointer ${styles.circle}`}
                        style={{ color: "#fff" }}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Stage Info */}
                    <div className="text-center px-2 mb-3">
                      <div
                        className={`text-sm font-medium mb-1 ${styles.text}`}
                      >
                        {stage.InterviewName}
                      </div>

                      {/* Enhanced Badge */}
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          appearance="outline"
                          size="small"
                          className={`text-xs font-semibold px-3 py-2 ${styles.badge}`}
                        >
                          {status.applicantCount}{" "}
                          {status.applicantCount === 1
                            ? "candidate"
                            : "candidates"}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Connector */}
                    {index < array.length - 1 && (
                      <div
                        className="absolute top-6 flex items-center"
                        style={{
                          left: `${((index + 1) / array.length) * 100}%`,
                          transform: "translateX(-50%)",
                          width: `${100 / array.length}%`,
                        }}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardPreview>
      </Card>

      {/* Pipeline Manager Drawer */}
      <PipelineManagerDrawer
        isOpen={isManagerDrawerOpen}
        onClose={() => setIsManagerDrawerOpen(false)}
        jobId={jobId}
        onPipelineUpdate={onPipelineUpdate}
      />
    </>
  );
};
