import { useState, useEffect } from "react";
import {
  Dialog,
  Body1Strong,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Textarea,
  Field,
  Text,
  FluentProvider,
  DialogContent,
  Spinner,
  Tab,
  TabList,
  TabValue,
  Badge,
  MessageBar,
  Caption1,
  Avatar,
  DialogTrigger,
  OverlayDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
} from "@fluentui/react-components";
import {
  TextEffectsSparkle24Regular,
  History24Regular,
  CheckmarkCircle24Regular,
  CheckmarkCircle20Regular,
  DismissRegular,
  Eye24Regular,
} from "@fluentui/react-icons";
import {
  getLatestJobPromptAndLogs,
  updateJobPrompt,
  createJobPrompt,
  restoreJobPromptFromLog,
  checkApiHealth,
} from "../../../Services/JobPrompt";
import { AuthContextType, useAuth } from "../../../Auth/AuthProvider";

interface ToneModalProps {
  isOpen: boolean;
  onClose: () => void;

  initialTone?: string;
  mode?: "add" | "edit";
}

interface LogEntry {
  LogID: number;
  Version: number;
  Prompt: string;
  Action: string;
  CreatedBy: string;
  CreatedAt: string;
  ModifiedBy?: string;
  ModifiedAt?: string;
  LoggedAt: string;
  userEmail?: string;
  userName?: string;
}

interface JobPrompt {
  Version: number;
  Prompt: string;
  CreatedBy: string;
  CreatedAt: string;
  ModifiedBy?: string;
  ModifiedAt?: string;
  IsActive: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: {
    jobPrompt?: JobPrompt;
    logs?: LogEntry[];
    version?: number;
  };
  error?: string;
}

interface ApiMessage {
  type: "success" | "error" | "warning" | "info";
  text: string;
}

export const ToneModal = ({
  isOpen,
  onClose,

  mode = "add",
}: ToneModalProps) => {
  const [tone, setTone] = useState("");
  const { currentUser, accessToken }: any = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentJobPrompt, setCurrentJobPrompt] = useState<JobPrompt | null>(
    null
  );
  const [fieldError, setFieldError] = useState<string>("");
  const [apiMessage, setApiMessage] = useState<ApiMessage | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("prompt");
  const [actualMode, setActualMode] = useState<"add" | "edit">(mode);
  const [apiHealthStatus, setApiHealthStatus] = useState<
    "checking" | "healthy" | "error"
  >("checking");
  const [latestLogID, setLatestLogID] = useState<number | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTone("");
      setFieldError("");
      setApiMessage(null);
      setActualMode(mode);
      setActiveTab("prompt");
      setIsLoadingInitialData(true);
      checkApiStatus();
      loadJobPromptData();
    } else {
      resetModalState();
    }
  }, [isOpen, mode]);

  const resetModalState = () => {
    setTone("");
    setFieldError("");
    setApiMessage(null);
    setLogs([]);
    setCurrentJobPrompt(null);
    setActiveTab("prompt");
    setIsSubmitting(false);
    setIsLoadingLogs(false);
    setIsLoadingInitialData(false);
    setLatestLogID(null);
  };

  const checkApiStatus = async () => {
    setApiHealthStatus("checking");
    try {
      const response = await checkApiHealth(accessToken);
      setApiHealthStatus(response.success ? "healthy" : "error");
    } catch (error) {
      setApiHealthStatus("error");
    }
  };

  const showApiMessage = (type: ApiMessage["type"], text: string) => {
    setApiMessage({ type, text });
    setTimeout(() => setApiMessage(null), 5000);
  };

  const loadJobPromptData = async () => {
    setIsLoadingLogs(true);
    setFieldError("");

    try {
      const response: ApiResponse = await getLatestJobPromptAndLogs(
        accessToken
      );

      if (response.success && response.data) {
        const { jobPrompt, logs: logData } = response.data;

        setLogs(logData || []);

        // Find the latest log entry (highest LogID)
        if (logData && logData.length > 0) {
          const latest = logData.reduce((prev, current) =>
            prev.LogID > current.LogID ? prev : current
          );
          setLatestLogID(latest.LogID);
        }

        if (jobPrompt && jobPrompt.Prompt) {
          setCurrentJobPrompt(jobPrompt);

          if (actualMode === "add") {
            setActualMode("edit");
            setTone(jobPrompt.Prompt);
          } else if (actualMode === "edit") {
            setTone(jobPrompt.Prompt);
          }
        } else {
          setCurrentJobPrompt(null);
          if (actualMode === "edit") {
            setActualMode("add");
          }
        }
      } else {
        setLogs([]);
        setCurrentJobPrompt(null);
        setLatestLogID(null);
        showApiMessage("warning", "No existing job prompt data found");
      }
    } catch (error) {
      console.error("Error loading job prompt data:", error);
      setFieldError("Failed to load existing data. Please try again.");
      setLogs([]);
      setCurrentJobPrompt(null);
      setLatestLogID(null);
      showApiMessage("error", "Failed to load job prompt data");
    } finally {
      setIsLoadingLogs(false);
      setIsLoadingInitialData(false);
    }
  };

  const handleSubmit = async () => {
    if (!tone.trim()) {
      setFieldError("Prompt cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setFieldError("");
    setApiMessage(null);

    try {
      let response: ApiResponse;

      if (actualMode === "edit" && currentJobPrompt) {
        response = await updateJobPrompt(
          currentJobPrompt.Version,
          tone.trim(),
          currentUser.userID ?? "",
          accessToken
        );
      } else {
        response = await createJobPrompt(
          tone.trim(),
          currentUser.userID ?? "",
          accessToken
        );
      }

      if (response.success) {
        await loadJobPromptData();
        showApiMessage("success", response.message);
      } else {
        setFieldError(
          response.message || response.error || "Failed to save prompt"
        );
        showApiMessage("error", response.message || "Save operation failed");
      }
    } catch (error) {
      console.error("Error saving prompt:", error);
      setFieldError("Network error. Please try again.");
      showApiMessage("error", "Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreFromLog = async (logEntry: LogEntry) => {
    setIsSubmitting(true);
    setFieldError("");
    setApiMessage(null);

    try {
      const response: ApiResponse = await restoreJobPromptFromLog(
        logEntry.LogID,
        currentUser.userID ?? "",
        accessToken
      );

      if (response.success) {
        setTone(logEntry.Prompt);
        setActualMode("edit");
        await loadJobPromptData();
        setActiveTab("prompt");
        showApiMessage(
          "success",
          `Successfully restored from Version ${logEntry.LogID}`
        );
      } else {
        setFieldError(response.message || "Failed to restore prompt");
        showApiMessage("error", response.message || "Restore operation failed");
      }
    } catch (error) {
      console.error("Error restoring prompt:", error);
      setFieldError("Failed to restore prompt. Please try again.");
      showApiMessage("error", "Failed to restore prompt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !isSubmitting && !isLoadingInitialData) {
      handleClose();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getActionBadgeAppearance: any = (action: string) => {
    switch (action) {
      case "CREATE":
        return "filled";
      case "UPDATE":
        return "outline";
      case "RESTORE":
        return "ghost";
      default:
        return "subtle";
    }
  };

  // Loading overlay for initial data load
  const LoadingOverlay = () => (
    <div className="flex flex-col items-center justify-center py-8 h-full">
      <Spinner />
      <Body1Strong className="mt-2">
        {apiHealthStatus === "checking"
          ? "Loading prompt data..."
          : "Fetching latest prompt and history..."}
      </Body1Strong>
    </div>
  );

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <OverlayDrawer
        open={isOpen}
        size="large"
        position="end"
        className="!rounded-l-xl"
        onOpenChange={(event, data) =>
          !data.open && !isSubmitting && !isLoadingInitialData && handleClose()
        }
      >
        <DrawerHeader className="!bg-gradient-to-br !from-[#EEF2FF] !to-[#FFFFFF]">
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                onClick={() => onClose()}
              />
            }
          >
            {actualMode === "edit"
              ? "Configure Job Description Generator"
              : "Add Prompt Profile"}
            {/* API Health Status Indicator */}
            {apiHealthStatus === "checking" && (
              <Spinner size="tiny" className="ml-2" />
            )}
            {apiHealthStatus === "error" && (
              <Badge
                appearance="ghost"
                color="danger"
                className="ml-2"
                size="small"
              >
                API Error
              </Badge>
            )}
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody onKeyDown={handleKeyDown} className="p-2">
          {/* Loading Overlay */}
          {isLoadingInitialData && <LoadingOverlay />}

          {/* Loading Overlay */}
          {isLoadingInitialData && <LoadingOverlay />}
          {apiMessage && (
            <MessageBar
              className="m-2"
              intent={
                apiMessage.type === "success"
                  ? "success"
                  : apiMessage.type === "error"
                  ? "error"
                  : apiMessage.type === "warning"
                  ? "warning"
                  : "info"
              }
            >
              {apiMessage.text}
            </MessageBar>
          )}

          <TabList
            selectedValue={activeTab}
            onTabSelect={(event, data) => setActiveTab(data.value)}
            appearance="transparent"
            size="small"
            className="bg-[#c7d5df]/46 rounded-lg border-1 border-[#ffffff] after:!bg-[#ffffff] p-2.5 :after:!bg-none w-fit xs:w-full"
          >
            <Tab
              id="prompt"
              value="prompt"
              icon={
                <TextEffectsSparkle24Regular
                  className={`${
                    activeTab === "prompt" ? "!text-[#007ED5]" : "text-gray-800"
                  } `}
                />
              }
              className={`${
                activeTab === "prompt"
                  ? ":after:!text-[#007ED5] after:!bg-transparent !bg-[#c7d5df]/0 after:!border-none"
                  : ":after:text-gray-800 after:!bg-transparent after:!border-none p-4"
              } `}
            >
              <span
                className={`${
                  activeTab === "prompt" ? "!text-[#007ED5]" : "text-gray-800"
                }`}
              >
                Prompt Editor{" "}
                {isLoadingInitialData && (
                  <Spinner size="tiny" className="ml-2" />
                )}
              </span>
            </Tab>
            <Tab
              id="history"
              value="history"
              icon={
                <History24Regular
                  className={`${
                    activeTab === "history"
                      ? "!text-[#007ED5]"
                      : "text-gray-800"
                  } `}
                />
              }
              className={`${
                activeTab === "history"
                  ? ":after:!text-[#007ED5] after:!bg-transparent !bg-[#c7d5df]/0 after:!border-none"
                  : ":after:text-gray-800 after:!bg-transparent after:!border-none p-4"
              } `}
            >
              <span
                className={`${
                  activeTab === "history" ? "!text-[#007ED5]" : "text-gray-800"
                }`}
              >
                History ({logs.length})
              </span>

              {/* {isLoadingLogs && <Spinner size="tiny" className="ml-2" />} */}
            </Tab>
          </TabList>
          <br />
          {activeTab === "prompt" && (
            <div className="space-y-4">
              {/* Loading state for prompt tab */}
              {isLoadingInitialData ? (
                <div className="flex flex-col items-center justify-center py-8 h-full">
                  <Spinner />
                  <Body1Strong className="mt-2">
                    Loading prompt data...
                  </Body1Strong>
                </div>
              ) : (
                <>
                  {/* Main Prompt Input */}
                  <Field
                    className="w-full  h-[65vh]"
                    validationState={fieldError ? "error" : "none"}
                    validationMessage={fieldError}
                  >
                    <Textarea
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      placeholder="Enter the tone description for job postings..."
                      className="w-full "
                      disabled={
                        isSubmitting || isLoadingLogs || isLoadingInitialData
                      }
                    />
                    <Caption1 className="text-gray-500">
                      Define the tone and style for job posting descriptions.
                      This will guide how job postings are written and
                      presented.
                    </Caption1>
                  </Field>
                </>
              )}

              <DialogActions className="flex w-max  py-2">
                <DialogTrigger disableButtonEnhancement>
                  <Button
                    appearance="secondary"
                    onClick={handleClose}
                    disabled={isSubmitting || isLoadingInitialData}
                  >
                    Cancel
                  </Button>
                </DialogTrigger>

                <div className="flex gap-2">
                  <Button
                    appearance="primary"
                    onClick={handleSubmit}
                    disabled={
                      !tone.trim() ||
                      isSubmitting ||
                      isLoadingLogs ||
                      isLoadingInitialData ||
                      apiHealthStatus === "error"
                    }
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="tiny" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckmarkCircle20Regular className="mr-2" />
                        {actualMode === "edit" ? "Update" : "Save"} Prompt
                      </>
                    )}
                  </Button>
                </div>
              </DialogActions>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              {isLoadingLogs || isLoadingInitialData ? (
                <div className="flex flex-col items-center justify-center py-8 h-full">
                  <Spinner />
                  <Body1Strong className="mt-2">Loading history...</Body1Strong>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8">
                  <History24Regular className="text-gray-400 mx-auto mb-2" />
                  <Text className="text-gray-500">No history available</Text>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                    <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      <div className="col-span-2">Version</div>
                      <div className="col-span-2">Modified</div>
                      <div className="col-span-4">Modified By</div>
                      <div className="col-span-2">Action</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>
                  </div>

                  {/* Version List */}
                  <div className="max-h-96 overflow-y-auto">
                    {logs
                      .sort((a, b) => b.LogID - a.LogID)
                      .map((log, index) => (
                        <div
                          key={log.LogID}
                          className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            log.LogID === latestLogID
                              ? "bg-green-50 border-l-4 border-l-green-500"
                              : ""
                          }`}
                        >
                          {/* Version */}
                          <div className="col-span-2 flex items-center">
                            <div className="flex items-center gap-2">
                              <Caption1 className="font-medium text-gray-900">
                                {log.LogID}
                              </Caption1>
                              {log.LogID === latestLogID && (
                                <div
                                  className="w-2 h-2 bg-blue-500 rounded-full"
                                  title="Current version"
                                />
                              )}
                            </div>
                          </div>

                          {/* Modified Date */}
                          <div className="col-span-2 flex items-center">
                            <Caption1 className=" text-gray-600">
                              {formatDate(log.ModifiedAt || log.CreatedAt)}
                            </Caption1>
                          </div>

                          {/* Modified By */}
                          <div className="col-span-4 flex items-center">
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-100 rounded-full flex items-center justify-center">
                                <Avatar name={log?.userName} size={20} />
                              </div>
                              <Caption1 className="text-xs text-gray-900 truncate">
                                {log.userName}
                              </Caption1>
                            </div>
                          </div>

                          {/* Action */}
                          <div className="col-span-2 flex items-center">
                            {log.LogID === latestLogID ? (
                              <Badge
                                appearance="ghost"
                                className="!bg-[#E5F5EB] !text-[#16A34A]"
                                size="large"
                              >
                                <div className="flex gap-2 items-center">
                                  <span className="h-2 w-2 bg-[#16A34A] rounded-full"></span>
                                  Current
                                </div>
                              </Badge>
                            ) : (
                              <Button
                                size="small"
                                appearance="subtle"
                                onClick={() => handleRestoreFromLog(log)}
                                disabled={
                                  isSubmitting ||
                                  isLoadingLogs ||
                                  isLoadingInitialData
                                }
                                title="Restore this version"
                              >
                                {isSubmitting ? (
                                  <Spinner size="tiny" />
                                ) : (
                                  "Restore"
                                )}
                              </Button>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="col-span-2 flex items-center justify-end gap-2">
                            <Button
                              size="small"
                              appearance="subtle"
                              onClick={() => {
                                // Toggle expanded view for this log
                                const element = document.getElementById(
                                  `log-detail-${log.LogID}`
                                );
                                if (element) {
                                  element.style.display =
                                    element.style.display === "none"
                                      ? "block"
                                      : "none";
                                }
                              }}
                              title="View details"
                              disabled={isLoadingInitialData}
                            >
                              <Eye24Regular />
                            </Button>
                          </div>

                          {/* Expandable Detail Row */}
                          <div
                            id={`log-detail-${log.LogID}`}
                            className="col-span-12 mt-3"
                            style={{ display: "none" }}
                          >
                            <div className="space-y-2">
                              <div className="text-sm text-gray-700 bg-white rounded p-3 border-1 border-[#E5E7EB] max-h-50 overflow-y-auto">
                                <div className="whitespace-pre-wrap">
                                  {log.Prompt}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DrawerBody>
      </OverlayDrawer>
    </FluentProvider>
  );
};
