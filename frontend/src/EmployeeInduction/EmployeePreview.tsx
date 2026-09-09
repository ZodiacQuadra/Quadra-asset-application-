import { useState, useEffect, useId } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Text,
  Body1,
  Body1Strong,
  Subtitle2,
  Caption1,
  Spinner,
  Avatar,
  Badge,
  Divider,
  Input,
  Textarea,
  Field,
  Switch,
  Dropdown,
  Option,
  Checkbox,
  Tag,
  TagPicker,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
  TagPickerProps,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTrigger,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  FluentProvider,
  useToastController,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  MailRegular,
  BriefcaseRegular,
  PeopleRegular,
  PersonRegular,
  LocationRegular,
  CallRegular,
  BuildingRegular,
  GlobeRegular,
  CalendarRegular,
  EditRegular,
  SaveRegular,
  DismissRegular,
  ShieldCheckmark20Filled,
} from "@fluentui/react-icons";
import {
  getEmployeeById,
  updateEmployee,
  Employee,
  UpdateEmployeePayload,
} from "../Services/EmployeeManagement";
import { useAuth } from "../Auth/AuthProvider";
import { acquireAdminToken } from "../Auth/adminAuth";
import PeoplePicker, { Person } from "../Recruit/Components/PeoplePicker";
import { searchUsersByDepartment } from "../Services/JDRequests";
import { getCombinedDepartments } from "../Services/Department";
import { getAppLocations, AppLocation } from "../Services/Location";
import { ALLOWLIST, validateSafeText } from "../Management/Utils/inputValidation";
import { fetchAllActiveLiscense } from "../Services/GraphAPI";
import { getFaxNumbers } from "../Services/Applicant";
import { FaxNumbersType } from "../Types/applicants";
import { ActiveLicense } from "../Types/license";
import LicenseList from "../Common/License.json";

const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
    <div className="text-[#0153A5] mt-[2px]">{icon}</div>
    <div className="flex flex-col">
      <Caption1 className="text-gray-500">{label}</Caption1>
      <Text className="!text-sm text-gray-900 break-all">{value || "—"}</Text>
    </div>
  </div>
);

// Domain part of the work email — fixed from env, fallback to quadrasystems.net
const EMAIL_DOMAIN =
  (import.meta.env.VITE_EMAIL_DOMAIN as string) || "quadrasystems.net";

// Shared button theme
const primaryBtnStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)",
  color: "#ffffff",
  border: "none",
  fontWeight: 600,
  padding: "8px 20px",
  whiteSpace: "nowrap",
};

const cancelBtnStyle: React.CSSProperties = {
  background: "#ffffff",
  color: "#374151",
  border: "1px solid #E5E7EB",
  fontWeight: 600,
  padding: "8px 20px",
  whiteSpace: "nowrap",
};

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const EmployeePreview = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { currentUser, accessToken } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState<UpdateEmployeePayload>({});
  const [selectedManager, setSelectedManager] = useState<Person | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  const [locationOptions, setLocationOptions] = useState<AppLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Division (sub-department) options — scoped by the selected department
  const [subDepartments, setSubDepartments] = useState<string[]>([]);
  const [isLoadingSubDepartments, setIsLoadingSubDepartments] = useState(false);
  // "Others" free-text sub department
  const [isOtherSubDept, setIsOtherSubDept] = useState(false);
  const [subDeptError, setSubDeptError] = useState<string | undefined>(undefined);
  // Cost Centre options
  const [faxNumbers, setFaxNumbers] = useState<FaxNumbersType[]>([]);

  // Licence assignment (same as Confirm Joining)
  const [assignLicense, setAssignLicense] = useState(false);
  const [availableLiscense, setAvailabelLiscense] = useState<ActiveLicense[]>(
    []
  );
  const [selectedLiscense, setSelectedLicense] = useState<string[]>([]);

  const onLicenseSelect: TagPickerProps["onOptionSelect"] = (_e, data) => {
    if (data.value === "no-options") return;
    setSelectedLicense(data.selectedOptions);
  };

  const licenseTagPickerOptions = availableLiscense?.filter(
    (option) => !selectedLiscense.includes(option.skuId)
  );

  // People picker search — restricted to the currently selected department
  const searchManagersByDept = async (query: string): Promise<Person[]> => {
    const department = form.department || employee?.department;
    if (!department) return [];
    const token = accessToken || "";
    const users = await searchUsersByDepartment(query, token, department);
    return users
      .filter((u) => u.id !== employee?.id) // exclude the employee themselves
      .map((u) => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
      }));
  };

  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const showError = (message: string) => {
    setErrorMessage(message);
    dispatchToast(
      <Toast>
        <ToastTitle>{message}</ToastTitle>
      </Toast>,
      { intent: "error" }
    );
  };

  const showSuccess = (message: string) =>
    dispatchToast(
      <Toast>
        <ToastTitle>{message}</ToastTitle>
      </Toast>,
      { intent: "success" }
    );

  // Acquire the delegated admin token (User.ReadWrite.All), forwarded as
  // x-admin-token — required to read/write Entra AD user details, same as the
  // /confirm-joining flow. Returns null when a redirect sign-in was triggered.
  const ensureAdminToken = async (): Promise<string | null> => {
    try {
      return await acquireAdminToken(currentUser?.email);
    } catch (adminAuthError: any) {
      if (adminAuthError?.message?.includes("Redirecting")) {
        dispatchToast(
          <Toast>
            <ToastTitle>Authentication Required</ToastTitle>
            <ToastBody>
              Signing in to admin account. Please reopen this page after the
              reload.
            </ToastBody>
          </Toast>,
          { intent: "info" }
        );
        return null;
      }
      throw adminAuthError;
    }
  };

  useEffect(() => {
    const loadEmployee = async () => {
      if (!employeeId) return;
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const adminToken = await ensureAdminToken();
        if (!adminToken) return; // redirecting for admin auth

        const result = await getEmployeeById(employeeId, adminToken);
        if (result.success && result.data) {
          setEmployee(result.data);
        } else {
          showError(result.message || "Failed to load employee");
        }
      } catch (error: any) {
        console.error("Error loading employee:", error);
        showError(error?.message || "Error loading employee");
      } finally {
        setIsLoading(false);
      }
    };
    loadEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  // Load departments for the edit dropdown (same source as JD Creation)
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setIsLoadingDepartments(true);
        const data = await getCombinedDepartments(accessToken || "");
        if (data) setDepartmentOptions(data);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Load office locations for the edit dropdown (same source as Shift & Location assignment)
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setIsLoadingLocations(true);
        const data = await getAppLocations(accessToken || "");
        if (data) setLocationOptions(data.filter((loc) => loc.Status === "active"));
      } catch (error) {
        console.error("Failed to fetch locations:", error);
      } finally {
        setIsLoadingLocations(false);
      }
    };
    loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Load cost-centre options (same source as Confirm Joining)
  useEffect(() => {
    const loadFaxNumbers = async () => {
      try {
        const data = await getFaxNumbers(accessToken || "");
        if (data) setFaxNumbers(data);
      } catch (error) {
        console.error("Failed to fetch cost centres:", error);
      }
    };
    loadFaxNumbers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Load division (sub-department) options for the selected department
  useEffect(() => {
    const loadSubDepartments = async () => {
      const department = form.department;
      if (!isEditMode || !department) {
        setSubDepartments([]);
        return;
      }
      try {
        setIsLoadingSubDepartments(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/graphapi/get-sub-departments?department=${encodeURIComponent(
            department
          )}`,
          { headers: { Authorization: `Bearer ${accessToken || ""}` } }
        );
        const result = await response.json();
        if (result.success) {
          const list: string[] = result.data || [];
          setSubDepartments(list);
          // A saved division that isn't one of the fetched options is a custom
          // ("Others") value — switch to free-text so it stays editable.
          setIsOtherSubDept(
            !!form.division && !list.includes(form.division)
          );
        }
      } catch (error) {
        console.error("Error fetching sub-departments:", error);
      } finally {
        setIsLoadingSubDepartments(false);
      }
    };
    loadSubDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.department, isEditMode, accessToken]);

  // Load available licences (used to resolve licence names in view mode and
  // populate the picker in edit mode)
  useEffect(() => {
    const loadLicenses = async () => {
      try {
        const response = await fetchAllActiveLiscense(accessToken || "");
        if (response?.success) {
          const filtered = response.data.filter(
            (item: ActiveLicense) => item.availableUnits > 0
          );
          setAvailabelLiscense(filtered);
        }
      } catch (error) {
        console.error("Failed to fetch licences:", error);
      }
    };
    loadLicenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Resolve a skuId's skuPartNumber. Prefer the live catalogue
  // (availableLiscense), then fall back to the skuPartNumber carried on the
  // employee's assigned licence — the catalogue only contains SKUs with
  // availableUnits > 0, so a fully-consumed assigned licence is absent from it.
  const resolveSkuPartNumber = (skuId: string): string | undefined =>
    availableLiscense.find((l) => l.skuId === skuId)?.skuPartNumber ||
    (employee?.assignedLicenses || []).find((l: any) => l?.skuId === skuId)
      ?.skuPartNumber;

  // Resolve a licence skuId to its friendly display name, falling back to the
  // skuPartNumber and finally the raw skuId when neither is mappable.
  const licenseName = (skuId: string): string => {
    const part = resolveSkuPartNumber(skuId);
    return part && LicenseList[part as keyof typeof LicenseList]
      ? LicenseList[part as keyof typeof LicenseList]
      : part || skuId;
  };

  const handleDepartmentChange = (department: string) => {
    // Changing department invalidates the department-scoped fields (manager
    // and division), so clear them — same behaviour as JD Creation.
    setForm((prev) => ({
      ...prev,
      department,
      managerId: null,
      division: "",
    }));
    setSelectedManager(null);
    setIsOtherSubDept(false);
    setSubDeptError(undefined);
  };

  const enterEditMode = () => {
    if (!employee) return;
    setForm({
      displayName: employee.displayName ?? "",
      givenName: employee.givenName ?? "",
      surname: employee.surname ?? "",
      mail: employee.mail ?? "",
      jobTitle: employee.jobTitle ?? "",
      department: employee.department ?? "",
      mobilePhone: employee.mobilePhone ?? "",
      officeLocation: employee.officeLocation ?? "",
      streetAddress: employee.streetAddress ?? "",
      city: employee.city ?? "",
      state: employee.state ?? "",
      postalCode: employee.postalCode ?? "",
      employeeId: employee.employeeId ?? "",
      accountEnabled: employee.accountEnabled,
      managerId: employee.manager?.id ?? null,
      division: employee.employeeOrgData?.division ?? "",
      costCenter: employee?.faxNumber ?? "",
    });
    setSelectedManager(
      employee.manager
        ? {
            id: employee.manager.id,
            displayName: employee.manager.displayName,
            email: employee.manager.mail ?? "",
          }
        : null
    );
    // Seed licences from the employee's current assignments
    const currentLicenses = (employee.assignedLicenses || [])
      .map((l: any) => l?.skuId)
      .filter(Boolean);
    setSelectedLicense(currentLicenses);
    setAssignLicense(currentLicenses.length > 0);
    setIsEditMode(true);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setForm({});
    setSelectedManager(null);
    setAssignLicense(false);
    setSelectedLicense([]);
    setIsOtherSubDept(false);
    setSubDeptError(undefined);
  };

  const setField = <K extends keyof UpdateEmployeePayload>(
    key: K,
    value: UpdateEmployeePayload[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  // Sentinel option that switches the Sub Department dropdown to free-text.
  const OTHER_SUB_DEPT = "Others";

  // Handle Sub Department selection: "Others" reveals a free-text field.
  const handleSubDeptSelect = (value: string) => {
    if (value === OTHER_SUB_DEPT) {
      setIsOtherSubDept(true);
      setField("division", ""); // clear so the user types a fresh value
    } else {
      setIsOtherSubDept(false);
      setField("division", value);
    }
    setSubDeptError(undefined);
  };

  // Live-validate the free-text Sub Department value.
  const handleOtherSubDeptChange = (value: string) => {
    setField("division", value);
    setSubDeptError(
      validateSafeText(value, {
        label: "Sub Department",
        allow: ALLOWLIST.name,
        maxLength: 100,
      })
    );
  };

  // When an office location is picked, stamp its address onto the employee.
  // If the location has no address on record, the fields are cleared so the
  // user is forced to type them (they're mandatory once a location is set).
  const handleOfficeLocationChange = (locationName: string) => {
    const loc = locationOptions.find((l) => l.Name === locationName);
    setForm((prev) => ({
      ...prev,
      officeLocation: locationName,
      streetAddress: loc?.Street ?? "",
      city: loc?.City ?? "",
      state: loc?.State ?? "",
      postalCode: loc?.Zipcode ?? "",
    }));
  };

  // Validate the form, then open the confirmation dialog
  const handleSaveClick = () => {
    const requiredFields: { label: string; value?: string | null }[] = [
      { label: "Display Name", value: form.displayName },
      { label: "Email", value: form.mail },
      { label: "Job Title", value: form.jobTitle },
      { label: "Department", value: form.department },
    ];

    // Address becomes mandatory once an office location is chosen. When the
    // selected location has no address on record, these are blank and the user
    // must fill them in before submitting.
    if (form.officeLocation?.trim()) {
      requiredFields.push(
        { label: "Street", value: form.streetAddress },
        { label: "City", value: form.city },
        { label: "State", value: form.state },
        { label: "Zip / PIN Code", value: form.postalCode }
      );
    }
    const missing = requiredFields
      .filter((f) => !f.value?.trim())
      .map((f) => f.label);
    if (missing.length > 0) {
      showError(`${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} required.`);
      return;
    }

    if (form.postalCode?.trim() && !/^\d{6}$/.test(form.postalCode.trim())) {
      showError("Zip / PIN Code must be 6 digits.");
      return;
    }

    // A custom ("Others") sub department must be typed in.
    if (isOtherSubDept && !form.division?.trim()) {
      showError("Sub Department is required.");
      return;
    }

    // Harden free-text fields against unsafe / injection-shaped input.
    const textChecks: { value?: string | null; allow: RegExp; label: string }[] = [
      { label: "Street", value: form.streetAddress, allow: ALLOWLIST.street },
      { label: "City", value: form.city, allow: ALLOWLIST.place },
      { label: "State", value: form.state, allow: ALLOWLIST.place },
    ];
    // "Others" sub department is user-typed free text — validate it too.
    if (isOtherSubDept) {
      textChecks.push({
        label: "Sub Department",
        value: form.division,
        allow: ALLOWLIST.name,
      });
    }
    for (const check of textChecks) {
      const err = validateSafeText(check.value, {
        label: check.label,
        allow: check.allow,
        maxLength: check.label === "Street" ? 250 : 100,
      });
      if (err) {
        showError(err);
        return;
      }
    }

    if (assignLicense && selectedLiscense.length === 0) {
      showError("Please add at least one licence to proceed.");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleSave = async () => {
    if (!employee) return;
    try {
      setIsSaving(true);
      const adminToken = await ensureAdminToken();
      if (!adminToken) return; // redirecting for admin auth

      const payload: UpdateEmployeePayload = {
        ...form,
        assignLicenses: assignLicense,
        licenses: assignLicense ? selectedLiscense : [],
      };
      // employeeOrgData (division/costCenter) — matches Confirm Joining
      const result = await updateEmployee(employee.id, payload, adminToken);
      if (result.success) {
        // The update response returns only status flags (not the user object),
        // so refetch the full details to reflect the saved values.
        const refreshed = await getEmployeeById(employee.id, adminToken);
        if (refreshed.success && refreshed.data) {
          setEmployee(refreshed.data);
        } else {
          // Fallback: merge the edited fields locally
          setEmployee((prev) =>
            prev ? ({ ...prev, ...form } as Employee) : prev
          );
        }
        setIsEditMode(false);
        setIsConfirmOpen(false);
        showSuccess(result.message || "Employee updated successfully");
      } else {
        showError(result.message || "Failed to update employee");
      }
    } catch (error: any) {
      console.error("Error updating employee:", error);
      showError(error?.message || "Error updating employee");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <div className="space-y-4 min-h-screen mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              appearance="subtle"
              icon={<ArrowLeftRegular />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Subtitle2 className="text-[#1D4586] font-bold">
              {isEditMode ? "Edit Employee" : "Employee Preview"}
            </Subtitle2>
          </div>

          {employee && !isLoading && (
            <div className="flex gap-2">
              {isEditMode ? (
                <>
                  <Button
                    appearance="secondary"
                    shape="circular"
                    style={cancelBtnStyle}
                    icon={<DismissRegular />}
                    onClick={cancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    appearance="primary"
                    shape="circular"
                    style={primaryBtnStyle}
                    icon={isSaving ? <Spinner size="tiny" /> : <SaveRegular />}
                    onClick={handleSaveClick}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button
                  appearance="primary"
                  shape="circular"
                  style={primaryBtnStyle}
                  icon={<EditRegular />}
                  onClick={enterEditMode}
                >
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 h-full">
            <Spinner />
            <Body1Strong className="mt-2">Loading Employee...</Body1Strong>
          </div>
        ) : !employee ? (
          <Card className="shadow-lg !rounded-xl border-0 bg-white">
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <PersonRegular className="w-10 h-10 text-blue-600" />
              </div>
              <Subtitle2 className="mb-3 text-gray-700">
                {errorMessage ? "Unable to load employee" : "Employee not found"}
              </Subtitle2>
              <Body1
                style={{
                  textAlign: "center",
                  color: errorMessage ? "red" : "inherit",
                }}
                className="text-gray-500 text-center max-w-md mx-auto"
              >
                {errorMessage || "We couldn't find an employee for this ID."}
              </Body1>
            </div>
          </Card>
        ) : (
          <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white">
            <div className="flex flex-col gap-5 p-2">
              {/* Header */}
              <div className="flex items-center gap-4">
                <Avatar name={employee.displayName} size={72} color="colorful" />
                <div className="flex flex-col gap-1">
                  <Text className="!text-lg !font-semibold text-[#1D4586]">
                    {employee.displayName}
                  </Text>
                  <Text className="!text-sm text-gray-600">
                    {employee.jobTitle || "—"}
                  </Text>
                  <div className="flex gap-2 mt-1">
                    <Badge
                      appearance="ghost"
                      color={
                        (isEditMode ? form.accountEnabled : employee.accountEnabled)
                          ? "success"
                          : "danger"
                      }
                    >
                      {(isEditMode ? form.accountEnabled : employee.accountEnabled)
                        ? "Active"
                        : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Divider />

              {isEditMode ? (
                /* ---------------- Edit mode ---------------- */
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <Field label="Display Name" required>
                      <Input
                        value={form.displayName ?? ""}
                        onChange={(_, d) => setField("displayName", d.value)}
                      />
                    </Field>
                    <Field label="First Name">
                      <Input
                        value={form.givenName ?? ""}
                        onChange={(_, d) => setField("givenName", d.value)}
                      />
                    </Field>
                    <Field label="Last Name">
                      <Input
                        value={form.surname ?? ""}
                        onChange={(_, d) => setField("surname", d.value)}
                      />
                    </Field>
                    <Field label="Email" required>
                      <Input
                        value={(form.mail ?? "").split("@")[0]}
                        contentAfter={
                          <Text size={200} className="text-gray-500">
                            @{EMAIL_DOMAIN}
                          </Text>
                        }
                        onChange={(_, d) => {
                          const local = d.value.split("@")[0].trim();
                          setField("mail", local ? `${local}@${EMAIL_DOMAIN}` : "");
                        }}
                      />
                    </Field>
                    <Field label="Job Title" required>
                      <Input
                        value={form.jobTitle ?? ""}
                        onChange={(_, d) => setField("jobTitle", d.value)}
                      />
                    </Field>
                    <Field label="Department" required>
                      <Dropdown
                        placeholder={
                          isLoadingDepartments
                            ? "Loading departments..."
                            : "Select department"
                        }
                        disabled={isLoadingDepartments}
                        value={form.department ?? ""}
                        selectedOptions={
                          form.department ? [form.department] : []
                        }
                        onOptionSelect={(_, data) =>
                          handleDepartmentChange(data.optionValue || "")
                        }
                      >
                        {departmentOptions.map((dept) => (
                          <Option key={dept.Id} value={dept.Name}>
                            {dept.Name}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>
                    <PeoplePicker
                      label={`Manager${
                        form.department ? ` (${form.department})` : ""
                      }`}
                      placeholder={
                        form.department
                          ? "Search within department..."
                          : "Select a department first"
                      }
                      disabled={!form.department}
                      selectedPerson={selectedManager}
                      searchFunction={searchManagersByDept}
                      onSelectionChanged={(person) => {
                        setSelectedManager(person);
                        setField("managerId", person?.id ?? null);
                      }}
                    />
                    <Field label="Mobile Phone">
                      <Input
                        value={form.mobilePhone ?? ""}
                        onChange={(_, d) => setField("mobilePhone", d.value)}
                      />
                    </Field>
                    <Field label="Office Location">
                      <Dropdown
                        placeholder={
                          isLoadingLocations
                            ? "Loading locations..."
                            : "Select office location"
                        }
                        disabled={isLoadingLocations}
                        value={form.officeLocation ?? ""}
                        selectedOptions={
                          form.officeLocation ? [form.officeLocation] : []
                        }
                        onOptionSelect={(_, data) =>
                          handleOfficeLocationChange(data.optionValue || "")
                        }
                      >
                        {locationOptions.map((loc) => (
                          <Option key={loc.Id} value={loc.Name}>
                            {loc.Name}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>
                    {/* Address — auto-filled from the selected office location;
                        mandatory once a location is chosen (see handleSaveClick). */}
                    <Field
                      label="Street"
                      required={!!form.officeLocation}
                    >
                      <Textarea
                        value={form.streetAddress ?? ""}
                        placeholder="e.g., 100 Feet Road, Gandhipuram"
                        resize="vertical"
                        onChange={(_, d) => setField("streetAddress", d.value)}
                      />
                    </Field>
                    <Field
                      label="City / District"
                      required={!!form.officeLocation}
                    >
                      <Input
                        value={form.city ?? ""}
                        placeholder="e.g., Coimbatore"
                        onChange={(_, d) => setField("city", d.value)}
                      />
                    </Field>
                    <Field
                      label="State"
                      required={!!form.officeLocation}
                    >
                      <Input
                        value={form.state ?? ""}
                        placeholder="e.g., Tamil Nadu"
                        onChange={(_, d) => setField("state", d.value)}
                      />
                    </Field>
                    <Field
                      label="Zip / PIN Code"
                      required={!!form.officeLocation}
                    >
                      <Input
                        value={form.postalCode ?? ""}
                        placeholder="e.g., 641012"
                        inputMode="numeric"
                        maxLength={6}
                        onChange={(_, d) =>
                          setField(
                            "postalCode",
                            d.value.replace(/\D/g, "").slice(0, 6)
                          )
                        }
                      />
                    </Field>
                    <Field label="Employee ID">
                      <Input
                        value={form.employeeId ?? ""}
                        onChange={(_, d) => setField("employeeId", d.value)}
                      />
                    </Field>
                    <Field label="Sub Department">
                      <Dropdown
                        placeholder={
                          !form.department
                            ? "Select a department first"
                            : isLoadingSubDepartments
                            ? "Loading Sub Departments..."
                            : "Select Sub Department"
                        }
                        disabled={!form.department || isLoadingSubDepartments}
                        value={
                          isOtherSubDept
                            ? OTHER_SUB_DEPT
                            : form.division ?? ""
                        }
                        selectedOptions={
                          isOtherSubDept
                            ? [OTHER_SUB_DEPT]
                            : form.division
                            ? [form.division]
                            : []
                        }
                        onOptionSelect={(_, data) =>
                          handleSubDeptSelect(data.optionValue || "")
                        }
                      >
                        {subDepartments.map((div) => (
                          <Option key={div} value={div}>
                            {div}
                          </Option>
                        ))}
                        <Option key="__other__" value={OTHER_SUB_DEPT}>
                          {OTHER_SUB_DEPT}
                        </Option>
                      </Dropdown>
                    </Field>
                    {isOtherSubDept && (
                      <Field
                        label="Specify Sub Department"
                        required
                        validationState={subDeptError ? "error" : "none"}
                        validationMessage={subDeptError}
                      >
                        <Input
                          value={form.division ?? ""}
                          placeholder="Enter sub department"
                          maxLength={100}
                          onChange={(_, d) =>
                            handleOtherSubDeptChange(d.value)
                          }
                        />
                      </Field>
                    )}
                    <Field label="Security Group">
                      <Dropdown
                        placeholder={
                          faxNumbers.length === 0
                            ? "Loading Security Groups..."
                            : "Select Security Group"
                        }
                        disabled={faxNumbers.length === 0}
                        value={form.costCenter ?? ""}
                        selectedOptions={
                          form.costCenter ? [form.costCenter] : []
                        }
                        onOptionSelect={(_, data) =>
                          setField("costCenter", data.optionValue || "")
                        }
                      >
                        {faxNumbers.map((fax) => (
                          <Option key={fax.id} value={fax.costCenter}>
                            {fax.costCenter}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>
                    <Field label="Account Status">
                      <Switch
                        checked={!!form.accountEnabled}
                        label={form.accountEnabled ? "Active" : "Disabled"}
                        onChange={(_, d) => setField("accountEnabled", d.checked)}
                      />
                    </Field>
                  </div>

                  {/* Licence assignment (same as Confirm Joining) */}
                  <div className="border border-gray-200 rounded-xl p-5 flex flex-col gap-5">
                    <div className="w-full p-3 bg-[#D1FAE5] text-green-700 flex justify-between items-center rounded-lg">
                      <div className="flex gap-2 items-center">
                        <div className="w-5 h-5 bg-green-800 flex items-center justify-center rounded-sm p-1">
                          <ShieldCheckmark20Filled className="w-4 h-4 text-white" />
                        </div>
                        <Body1Strong>Assign License</Body1Strong>
                      </div>
                      <Checkbox
                        checked={assignLicense}
                        onChange={() => {
                          setAssignLicense(!assignLicense);
                          setSelectedLicense([]);
                        }}
                        indicator={{
                          style: {
                            backgroundColor: assignLicense ? "#016630" : "#fff",
                          },
                        }}
                      />
                    </div>

                    <Field className="w-full" label="License">
                      <TagPicker
                        onOptionSelect={onLicenseSelect}
                        selectedOptions={selectedLiscense}
                        disabled={!assignLicense}
                      >
                        <TagPickerControl>
                          <TagPickerGroup aria-label="License">
                            {selectedLiscense.map((skuId) => {
                              const displayName = licenseName(skuId);
                              return (
                                <Tag
                                  key={skuId}
                                  shape="rounded"
                                  media={
                                    <Avatar
                                      aria-hidden
                                      name={displayName}
                                      color="colorful"
                                    />
                                  }
                                  value={skuId}
                                  size="small"
                                >
                                  {displayName}
                                </Tag>
                              );
                            })}
                          </TagPickerGroup>
                          <TagPickerInput aria-label="Select License" />
                        </TagPickerControl>
                        <TagPickerList>
                          {licenseTagPickerOptions.length > 0 ? (
                            licenseTagPickerOptions.map((option) => (
                              <TagPickerOption
                                value={option.skuId}
                                key={option.skuId}
                              >
                                {option?.skuPartNumber &&
                                LicenseList[
                                  option.skuPartNumber as keyof typeof LicenseList
                                ]
                                  ? LicenseList[
                                      option.skuPartNumber as keyof typeof LicenseList
                                    ]
                                  : option?.skuPartNumber}
                              </TagPickerOption>
                            ))
                          ) : (
                            <TagPickerOption value="no-options">
                              No options available
                            </TagPickerOption>
                          )}
                        </TagPickerList>
                      </TagPicker>
                    </Field>
                  </div>

                  {/* Read-only identity fields */}
                  {/* <Divider>Read-only</Divider>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DetailItem
                      icon={<PersonRegular className="w-5 h-5" />}
                      label="User Principal Name"
                      value={employee.userPrincipalName}
                    />
                  </div> */}
                </div>
              ) : (
                /* ---------------- View mode ---------------- */
                <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                  <DetailItem
                    icon={<PersonRegular className="w-5 h-5" />}
                    label="Display Name"
                    value={employee.displayName}
                  />
                  <DetailItem
                    icon={<PersonRegular className="w-5 h-5" />}
                    label="First Name"
                    value={employee.givenName}
                  />
                  <DetailItem
                    icon={<PersonRegular className="w-5 h-5" />}
                    label="Last Name"
                    value={employee.surname}
                  />
                  <DetailItem
                    icon={<MailRegular className="w-5 h-5" />}
                    label="Email"
                    value={employee.mail}
                  />
                  {/* <DetailItem
                    icon={<PersonRegular className="w-5 h-5" />}
                    label="User Principal Name"
                    value={employee.userPrincipalName}
                  /> */}
                  <DetailItem
                    icon={<BriefcaseRegular className="w-5 h-5" />}
                    label="Job Role"
                    value={employee.jobTitle}
                  />
                  <DetailItem
                    icon={<PeopleRegular className="w-5 h-5" />}
                    label="Department"
                    value={employee.department}
                  />
                  <DetailItem
                    icon={<PersonRegular className="w-5 h-5" />}
                    label="Manager"
                    value={employee.manager?.displayName}
                  />
                  <DetailItem
                    icon={<CallRegular className="w-5 h-5" />}
                    label="Mobile Phone"
                    value={employee.mobilePhone}
                  />
                  <DetailItem
                    icon={<LocationRegular className="w-5 h-5" />}
                    label="Office Location"
                    value={employee.officeLocation}
                  />
                  <DetailItem
                    icon={<LocationRegular className="w-5 h-5" />}
                    label="Street"
                    value={employee.streetAddress}
                  />
                  <DetailItem
                    icon={<BuildingRegular className="w-5 h-5" />}
                    label="City / District"
                    value={employee.city}
                  />
                  <DetailItem
                    icon={<GlobeRegular className="w-5 h-5" />}
                    label="State"
                    value={employee.state}
                  />
                  <DetailItem
                    icon={<LocationRegular className="w-5 h-5" />}
                    label="Zip / PIN Code"
                    value={employee.postalCode}
                  />
                  <DetailItem
                    icon={<PersonRegular className="w-5 h-5" />}
                    label="Employee ID"
                    value={employee.employeeId}
                  />
                  <DetailItem
                    icon={<BuildingRegular className="w-5 h-5" />}
                    label="Sub Department"
                    value={employee.employeeOrgData?.division}
                  />
                  <DetailItem
                    icon={<BuildingRegular className="w-5 h-5" />}
                    label="Security Group"
                    value={employee.faxNumber}
                  />
                  <DetailItem
                    icon={<GlobeRegular className="w-5 h-5" />}
                    label="Usage Location"
                    value={employee.usageLocation}
                  />
                  <DetailItem
                    icon={<CalendarRegular className="w-5 h-5" />}
                    label="Hire Date"
                    value={formatDate(employee.employeeHireDate)}
                  />
                  <DetailItem
                    icon={<CalendarRegular className="w-5 h-5" />}
                    label="Created On"
                    value={formatDate(employee.createdDateTime)}
                  />
                </div>

                {/* Assigned Licences */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50">
                  <Caption1 className="text-gray-500 block mb-2">
                    Assigned Licences
                  </Caption1>
                  {employee.assignedLicenses &&
                  employee.assignedLicenses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {employee.assignedLicenses.map((lic: any, idx: number) => (
                        <Tag
                          key={lic?.skuId ?? idx}
                          shape="rounded"
                          size="small"
                          media={
                            <Avatar
                              aria-hidden
                              name={licenseName(lic?.skuId)}
                              color="colorful"
                            />
                          }
                        >
                          {licenseName(lic?.skuId)}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Text className="!text-sm text-gray-900">
                      No licences assigned
                    </Text>
                  )}
                </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Confirmation dialog before saving */}
      <Dialog
        open={isConfirmOpen}
        onOpenChange={(_, data) => !isSaving && setIsConfirmOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm changes</DialogTitle>
            <DialogContent>
              <Text className="!text-sm text-gray-700">
                Please review the details below before saving. These changes will
                be applied to the employee's Entra AD account.
              </Text>
              <div className="mt-3 flex flex-col gap-2 bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between gap-4">
                  <Caption1 className="text-gray-500">Display Name</Caption1>
                  <Text className="!text-sm">{form.displayName || "—"}</Text>
                </div>
                <div className="flex justify-between gap-4">
                  <Caption1 className="text-gray-500">Email</Caption1>
                  <Text className="!text-sm break-all">{form.mail || "—"}</Text>
                </div>
                <div className="flex justify-between gap-4">
                  <Caption1 className="text-gray-500">Job Title</Caption1>
                  <Text className="!text-sm">{form.jobTitle || "—"}</Text>
                </div>
                <div className="flex justify-between gap-4">
                  <Caption1 className="text-gray-500">Department</Caption1>
                  <Text className="!text-sm">{form.department || "—"}</Text>
                </div>
                <div className="flex justify-between gap-4">
                  <Caption1 className="text-gray-500">Manager</Caption1>
                  <Text className="!text-sm">
                    {selectedManager?.displayName || "—"}
                  </Text>
                </div>
                <div className="flex justify-between gap-4">
                  <Caption1 className="text-gray-500">Account Status</Caption1>
                  <Text className="!text-sm">
                    {form.accountEnabled ? "Active" : "Disabled"}
                  </Text>
                </div>
                <div className="flex justify-between gap-4">
                  <Caption1 className="text-gray-500">Licences</Caption1>
                  <Text className="!text-sm">
                    {assignLicense
                      ? `${selectedLiscense.length} selected`
                      : "Not assigning"}
                  </Text>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button
                  appearance="secondary"
                  shape="circular"
                  style={cancelBtnStyle}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                shape="circular"
                style={primaryBtnStyle}
                icon={isSaving ? <Spinner size="tiny" /> : <SaveRegular />}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Confirm & Save"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Toaster toasterId={toasterId} />
    </FluentProvider>
  );
};

export default EmployeePreview;
