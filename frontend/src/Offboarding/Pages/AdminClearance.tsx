import React, { useState, useEffect, useId, useCallback } from "react";
import {
  Button,
  Checkbox,
  Field,
  Toast,
  ToastTitle,
  useToastController,
  Toaster,
  Subtitle2,
  Spinner,
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
  Input,
  Switch,
  Dropdown,
  Option,
  FluentProvider,
  webLightTheme,
  Card,
  Badge,
} from "@fluentui/react-components";
import {
  ArrowExportRtlRegular,
  SaveRegular,
  CheckmarkCircleRegular,
  ArrowSwapRegular,
} from "@fluentui/react-icons";
import {
  getAdminActivities as getAdminActivitiesByExit,
  submitAdminActivity,
  updateAdminActivity,
  getEmployeeExitByID,
  updateDepartmentApproval,
  updateAdminDraft,
  sendAdminSubmitNotification,
} from "../../Services/Offboarding";
import { getAdminActivities } from "../../Services/AdminManagement";
import { useAuth } from "../../Auth/AuthProvider";
import { useNavigate, useParams } from "react-router-dom";
import HorizontalCustomStepper from "../Component/HorizontalCustomStepper";
import HandoverItemsTable from "../../Asset/Components/HandoverItemsTable";
import {
  getAssetHandoverRequestByExit,
  updateAssetHandoverRequestItem,
  AssetHandoverRequestDetail,
  HandoverItemStatus,
  HandoverRequestStatus,
} from "../../Asset/Services/AssetHandoverRequestService";

const HANDOVER_STATUS_BADGE_COLOR: Record<HandoverRequestStatus, "warning" | "informative" | "success"> = {
  Pending: "warning",
  InProgress: "informative",
  Completed: "success",
};

// Mock auth hook - replace with your actual implementation

interface AdminActivity {
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
  applicable: boolean;
  status: string;
  isNew: boolean;
}

interface ErrorState {
  applicable: string;
  status: string;
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
  adminRemarks: string;
  addDeduction: boolean;
  deductionAmount: string;
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

const ClearanceFromAdmin = () => {
  const { Id }: any = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [formData, setFormData] = useState<FormItem[]>([]);
  const [errors, setErrors] = useState<ErrorState[]>([]);
  const [isFormDisabled, setIsFormDisabled] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [addDeduction, setAddDeduction] = useState(false);
  const [deductionAmount, setDeductionAmount] = useState("");
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
    adminRemarks: "",
    addDeduction: false,
    deductionAmount: "",
  });

  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);
  const { currentUser, accessToken, refreshToken }: any = useAuth();
  const [Exits, setExits] = useState<EmployeeExit>();

  // Real Asset Handover Request linked to this offboarding case, if the
  // employee has already raised one from the Asset module — when present,
  // it replaces the generic hardcoded checklist below with the actual
  // assets they selected, using the same 5 status options either way.
  // Purely additive: when no linked request exists (the vast majority of
  // cases, and every case that predates this feature), nothing here
  // changes and the generic checklist renders exactly as before.
  const [linkedHandover, setLinkedHandover] = useState<AssetHandoverRequestDetail | null>(null);
  const [handoverLoading, setHandoverLoading] = useState(true);

  const loadLinkedHandover = async () => {
    if (!Id) return;
    setHandoverLoading(true);
    try {
      const data = await getAssetHandoverRequestByExit(Id);
      setLinkedHandover(data);
    } catch (error) {
      console.error("Error loading linked asset handover request:", error);
    } finally {
      setHandoverLoading(false);
    }
  };

  useEffect(() => {
    loadLinkedHandover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Id]);

  const handleHandoverItemAction = async (
    itemId: string,
    status: Exclude<HandoverItemStatus, "Pending">,
    remarks: string
  ) => {
    if (!currentUser?.userID) return;
    try {
      await updateAssetHandoverRequestItem(itemId, { status, remarks, actionedByUserId: currentUser.userID });
      await loadLinkedHandover();
      // The item update may have auto-completed this case's Admin Clearance
      // stage server-side (see AssetHandoverRequests.js) — re-fetch so the
      // stepper/status badges/form-disabled gating reflect that immediately.
      const response = await getEmployeeExitByID(Id, accessToken);
      const exitData = response.data || response;
      setExits(exitData);
      setEmployeeData((prev) => ({
        ...prev,
        status: exitData.Status || prev.status,
        adminStatus: exitData.AdminStatus || prev.adminStatus,
      }));
      showToast("Asset handover item updated", "success");
    } catch (error) {
      console.error("Error updating handover item:", error);
      showToast(error instanceof Error ? error.message : "Failed to update item", "error");
    }
  };

  useEffect(() => {
    const loadExistingData = async () => {
      if (!Id) return;

      try {
        const response = await getEmployeeExitByID(Id, accessToken);
        const exitData = response.data || response;
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
          adminRemarks: exitData.AdminRemarks || "",
          addDeduction: exitData.AddDeduction || false,
          deductionAmount: exitData.DeductionAmount?.toString() || "",
        });

        // CRITICAL: Set form state with existing data
        setRemarks(exitData.AdminRemarks || "");
        setAddDeduction(
          exitData.AddDeduction === true || exitData.AddDeduction === 1
        );
        setDeductionAmount(
          exitData.DeductionAmount ? exitData.DeductionAmount.toString() : ""
        );

        showToast("Offboarding record loaded successfully", "success");
      } catch (error) {
        console.error("Error loading Offboarding data:", error);
        showToast("Failed to load Offboarding record", "error");
      }
    };

    loadExistingData();
  }, [Id]);

  useEffect(() => {
    fetchFormData();
  }, [Id]);

  useEffect(() => {
    updateFormDisabledStatus(
      currentUser.permissions.offboarding.asset_clearance
    );
  }, [employeeData, currentUser, formData]);

  const updateFormDisabledStatus = (userRole: boolean) => {
    const isDisabled =
      employeeData.status === "Locked" ||
      employeeData.status === "Completed" ||
      employeeData.iTStatus !== "Completed" ||
      employeeData.adminStatus === "Completed" ||
      !userRole;

    setIsFormDisabled(isDisabled);
  };

  const fetchFormData = async () => {
    try {
      // First, try to fetch existing admin activities for this Offboarding
      const { data } = await getAdminActivitiesByExit(Id, accessToken);
      // console.log(data);
      if (data.length > 0) {
        // Employee has existing admin activities
        setFormData(
          data.map((val: any) => ({
            id: val.ID,
            title: val.Title,
            applicable: val.Applicable,
            status: val.Status,
            isNew: false,
          }))
        );
        setErrors(data.map(() => ({ applicable: "", status: "" })));
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
      // Fetch active admin activities from the master activities list
      const response: any = await getAdminActivities(
        {
          status: "Active",
          pageNumber: 1,
          pageSize: 100,
          sortBy: "CreatedAt",
          sortDirection: "ASC",
        },
        accessToken
      );

      if (response.success && response.data?.adminActivities) {
        const activities = response.data.adminActivities;

        if (activities.length > 0) {
          const initialData = activities.map((activity: AdminActivity) => ({
            id: activity.id,
            title: activity.title,
            applicable: false,
            status: "Not Applicable",
            isNew: true,
          }));

          setFormData(initialData);
          setErrors(initialData.map(() => ({ applicable: "", status: "" })));
        } else {
          // Fallback to default activities if no admin activities found
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
        title: "Company Laptop",
        applicable: false,
        status: "Not Applicable",
      },
      {
        id: "default-2",
        title: "Mouse",
        applicable: false,
        status: "Not Applicable",
      },
      {
        id: "default-3",
        title: "Keyboard",
        applicable: false,
        status: "Not Applicable",
      },
      {
        id: "default-4",
        title: "Headset",
        applicable: false,
        status: "Not Applicable",
      },
      {
        id: "default-5",
        title: "ID Card",
        applicable: false,
        status: "Not Applicable",
      },
      {
        id: "default-6",
        title: "Access Card",
        applicable: false,
        status: "Not Applicable",
      },
      {
        id: "default-7",
        title: "Office Keys",
        applicable: false,
        status: "Not Applicable",
      },
      {
        id: "default-8",
        title: "Parking Pass",
        applicable: false,
        status: "Not Applicable",
      },
    ];

    const initialData = defaultItems.map((item) => ({
      ...item,
      isNew: true,
    }));

    setFormData(initialData);
    setErrors(initialData.map(() => ({ applicable: "", status: "" })));
  };

  const validateForm = (): boolean => {
    const newErrors = formData.map((item) => ({
      applicable: "",
      status: item.applicable && !item.status ? "Please select a status" : "",
    }));

    if (addDeduction && !deductionAmount) {
      showToast("Please enter a deduction amount", "error");
      return false;
    }

    setErrors(newErrors);
    return newErrors.every((error) => !error.status);
  };

  const handleConfirmSubmit = async () => {
    setIsDialogOpen(false);
    await handleSubmit(false);
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!isDraft && !validateForm()) {
      showToast("Please correct the errors in the form", "error");
      return;
    }

    isDraft ? setIsSavingDraft(true) : setIsSubmitting(true);

    try {
      await Promise.all(
        formData.map((item: any) =>
          item.isNew
            ? submitAdminActivity(
                Id,
                {
                  title: item.title,
                  applicable: item.applicable,
                  status: item.status,
                  createdByUserID: currentUser.userID,
                },
                accessToken
              )
            : updateAdminActivity(
                item.id,
                {
                  title: item.title,
                  applicable: item.applicable,
                  status: item.status,
                  modifiedByUserID: currentUser.userID,
                },
                accessToken
              )
        )
      );

      if (isDraft) {
        // Save draft with remarks and deduction information
        await updateAdminDraft(
          Id,
          {
            approverUserID: currentUser.userID,
            remarks: remarks,
            addDeduction: addDeduction,
            deductionAmount: addDeduction ? parseFloat(deductionAmount) : 0,
          },
          accessToken
        );
      } else {
        // Final submission
        await updateDepartmentApproval(
          Id,
          "Admin",
          {
            approverUserID: currentUser.userID,
            remarks: remarks,
            addDeduction: addDeduction,
            deductionAmount: addDeduction ? parseFloat(deductionAmount) : 0,
          },
          accessToken
        );

        await refreshToken().then(async (result: any) => {
          await sendAdminSubmitNotification(Exits, currentUser, accessToken);
        });

        const response = await getEmployeeExitByID(Id, accessToken);
        if (response.success) {
          setEmployeeData(response.data);
        }
      }

      await fetchFormData();
      showToast(
        isDraft ? "Draft saved successfully!" : "Form submitted successfully!",
        "success"
      );

      if (!isDraft) {
        setTimeout(() => {
          navigate("/offboard/AdminClearance");
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
      newFormData[index] = {
        ...newFormData[index],
        [field]: value,
        ...(field === "applicable" && !value
          ? { status: "Not Applicable" }
          : {}),
      };
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading clearance form...</Body1Strong>
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

          

          <div style={{ marginBottom: "24px" }}>
            <Subtitle2 style={{ color: "#1a1a1a", marginBottom: "8px" }}>
              Admin Clearance Form
            </Subtitle2>
            <div>
              <Body1 style={{ color: "#616161" }}>
                Complete the admin clearance checklist for{" "}
              </Body1>
              <Body1Strong> {employeeData.name || "the employee"}</Body1Strong>
            </div>
          </div>
          <div>
            <HorizontalCustomStepper activeStep={2} data={Exits} />
          </div>
          <div style={{ marginTop: "20px" }}>
            {handoverLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
                <Spinner size="tiny" label="Checking for an asset handover request..." />
              </div>
            ) : linkedHandover ? (
              <Card style={{ borderRadius: "8px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <ArrowSwapRegular />
                      <Body1Strong>Asset Handover Request {linkedHandover.request.HandoverRequestID}</Body1Strong>
                    </div>
                    <Body1 style={{ color: "#616161", marginTop: "4px" }}>
                      {employeeData.name || "The employee"} selected these assets to hand over — reason: {linkedHandover.request.Reason}
                    </Body1>
                  </div>
                  <Badge appearance="tint" color={HANDOVER_STATUS_BADGE_COLOR[linkedHandover.request.Status]}>
                    {linkedHandover.request.Status}
                  </Badge>
                </div>
                <HandoverItemsTable
                  items={linkedHandover.items}
                  disabled={isFormDisabled || linkedHandover.request.Status === "Completed"}
                  onActionItem={handleHandoverItemAction}
                />
                {linkedHandover.request.Status === "Completed" ? (
                  <Body1 style={{ color: "#107C10", marginTop: "12px" }}>
                    All assets have been actioned — this clearance stage has been completed automatically.
                  </Body1>
                ) : (
                  <Body1 style={{ color: "#616161", marginTop: "12px" }}>
                    Action every asset above to automatically complete this clearance stage and move to the next.
                  </Body1>
                )}
              </Card>
            ) : (
              <div
                className="w-[100%] rounded-[8px] mb-[10px]"
                style={{ border: "1px solid #e5e7eb", overflowX: "auto" }}
              >
                <Table>
                  <TableHeader className="bg-gray-100 ">
                    <TableRow>
                      <TableHeaderCell style={{ width: "40%", padding: "8px" }}>
                        <Body1Strong>Item</Body1Strong>
                      </TableHeaderCell>
                      <TableHeaderCell
                        style={{ width: "20%", textAlign: "center" }}
                      >
                        <Body1Strong>Applicable</Body1Strong>
                      </TableHeaderCell>
                      <TableHeaderCell style={{ width: "40%" }}>
                        <Body1Strong>Status</Body1Strong>
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <TableCellLayout>
                            <Body1Strong>{item.title}</Body1Strong>
                          </TableCellLayout>
                        </TableCell>
                        <TableCell>
                          <Field>
                            <div>
                              <Switch
                                checked={item.applicable}
                                onChange={(e, data) =>
                                  handleInputChange(
                                    index,
                                    "applicable",
                                    data.checked
                                  )
                                }
                                disabled={isFormDisabled}
                              />
                            </div>
                          </Field>
                        </TableCell>
                        <TableCell className="!p-2">
                          <Field
                            validationState={
                              errors[index]?.status ? "error" : "none"
                            }
                            validationMessage={errors[index]?.status}
                          >
                            <Dropdown
                              placeholder="Select status"
                              value={item.status}
                              selectedOptions={[item.status]}
                              onOptionSelect={(_, data) =>
                                handleInputChange(
                                  index,
                                  "status",
                                  data.optionValue || ""
                                )
                              }
                              disabled={!item.applicable || isFormDisabled}
                              style={{ width: "100%" }}
                            >
                              <Option value="Good condition">
                                Good condition
                              </Option>
                              <Option value="Damaged">Damaged</Option>
                              <Option value="Not Applicable">
                                Not Applicable
                              </Option>
                              <Option value="Removed">Removed</Option>
                              <Option value="Collected">Collected</Option>
                            </Dropdown>
                          </Field>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Card style={{ marginTop: "24px", borderRadius: "8px" }}>
              <div>
                <Field label="Remarks (if any)" className="!font-semibold">
                  <Textarea
                    placeholder="Enter any remarks or notes"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    disabled={isFormDisabled}
                    resize="vertical"
                    style={{ width: "100%" }}
                    rows={4}
                  />
                </Field>
              </div>

              <div style={{ marginTop: "16px" }}>
                <Checkbox
                  label="Add deduction amount"
                  checked={addDeduction}
                  onChange={(e, data) => setAddDeduction(data.checked === true)}
                  disabled={isFormDisabled}
                />
              </div>
              {addDeduction && (
                <div style={{ maxWidth: "300px" }}>
                  <Field
                    label="Deduction Amount"
                    required
                    validationState={
                      addDeduction && !deductionAmount ? "error" : "none"
                    }
                    validationMessage={
                      addDeduction && !deductionAmount
                        ? "Please enter a deduction amount"
                        : ""
                    }
                  >
                    <Input
                      type="number"
                      value={deductionAmount}
                      onChange={(e) => setDeductionAmount(e.target.value)}
                      disabled={isFormDisabled}
                      placeholder="Enter amount"
                    />
                  </Field>
                </div>
              )}
            </Card>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              paddingTop: "16px",
              marginTop: "24px",
              borderTop: "1px solid #e0e0e0",
              flexWrap: "wrap",
            }}
          >
            <Button
              appearance="subtle"
              onClick={() => navigate("/offboard/AdminClearance")}
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
                    disabled={
                      isSubmitting ||
                      isSavingDraft ||
                      isFormDisabled ||
                      (!!linkedHandover && linkedHandover.request.Status !== "Completed")
                    }
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
                    <DialogTitle>
                      Confirm Admin Clearance Submission
                    </DialogTitle>
                    <DialogContent>
                      <Body1 style={{ marginBottom: "12px" }}>
                        Are you sure you want to submit the Admin clearance
                        form? Please ensure all applicable items have been
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

export default ClearanceFromAdmin;
