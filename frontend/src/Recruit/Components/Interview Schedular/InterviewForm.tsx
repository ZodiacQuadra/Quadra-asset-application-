import React, { useState, useEffect } from "react";
import {
  Field,
  Input,
  Dropdown,
  Option,
  Textarea,
  Badge,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Checkbox,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from "@fluentui/react-components";
import {
  Link20Regular,
  Location20Filled,
  Location20Regular,
  People20Regular,
  Video20Regular,
} from "@fluentui/react-icons";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import MultiSelectPeoplePicker from "./MultiSelectPeoplePicker";
import { Applicant, InterviewStage } from "../../../Types/interview";

interface Person {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
}

interface InterviewSlot {
  id: string;
  applicantId: string;
  date: string;
  time: string;
  duration: number;
  interviewType: string;
  stage: string;
  interviewers: Person[];
  location: string;
  meetingLink: string;
  isTeamsMeeting: boolean;
  notes: string;
  stageId?: string; // Optional for backward compatibility
  timeZone: string;
  // Optional email field for interviewers
}

interface InterviewFormProps {
  applicant: Applicant;
  slot: InterviewSlot;
  onUpdateSlot: (updates: Partial<InterviewSlot>) => void;
  stages: InterviewStage[];
  globalSettings: any;
  useGlobalSettings: boolean;
  validationErrors: { [key: string]: string };
  slotId: string;
}

const InterviewForm: React.FC<InterviewFormProps> = ({
  applicant,
  slot,
  onUpdateSlot,
  stages,
  globalSettings,
  useGlobalSettings,
  validationErrors,
  slotId,
}) => {
  const sortedStages = [...stages]
    .sort((a, b) => a.Order - b.Order)
    .filter(
      (s) => !["hired", "applied", "hr screening"].includes(s.ID.toLowerCase())
    );

  // Use global settings if enabled, otherwise use slot data
  const currentSlot = useGlobalSettings ? { ...slot, ...globalSettings } : slot;

  const handleFieldUpdate = (updates: Partial<InterviewSlot>) => {
    // console.log(updates);
    onUpdateSlot(updates);
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

  const handleTeamsMeetingToggle = (checked: boolean) => {
    handleFieldUpdate({
      isTeamsMeeting: checked,
      meetingLink: checked ? "Teams meeting will be generated" : "",
    });
  };

  // Helper function to get validation error for a field
  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors[`${slotId}-${fieldName}`];
  };

  // Convert string date to Date object for DatePicker
  const getDateValue = (dateString: string): Date | null => {
    if (!dateString) return null;
    try {
      // Handle different date formats
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
    // console.log("Selected date:", date);
    const formattedDate = formatDateForStorage(date || null);
    handleFieldUpdate({ date: formattedDate });
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <Text weight="semibold">
          {applicant.firstName} {applicant.lastName}
        </Text>
        <Badge size="small" className="!bg-[#E5EDF4] !text-[#0153A5]">
          {applicant.ApplicantCode}
        </Badge>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date and Time */}
          <Field
            label="Interview Date"
            required
            validationState={getFieldError("date") ? "error" : "none"}
            validationMessage={getFieldError("date")}
          >
            <DatePicker
              value={getDateValue(currentSlot.date)}
              onSelectDate={handleDateChange}
              disabled={useGlobalSettings}
              placeholder="Select date"
              className="!border-1 !border-gray-200 !rounded-lg !p-2 after:!border-0"
              formatDate={(date?: Date) => {
                if (!date) return "";
                return date.toLocaleDateString();
              }}
              minDate={new Date()}
            />
          </Field>

          <Field
            label="Interview Time"
            required
            validationState={getFieldError("time") ? "error" : "none"}
            validationMessage={getFieldError("time")}
          >
            <Input
              type="time"
              value={currentSlot.time}
              onChange={(_, data) => handleFieldUpdate({ time: data.value })}
              disabled={useGlobalSettings}
              className="!border-1 !border-gray-200 !rounded-lg !p-2 after:!border-0"
            />
          </Field>

          {/* Duration and Type */}
          <Field
            label="Duration (minutes)"
            required
            validationState={getFieldError("duration") ? "error" : "none"}
            validationMessage={getFieldError("duration")}
          >
            <Input
              type="number"
              value={isNaN(currentSlot.duration) ? "" : currentSlot.duration.toString()}
              onChange={(_, data) =>
                handleFieldUpdate({ duration: data.value === "" ? NaN : parseInt(data.value) })
              }
              min={15}
              max={480}
              disabled={useGlobalSettings}
              className="!border-1 !border-gray-200 !rounded-lg !p-1 after:!border-0"
            />
          </Field>

          <Field
            label="Interview Type"
            required
            validationState={getFieldError("interviewType") ? "error" : "none"}
            validationMessage={getFieldError("interviewType")}
          >
            <Dropdown
              value={currentSlot.interviewType}
              onOptionSelect={(_, data) =>
                handleFieldUpdate({ interviewType: data.optionValue || "" })
              }
              placeholder="Select interview type"
              disabled={useGlobalSettings}
              className="!border-1 !border-gray-200 !rounded-lg !p-1 after:!border-0"
            >
              <Option value="phone">📞 Phone Interview</Option>
              <Option value="virtual">📹 Virtual Interview</Option>
              <Option value="in-person">🏢 In-Person Interview</Option>
            </Dropdown>
          </Field>

          {/* Stage */}
          <Field
            label="Interview Stage"
            required
            validationState={getFieldError("stage") ? "error" : "none"}
            validationMessage={getFieldError("stage")}

          >
            <Dropdown
              value={currentSlot.stage}
              onOptionSelect={(_, data) => {
                // console.log(data);
                handleFieldUpdate({
                  stage: data.optionText || "",
                  stageId: data.optionValue || "",
                });
              }}
              placeholder="Select stage"
              disabled
              className="!border-1 !border-gray-200 !rounded-lg !p-1 after:!border-0"

            >
              {sortedStages.map((stage) => (
                <Option key={stage.ID} value={stage.ID}>
                  {stage.InterviewName}
                </Option>
              ))}
            </Dropdown>
          </Field>
        </div>

        {/* Interviewers */}
        <Field
          label="Interviewers"
          required
          validationState={getFieldError("interviewers") ? "error" : "none"}
          validationMessage={getFieldError("interviewers")}
        >
          <MultiSelectPeoplePicker
            label=""
            multiple={true}
            selectedPeople={currentSlot.interviewers}
            placeholder="Search and select interviewers..."
            onSelectionChanged={handleInterviewersChange}
            disabled={useGlobalSettings}
          />
        </Field>

        {/* Location and Meeting Details */}
        <div className="space-y-4">
          {(currentSlot.interviewType === "virtual" ||
            currentSlot.interviewType === "in-person") && (
            <div className="flex items-center gap-3 !bg-gray-100 p-3 rounded-lg">
              <Checkbox
                checked={currentSlot.isTeamsMeeting}
                onChange={(_, data: any) =>
                  handleTeamsMeetingToggle(data.checked || false)
                }
                label="Generate Teams Meeting"
                disabled={useGlobalSettings}
              />
            </div>
          )}

          {currentSlot.isTeamsMeeting && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Video20Regular className="text-blue-600" />
                <Text size={200} className="text-blue-800">
                  Teams meeting will be automatically generated and invitation
                  sent to all participants.
                </Text>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location: Visible & Required for In-Person */}
            {currentSlot.interviewType === "in-person" && (
              <Field
                label="Location"
                required
                validationState={getFieldError("location") ? "error" : "none"}
                validationMessage={getFieldError("location")}
              >
                <Input
                  value={currentSlot.location}
                  onChange={(_, data) =>
                    handleFieldUpdate({ location: data.value })
                  }
                  contentBefore={<Location20Regular />}
                  placeholder="e.g., Conference Room A, Building 1"
                  disabled={useGlobalSettings}
                  className="!border-1 !border-gray-200 !rounded-lg !p-2 after:!border-0"
                />
              </Field>
            )}

            {/* Meeting Link: Visible & Required for Virtual/In-Person if Teams is OFF */}
            {!currentSlot.isTeamsMeeting &&
              (currentSlot.interviewType === "virtual" ||
                currentSlot.interviewType === "in-person") && (
                <Field
                  label="Meeting Link"
                  required
                  validationState={
                    getFieldError("meetingLink") ? "error" : "none"
                  }
                  validationMessage={getFieldError("meetingLink")}
                >
                  <Input
                    type="url"
                    value={currentSlot.meetingLink}
                    onChange={(_, data) =>
                      handleFieldUpdate({ meetingLink: data.value })
                    }
                    placeholder="https://meet.google.com/..."
                    disabled={useGlobalSettings}
                    className="!border-1 !border-gray-200 !rounded-lg !p-2 after:!border-0"
                    contentBefore={<Link20Regular />}
                  />
                </Field>
              )}
          </div>
        </div>

        {/* Notes */}
        <Field label="Additional Notes">
          <Textarea
            value={currentSlot.notes}
            onChange={(_, data) => handleFieldUpdate({ notes: data.value })}
            placeholder="Any additional notes for this interview..."
            rows={3}
            disabled={useGlobalSettings}
            className="!border-1 !border-gray-200 !rounded-lg !p-1 after:!border-0"
          />
        </Field>

        {/* Show global settings override notice */}
        {useGlobalSettings && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Text size={200} className="text-yellow-800">
              ⚠️ This interview is using global settings. Individual changes are
              disabled.
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewForm;
