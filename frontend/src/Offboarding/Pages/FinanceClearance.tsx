import React, { useState, useEffect, useId } from "react";
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
  FluentProvider,
  webLightTheme,
  Card,
} from "@fluentui/react-components";
import {
  ArrowExportRtlRegular,
  SaveRegular,
  CheckmarkCircleRegular,
} from "@fluentui/react-icons";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import {
  getFinanceActivities as getFinanceActivitiesByExit,
  submitFinanceActivity,
  updateFinanceActivity,
  getEmployeeExitByID,
  updateDepartmentApproval,
  updateFinanceDraft,
  sendFinanceSubmitNotification,
} from "../../Services/Offboarding";
import { getFinanceActivities } from "../../Services/FinanceManagement";
import { useAuth } from "../../Auth/AuthProvider";
import { useNavigate, useParams } from "react-router-dom";
import HorizontalCustomStepper from "../Component/HorizontalCustomStepper";

interface FinanceActivity {
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
  verified: boolean;
  date: string | null;
  remarks: string;
  isNew: boolean;
}

interface ErrorState {
  verified: string;
  date: string;
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
  financeRemarks: string;
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

const ClearanceFromFinance = () => {
  const navigate = useNavigate();
  const { Id }: any = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [formData, setFormData] = useState<FormItem[]>([]);
  const [errors, setErrors] = useState<ErrorState[]>([]);
  const [isFormDisabled, setIsFormDisabled] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
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
    financeRemarks: "",
  });

  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);
  const { currentUser, accessToken, refreshToken }: any = useAuth();
  const [Exits, setExits] = useState<EmployeeExit>();

  useEffect(() => {
    const loadExistingData = async () => {
      if (!Id) return;

      try {
        setIsLoading(true);
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
          financeRemarks: exitData.FinanceRemarks || "",
        });

        setRemarks(exitData.FinanceRemarks || "");
        showToast("Offboarding record loaded successfully", "success");
      } catch (error) {
        console.error("Error loading Offboarding data:", error);
        showToast("Failed to load Offboarding record", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, [Id]);

  useEffect(() => {
    fetchFormData();
  }, [Id]);

  useEffect(() => {
    updateFormDisabledStatus(
      currentUser.permissions.offboarding.finance_clearance
    );
  }, [employeeData, currentUser, formData]);

  const updateFormDisabledStatus = (userRole: boolean) => {
    const isDisabled =
      employeeData.status === "Locked" ||
      employeeData.status === "Completed" ||
      employeeData.hrStatus !== "Completed" ||
      employeeData.financeStatus === "Completed" ||
      !userRole;

    setIsFormDisabled(isDisabled);
  };

  const fetchFormData = async () => {
    try {
      setIsLoading(true);
      const { data } = await getFinanceActivitiesByExit(Id, accessToken);
      // console.log(data);
      if (data.length > 0) {
        setFormData(
          data.map((val: any) => ({
            id: val.ID,
            title: val.Title,
            verified: val.Verified,
            date: val.Date ? val.Date.split("T")[0] : null,
            remarks: val.Remarks || "",
            isNew: false,
          }))
        );
        setErrors(data.map(() => ({ verified: "", date: "" })));
      } else {
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
    setIsLoading(true);
    try {
      const response: any = await getFinanceActivities(
        {
          status: "Active",
          pageNumber: 1,
          pageSize: 100,
          sortBy: "CreatedAt",
          sortDirection: "ASC",
        },
        accessToken
      );

      if (response.success && response.data?.financeActivities) {
        const activities = response.data.financeActivities;

        if (activities.length > 0) {
          const initialData = activities.map((activity: FinanceActivity) => ({
            id: activity.id,
            title: activity.title,
            verified: false,
            date: null,
            remarks: "",
            isNew: true,
          }));

          setFormData(initialData);
          setErrors(initialData.map(() => ({ verified: "", date: "" })));
        } else {
          await loadDefaultActivities();
        }
      } else {
        await loadDefaultActivities();
      }
    } catch (error) {
      console.error("Error fetching activities from master:", error);
      showToast("Error loading activities, using defaults", "warning");
      await loadDefaultActivities();
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultActivities = async () => {
    const defaultItems = [
      {
        id: "default-1",
        title: "Final Settlement",
        verified: false,
        date: null,
        remarks: "",
      },
      {
        id: "default-2",
        title: "PF Withdrawal",
        verified: false,
        date: null,
        remarks: "",
      },
      {
        id: "default-3",
        title: "Gratuity",
        verified: false,
        date: null,
        remarks: "",
      },
      {
        id: "default-4",
        title: "Leave Encashment",
        verified: false,
        date: null,
        remarks: "",
      },
      {
        id: "default-5",
        title: "Salary Clearance",
        verified: false,
        date: null,
        remarks: "",
      },
      {
        id: "default-6",
        title: "Loan Settlement",
        verified: false,
        date: null,
        remarks: "",
      },
      {
        id: "default-7",
        title: "Advance Settlement",
        verified: false,
        date: null,
        remarks: "",
      },
      {
        id: "default-8",
        title: "Tax Documents",
        verified: false,
        date: null,
        remarks: "",
      },
    ];

    const initialData = defaultItems.map((item) => ({
      ...item,
      isNew: true,
    }));

    setFormData(initialData);
    setErrors(initialData.map(() => ({ verified: "", date: "" })));
  };

  const validateForm = (): boolean => {
    const newErrors = formData.map((item) => ({
      verified: item.verified ? "" : "This field is required",
      date: item.verified && !item.date ? "Date is required when verified" : "",
    }));

    setErrors(newErrors);
    return newErrors.every((error) => !error.verified && !error.date);
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
            ? submitFinanceActivity(
                Id,
                {
                  title: item.title,
                  verified: item.verified,
                  date: item.date,
                  remarks: item.remarks,
                  createdByUserID: currentUser.userID,
                },
                accessToken
              )
            : updateFinanceActivity(
                item.id,
                {
                  title: item.title,
                  verified: item.verified,
                  date: item.date,
                  remarks: item.remarks,
                  modifiedByUserID: currentUser.userID,
                },
                accessToken
              )
        )
      );

      if (isDraft) {
        // Save draft with remarks - update only remarks without changing status
        await updateFinanceDraft(
          Id,
          {
            approverUserID: currentUser.userID,
            remarks: remarks,
          },
          accessToken
        );
      } else {
        // Final submission - update status and remarks
        await updateDepartmentApproval(
          Id,
          "Finance",
          {
            approverUserID: currentUser.userID,
            remarks: remarks,
          },
          accessToken
        );

        await refreshToken().then(async (result: any) => {
          await sendFinanceSubmitNotification(Exits, currentUser, accessToken);
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
          navigate("/offboard/FinanceClearance");
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
      };

      if (field === "verified" && value === true && !newFormData[index].date) {
        newFormData[index].date = new Date().toISOString().split("T")[0];
      }

      if (field === "verified" && value === false) {
        newFormData[index].date = null;
      }

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
        <Body1Strong className="mt-2"> Loading clearance form...</Body1Strong>
      </div>
    );
  }

  if(isSubmitting || isSavingDraft){
    return(
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
              Finance Clearance Form
            </Subtitle2>
            <div>
              <Body1 style={{ color: "#616161" }}>
                Complete the finance clearance checklist for{" "}
              </Body1>
              <Body1Strong> {employeeData.name || "the employee"}</Body1Strong>
            </div>
          </div>
          <div>
            <HorizontalCustomStepper activeStep={4} data={Exits} />
          </div>
          <div style={{ marginTop: "20px" }}>
            <div
              className="w-[100%] rounded-[8px] mb-[10px]"
              style={{ border: "1px solid #e5e7eb", overflowX: "auto" }}
            >
              <Table>
                <TableHeader className="bg-gray-100 ">
                  <TableRow>
                    <TableHeaderCell style={{ width: "30%", padding: "8px" }}>
                      <Body1Strong>Title</Body1Strong>
                    </TableHeaderCell>
                    <TableHeaderCell
                      style={{ width: "15%", textAlign: "center" }}
                    >
                      <Body1Strong>Verified</Body1Strong>
                    </TableHeaderCell>
                    <TableHeaderCell style={{ width: "20%" }}>
                      <Body1Strong>Date</Body1Strong>
                    </TableHeaderCell>
                    <TableHeaderCell style={{ width: "35%" }}>
                      <Body1Strong>Remarks</Body1Strong>
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
                        <Field
                          validationState={
                            errors[index]?.verified ? "error" : "none"
                          }
                          validationMessage={errors[index]?.verified}
                        >
                          <div>
                            <Checkbox
                              checked={item.verified}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "verified",
                                  e.target.checked
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
                            errors[index]?.date ? "error" : "none"
                          }
                          validationMessage={errors[index]?.date}
                        >
                          <DatePicker
                            placeholder="Select a date"
                            disabled={isFormDisabled || !item.verified}
                            value={item.date ? new Date(item.date) : undefined}
                            onSelectDate={(date) => {
                              if (date) {
                                const adjustedDate = new Date(
                                  date.getTime() -
                                    date.getTimezoneOffset() * 60000
                                );
                                handleInputChange(
                                  index,
                                  "date",
                                  adjustedDate.toISOString().split("T")[0]
                                );
                              } else {
                                handleInputChange(index, "date", null);
                              }
                            }}
                          />
                        </Field>
                      </TableCell>
                      <TableCell className="!p-2">
                        <Input
                          disabled={isFormDisabled}
                          value={item.remarks || ""}
                          onChange={(e) =>
                            handleInputChange(index, "remarks", e.target.value)
                          }
                          // resize="vertical"
                          style={{ width: "100%" }}
                          // rows={1}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div style={{ marginTop: "30px" }}>
              <Card
                style={{
                  borderRadius: "4px",
                }}
              >
                <Field
                  label="General Remarks (if any)"
                  className="!font-semibold"
                >
                  <Textarea
                    placeholder="Enter any remarks or notes"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    disabled={isFormDisabled}
                    resize="vertical"
                    style={{ width: "100%" }}
                    rows={6}
                  />
                </Field>
              </Card>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
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
              onClick={() => navigate("/offboard/FinanceClearance")}
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
                    <DialogTitle>
                      Confirm Finance Clearance Submission
                    </DialogTitle>
                    <DialogContent>
                      <Body1 style={{ marginBottom: "12px" }}>
                        Are you sure you want to submit the Finance clearance
                        form? Please ensure all items have been verified.
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

export default ClearanceFromFinance;
