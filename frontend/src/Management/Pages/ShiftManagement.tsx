import React, { useState, useEffect, useId } from "react";
import {
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Body1Strong,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
  Toaster,
  Spinner,
  Field,
  Card,
  Text,
  Badge,
  Subtitle2,
  Caption1,
  FluentProvider,
  SearchBox,
  Input,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Switch,
} from "@fluentui/react-components";
import {
  Delete20Regular,
  Add12Filled,
  CheckmarkCircle20Regular,
  ErrorCircle20Regular,
  EditRegular,
  ClockRegular,
  TimeAndWeatherRegular,
  DismissRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import {
  getAllShifts,
  upsertShift,
  deleteShift,
  Shift,
  UpsertShiftData,
} from "../../Services/ShiftService";

// =============================================
// Helpers
// =============================================

/** Convert "HH:mm:ss" or ISO string from server to "HH:mm" for <input type="time" /> */
const toTimeInput = (timeStr?: any, useUTC = false): string => {
  if (!timeStr) return "";

  // If it's a simple HH:mm:ss string
  if (typeof timeStr === "string" && !timeStr.includes("T")) {
    return timeStr.slice(0, 5);
  }

  // If it's an ISO date string or Date object
  const date = new Date(timeStr);
  if (isNaN(date.getTime())) return "";

  const h = String(useUTC ? date.getUTCHours() : date.getHours()).padStart(2, "0");
  const m = String(useUTC ? date.getUTCMinutes() : date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

/** Display-friendly time label "HH:mm AM/PM" */
const formatTime = (timeStr?: any): string => {
  if (!timeStr) return "—";

  let h: number, m: number;

  if (typeof timeStr === "string" && !timeStr.includes("T")) {
    // Simple "HH:mm:ss" or "HH:mm"
    const parts = timeStr.split(":").map(Number);
    h = parts[0];
    m = parts[1];
  } else {
    // ISO string or Date object
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return "—";
    h = date.getUTCHours();
    m = date.getUTCMinutes();
  }

  if (isNaN(h) || isNaN(m)) return "—";

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// =============================================
// Types
// =============================================

interface ShiftFormState {
  id: number | null;
  ShiftName: string;
  StartTime: string;
  EndTime: string;
  IsActive: boolean;
  HasExpiry: boolean;
  ExpiryDate: string; // "YYYY-MM-DD"
  ExpiryTime: string; // "HH:mm"
}

const emptyForm = (): ShiftFormState => ({
  id: null,
  ShiftName: "",
  StartTime: "",
  EndTime: "",
  IsActive: true,
  HasExpiry: false,
  ExpiryDate: "",
  ExpiryTime: "",
});

interface FormErrors {
  ShiftName?: string;
  StartTime?: string;
  EndTime?: string;
  ExpiryDate?: string;
  ExpiryTime?: string;
}

// =============================================
// Component
// =============================================

function ShiftTemplate() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<ShiftFormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);
  const { currentUser } = useAuth() as any;

  useEffect(() => {
    fetchShifts();
  }, []);

  // =============================================
  // Data Fetching
  // =============================================

  const fetchShifts = async () => {
    setIsLoading(true);
    try {
      const res = await getAllShifts();
      if (res.success && res.data) {
        setShifts(res.data);
      } else {
        showToast("error", "Failed to load shifts", res.message);
      }
    } catch (e) {
      showToast("error", "Error", "Could not fetch shifts.");
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // Toast
  // =============================================

  const showToast = (
    intent: "success" | "error",
    title: string,
    body?: string
  ) => {
    dispatchToast(
      <Toast>
        <ToastTitle
          media={
            intent === "success" ? (
              <CheckmarkCircle20Regular />
            ) : (
              <ErrorCircle20Regular />
            )
          }
        >
          {title}
        </ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent, toastId, timeout: 5000 }
    );
  };

  // =============================================
  // Form Validation
  // =============================================

  const validate = (form: ShiftFormState): FormErrors => {
    const errs: FormErrors = {};
    if (!form.ShiftName.trim()) errs.ShiftName = "Shift name is required";
    if (!form.StartTime) errs.StartTime = "Start time is required";
    if (!form.EndTime) errs.EndTime = "End time is required";
    // Duplicate name check (exclude current shift being edited)
    const isDuplicate = shifts.some(
      (s) =>
        s.ID !== form.id &&
        s.ShiftName.trim().toLowerCase() === form.ShiftName.trim().toLowerCase()
    );
    if (isDuplicate) errs.ShiftName = "A shift with this name already exists";
    
    if (form.HasExpiry) {
      if (!form.ExpiryDate) errs.ExpiryDate = "Expiry date is required";
      if (!form.ExpiryTime) errs.ExpiryTime = "Expiry time is required";
    }
    
    return errs;
  };

  // =============================================
  // Dialog helpers
  // =============================================

  const openAddDialog = () => {
    setFormState(emptyForm());
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (shift: Shift) => {
    setFormState({
      id: shift.ID,
      ShiftName: shift.ShiftName,
      StartTime: toTimeInput(shift.StartTime, true),
      EndTime: toTimeInput(shift.EndTime, true),
      IsActive: shift.IsActive,
      HasExpiry: !!shift.ExpiryDate,
      ExpiryDate: shift.ExpiryDate ? new Date(shift.ExpiryDate).toLocaleDateString('en-CA') : "", // YYYY-MM-DD
      ExpiryTime: shift.ExpiryDate ? toTimeInput(shift.ExpiryDate) : "",
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setFormState(emptyForm());
    setFormErrors({});
  };

  // =============================================
  // Save
  // =============================================

  const handleSave = async () => {
    const errs = validate(formState);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setIsSaving(true);
    try {
      const payload: UpsertShiftData = {
        id: formState.id,
        ShiftName: formState.ShiftName.trim(),
        StartTime: formState.StartTime,
        EndTime: formState.EndTime,
        IsActive: formState.IsActive,
        ExpiryDate: formState.HasExpiry && formState.ExpiryDate && formState.ExpiryTime 
                    ? new Date(`${formState.ExpiryDate}T${formState.ExpiryTime}:00`).toISOString() 
                    : null,
      };
      const res = await upsertShift(payload, currentUser?.userID || "UNKNOWN");
      if (res.success) {
        showToast(
          "success",
          formState.id ? "Shift Updated" : "Shift Created",
          res.message
        );
        closeDialog();
        await fetchShifts();
      } else {
        showToast("error", "Failed to save shift", res.message);
      }
    } catch (e) {
      showToast("error", "Error", "Could not save shift.");
    } finally {
      setIsSaving(false);
    }
  };

  // =============================================
  // Delete
  // =============================================

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await deleteShift(id, currentUser?.userID || "UNKNOWN");
      if (res.success) {
        showToast("success", "Shift Deleted", res.message);
        await fetchShifts();
      } else {
        showToast("error", "Failed to delete shift", res.message);
      }
    } catch (e) {
      showToast("error", "Error", "Could not delete shift.");
    } finally {
      setDeletingId(null);
    }
  };

  // =============================================
  // Filtered list
  // =============================================

  const filteredShifts = shifts.filter((s) =>
    s.ShiftName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =============================================
  // Render
  // =============================================

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading Shift Templates...</Body1Strong>
      </div>
    );
  }

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <div className="min-h-screen">
        <Toaster toasterId={toastId} />

        {/* ---- Header ---- */}
        <div className="flex justify-between items-center pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Subtitle2 className="text-[#063762]">Shift Template</Subtitle2>
            </div>
            <Caption1 className="text-gray-600">
              Define and manage employee work shift templates and timings
            </Caption1>
          </div>
        </div>

        {/* ---- Controls ---- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div className="flex items-center gap-4 w-full md:w-1/4">
            <div className="relative w-full">
              <SearchBox
                className={`w-full transition-all duration-200 ${
                  isTransitioning
                    ? "opacity-70 scale-[0.99]"
                    : "opacity-100 scale-100"
                } !border-1 !border-[#E5E7EB] after:!border-0 !rounded-3xl`}
                placeholder="Search shifts..."
                value={searchTerm}
                onChange={(_, data) => {
                  setSearchTerm(data.value);
                  setIsTransitioning(true);
                  setTimeout(() => setIsTransitioning(false), 150);
                }}
              />
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <Button
              appearance="primary"
              onClick={openAddDialog}
              shape="circular"
              icon={
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] flex items-center justify-center text-white">
                  <Add12Filled />
                </div>
              }
              className="hover:bg-indigo-700 shadow !bg-white/50 !text-[#626262] border-1 !border-white"
            >
              Add Shift
            </Button>
          </div>
        </div>

        {/* ---- Table ---- */}
        <div className="mt-4">
          {filteredShifts.length > 0 ? (
            <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0">
              <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <Table sortable className="w-full">
                  <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                    <TableRow className="border-b-2 border-gray-100">
                      <TableHeaderCell className="!py-3 !px-6 w-16">
                        <Body1Strong className="text-gray-900">#</Body1Strong>
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-3 !px-6">
                        <Body1Strong className="text-gray-900">Shift Name</Body1Strong>
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-3 !px-6">
                        <Body1Strong className="text-gray-900">Start Time</Body1Strong>
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-3 !px-6">
                        <Body1Strong className="text-gray-900">End Time</Body1Strong>
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-3 !px-6">
                        <Body1Strong className="text-gray-900">Status</Body1Strong>
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-3 !px-6">
                        <Body1Strong className="text-gray-900">Expiry</Body1Strong>
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-3 !px-6 w-28">
                        <Body1Strong className="text-gray-900">Actions</Body1Strong>
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShifts.map((shift, index) => (
                      <TableRow
                        key={shift.ID}
                        className={`hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        }`}
                      >
                        <TableCell className="px-6 py-4">
                          <Badge
                            appearance="filled"
                            color="brand"
                            size="medium"
                            className="font-semibold bg-blue-100 text-blue-800"
                          >
                            {index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <ClockRegular className="w-4 h-4 text-blue-500" />
                            <Text className="text-gray-800 font-medium">
                              {shift.ShiftName}
                            </Text>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Text className="text-gray-700">{formatTime(shift.StartTime)}</Text>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Text className="text-gray-700">{formatTime(shift.EndTime)}</Text>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            appearance="filled"
                            color={shift.IsActive && !(shift.ExpiryDate && new Date(shift.ExpiryDate) < new Date()) ? "success" : "subtle"}
                            size="medium"
                          >
                            {shift.IsActive && !(shift.ExpiryDate && new Date(shift.ExpiryDate) < new Date()) ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Text size={200} className={shift.ExpiryDate && new Date(shift.ExpiryDate) < new Date() ? "text-red-500 font-semibold" : "text-gray-500"}>
                            {shift.ExpiryDate ? new Date(shift.ExpiryDate).toLocaleString() : "—"}
                            {shift.ExpiryDate && new Date(shift.ExpiryDate) < new Date() && " (Expired)"}
                          </Text>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Button
                              icon={<EditRegular />}
                              onClick={() => openEditDialog(shift)}
                              appearance="subtle"
                              className="w-8 h-8 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 rounded-lg"
                              title="Edit shift"
                            />
                            <Button
                              onClick={() => handleDelete(shift.ID)}
                              icon={
                                deletingId === shift.ID ? (
                                  <Spinner size="tiny" />
                                ) : (
                                  <Delete20Regular />
                                )
                              }
                              disabled={deletingId === shift.ID}
                              appearance="subtle"
                              className="w-8 h-8 hover:bg-red-100 hover:text-red-700 transition-all duration-200 rounded-lg"
                              title="Delete shift"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 border-t border-gray-100 px-2 py-4">
                <div className="flex items-center justify-between">
                  <Caption1 className="text-gray-600 font-medium">
                    Showing {filteredShifts.length} of {shifts.length} shifts
                  </Caption1>
                </div>
              </div>
            </Card>
          ) : (
            <div className="text-center py-20 flex flex-col items-center bg-white/50 rounded-lg shadow-sm border border-white">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <TimeAndWeatherRegular className="w-10 h-10 text-blue-600" />
              </div>
              <Subtitle2 className="mb-3 text-gray-700">No shifts found</Subtitle2>
              <Text className="text-gray-500 max-w-md mx-auto leading-relaxed">
                {searchTerm
                  ? `No shifts match "${searchTerm}". Try a different search.`
                  : "Get started by adding your first shift to manage workday timings."}
              </Text>
              {!searchTerm && (
                <Button
                  appearance="primary"
                  onClick={openAddDialog}
                  className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  icon={<Add12Filled />}
                >
                  Add Your First Shift
                </Button>
              )}
              {searchTerm && (
                <Button
                  appearance="primary"
                  onClick={() => setSearchTerm("")}
                  className="mt-6 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ---- Add / Edit Dialog ---- */}
        <Dialog open={isDialogOpen} onOpenChange={(_, data) => !data.open && closeDialog()}>
          <DialogSurface className="!rounded-2xl !shadow-2xl !max-w-md">
            <DialogBody>
              <DialogTitle
                action={
                  <Button
                    appearance="subtle"
                    aria-label="close"
                    icon={<DismissRegular />}
                    onClick={closeDialog}
                  />
                }
              >
                {formState.id ? "Edit Shift" : "Add New Shift"}
              </DialogTitle>

              <DialogContent className="flex flex-col gap-4 pt-2">
                {/* Shift Name */}
                <Field
                  label="Shift Name"
                  required
                  validationState={formErrors.ShiftName ? "error" : "none"}
                  validationMessage={formErrors.ShiftName}
                >
                  <Input
                    placeholder="e.g. Morning Shift"
                    value={formState.ShiftName}
                    onChange={(_, data) =>
                      setFormState((prev) => ({ ...prev, ShiftName: data.value }))
                    }
                  />
                </Field>

                {/* Start Time */}
                <Field
                  label="Start Time"
                  required
                  validationState={formErrors.StartTime ? "error" : "none"}
                  validationMessage={formErrors.StartTime}
                >
                  <Input
                    type="time"
                    value={formState.StartTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormState((prev) => ({ ...prev, StartTime: e.target.value }))
                    }
                  />
                </Field>

                {/* End Time */}
                <Field
                  label="End Time"
                  required
                  validationState={formErrors.EndTime ? "error" : "none"}
                  validationMessage={formErrors.EndTime}
                >
                  <Input
                    type="time"
                    value={formState.EndTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormState((prev) => ({ ...prev, EndTime: e.target.value }))
                    }
                  />
                </Field>

                {/* Active Toggle */}
                <Switch
                  label="Active"
                  checked={formState.IsActive}
                  onChange={(_, data) =>
                    setFormState((prev) => ({ ...prev, IsActive: data.checked }))
                  }
                />

                {/* Expiry Toggle */}
                <Switch
                  label="Set Expiry"
                  checked={formState.HasExpiry}
                  onChange={(_, data) =>
                    setFormState((prev) => ({ ...prev, HasExpiry: data.checked }))
                  }
                />

                {formState.HasExpiry && (
                  <div className="flex gap-4">
                    <Field
                      label="Expiry Date"
                      required
                      className="flex-1"
                      validationState={formErrors.ExpiryDate ? "error" : "none"}
                      validationMessage={formErrors.ExpiryDate}
                    >
                      <Input
                        type="date"
                        value={formState.ExpiryDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormState((prev) => ({ ...prev, ExpiryDate: e.target.value }))
                        }
                      />
                    </Field>
                    <Field
                      label="Expiry Time"
                      required
                      className="flex-1"
                      validationState={formErrors.ExpiryTime ? "error" : "none"}
                      validationMessage={formErrors.ExpiryTime}
                    >
                      <Input
                        type="time"
                        value={formState.ExpiryTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormState((prev) => ({ ...prev, ExpiryTime: e.target.value }))
                        }
                      />
                    </Field>
                  </div>
                )}
              </DialogContent>

              <DialogActions>
                <Button appearance="secondary" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  icon={isSaving ? <Spinner size="tiny" /> : undefined}
                >
                  {isSaving ? "Saving..." : formState.id ? "Update Shift" : "Create Shift"}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>
    </FluentProvider>
  );
}

export default ShiftTemplate;
