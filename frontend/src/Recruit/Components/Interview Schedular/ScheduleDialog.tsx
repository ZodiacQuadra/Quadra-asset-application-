import React, { useState, useEffect } from "react";
import {
  Button,
  Field,
  Input,
  Textarea,
  Spinner,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Accordion,
  FluentProvider,
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Caption1,
  Subtitle1,
} from "@fluentui/react-components";

import { InterviewStage } from "../../../Types/interview";
import {
  Calendar20Regular,
  Settings20Regular,
  DismissRegular,
} from "@fluentui/react-icons";

import ApplicantSummary from "./ApplicantSummary";
import GlobalSettings from "./GlobalSettings";
import InterviewForm from "./InterviewForm";
import { Applicant, Person, InterviewSlot } from "../../../Types/interview";
import { useAuth } from "../../../Auth/AuthProvider";
import JobRole from "../../../Management/Components/JobRole/JobRole";

interface ScheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedApplicants: Set<string>;
  applicants: any[];
  stages: InterviewStage[];
  onScheduleSuccess?: (value: any) => void;
  isLoading: boolean;
  jobRole: string;
  jobSequence: string;
  currentStage:{stageId:string,stageName:string}
}

// API service function to fetch applicant details

// Main Schedule Dialog Component
const ScheduleDialog: React.FC<ScheduleDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedApplicants,
  applicants: initialApplicants,
  stages,
  onScheduleSuccess,
  isLoading,
  jobRole,
  jobSequence,
  currentStage
}) => {
  // Form state
  const { accessToken } = useAuth();
  const [interviewTitle, setInterviewTitle] = useState<string>("");
  const [interviewDescription, setInterviewDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState<boolean>(
    false
  );
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);

  // Validation state
  const [titleError, setTitleError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Global settings state (only for multiple applicants)
  const showGlobalSettings = selectedApplicants.size > 1;
  const [useGlobalSettings, setUseGlobalSettings] = useState<boolean>(
    showGlobalSettings
  );
  const [globalSettings, setGlobalSettings] = useState<any>({
    date: "",
    time: "",
    duration: 60,
    interviewType: "",
    stage:currentStage.stageName?? "",
    stageId:currentStage.stageId?? "",
    interviewers: [],
    location: "",
    meetingLink: "",
    isTeamsMeeting: false,
    timeZone: "Asia/Kolkata",
  });
  const [globalSettingsErrors, setGlobalSettingsErrors] = useState<{
    [key: string]: string;
  }>({});

  // console.log("currentStage at dialog",currentStage)

  // Interview slots state
  const [interviewSlots, setInterviewSlots] = useState<InterviewSlot[]>([]);

  useEffect(()=>{
    if(currentStage){
      setGlobalSettings((prev:any)=>({...prev,...currentStage}))
    }
  },[currentStage])

  const fetchApplicantDetails = async (
    applicantIds: string[]
  ): Promise<Applicant[]> => {
    try {
      const promises = applicantIds.map(async (id) => {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/applicant/getApplicantPipelineSteps/${id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch applicant ${id}`);
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || `Failed to fetch applicant ${id}`);
        }
        return result.data;
      });

      const results = await Promise.allSettled(promises);
      const successfulResults: Applicant[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successfulResults.push(result.value);
        } else {
          console.error(
            `Failed to fetch applicant ${applicantIds[index]}:`,
            result.reason
          );
        }
      });

      return successfulResults;
    } catch (error) {
      console.error("Error fetching applicant details:", error);
      throw error;
    }
  };

  // Fetch applicant details when dialog opens
  useEffect(() => {
    const fetchMissingApplicants = async () => {
      if (!isOpen || selectedApplicants.size === 0) return;

      const applicantIds = Array.from(selectedApplicants);
      const missingIds = applicantIds.filter(
        (id) => !applicants.find((a) => a.ID === id)
      );

      if (missingIds.length > 0) {
        setIsLoadingApplicants(true);
        try {
          const fetchedApplicants = await fetchApplicantDetails(missingIds);
          setApplicants((prev) => [...prev, ...fetchedApplicants]);
        } catch (error) {
          console.error("Failed to fetch applicant details:", error);
        } finally {
          setIsLoadingApplicants(false);
        }
      }
    };

    fetchMissingApplicants();
  }, [isOpen, selectedApplicants]);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen && selectedApplicants.size > 0) {
      const size = selectedApplicants.size;
      if (size === 1) {
        const singleApplicantId = Array.from(selectedApplicants)[0];
        const applicant = applicants.find((a) => a.ID === singleApplicantId);
        const applicantName = applicant
          ? `${applicant.firstName} ${applicant.lastName}`.trim()
          : "Candidate";
        // Update this line to include the jobId
        setInterviewTitle(
          `${applicantName} - ${jobRole} (${jobSequence}) Interview`
        );
      } else {
        // Update this line to include the jobId
        setInterviewTitle(
          `Interviews for ${jobRole} (${jobSequence}) - ${size} Candidates`
        );
      }
      setInterviewDescription("");

      // Reset validation errors
      setTitleError("");
      setValidationErrors({});
      setGlobalSettingsErrors({});

      // Set global settings usage based on applicant count
      setUseGlobalSettings(showGlobalSettings);

      // Initialize interview slots
      const slots: InterviewSlot[] = Array.from(selectedApplicants).map(
        (applicantId) => ({
          id: `slot-${applicantId}`,
          applicantId,
          date: "",
          time: "",
          duration: 60,
          interviewType: "",
          stage: currentStage.stageName ?? '',
          interviewers: [],
          location: "",
          meetingLink: "",
          isTeamsMeeting: false,
          notes: "",
          timeZone: "Asia/Kolkata",
          stageId:currentStage.stageId ?? null
        })
      );
      setInterviewSlots(slots);
    }
  }, [isOpen, selectedApplicants, showGlobalSettings,currentStage]);

  // Handle slot updates
  const handleUpdateSlot = (id: string, updates: Partial<InterviewSlot>) => {
    setInterviewSlots((slots) =>
      slots.map((slot) => (slot.id === id ? { ...slot, ...updates } : slot))
    );

    // Clear validation errors for updated fields
    const newErrors = { ...validationErrors };
    Object.keys(updates).forEach((field) => {
      delete newErrors[`${id}-${field}`];
    });
    setValidationErrors(newErrors);
  };

  // Handle global settings change
  const handleGlobalSettingsChange = (updates: any) => {
    setGlobalSettings((prev: any) => ({ ...prev, ...updates }));

    // Clear validation errors for updated fields
    const newErrors = { ...globalSettingsErrors };
    Object.keys(updates).forEach((field) => {
      delete newErrors[field];
    });
    setGlobalSettingsErrors(newErrors);
  };

  // Validation functions
  const validateTitle = (title: string): string => {
    if (!title.trim()) {
      return "Interview title is required";
    }
    if (title.trim().length < 3) {
      return "Interview title must be at least 3 characters long";
    }
    return "";
  };

  const validateGlobalSettings = (): boolean => {
    if (!useGlobalSettings) return true;

    const errors: { [key: string]: string } = {};

    if (!globalSettings.date) errors.date = "Date is required";
    if (!globalSettings.time) errors.time = "Time is required";
    if (!globalSettings.interviewType)
      errors.interviewType = "Interview type is required";
    if (!globalSettings.stage) errors.stage = "Interview stage is required";
    if (globalSettings.interviewers.length === 0)
      errors.interviewers = "At least one interviewer is required";
    if (globalSettings.duration < 15 || globalSettings.duration > 480)
      errors.duration = "Duration must be between 15 and 480 minutes";

    // Conditional validation for in-person interviews
    if (globalSettings.interviewType === "in-person") {
      if (!globalSettings.location.trim()) {
        errors.location = "Location is required for in-person interviews";
      }
    }

    // Conditional validation for virtual and in-person meetings
    if (
      globalSettings.interviewType === "virtual" ||
      globalSettings.interviewType === "in-person"
    ) {
      if (
        !globalSettings.isTeamsMeeting &&
        !globalSettings.meetingLink.trim()
      ) {
        errors.meetingLink =
          "A meeting link is required, or you must select 'Generate Teams Meeting'";
      }
    }

    // **NEW**: Check if the new date/time is in the past
    if (globalSettings.date && globalSettings.time) {
      const combinedDateTime = new Date(
        `${globalSettings.date}T${globalSettings.time}`
      );
      if (combinedDateTime <= new Date()) {
        errors.date = "Interview must be scheduled for a future date and time";
      }
    }

    setGlobalSettingsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateIndividualSlots = (): boolean => {
    if (useGlobalSettings) return true;

    const errors: { [key: string]: string } = {};

    interviewSlots.forEach((slot) => {
      if (!slot.date) errors[`${slot.id}-date`] = "Date is required";
      if (!slot.time) errors[`${slot.id}-time`] = "Time is required";
      if (!slot.interviewType)
        errors[`${slot.id}-interviewType`] = "Interview type is required";
      if (!slot.stage)
        errors[`${slot.id}-stage`] = "Interview stage is required";
      if (slot.interviewers.length === 0)
        errors[`${slot.id}-interviewers`] =
          "At least one interviewer is required";
      if (isNaN(slot.duration) || slot.duration < 15 || slot.duration > 480)
        errors[`${slot.id}-duration`] =
          "Duration must be between 15 and 480 minutes";

      // Conditional validation for in-person interviews
      if (slot.interviewType === "in-person") {
        if (!slot.location.trim()) {
          errors[`${slot.id}-location`] =
            "Location is required for in-person interviews";
        }
      }

      // Conditional validation for virtual and in-person meetings
      if (
        slot.interviewType === "virtual" ||
        slot.interviewType === "in-person"
      ) {
        if (!slot.isTeamsMeeting && !slot.meetingLink.trim()) {
          errors[`${slot.id}-meetingLink`] =
            "A meeting link is required, or you must select 'Generate Teams Meeting'";
        }
      }

      // **NEW**: Check if the new date/time is in the past
      if (slot.date && slot.time) {
        const combinedDateTime = new Date(`${slot.date}T${slot.time}`);
        if (combinedDateTime <= new Date()) {
          errors[`${slot.id}-date`] =
            "Interview must be scheduled for a future date and time";
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form validation
  const isFormValid = (): boolean => {
    const titleErr = validateTitle(interviewTitle);
    setTitleError(titleErr);

    const isGlobalValid = validateGlobalSettings();
    const areSlotsValid = validateIndividualSlots();

    return !titleErr && isGlobalValid && areSlotsValid;
  };

  // Handle interview scheduling
  const handleScheduleSubmit = async () => {
    if (!isFormValid()) {
      // console.log("Form not valid")
      return;
    }
    // console.log(interviewTitle, interviewDescription, interviewSlots);
    setIsSubmitting(true);
    try {
      const scheduleData = {
        title: interviewTitle,
        description: interviewDescription,
        interviews: interviewSlots.map((slot) => {
          const currentSlot = useGlobalSettings
            ? { ...slot, ...globalSettings }
            : slot;

          const combinedDateTime = new Date(
            `${currentSlot.date}T${currentSlot.time}`
          );

          const istOffsetMs = 5.5 * 60 * 60 * 1000;
          const adjustedDateTime = new Date(
            combinedDateTime.getTime() + istOffsetMs
          );

          return {
            applicantId: currentSlot.applicantId,
            dateTime: adjustedDateTime.toISOString(),
            duration: currentSlot.duration,
            type: currentSlot.interviewType,
            stage: currentSlot.stage,
            stageId: currentSlot.stageId,
            interviewers: currentSlot.interviewers,
            location: currentSlot.location,
            meetingLink: currentSlot.meetingLink,
            isTeamsMeeting: currentSlot.isTeamsMeeting,
            notes: currentSlot.notes,
            timeZone: currentSlot.timeZone,
          };
        }),
      };

      // console.log("Scheduling bulk interviews:", scheduleData);

      onScheduleSuccess?.(scheduleData);
      // onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling interviews:", error);
      alert(
        "An error occurred while scheduling the interviews. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTitleChange = (value: string) => {
    setInterviewTitle(value);
    const error = validateTitle(value);
    setTitleError(error);
  };

  if (selectedApplicants.size === 0) {
    return null;
  }


  // console.log("global setting at schedule",globalSettings)

  return (
    <OverlayDrawer
      open={isOpen}
      onOpenChange={(_, { open }) => onOpenChange(!!open)}
      position="end"
      size="large"
    >
      <DrawerHeader className="!bg-gradient-to-br !from-[#EEF2FF] !to-[#FAF5FF] p-2 mb-2">
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<DismissRegular />}
              onClick={() => onOpenChange(false)}
            />
          }
        >
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 p-1 bg-white rounded-lg flex justify-center items-center">
              <Calendar20Regular />
            </div>
            <div className="flex flex-col">
              <Subtitle1 className="!text-black !text-md">
                Schedule Interviews
              </Subtitle1>
              <Caption1 className="!text-gray-700 !text-xs">
                Schedule interviews for {selectedApplicants.size} Applicant
                {selectedApplicants.size > 1 ? "s" : ""}{" "}
              </Caption1>
            </div>
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody>
        <div className="space-y-4">
          {/* Applicant Summary */}
          <ApplicantSummary
            selectedApplicants={selectedApplicants}
            applicants={applicants}
            isLoadingApplicants={isLoadingApplicants}
          />

          {/* Interview Details */}
          <div className="flex flex-col gap-1">
            <Subtitle1 className="!text-sm !text-gray-800">
              Interview Details
            </Subtitle1>
            <div className="p-4 space-y-4">
              <Field
                label="Interview Title"
                required
                validationState={titleError ? "error" : "none"}
                validationMessage={titleError}
              >
                <Input
                  value={interviewTitle}
                  onChange={(_, data) => handleTitleChange(data.value)}
                  placeholder="Enter interview title"
                  className="!border-1 !border-gray-200 !rounded-lg !p-2 after:!border-0"
                />
              </Field>
              <Field label="Interview Description">
                <Textarea
                  value={interviewDescription}
                  onChange={(_, data) => setInterviewDescription(data.value)}
                  placeholder="Enter interview description (optional)"
                  rows={3}
                  className="!border-1 !border-gray-200 !rounded-lg !p-1 after:!border-0"
                />
              </Field>
            </div>
          </div>

          {/* Global Settings - Only show for multiple applicants */}
          {showGlobalSettings && (
            <GlobalSettings
              useGlobalSettings={useGlobalSettings}
              setUseGlobalSettings={setUseGlobalSettings}
              globalSettings={globalSettings}
              onGlobalSettingsChange={handleGlobalSettingsChange}
              stages={stages}
              validationErrors={globalSettingsErrors}
            />
          )}

          {/* Individual Interview Forms */}
          <FluentProvider>
            <div className="space-y-4 flex flex-col">
              <Text weight="semibold" className="block">
                Interview Settings
              </Text>
              {interviewSlots.map((slot) => {
                const applicant = applicants.find(
                  (a) => a.ID === slot.applicantId
                );
                if (!applicant) return null;

                return (
                  <InterviewForm
                    key={slot.id}
                    applicant={applicant}
                    slot={slot}
                    onUpdateSlot={(updates: any) => {
                      handleUpdateSlot(slot.id, updates);
                    }}
                    stages={stages}
                    globalSettings={globalSettings}
                    useGlobalSettings={useGlobalSettings}
                    validationErrors={validationErrors}
                    slotId={slot.id}
                  />
                );
              })}
            </div>
          </FluentProvider>
        </div>
        {/* Actions footer */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t mt-4 pt-3 pb-3 flex justify-end gap-2">
          <Button
            appearance="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="!rounded-xl !border-1 !border-gray-300 !text-black"
          >
            Cancel
          </Button>
          <Button
            onClick={handleScheduleSubmit}
            disabled={isLoading}
            icon={
              isLoading ? <Spinner size="tiny" /> : <Calendar20Regular />
            }
            className={isLoading?"!bg-gray-300 !text-gray-100":"!bg-gradient-to-br !from-[#0153A5] !to-[#2FC2FE] !text-white !rounded-xl !font-medium !p-2"}
          >
            {isLoading ? "Scheduling..." : "Schedule Interviews"}
          </Button>
        </div>
      </DrawerBody>
    </OverlayDrawer>
  );
};

export default ScheduleDialog;
