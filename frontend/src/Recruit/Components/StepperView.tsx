import React, { useRef, useEffect } from "react";
import {
  Checkbox,
  Button,
  Badge,
  Subtitle2,
  Caption1,
  Accordion,
  AccordionItem,
  AccordionToggleEventHandler,
  AccordionHeader,
  AccordionPanel,
  useToastController,
  Toast,
  ToastTitle,
  Spinner,
  useId,
  FluentProvider,
  Toaster,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  CheckmarkCircle24Regular,
  DismissCircle24Regular,
  CalendarLtr24Regular,
  ChevronUp20Filled,
  ChevronDown20Filled,
  Send20Regular,
  Send20Filled,
} from "@fluentui/react-icons";
import ApplicantCard from "./ApplicantCard";
import { Applicant, InterviewStage } from "../../Types/interview";
import { sendManagementNotification } from "../../Services/HiringPipeline";
import { useAuth } from "../../Auth/AuthProvider";
import { useLocation } from "react-router-dom";

interface StepperViewProps {
  jobRole: string;
  jobId: string;
  stages: InterviewStage[];
  selectedApplicants: Set<string>;
  onApplicantSelect: (applicantId: string, checked: boolean) => void;
  onSelectAllInStage: (stageId: string) => void;
  onDeselectAllInStage: (stageId: string) => void;
  onRemoveStage: (stageId: string) => void;
  onScheduleApplicant: (applicantId: string,stageId:string,stageName:string) => void;
  onNavigateToApplicant: (applicantId: string) => void;
  getApplicantsByStage: (stageId: string) => Applicant[];
  onRescheduleInterview?: (applicantId: string, interviewId: string) => void;
  onCancelInterview?: (applicantId: string, interviewId: string) => void;
  onApprove?: (applicant: Applicant,feedback:string,salary:string,shouldSaveFeedback:boolean) => void;
  onReject?: (applicant: Applicant, reason: string) => void;
  onBulkApprove?: () => void;
  onBulkReject?: () => void;
  isProcessing: boolean;
  refreshData?: () => void;
  isSubordinate: boolean;
  designation?: string | null;
  departmentId?: string | null;
  SelectedStage:{stageId:string,stageName:string}
}

export const StepperView: React.FC<StepperViewProps> = ({
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
  designation,
  departmentId,
  SelectedStage
}) => {
  const sortedStages = [...stages].sort((a, b) => a.Order - b.Order);

  const [openStage, setOpenStage] = React.useState<string[]>([]);
  const [IsLoadingNotificationLoader, setIsLoadingNotification] = React.useState(false)
  const locationCurrent = useLocation()

  // Function to toggle accordian
  const handleToggle: AccordionToggleEventHandler<string> = (event, data) => {
    setOpenStage(data.openItems);
  };
  const { currentUser, accessToken } = useAuth()
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);


  // Helper function to get checkbox state for a stage
  const getStageCheckboxState = (stageId: string) => {
    const stageApplicants = getApplicantsByStage(stageId);
    const selectedInStage = stageApplicants.filter((applicant) =>
      selectedApplicants.has(applicant.ID)
    );



    if (stageApplicants.length === 0) {
      return { checked: false, indeterminate: false };
    }

    const allSelected = selectedInStage.length === stageApplicants.length;
    const someSelected = selectedInStage.length > 0;

    return {
      checked: allSelected,
      indeterminate: someSelected && !allSelected,
    };
  };

  // Handle stage checkbox change
  const handleStageCheckboxChange = (stageId: string, checked: boolean) => {
    if (checked) {
      onSelectAllInStage(stageId);
    } else {
      onDeselectAllInStage(stageId);
    }
  };

  // Get selected applicants count for a specific stage
  const getSelectedInStageCount = (stageId: string) => {
    const stageApplicants = getApplicantsByStage(stageId);
    return stageApplicants.filter((applicant) =>
      selectedApplicants.has(applicant.ID)
    ).length;
  };

  const hasScrolledRef = useRef(false)
  const managementRef = useRef<HTMLDivElement>(null);
  const normalRef = useRef<HTMLDivElement>(null);


  React.useEffect(() => {
  // console.log("location", locationCurrent.search.includes("management"))
  if (locationCurrent.search.includes("management")) {
    const stage = sortedStages.filter(item => item.notify)
    if (stage && stage.length > 0) {
      setOpenStage([...openStage, stage[0]?.ID]);
    }
    
    window.history.replaceState({}, '', `#${locationCurrent.pathname}`)
  }
}, []) // Run only once on mount

React.useEffect(() => {
  if (managementRef.current && locationCurrent.search.includes("management") && !hasScrolledRef.current) {
    const parent = document.getElementById("mainContainer");
    const child = managementRef.current;

    if (parent && child) {
      // console.log("-----scroll executed------")
      hasScrolledRef.current = true
      setTimeout(() => {
        requestAnimationFrame(() => {
          const parentRect = parent.getBoundingClientRect();
          const childRect = child.getBoundingClientRect();

          parent.scrollTo({
            top: parent.scrollTop + (childRect.top - parentRect.top),
            behavior: "smooth",
          });
        });
      }, 150); 
    }
  }
}, [openStage]) 



  // Component for stage checkbox with proper indeterminate handling
  const StageCheckbox: React.FC<{ stageId: string; stageName: string }> = ({
    stageId,
    stageName,
  }) => {
    const checkboxRef = useRef<HTMLInputElement>(null);
    const checkboxState = getStageCheckboxState(stageId);




    useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = checkboxState.indeterminate;
      }
    }, [checkboxState.indeterminate]);

    return (
      <>
        {stageName == "Hired" ? (
          <></>
        ) : (
          <>
            <Checkbox
              checked={checkboxState.checked}
              input={{ ref: checkboxRef }}
              onChange={(e, data) =>
                handleStageCheckboxChange(stageId, !!data.checked)
              }
              className="transition-transform hover:scale-110"
            />
          </>
        )}
      </>
    );
  };

  const handleSendEmailNotification = async (id: string, applicants: Applicant[]) => {
    try {
      const redirectUrl = `${location.href}?mode=management`

      // console.log("applicant", applicants)

      const mappedData = applicants.map((item) => {
        return { name: item.firstName + " " + item.lastName, date: item.currentPipeline?.createdAt || null }
      })

      // console.log("redirectUrl",redirectUrl)
      if (currentUser.userID && accessToken) {
        setIsLoadingNotification(true)
        const response = await sendManagementNotification(id, mappedData, redirectUrl, accessToken, currentUser.userID, jobRole, jobId)

        // console.log("response", response)

        dispatchToast(
          <Toast>
            <ToastTitle>{response.message}</ToastTitle>
          </Toast>,
          { intent: response.success ? "success" : "error" }
        );
      }
    }
    finally {
      setIsLoadingNotification(false)
    }

  }

  return (
    <FluentProvider className="!bg-transparent">
      <div className="space-y-2">
      <Accordion openItems={openStage} onToggle={handleToggle} collapsible>
        {sortedStages
          .filter((stage) => stage.Show)
          .map((stage, index) => {
            const stageApplicants = getApplicantsByStage(stage.ID);
            const canRemove = !stage.isDefault;
            const selectedInStageCount = getSelectedInStageCount(stage.ID);

            return (
              <AccordionItem
                value={stage.ID}
                className={`relative ${openStage.includes(stage.ID) ? "!mb-0" : "!mb-10"
                  }`}
              >
                <div
                  key={stage.ID}
                  className="flex items-start gap-4 !mb-0 !pt-0 !pb-0"
                >
                  {/* Step Indicator */}
                  <div className="flex flex-col items-center gap-10 mt-[0.5%]">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold ${openStage.includes(stage.ID)
                        ? stage.color.split(" ").splice(0, 2).join(" ") +
                        " " +
                        "text-white"
                        : `bg-transparent ${stage.color.split(" ")[2]}`
                        } border-2  shrink-0`}
                    >
                      {index + 1}
                    </div>
                    {index < sortedStages.length - 1 && (
                      <div
                        className={`w-0.5 h-[90%] ${openStage.includes(stage.ID)
                          ? stage.color
                          : "bg-transparent"
                          } absolute top-12 left-6 -translate-x-1/2`}
                      />
                    )}
                  </div>

                  {/* Stage Content */}
                  <div className="flex-1 min-w-0 items-center">
                    <AccordionHeader className="w-full ">
                      <div
                        className={`${openStage.includes(stage.ID) ? "!mb-0" : "!mb-0"
                          } bg-[#FBFBFB] rounded-lg px-4 p-3 w-full border border-[#EBEAEA] shadow-sm`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Stage Checkbox */}
                            {/* {stageApplicants.length > 0 && (
                              <StageCheckbox
                                stageId={stage.ID}
                                stageName={stage.InterviewName}
                              />
                            )} */}

                            <div className="flex flex-col">
                              <Subtitle2 className="!text-sm font-semibold text-gray-900">
                                {stage.InterviewName}
                                {/* {stage.IsManual && (
                            <Badge
                              size="small"
                              color="important"
                              className="ml-2"
                            >
                              Manual
                            </Badge>
                          )} */}
                              </Subtitle2>
                              <Caption1 className="text-gray-600">
                                {stage.Description}
                              </Caption1>
                            </div>
                          </div>

                          <div ref={stage.notify ? managementRef : normalRef} className="flex items-center gap-2">
                            {

                              stage.notify && stage.notifyUser.length > 0 && stageApplicants.length > 0 && <Button appearance="subtle" size="small" onClick={(e) => {
                                e.stopPropagation()
                                handleSendEmailNotification(stage.ID, stageApplicants)
                              }}>{IsLoadingNotificationLoader ? <Spinner size="extra-tiny" /> : <Send20Filled />}</Button>
                            }
                            <div className="flex items-center">
                              <Badge
                                appearance="filled"
                                color="brand"
                                className="!bg-[#E5EDF4] !text-[#0153A5] !px-4 !py-4 !rounded-lg ml-2"
                              >
                                {stageApplicants.length} applicants
                              </Badge>
                              <div className="text-[#737373] ml-2">
                                {openStage.includes(stage.ID) ? (
                                  <ChevronUp20Filled />
                                ) : (
                                  <ChevronDown20Filled />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionHeader>
                    <style>{`
                      .fui-AccordionHeader__expandIcon {
                        display: none !important;
                      }
                    `}</style>

                    <AccordionPanel className=" !mb-0">
                      <div className="h-96 overflow-y-auto p-2">
                        <div className="grid grid-cols-1  gap-4 mb-2 w-full">
                          {stageApplicants.map((applicant) => (
                            <ApplicantCard
                              jobRole={jobRole}
                              stages={sortedStages}
                              jobId={jobId}
                              key={applicant.ID}
                              isManualStage={stage.IsManual}
                              applicant={applicant}
                              departmentId={departmentId}
                              isSelected={selectedApplicants.has(
                                applicant.ID
                              )}
                              onSelect={(checked) =>
                                onApplicantSelect(applicant.ID, checked)
                              }
                              onCancelInterview={(interviewId) =>
                                onCancelInterview?.(applicant.ID, interviewId)
                              }
                              onReschedule={(interviewId) =>
                                onRescheduleInterview?.(
                                  applicant.ID,
                                  interviewId
                                )
                              }
                              onSchedule={() =>
                                onScheduleApplicant(applicant.ID,stage.ID,stage.InterviewName)
                              }
                              onNavigate={() =>
                                onNavigateToApplicant(applicant.ID)
                              }
                              isDraggable={false}
                              onApprove={onApprove}
                              onReject={onReject}
                              refreshData={refreshData}
                              showTriggerNotification={stage.notify && stage.notifyUser.length > 0}
                              isSubordinate={isSubordinate}
                              designation={designation}
                              
                            />
                          ))}
                        </div>

                        {stageApplicants.length === 0 && (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6 text-center text-gray-500">
                            No applicants in this stage
                          </div>
                        )}
                      </div>
                    </AccordionPanel>

                    {/* Applicants Grid */}
                  </div>
                </div>
              </AccordionItem>
            );
          })}
      </Accordion>
      </div>
      <Toaster toasterId={toasterId} />
    </FluentProvider>
  );
};
