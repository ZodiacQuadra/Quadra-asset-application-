import React, { useState, useEffect } from "react";
import {
  Button,
  Checkbox,
  Field,
  Toast,
  ToastTitle,
  useToastController,
  useId,
  Toaster,
  Subtitle2,
  Spinner,
  Card,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Body1Strong,
  Textarea,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Body1,
  Text,
  FluentProvider,
  webLightTheme,
} from "@fluentui/react-components";
import {
  ArrowExportRtlRegular,
  SaveRegular,
  CheckmarkCircleRegular,
  InfoRegular,
  WarningRegular,
} from "@fluentui/react-icons";
import axios from "axios";
import { getActivities } from "../../Services/ITActivitiesManagement"; // Update path as needed
import { useAuth } from "../../Auth/AuthProvider";
import {
  getEmployeeExitByID,
  sendITHeadSubmitNotification,
} from "../../Services/Offboarding";
import { useNavigate, useParams } from "react-router-dom";
import HorizontalCustomStepper from "../Component/HorizontalCustomStepper";

// Mock useAuth hook for demo - replace with your actual implementation

interface Activity {
  id: string;
  activityCode: string;
  title: string;
  description?: string;
  status: string;
  createdByUserID: string;
  modifiedByUserID?: string;
  createdAt: string;
  modifiedAt?: string;
}

interface FormItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  remarks: string;
  isNew: boolean;
}

interface ErrorState {
  completed: string;
  remarks: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  designation: string;
  workLocation: string;
  groupName: string;
  managerUserID: string;
  joiningDate: string;
  resignationDate: string;
  relievingDate: string;
  noticePeriod: string;
  personalMailID: string;
  status: string;
  hrStatus: string;
  headStatus: string;
  iTStatus: string;
  adminStatus: string;
  financeStatus: string;
}

export interface EmployeeExit {
  ID: string;
  ExitSequence: string;
  ExitID: string;
  Name: string;
  Email: string;
  Phone: string;
  Designation: string;
  WorkLocation: string;
  GroupName: string;
  ManagerUserID: string;
  JoiningDate: string;
  ResignationDate: string;
  RelievingDate: string;
  NoticePeriod: number;
  PersonalMailID?: string;
  Status: string;
  IsCompleted: boolean;
  HeadStatus: string;
  HeadUserID?: string;
  HeadDate?: string | null;
  HeadRemainder?: string | null;
  HRStatus: string;
  HRUserID?: string | null;
  HRDate?: string | null;
  ITStatus: string;
  ITUserID?: string | null;
  ITDate?: string | null;
  ITRemainder?: string | null;
  AdminStatus: string;
  AdminUserID?: string | null;
  AdminDate?: string | null;
  AdminRemarks?: string | null;
  AdminDraftStatus?: string | null;
  AdminRemainder?: string | null;
  AddDeduction?: string | null;
  DeductionAmount?: number | null;
  FinanceStatus: string;
  FinanceUserID?: string | null;
  FinanceDate?: string | null;
  FinanceRemarks?: string | null;
  FinanceDraftStatus?: string | null;
  FinanceRemainder?: string | null;
  CreatedByUserID: string;
  ModifiedByUserID?: string;
  CreatedAt: string;
  ModifiedAt?: string;
  IsDeleted?: boolean;
  DeletedAt?: string | null;
  DeletedByUserID?: string | null;
  ROWVERSION?: {
    type: string;
    data: number[];
  };
  ManagerUserIDDetails?: UserDetailsmain;
  CreatedByUserIDDetails?: UserDetailsmain;
  HeadUserIDDetails?: UserDetailsmain;
  ITUserIDDetails?: UserDetailsmain;
  AdminUserIDDetails?: UserDetailsmain;
  HrUserIDDetails?: UserDetailsmain;
  FinanceUserIDDetails?: UserDetailsmain;
  ActivitiesCount?: number;
}

export interface UserDetailsmain {
  id: string;
  displayName: string;
  email: string;
}

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/offboarding`;

const ClearanceFromITHead = () => {
  // State Management
  const { Id }: any = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [formData, setFormData] = useState<FormItem[]>([]);
  const [errors, setErrors] = useState<ErrorState[]>([]);
  const [isFormDisabled, setIsFormDisabled] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [Exits, setExits] = useState<EmployeeExit>();
  const [employeeData, setEmployeeData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    designation: "",
    workLocation: "",
    groupName: "",
    managerUserID: "",
    joiningDate: "",
    resignationDate: "",
    relievingDate: "",
    noticePeriod: "",
    personalMailID: "",
    status: "Pending",
    hrStatus: "Pending",
    headStatus: "Pending",
    iTStatus: "Pending",
    adminStatus: "Pending",
    financeStatus: "Pending",
  });

  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);
  const { currentUser, accessToken, refreshToken }: any = useAuth();

  useEffect(() => {
    const loadExistingData = async () => {
      if (!Id) return;

      try {
        setIsLoading(true);
        const response = await getEmployeeExitByID(Id, accessToken);
        const exitData = response.data || response; // Handle both response formats

        // console.log("Loaded Offboarding data:", exitData); // Debug log
        setExits(exitData);
        setEmployeeData({
          name: exitData.Name || "",
          email: exitData.Email || "",
          phone: exitData.Phone || "",
          designation: exitData.Designation || "",
          workLocation: exitData.WorkLocation || "",
          groupName: exitData.GroupName || "",
          managerUserID: exitData.ManagerUserID || "",
          joiningDate: exitData.JoiningDate
            ? exitData.JoiningDate.split("T")[0]
            : "",
          resignationDate: exitData.ResignationDate
            ? exitData.ResignationDate.split("T")[0]
            : "",
          relievingDate: exitData.RelievingDate
            ? exitData.RelievingDate.split("T")[0]
            : "",
          noticePeriod: exitData.NoticePeriod?.toString() || "",
          personalMailID: exitData.PersonalMailID || "",
          status: exitData.Status || "Pending",
          hrStatus: exitData.HRStatus || "Pending",
          headStatus: exitData.HeadStatus || "Pending",
          iTStatus: exitData.ITStatus || "Pending",
          adminStatus: exitData.AdminStatus || "Pending",
          financeStatus: exitData.FinanceStatus || "Pending",
        });

        dispatchToast(
          <Toast>
            <ToastTitle>Offboarding record loaded successfully</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } catch (error) {
        console.error("Error loading Offboarding data:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to load Offboarding record</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      }
    };

    loadExistingData();
  }, [Id]);

  // Initialize form
  useEffect(() => {
    fetchFormData();
  }, [Id]);

  // Update form disabled status
  useEffect(() => {
    updateFormDisabledStatus(currentUser.permissions.offboarding.it_clearance);
  }, [employeeData, currentUser, formData]);

  const updateFormDisabledStatus = (userRole: boolean) => {
    const isDisabled =
      employeeData.status === "Locked" ||
      employeeData.status === "Completed" ||
      employeeData.headStatus !== "Completed" ||
      employeeData.iTStatus === "Completed" ||
      !userRole;

    setIsFormDisabled(isDisabled);
  };

  const fetchFormData = async () => {
    try {
      // First, try to fetch existing IT activities for this exit
      setIsLoading(true);
      const { data } = await axios.get(
        `${API_BASE_URL}/exit/${Id}/it-activities`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (data.success && data.data.length > 0) {
        // Employee has existing IT activities
        setFormData(
          data.data.map((val: any) => ({
            id: val.ID,
            title: val.Title,
            description: val.Description || "",
            completed: val.Completed,
            remarks: val.Remarks || "",
            isNew: false,
          }))
        );
        setErrors(data.data.map(() => ({ completed: "", remarks: "" })));
      } else {
        // No existing activities, fetch from activities master
        await fetchActivitiesFromMaster();
      }
    } catch (error) {
      console.error("Error fetching form data:", error);
      await fetchActivitiesFromMaster();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivitiesFromMaster = async () => {
    try {
      // Fetch active IT activities from the master activities list
      const response: any = await getActivities(
        {
          status: "Active",
          pageNumber: 1,
          pageSize: 100,
          sortBy: "CreatedAt",
          sortDirection: "ASC",
        },
        accessToken
      );

      if (response.success && response.data?.activities) {
        const activities = response.data.activities;

        // Filter for IT-related activities (you can add more sophisticated filtering)
        const itActivities = activities;

        if (itActivities.length > 0) {
          const initialData = itActivities.map((activity: Activity) => ({
            id: activity.id,
            title: activity.title,
            description: activity.description || "",
            completed: false,
            remarks: "",
            isNew: true,
          }));

          setFormData(initialData);
          setErrors(initialData.map(() => ({ completed: "", remarks: "" })));
        } else {
          // Fallback to default IT activities if no IT activities found
          await loadDefaultActivities();
        }
      } else {
        await loadDefaultActivities();
      }
    } catch (error) {
      console.error("Error fetching activities from master:", error);
      showToast("Error loading activities, using defaults", "warning");
      await loadDefaultActivities();
    }
  };

  const loadDefaultActivities = async () => {
    const defaultItems = [
      {
        id: "default-1",
        title: "Collect Laptop and Accessories",
        description:
          "Retrieve company laptop, charger, mouse, and other accessories",
      },
      {
        id: "default-2",
        title: "Revoke System Access",
        description: "Remove access to all company systems and applications",
      },
      {
        id: "default-3",
        title: "Disable Email Account",
        description:
          "Deactivate company email account and set up forwarding if needed",
      },
      {
        id: "default-4",
        title: "Remove from Active Directory",
        description: "Delete or disable user account in Active Directory",
      },
      {
        id: "default-5",
        title: "Collect ID Card and Access Card",
        description: "Retrieve physical access cards and ID badges",
      },
      {
        id: "default-6",
        title: "Clear VPN Access",
        description: "Revoke VPN credentials and remote access",
      },
      {
        id: "default-7",
        title: "Remove from Distribution Lists",
        description: "Remove user from all email distribution lists and groups",
      },
      {
        id: "default-8",
        title: "Archive Employee Data",
        description: "Backup and archive employee data as per retention policy",
      },
    ];

    const initialData = defaultItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      completed: false,
      remarks: "",
      isNew: true,
    }));

    setFormData(initialData);
    setErrors(initialData.map(() => ({ completed: "", remarks: "" })));
  };

  const validateForm = (): boolean => {
    const newErrors = formData.map((item) => ({
      completed: item.completed ? "" : "This field is required",
      remarks: "",
    }));
    setErrors(newErrors);
    return newErrors.every((error) => !error.completed);
  };

  const handleConfirmSubmit = async () => {
    setIsDialogOpen(false);
    await handleSubmit(false);
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!isDraft && !validateForm()) {
      showToast("Please mark all items as completed", "error");
      return;
    }

    isDraft ? setIsSavingDraft(true) : setIsSubmitting(true);

    try {
      await Promise.all(
        formData.map((item: any) =>
          item.isNew
            ? axios.post(
                `${API_BASE_URL}/exit/${Id}/it-activity`,
                {
                  title: item.title,
                  completed: item.completed,
                  remarks: item.remarks,
                  description: item.description,
                  createdByUserID: currentUser.userID,
                },
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              )
            : axios.put(
                `${API_BASE_URL}/exit/it-activity/${item.id}`,
                {
                  title: item.title,
                  completed: item.completed,
                  remarks: item.remarks,
                  modifiedByUserID: currentUser.userID,
                },
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              )
        )
      );

      if (!isDraft) {
        await axios.put(
          `${API_BASE_URL}/exit/${Id}/approval/IT`,
          {
            approverUserID: currentUser.userID,
            remarks: "IT clearance completed",
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        await refreshToken().then(async (result: any) => {
          await sendITHeadSubmitNotification(Exits, currentUser, accessToken);
        });
        const response = await axios.get(`${API_BASE_URL}/exit/${Id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (response.data.success) {
          setEmployeeData(response.data.data);
        }
      }

      await fetchFormData();
      showToast(
        isDraft ? "Draft saved successfully!" : "Form submitted successfully!",
        "success"
      );

      if (!isDraft) {
        setTimeout(() => {
          navigate("/offboard/ITClearance");
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast(
        isDraft ? "Error saving draft" : "Error submitting form",
        "error"
      );
    } finally {
      isDraft ? setIsSavingDraft(false) : setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    index: number,
    field: keyof FormItem,
    value: any
  ) => {
    setFormData((prev) => {
      const newFormData = [...prev];
      newFormData[index] = { ...newFormData[index], [field]: value };
      return newFormData;
    });

    if (errors[index]) {
      setErrors((prev) => {
        const newErrors = [...prev];
        newErrors[index] = { ...newErrors[index], [field]: "" };
        return newErrors;
      });
    }
  };

  const showToast = (
    message: string,
    intent: "success" | "error" | "warning" | "info" = "success"
  ) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{message}</ToastTitle>
      </Toast>,
      { intent }
    );
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Completed":
        return { bg: "#e6f4ea", text: "#137333", border: "#c2e7d0" };
      case "Pending":
        return { bg: "#fef7e0", text: "#b35c00", border: "#ffd966" };
      case "Locked":
        return { bg: "#fce8e6", text: "#c5221f", border: "#f8bbd0" };
      default:
        return { bg: "#f5f5f5", text: "#5f6368", border: "#e0e0e0" };
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = getStatusBadgeColor(status);
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 10px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 500,
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
        }}
      >
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2"> Loading clearance form...</Body1Strong>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">
          Loading Offboarding Requests...
        </Body1Strong>
      </div>
    );
  }

  if(isSubmitting || isSavingDraft){
    return (
            <div className="flex flex-col items-center justify-center py-8 h-full">
              <Spinner />
              <Body1Strong className="mt-2">
                {" "}
                {isSavingDraft ? "Saving draft..." : "Submitting form..."}
              </Body1Strong>
            </div>
          )
  }

  return (
    <FluentProvider style={{ background: "transparent" }} theme={webLightTheme}>
      <div>
        <div>
          <Toaster toasterId={toastId} />

          
          

          {/* Header Section */}
          <div style={{ marginBottom: "24px" }}>
            <Subtitle2 style={{ color: "#1a1a1a", marginBottom: "8px" }}>
              IT Head Clearance Form
            </Subtitle2>
            <div>
              {" "}
              <Body1 style={{ color: "#616161" }}>
                Complete the IT clearance checklist for{" "}
              </Body1>
              <Body1Strong> {employeeData.name || "the employee"}</Body1Strong>
            </div>
          </div>
          <div>
            <HorizontalCustomStepper activeStep={1} data={Exits} />
          </div>
          <div>
            <div
              className="w-[100%] rounded-[8px] mb-[10px] mt-10"
              style={{ border: "1px solid #e5e7eb", overflowX: "auto" }}
            >
              <Table>
                <TableHeader className="bg-gray-100 ">
                  <TableRow>
                    <TableHeaderCell style={{ width: "40%" }}>
                      <Body1Strong>Activity</Body1Strong>
                    </TableHeaderCell>
                    <TableHeaderCell
                      style={{
                        width: "15%",
                        textAlign: "center",
                        padding: "8px",
                      }}
                    >
                      <Body1Strong>Completed</Body1Strong>
                    </TableHeaderCell>
                    <TableHeaderCell style={{ width: "45%" }}>
                      <Body1Strong>Remarks</Body1Strong>
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <TableCellLayout>
                          <div>
                            <Body1Strong>{item.title}</Body1Strong>
                            {item.description && (
                              <Text
                                size={200}
                                style={{
                                  display: "block",
                                  color: "#757575",
                                  marginTop: "4px",
                                }}
                              >
                                {item.description}
                              </Text>
                            )}
                          </div>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <Field
                          validationState={
                            errors[index]?.completed ? "error" : "none"
                          }
                          validationMessage={errors[index]?.completed}
                        >
                          <div>
                            <Checkbox
                              checked={item.completed}
                              onChange={(e, data) =>
                                handleInputChange(
                                  index,
                                  "completed",
                                  data.checked
                                )
                              }
                              disabled={isFormDisabled}
                            />
                          </div>
                        </Field>
                      </TableCell>
                      <TableCell className="!p-2">
                        <Field>
                          <Textarea
                            placeholder="Enter any remarks or notes"
                            value={item.remarks}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "remarks",
                                e.target.value
                              )
                            }
                            disabled={isFormDisabled}
                            resize="vertical"
                            style={{ width: "100%" }}
                          />
                        </Field>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              gap: "12px",
              paddingTop: "16px",
              borderTop: "1px solid #e0e0e0",
              flexWrap: "wrap",
            }}
          >
            <Button
              appearance="subtle"
              onClick={() => navigate("/offboard/ITClearance")}
              disabled={isSavingDraft || isSubmitting}
              icon={<ArrowExportRtlRegular />}
            >
              Back
            </Button>

            <div className="flex gap-3">
              <Button
                appearance="secondary"
                onClick={() => handleSubmit(true)}
                disabled={isSavingDraft || isSubmitting || isFormDisabled}
                icon={<SaveRegular />}
                style={{
                  borderRadius: "30px",
                }}
              >
                {isSavingDraft ? "Saving..." : "Save as Draft"}
              </Button>

              <Dialog
                open={isDialogOpen}
                onOpenChange={(_, data) => setIsDialogOpen(data.open)}
              >
                <DialogTrigger disableButtonEnhancement>
                  <Button
                    appearance="primary"
                    disabled={isSubmitting || isSavingDraft || isFormDisabled}
                    icon={<CheckmarkCircleRegular />}
                    style={{
                      background:
                        "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)",
                      borderRadius: "30px",
                    }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Clearance"}
                  </Button>
                </DialogTrigger>
                <DialogSurface>
                  <DialogBody>
                    <DialogTitle>Confirm IT Clearance Submission</DialogTitle>
                    <DialogContent>
                      <Body1 style={{ marginBottom: "12px" }}>
                        Are you sure you want to submit the IT Head clearance
                        form? Please ensure all items have been completed and
                        verified.
                      </Body1>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#fce8e6",
                          border: "1px solid #f8bbd0",
                          borderRadius: "6px",
                        }}
                      >
                        <Body1 style={{ color: "#c5221f" }}>
                          <strong>Note:</strong> This action cannot be undone.
                        </Body1>
                      </div>
                    </DialogContent>
                    <DialogActions>
                      <Button
                        appearance="secondary"
                        onClick={() => setIsDialogOpen(false)}
                        style={{
                          borderRadius: "30px",
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        appearance="primary"
                        onClick={handleConfirmSubmit}
                        style={{
                          background:
                            "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)",
                          borderRadius: "30px",
                        }}
                      >
                        Confirm & Submit
                      </Button>
                    </DialogActions>
                  </DialogBody>
                </DialogSurface>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </FluentProvider>
  );
};

export default ClearanceFromITHead;
