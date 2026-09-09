import React, { useState, useEffect } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  Button,
  Field,
  Input,
  Textarea,
  Dropdown,
  Option,
  Checkbox,
  Badge,
  Card,
  Avatar,
  CardHeader,
  Divider,
  Spinner,
  Text,
} from "@fluentui/react-components";
import {
  Calendar24Regular,
  Clock24Regular,
  Video24Regular,
  Phone24Regular,
  Building24Regular,
  Dismiss24Regular,
  Video20Regular,
} from "@fluentui/react-icons";
import { InterviewStage } from "../../../Types/interview";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import MultiSelectPeoplePicker from "./MultiSelectPeoplePicker";
import { fetchUsersByID } from "../../../Services/GraphAPI"; // Import the fetchUsers function
import { useAuth } from "../../../Auth/AuthProvider";

interface Person {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  role?: string; // Add this
  isPrimary?: boolean; // Add this
}

interface ScheduledInterview {
  interviewId: string;
  applicantId: string;
  title: string;
  type: "phone" | "virtual" | "in-person";
  scheduledDateTime: string;
  duration: number;
  location: string;
  meetingLink?: string;
  isTeamsMeeting: boolean;
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled";
  notes: string;
  timeZone?: string;
  stageId?: string;
  interviewers?: Person[];
  outlookEventId?: string;
  originalDateTime?: string;
  rescheduleCount?: number;
  rescheduleReason?: string;
  lastRescheduledAt?: string;
  stage?: string;
  interviewerId?: string; // Add this property
}

interface RescheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  interview: ScheduledInterview | null;
  applicant: any | null;
  onRescheduleSuccess: (updatedInterview: ScheduledInterview) => Promise<void>;
  stages?: InterviewStage[];
}

const RescheduleDialog: React.FC<RescheduleDialogProps> = ({
  isOpen,
  onOpenChange,
  interview,
  applicant,
  onRescheduleSuccess,
  stages = [],
}) => {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    duration: 60,
    interviewType: "virtual" as "phone" | "virtual" | "in-person",
    stage: "",
    stageId: "",
    interviewers: [] as Person[],
    location: "",
    meetingLink: "",
    isTeamsMeeting: true,
    notes: "",
  });
  // console.log(interview);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInterviewer, setIsLoadingInterviewer] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const { accessToken }: any = useAuth();
  // Sort stages like in InterviewForm
  // console.log("Stages in scheduleDialog:", stages);
  const sortedStages = [...stages]
    .sort((a, b) => a.Order - b.Order)
    .filter(
      (s) => !["hired", "applied", "hr screening"].includes(s.ID.toLowerCase())
    );

  // Function to format date in DD/MM/YYYY format
  const formatDateDisplay = (date?: Date): string => {
    if (!date || isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // Initialize form data when interview changes
  useEffect(() => {
    const initializeFormData = async () => {
      if (interview && applicant) {
        // console.log("Initializing form with interview:", interview);
        // console.log("Interview interviewers:", interview.interviewers);

        // Set basic form data first
        const basicFormData: any = {
          date: formatDateForStorage(new Date(interview.scheduledDateTime)),
          time: interview.scheduledDateTime.slice(11, 16),
          duration: interview.duration || 60,
          interviewType: interview.type,
          stage: interview.stage || "",
          stageId: interview.stageId || "",
          interviewers: [], // Initialize as empty first
          location: interview.location || "",
          meetingLink: interview.meetingLink || "",
          isTeamsMeeting: Boolean(interview.isTeamsMeeting), // Ensure boolean
          notes: interview.notes || "",
        };

        // Handle interviewers data - try multiple approaches
        let finalInterviewers: Person[] = [];

        // If interviewers array exists and has data
        if (
          interview.interviewers &&
          Array.isArray(interview.interviewers) &&
          interview.interviewers.length > 0
        ) {
          finalInterviewers = interview.interviewers.map(
            (interviewer: any) => ({
              id: interviewer.id || interviewer.interviewerId,
              displayName: interviewer.displayName || interviewer.name,
              email: interviewer.email,
              role: interviewer.role || "Interviewer",
              isPrimary:
                interviewer.isPrimary === true ||
                interviewer.isPrimary === "true",
            })
          );
          // console.log("Using existing interviewers:", finalInterviewers);
        }
        // If there's an interviewerId but no interviewers array, fetch the interviewer
        else if (interview.interviewerId) {
          try {
            setIsLoadingInterviewer(true);
            // console.log("Fetching interviewer by ID:", interview.interviewerId);
            const fetchedInterviewer = await fetchUsersByID(
              interview.interviewerId,
              accessToken
            );
            // console.log("Fetched interviewer:", fetchedInterviewer);

            if (fetchedInterviewer && Array.isArray(fetchedInterviewer)) {
              finalInterviewers = fetchedInterviewer;
            } else if (fetchedInterviewer) {
              finalInterviewers = [fetchedInterviewer];
            }
          } catch (error) {
            console.error("Error fetching interviewer:", error);
          } finally {
            setIsLoadingInterviewer(false);
          }
        }

        // Set the final form data with interviewers
        basicFormData.interviewers = finalInterviewers;

        // console.log("Final form data:", basicFormData);
        // console.log("Final interviewers count:", finalInterviewers.length);
        // console.log("isTeamsMeeting value:", basicFormData.isTeamsMeeting);

        setFormData(basicFormData);
      }
    };

    initializeFormData();
  }, [interview, applicant]);

  // Handle field updates like in InterviewForm
  const handleFieldUpdate = (updates: Partial<typeof formData>) => {
    let finalUpdates = { ...updates };

    // ** NEW LOGIC: Smart updates based on interview type change **
    if (updates.interviewType) {
      if (updates.interviewType === "virtual") {
        // Switching to Virtual: Clear the physical location.
        finalUpdates.location = "";
        // console.log("Switched to Virtual, clearing location.");
      } else if (updates.interviewType === "in-person") {
        // Switching to In-Person: Clear the meeting link if Teams is not selected.
        if (!formData.isTeamsMeeting) {
          finalUpdates.meetingLink = "";
        }
        // console.log("Switched to In-Person, clearing meeting link.");
      }
    }
    setFormData((prev) => ({ ...prev, ...updates }));

    // Clear validation errors for updated fields
    const updatedFields = Object.keys(updates);
    if (updatedFields.some((field) => validationErrors[field])) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        updatedFields.forEach((field) => {
          delete newErrors[field];
        });
        return newErrors;
      });
    }
  };

  const handleInterviewersChange = (people: Person | Person[] | null) => {
    let normalized: Person[] = [];
    if (!people) {
      normalized = [];
    } else if (Array.isArray(people)) {
      normalized = people;
    } else {
      normalized = [people];
    }
    handleFieldUpdate({ interviewers: normalized });
  };

  // CORRECTED: No longer clears location field
  const handleTeamsMeetingToggle = (checked: boolean) => {
    handleFieldUpdate({
      isTeamsMeeting: checked,
      meetingLink: checked ? "Teams meeting will be generated" : "",
    });
  };

  // Convert string date to Date object for DatePicker
  const getDateValue = (dateString: string): Date | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  // Convert Date object to string for storage
  const formatDateForStorage = (date: Date | null): string => {
    if (!date) return "";
    // Use local timezone values to avoid UTC conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Handle date change from DatePicker
  const handleDateChange = (date: Date | null | undefined) => {
    const formattedDate = formatDateForStorage(date || null);
    handleFieldUpdate({ date: formattedDate });
  };

  // UPDATED VALIDATION LOGIC
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.date) errors.date = "Interview date is required";
    if (!formData.time) errors.time = "Interview time is required";
    if (isNaN(formData.duration) || formData.duration <= 15)
      errors.duration = "Duration must be greater than 15 minutes";
    if (formData.duration > 480)
      errors.duration = "Duration cannot exceed 480 minutes (8 hours)";
    if (!formData.interviewType)
      errors.interviewType = "Interview type is required";
    if (formData.interviewers.length === 0)
      errors.interviewers = "At least one interviewer is required";

    // Conditional validation for in-person interviews
    if (formData.interviewType === "in-person") {
      if (!formData.location.trim()) {
        errors.location = "Location is required for in-person interviews";
      }
    }

    // Conditional validation for virtual and in-person meetings
    if (
      formData.interviewType === "virtual" ||
      formData.interviewType === "in-person"
    ) {
      if (!formData.isTeamsMeeting && !formData.meetingLink.trim()) {
        errors.meetingLink =
          "A meeting link is required, or you must select 'Generate Teams Meeting'";
      }
    }

    // Check if the new date/time is in the past
    if (formData.date && formData.time) {
      const combinedDateTime = new Date(`${formData.date}T${formData.time}`);
      if (combinedDateTime <= new Date()) {
        errors.date = "Interview must be scheduled for a future date and time";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !interview || !applicant) return;

    setIsLoading(true);

    try {
      const combinedDateTime = new Date(`${formData.date}T${formData.time}`);

      // Add IST offset (5 hours 30 minutes = 330 minutes = 19800000 milliseconds)
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const adjustedDateTime = new Date(
        combinedDateTime.getTime() + istOffsetMs
      );

      // Enhanced interviewer processing - ensure all interviewer data is preserved
      const processedInterviewers = formData.interviewers.map(
        (interviewer, index) => ({
          id: interviewer.id,
          displayName: interviewer.displayName,
          email: interviewer.email,
          role: interviewer.role || "Interviewer",
          isPrimary: interviewer.isPrimary,
        })
      );

      // console.log(
      //   "Submitting reschedule with interviewers:",
      //   processedInterviewers
      // );
      // console.log("isTeamsMeeting value:", formData.isTeamsMeeting);

      const updatedInterview: ScheduledInterview = {
        ...interview,
        scheduledDateTime: adjustedDateTime.toISOString(),
        duration: formData.duration,
        type: formData.interviewType,
        stage: formData.stage,
        stageId: formData.stageId,
        interviewers: processedInterviewers,
        location: formData.location,
        meetingLink: formData.meetingLink,
        isTeamsMeeting: Boolean(formData.isTeamsMeeting), // Ensure boolean
        notes: formData.notes,
        timeZone: "Asia/Kolkata",
        // Preserve original outlook event ID
        outlookEventId: interview.outlookEventId,
      };

      // console.log("Final updated interview object:", updatedInterview);
      await onRescheduleSuccess(updatedInterview);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to reschedule interview:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case "phone":
        return <Phone24Regular className="w-5 h-5" color="#0078D4" />;
      case "virtual":
        return <Video24Regular className="w-5 h-5" color="#0078D4" />;
      case "in-person":
        return <Building24Regular className="w-5 h-5" color="#0078D4" />;
      default:
        return <Calendar24Regular className="w-5 h-5" color="#0078D4" />;
    }
  };

  const formatOriginalDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!interview || !applicant) {
    return null;
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(_, { open }) => onOpenChange(open)}
      position="end"
      className="!w-[75%]"
    >
      <DrawerBody className="overflow-y-auto !p-0">
        <DrawerHeader
          className="!flex !flex-row items-center justify-between !px-[22px] !py-[18px]"
          style={{
            background: "linear-gradient(90deg, #EEF2FF 0%, #fff 100%)",
            border: "1px solid #E5E7EB",
          }}
        >
          <div className="h-[30px] w-[30px] flex justify-center items-center rounded-[5px] bg-[#E0E7FF]">
            <Calendar24Regular className="w-5 h-5 text-[#4F46E5]" />
          </div>
          <div className="flex-1">
            <Text weight="semibold" size={400}>
              Reschedule Interview
            </Text>
          </div>
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            onClick={() => onOpenChange(false)}
          />
        </DrawerHeader>
        <div className="p-6 space-y-6">
          {/* Current Interview Info */}
          <Card
            style={{
              boxShadow: "none",
              backgroundColor: "#fff",
              border: "1px solid #E0E7FF",
              borderRadius: "8px",
              padding: "22px 20px",
              gap: "15px",
            }}
          >
            <CardHeader
              header={
                <div className="flex items-center justify-between w-[100%]">
                  <div className="flex items-center gap-3">
                    <Avatar
                      size={40}
                      name={`${applicant.firstName} ${applicant.lastName}`}
                      image={{ src: applicant.profilePicture || undefined }}
                      color="brand"
                    />
                    <div className="flex flex-col">
                      <Text weight="semibold" size={400}>
                        {applicant.firstName} {applicant.lastName}
                      </Text>
                      <Text size={200} className="text-gray-500">
                        {applicant.ApplicantCode}
                      </Text>
                    </div>
                  </div>

                  <Badge
                    appearance="outline"
                    style={{
                      padding: "16px 12px",
                      backgroundColor: "#fef3c7",
                      color: "#B45309",
                      border: "none",
                    }}
                  >
                    Current Schedule
                  </Badge>
                </div>
              }
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                {getInterviewTypeIcon(interview.type)}
                <span className="capitalize">{interview.type} Interview</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock24Regular className="w-4 h-4" color="#0078D4" />
                <span>
                  {formatOriginalDateTime(interview.scheduledDateTime)}
                </span>
              </div>
              {interview.location && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Building24Regular className="w-4 h-4" color="#0078D4" />
                  <span>{interview.location}</span>
                </div>
              )}
            </div>
          </Card>

          <Divider />

          {/* Reschedule Form - Following InterviewForm structure */}
          <div className="p-[12px] rounded-[8px] bg-[#F9FAFB] flex flex-col gap-[18px] mb-[5px]">
            <div className="space-y-4">
              <Text weight="semibold" size={300}>
                New Interview Details
              </Text>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date and Time */}
                <Field
                  label="Interview Date"
                  required
                  validationState={validationErrors.date ? "error" : "none"}
                  validationMessage={validationErrors.date}
                >
                  <DatePicker
                    value={getDateValue(formData.date)}
                    onSelectDate={handleDateChange}
                    placeholder="Select date (DD/MM/YYYY)"
                    formatDate={formatDateDisplay}
                  />
                </Field>

                <Field
                  label="Interview Time"
                  required
                  validationState={validationErrors.time ? "error" : "none"}
                  validationMessage={validationErrors.time}
                >
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(_, data) =>
                      handleFieldUpdate({ time: data.value })
                    }
                  />
                </Field>

                {/* Duration and Type */}
                <Field
                  label="Duration (minutes)"
                  required
                  validationState={validationErrors.duration ? "error" : "none"}
                  validationMessage={validationErrors.duration}
                >
                  <Input
                    type="number"

                    value={isNaN(formData.duration) ? "" : formData.duration.toString()}
                    onChange={(_, data) =>
                      handleFieldUpdate({ duration: data.value === "" ? NaN : parseInt(data.value) })
                    }
                    min={15}
                    max={480}
                  />
                </Field>

                <Field
                  label="Interview Type"
                  required
                  validationState={
                    validationErrors.interviewType ? "error" : "none"
                  }
                  validationMessage={validationErrors.interviewType}
                >
                  <Dropdown
                    value={formData.interviewType}
                    onOptionSelect={(_, data) =>
                      handleFieldUpdate({
                        interviewType: data.optionValue as any,
                      })
                    }
                    placeholder="Select interview type"
                  >
                    <Option value="phone">📞 Phone Interview</Option>
                    <Option value="virtual">📹 Virtual Interview</Option>
                    <Option value="in-person">🏢 In-Person Interview</Option>
                  </Dropdown>
                </Field>

                {/* Stage */}
                {sortedStages.length > 0 && (
                  <Field
                    label="Interview Stage"
                    required
                    validationState={validationErrors.stage ? "error" : "none"}
                    validationMessage={validationErrors.stage}
                  >
                    <Dropdown
                      value={formData.stage}
                      onOptionSelect={(_, data) => {
                        handleFieldUpdate({
                          stage: data.optionText || "",
                          stageId: data.optionValue || "",
                        });
                      }}
                      placeholder="Select stage"
                    >
                      {sortedStages.map((stage) => (
                        <Option key={stage.ID} value={stage.ID}>
                          {stage.InterviewName}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                )}
              </div>

              {/* Interviewers */}
              <Field
                label="Interviewers"
                required
                validationState={
                  validationErrors.interviewers ? "error" : "none"
                }
                validationMessage={validationErrors.interviewers}
              >
                {isLoadingInterviewer && (
                  <div className="flex items-center gap-2 mb-2">
                    <Spinner size="tiny" />
                    <Text size={200}>Loading interviewer...</Text>
                  </div>
                )}
                <MultiSelectPeoplePicker
                  label=""
                  multiple={true}
                  placeholder="Search and select interviewers..."
                  selectedPeople={formData.interviewers}
                  onSelectionChanged={handleInterviewersChange}
                />
              </Field>

              {/* Location and Meeting Details */}
              <div className="space-y-4">
                {(formData.interviewType === "virtual" ||
                  formData.interviewType === "in-person") && (
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={formData.isTeamsMeeting}
                        onChange={(_, data: any) =>
                          handleTeamsMeetingToggle(data.checked || false)
                        }
                        label="Generate Teams Meeting"
                      />
                    </div>
                  )}

                {formData.isTeamsMeeting && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Video20Regular className="text-blue-600" />
                      <Text size={200} className="text-blue-800">
                        Teams meeting will be automatically generated and
                        invitation sent to all participants.
                      </Text>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* UPDATED JSX: Location Field */}
                  {formData.interviewType === "in-person" && (
                    <Field
                      label="Location"
                      required
                      validationState={
                        validationErrors.location ? "error" : "none"
                      }
                      validationMessage={validationErrors.location}
                    >
                      <Input
                        value={formData.location}
                        onChange={(_, data) =>
                          handleFieldUpdate({ location: data.value })
                        }
                        placeholder="e.g., Conference Room A, Building 1"
                      />
                    </Field>
                  )}

                  {/* UPDATED JSX: Meeting Link Field */}
                  {!formData.isTeamsMeeting &&
                    (formData.interviewType === "virtual" ||
                      formData.interviewType === "in-person") && (
                      <Field
                        label="Meeting Link"
                        required
                        validationState={
                          validationErrors.meetingLink ? "error" : "none"
                        }
                        validationMessage={validationErrors.meetingLink}
                      >
                        <Input
                          type="url"
                          value={formData.meetingLink}
                          onChange={(_, data) =>
                            handleFieldUpdate({ meetingLink: data.value })
                          }
                          placeholder="https://meet.google.com/..."
                        />
                      </Field>
                    )}
                </div>
              </div>

              {/* Notes */}
              <Field label="Additional Notes">
                <Textarea
                  value={formData.notes}
                  onChange={(_, data) =>
                    handleFieldUpdate({ notes: data.value })
                  }
                  placeholder="Any additional notes for this interview..."
                  rows={3}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                appearance="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                icon={<Dismiss24Regular />}
                style={{ borderRadius: "30px" }}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleSubmit}
                disabled={isLoading}
                icon={
                  isLoading ? <Spinner size="tiny" /> : <Calendar24Regular />
                }
                style={{
                  background:
                    "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)",
                  padding: "12px 18px",
                  borderRadius: "30px",
                  color: "#fff",
                }}
              >
                {isLoading ? "Rescheduling..." : "Reschedule Interview"}
              </Button>
            </div>
          </div>
        </div>
      </DrawerBody>
    </Drawer>
  );
};

export default RescheduleDialog;
