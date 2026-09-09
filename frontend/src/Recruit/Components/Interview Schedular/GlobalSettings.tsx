import React from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  Field,
  Input,
  Dropdown,
  Option,
  Switch,
  Checkbox,
  Badge,
  Text,
} from "@fluentui/react-components";
import {
  Settings20Regular,
  People20Regular,
  Video20Regular,
  Location20Regular,
  Link20Regular,
} from "@fluentui/react-icons";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import MultiSelectPeoplePicker from "./MultiSelectPeoplePicker";
import { Person, InterviewStage } from "../../../Types/interview";

interface GlobalSettingsProps {
  useGlobalSettings: boolean;
  setUseGlobalSettings: (value: boolean) => void;
  globalSettings: any;
  onGlobalSettingsChange: (updates: any) => void;
  stages: InterviewStage[];
  validationErrors: { [key: string]: string };
}

const GlobalSettings: React.FC<GlobalSettingsProps> = ({
  useGlobalSettings,
  setUseGlobalSettings,
  globalSettings,
  onGlobalSettingsChange,
  stages,
  validationErrors,
}) => {
  // console.log(stages);
  const sortedStages = [...stages]
    .sort((a, b) => a.Order - b.Order)
    .filter(
      (s) => !["hired", "applied", "hr screening"].includes(s.ID.toLowerCase())
    );
  // Handle global interviewers change
  const handleGlobalInterviewersChange = (people: Person | Person[] | null) => {
    let normalized: Person[] = [];
    if (!people) {
      normalized = [];
    } else if (Array.isArray(people)) {
      normalized = people;
    } else {
      normalized = [people];
    }
    onGlobalSettingsChange({ interviewers: normalized });
  };

  const handleTeamsMeetingToggle = (checked: boolean) => {
    onGlobalSettingsChange({
      isTeamsMeeting: checked,
      meetingLink: checked ? "Teams meeting will be generated" : "",
    });
  };

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
    const formattedDate = formatDateForStorage(date || null);
    onGlobalSettingsChange({ date: formattedDate });
  };

  return (
    <Card className="w-full !shadow-none">
      <CardHeader
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Settings20Regular />
              <Text weight="semibold">Global Settings</Text>
              <Text size={200} className="text-gray-600">
                (Apply same settings to all interviews)
              </Text>
            </div>
            <Switch
              checked={useGlobalSettings}
              onChange={(_, data) => setUseGlobalSettings(data.checked)}
              label="Use global settings"
            />
          </div>
        }
      />
      {useGlobalSettings && (
        <CardPreview>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Date"
                required
                validationState={validationErrors.date ? "error" : "none"}
                validationMessage={validationErrors.date}
              >
                <DatePicker
                  value={getDateValue(globalSettings.date)}
                  onSelectDate={handleDateChange}
                  formatDate={(date?: Date) => {
                    if (!date) return "";
                    return date.toLocaleDateString();
                  }}
                  placeholder="Select date"
                  className="!border-1 !border-gray-200 !rounded-lg !p-2 after:!border-0"
                />
              </Field>
              <Field
                label="Time"
                required
                validationState={validationErrors.time ? "error" : "none"}
                validationMessage={validationErrors.time}
              >
                <Input
                  type="time"
                  value={globalSettings.time}
                  onChange={(_, data) =>
                    onGlobalSettingsChange({ time: data.value })
                  }
                  className="!border-1 !border-gray-200 !rounded-lg !p-2 after:!border-0"
                />
              </Field>
              <Field
                label="Duration (min)"
                required
                validationState={validationErrors.duration ? "error" : "none"}
                validationMessage={validationErrors.duration}
              >
                <Input
                  type="number"
                  value={globalSettings.duration.toString()}
                  onChange={(_, data) =>
                    onGlobalSettingsChange({
                      duration: parseInt(data.value) || 60,
                    })
                  }
                  min={15}
                  max={480}
                  className="!border-1 !border-gray-200 !rounded-lg !p-2 after:!border-0"
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
                  value={globalSettings.interviewType}
                  onOptionSelect={(_, data) =>
                    onGlobalSettingsChange({
                      interviewType: data.optionValue || "",
                    })
                  }
                  placeholder="Select type"
                  className="!border-1 !border-gray-200 !rounded-lg !p-2 after:!border-0"
                >
                  <Option value="phone">📞 Phone Interview</Option>
                  <Option value="virtual">📹 Virtual Interview</Option>
                  <Option value="in-person">🏢 In-Person Interview</Option>
                </Dropdown>
              </Field>
              <Field
                label="Interview Stage"
                required
                validationState={validationErrors.stage ? "error" : "none"}
                validationMessage={validationErrors.stage}
              >
                <Dropdown
                  value={globalSettings.stage}
                  onOptionSelect={(_, data) =>
                    onGlobalSettingsChange({
                      stage: data.optionText || "",
                      stageId: data.optionValue || "",
                    })
                  }
                  className="!border-1 !border-gray-200 !rounded-lg !p-2 after:!border-0"
                  placeholder="Select stage"
                >
                  {sortedStages.map((stage) => (
                    <Option key={stage.ID} value={stage.ID}>
                      {stage.InterviewName}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>

            <Field
              label="Interviewers"
              required
              validationState={validationErrors.interviewers ? "error" : "none"}
              validationMessage={validationErrors.interviewers}
            >
              <MultiSelectPeoplePicker
                label=""
                placeholder="Search and select interviewers..."
                onSelectionChanged={handleGlobalInterviewersChange}
                multiple={true}
              />
              {globalSettings.interviewers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {globalSettings.interviewers.map((interviewer: Person) => (
                    <Badge
                      key={interviewer.id}
                      appearance="outline"
                      size="medium"
                      icon={<People20Regular />}
                    >
                      {interviewer.displayName}
                    </Badge>
                  ))}
                </div>
              )}
            </Field>

            {(globalSettings.interviewType === "virtual" ||
              globalSettings.interviewType === "in-person") && (
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={globalSettings.isTeamsMeeting}
                  onChange={(_, data: any) =>
                    handleTeamsMeetingToggle(data.checked || false)
                  }
                  label="Generate Teams Meeting for all interviews"
                />
              </div>
            )}

            {globalSettings.isTeamsMeeting && (
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
              {/* Location Field: Show only for "in-person" interviews and is mandatory. */}
              {globalSettings.interviewType === "in-person" && (
                <Field
                  label="Location"
                  required
                  validationState={validationErrors.location ? "error" : "none"}
                  validationMessage={validationErrors.location}
                >
                  <Input
                    value={globalSettings.location}
                    onChange={(_, data) =>
                      onGlobalSettingsChange({
                        location: data.value,
                      })
                    }
                    contentBefore={<Location20Regular />}
                    placeholder="e.g., Conference Room A,1st Floor, Coimbatore"
                    className="!border-1 !border-gray-200 !rounded-lg !p-2 after:!border-0"
                  />
                </Field>
              )}

              {/* Meeting Link Field: Show for "virtual" or "in-person" if Teams meeting is not selected. It's mandatory in this case. */}
              {!globalSettings.isTeamsMeeting &&
                (globalSettings.interviewType === "virtual" ||
                  globalSettings.interviewType === "in-person") && (
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
                      value={globalSettings.meetingLink}
                      onChange={(_, data) =>
                        onGlobalSettingsChange({
                          meetingLink: data.value,
                        })
                      }
                      contentBefore={<Link20Regular />}
                      placeholder="https://meet.google.com/..."
                      className="!border-1 !border-gray-200 !rounded-lg !p-2 after:!border-0"
                    />
                  </Field>
                )}
            </div>
          </div>
        </CardPreview>
      )}
    </Card>
  );
};

export default GlobalSettings;
