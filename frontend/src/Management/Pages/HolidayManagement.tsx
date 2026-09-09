import React, { useState, useEffect, useRef, useId } from "react";
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
  Select,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  tokens,
  Checkbox,
  Tag,
  TagGroup,
} from "@fluentui/react-components";
import {
  Delete20Regular,
  Add12Filled,
  CheckmarkCircle20Regular,
  ErrorCircle20Regular,
  EditRegular,
  DismissRegular,
  ArrowUpload24Regular,
  ArrowDownload24Regular,
  CalendarLtr24Regular,
  Warning24Filled,
  Dismiss12Regular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import {
  getHolidaysByYear,
  getHolidayYears,
  upsertHoliday,
  bulkUploadHolidays,
  deleteHoliday,
  Holiday,
  UpsertHolidayData,
} from "../../Services/HolidayService";
import * as XLSX from "xlsx";
import { AppLocation, getAppLocations } from "../../Services/Location";

// =============================================
// Constants
// =============================================

const HOLIDAY_TYPES = ["Government", "Festival", "Company", "Others","Optional"] as const;
type HolidayType = (typeof HOLIDAY_TYPES)[number];

const TYPE_COLORS: Record<HolidayType, "brand" | "danger" | "success" | "warning" | "informative" | "important" | "severe" | "subtle"> = {
  Government: "brand",
  Festival: "important",
  Company: "success",
  Others: "subtle",
  Optional:"subtle"
};

// =============================================
// Types
// =============================================

interface HolidayFormState {
  id: number | null;
  HolidayName: string;
  HolidayDate: string; // YYYY-MM-DD
  HolidayType: HolidayType;
  isLocationSpecific: boolean;
  locations:{id:string,Name:string,locationId:string}[]
}

const emptyForm = (): HolidayFormState => ({
  id: null,
  HolidayName: "",
  HolidayDate: "",
  HolidayType: "Government",
  isLocationSpecific:false,
  locations:[]
});

interface FormErrors {
  HolidayName?: string;
  HolidayDate?: string;
  HolidayType?: string;
}

// =============================================
// Component
// =============================================

function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [isStrategyDialogOpen, setIsStrategyDialogOpen] = useState(false);
  const [isReplaceConfirmDialogOpen, setIsReplaceConfirmDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [formState, setFormState] = useState<HolidayFormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [OfficeLocations,setOfficeLocations] = useState<AppLocation[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);
  const { currentUser, accessToken } = useAuth() as any;

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    fetchHolidays(selectedYear);
  }, [selectedYear]);


  useEffect(()=>{
    const loadData = async() =>{
      try{
        const data =await getAppLocations(accessToken)
        setOfficeLocations(data)
      }
      catch(error){
        // console.log("error",error)
      }
    }

    loadData()
  },[])

  // =============================================
  // Data Fetching
  // =============================================

  const fetchYears = async () => {
    try {
      const res = await getHolidayYears();
      if (res.success && res.data) {
        setAvailableYears(res.data);
        // Default to current year or last uploaded year
        if (res.data.length > 0 && !res.data.includes(selectedYear)) {
          setSelectedYear(res.data[0]);
        }
      }
    } catch (e) {
      console.error("Error fetching holiday years:", e);
    }
  };

  const fetchHolidays = async (year: number) => {
    setIsLoading(true);
    try {
      const res = await getHolidaysByYear(year);
      if (res.success && res.data) {
        setHolidays(res.data);
      } else {
        setHolidays([]);
      }
    } catch (e) {
      showToast("error", "Error", "Could not fetch holidays.");
      setHolidays([]);
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // Toast
  // =============================================

  const showToast = (intent: "success" | "error", title: string, body?: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle
          media={
            intent === "success" ? <CheckmarkCircle20Regular /> : <ErrorCircle20Regular />
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

  const validate = (form: HolidayFormState): FormErrors => {
    const errs: FormErrors = {};
    if (!form.HolidayName.trim()) errs.HolidayName = "Holiday name is required";
    if (!form.HolidayDate) errs.HolidayDate = "Date is required";
    if (!form.HolidayType) errs.HolidayType = "Type is required";
    // Duplicate check (same date + name, exclude current)
    const isDuplicate = holidays.some(
      (h) =>
        h.ID !== form.id &&
        h.HolidayName.trim().toLowerCase() === form.HolidayName.trim().toLowerCase() &&
        h.HolidayDate.substring(0, 10) === form.HolidayDate
    );
    if (isDuplicate) errs.HolidayName = "A holiday with this name on this date already exists";
    return errs;
  };

  // =============================================
  // Dialog helpers
  // =============================================

  const openAddDialog = () => {
    setFormState(emptyForm());
    setFormErrors({});
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (holiday: Holiday) => {
    // console.log("Opening edit dialog for holiday:", holiday);
    setFormState({
      id: holiday.ID,
      HolidayName: holiday.HolidayName,
      HolidayDate: holiday.HolidayDate.substring(0, 10), // YYYY-MM-DD
      HolidayType: holiday.HolidayType as HolidayType,
      isLocationSpecific: holiday.IsLocationSpecific,
      locations: (holiday.Locations ?? [])
    });
    setFormErrors({});
    setIsFormDialogOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormDialogOpen(false);
    setFormState(emptyForm());
    setFormErrors({});
  };

  // =============================================
  // Save (single holiday)
  // =============================================

  const handleSave = async () => {
    const errs = validate(formState);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setIsSaving(true);
    try {
      const payload: UpsertHolidayData = {
        id: formState.id,
        HolidayName: formState.HolidayName.trim(),
        HolidayDate: formState.HolidayDate,
        HolidayType: formState.HolidayType,
        IsLocationSpecific: formState.isLocationSpecific,
        Locations:formState.locations?.map(loc=>loc.locationId) || []
      };
      const res = await upsertHoliday(payload, currentUser?.userID || "UNKNOWN");
      if (res.success) {
        showToast("success", formState.id ? "Holiday Updated" : "Holiday Created", res.message);
        closeFormDialog();
        await fetchHolidays(selectedYear);
        await fetchYears();
      } else {
        showToast("error", "Failed to save holiday", res.message);
      }
    } catch (e) {
      showToast("error", "Error", "Could not save holiday.");
    } finally {
      setIsSaving(false);
    }
  };

  // =============================================
  // Delete (single holiday)
  // =============================================

  const openDeleteDialog = (holiday: Holiday) => {
    setDeleteTarget(holiday);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.ID);
    setIsDeleteDialogOpen(false);
    try {
      const res = await deleteHoliday(deleteTarget.ID, currentUser?.userID || "UNKNOWN");
      if (res.success) {
        showToast("success", "Holiday Deleted", res.message);
        await fetchHolidays(selectedYear);
        await fetchYears();
      } else {
        showToast("error", "Failed to delete holiday", res.message);
      }
    } catch (e) {
      showToast("error", "Error", "Could not delete holiday.");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  // =============================================
  // Excel Upload
  // =============================================

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If holidays exist for the selected year, show strategy choice
    if (holidays.length > 0) {
      setPendingFile(file);
      setIsStrategyDialogOpen(true);
    } else {
      performUpload(file, "overwrite");
    }

    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMergeUpload = () => {
    if (pendingFile) {
      performUpload(pendingFile, "merge");
    }
    setIsStrategyDialogOpen(false);
    setPendingFile(null);
  };

  const handleShowReplaceConfirm = () => {
    setIsStrategyDialogOpen(false);
    setIsReplaceConfirmDialogOpen(true);
  };

  const handleConfirmReplace = () => {
    if (pendingFile) {
      performUpload(pendingFile, "overwrite");
    }
    setIsReplaceConfirmDialogOpen(false);
    setPendingFile(null);
  };

  const performUpload = async (file: File, mode: "overwrite" | "merge") => {
    setIsUploading(true);
    setUploadErrors([]);
    try {
      const res = await bulkUploadHolidays(file, selectedYear, currentUser?.userID || "UNKNOWN", mode);
      if (res.success) {
        showToast("success", "Upload Successful", res.message);
        await fetchHolidays(selectedYear);
        await fetchYears();
      } else {
        showToast("error", "Upload Failed", res.message);
        if (res.errors && res.errors.length > 0) {
          setUploadErrors(res.errors);
        }
      }
    } catch (e) {
      showToast("error", "Error", "Could not upload holidays.");
    } finally {
      setIsUploading(false);
    }
  };

  // =============================================
  // Download Template
  // =============================================

  const handleDownloadTemplate = () => {
    const templateData = [
      { "Holiday Name": "Republic Day", Date: "26-01-2025", Type: "Government" },
      { "Holiday Name": "Holi", Date: "14-03-2025", Type: "Festival" },
      { "Holiday Name": "Company Foundation Day", Date: "01-06-2025", Type: "Company" },
      { "Holiday Name": "Bridge Holiday", Date: "02-06-2025", Type: "Others" },
      {"Holiday Name":"Bakrid", Date:"27-05-2025", Type:"Optional"}
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Holidays");

    // Set column widths
    ws["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];

    XLSX.writeFile(wb, `Holiday_Template_${selectedYear}.xlsx`);
    showToast("success", "Template Downloaded", "Fill in the template and upload it.");
  };

  // =============================================
  // Helpers
  // =============================================

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { weekday: "short" });
  };

  // Build year options: available years + current year (if not already in list)
  const yearOptions = Array.from(
    new Set([...availableYears, new Date().getFullYear()])
  ).sort((a, b) => b - a);

  const filteredHolidays = holidays.filter(
    (h) =>
      h.HolidayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.HolidayType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =============================================
  // Render
  // =============================================

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading Holidays...</Body1Strong>
      </div>
    );
  }

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <div className="min-h-screen">
        <Toaster toasterId={toastId} />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        {/* ---- Header ---- */}
        <div className="flex justify-between items-center pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Subtitle2 className="text-[#063762]">Holiday Management</Subtitle2>
            </div>
            <Caption1 className="text-gray-600">
              Manage company holidays and festival calendars
            </Caption1>
          </div>
        </div>

        {/* ---- Controls ---- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Year Selector */}
            <Select
              value={String(selectedYear)}
              onChange={(_, data) => setSelectedYear(parseInt(data.value))}
              className="!min-w-[120px]"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <SearchBox
                className={`w-full transition-all duration-200 ${
                  isTransitioning ? "opacity-70 scale-[0.99]" : "opacity-100 scale-100"
                } !border-1 !border-[#E5E7EB] after:!border-0 !rounded-3xl`}
                placeholder="Search holidays..."
                value={searchTerm}
                onChange={(_, data) => {
                  setSearchTerm(data.value);
                  setIsTransitioning(true);
                  setTimeout(() => setIsTransitioning(false), 150);
                }}
              />
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <Button
              appearance="subtle"
              onClick={handleDownloadTemplate}
              icon={<ArrowDownload24Regular />}
              className="!text-[#626262]"
            >
              Download Template
            </Button>
            <Button
              appearance="subtle"
              onClick={() => fileInputRef.current?.click()}
              icon={isUploading ? <Spinner size="tiny" /> : <ArrowUpload24Regular />}
              disabled={isUploading}
              className="!text-[#626262]"
            >
              {isUploading ? "Uploading..." : "Upload Excel"}
            </Button>
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
              Add Holiday
            </Button>
          </div>
        </div>

        {/* ---- Upload Errors ---- */}
        {uploadErrors.length > 0 && (
          <Card className="mb-4 !bg-red-50 !border !border-red-200 !rounded-xl !p-4">
            <div className="flex items-start gap-2">
              <Warning24Filled className="text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <Text weight="semibold" className="text-red-800 block mb-1">
                  Upload Validation Errors:
                </Text>
                <ul className="list-disc list-inside text-red-700 text-sm">
                  {uploadErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
            <Button
              appearance="subtle"
              size="small"
              className="mt-2"
              onClick={() => setUploadErrors([])}
            >
              Dismiss
            </Button>
          </Card>
        )}

        {/* ---- Table ---- */}
        <div className="mt-4">
          {filteredHolidays.length > 0 ? (
            <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0">
              <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <Table sortable className="w-full">
                  <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                    <TableRow className="border-b-2 border-gray-100">
                      <TableHeaderCell className="!py-3 !px-6 w-16">
                        <Body1Strong className="text-gray-900">#</Body1Strong>
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-3 !px-6">
                        <Body1Strong className="text-gray-900">Holiday Name</Body1Strong>
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-3 !px-6">
                        <Body1Strong className="text-gray-900">Date</Body1Strong>
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-3 !px-6 w-24">
                        <Body1Strong className="text-gray-900">Day</Body1Strong>
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-3 !px-6">
                        <Body1Strong className="text-gray-900">Type</Body1Strong>
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-3 !px-6 w-28">
                        <Body1Strong className="text-gray-900">Actions</Body1Strong>
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHolidays.map((holiday, index) => (
                      <TableRow
                        key={holiday.ID}
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
                            <CalendarLtr24Regular className="w-4 h-4 text-blue-500" />
                            <Text className="text-gray-800 font-medium">
                              {holiday.HolidayName}
                            </Text>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Text className="text-gray-700">{formatDate(holiday.HolidayDate)}</Text>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Text className="text-gray-500">{getDayName(holiday.HolidayDate)}</Text>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            appearance="filled"
                            color={TYPE_COLORS[holiday.HolidayType as HolidayType] || "subtle"}
                            size="medium"
                          >
                            {holiday.HolidayType}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Button
                              icon={<EditRegular />}
                              onClick={() => openEditDialog(holiday)}
                              appearance="subtle"
                              className="w-8 h-8 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 rounded-lg"
                              title="Edit holiday"
                            />
                            <Button
                              onClick={() => openDeleteDialog(holiday)}
                              icon={
                                deletingId === holiday.ID ? (
                                  <Spinner size="tiny" />
                                ) : (
                                  <Delete20Regular />
                                )
                              }
                              disabled={deletingId === holiday.ID}
                              appearance="subtle"
                              className="w-8 h-8 hover:bg-red-100 hover:text-red-700 transition-all duration-200 rounded-lg"
                              title="Delete holiday"
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
                    Showing {filteredHolidays.length} of {holidays.length} holidays for {selectedYear}
                  </Caption1>
                </div>
              </div>
            </Card>
          ) : (
            <div className="text-center py-20 flex flex-col items-center bg-white/50 rounded-lg shadow-sm border border-white">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <CalendarLtr24Regular className="w-10 h-10 text-blue-600" />
              </div>
              <Subtitle2 className="mb-3 text-gray-700">
                No holidays for {selectedYear}
              </Subtitle2>
              <Text className="text-gray-500 max-w-md mx-auto leading-relaxed">
                {searchTerm
                  ? `No holidays match "${searchTerm}". Try a different search.`
                  : "Get started by uploading an Excel file or adding holidays manually."}
              </Text>
              {!searchTerm && (
                <div className="flex gap-3 mt-6">
                  <Button
                    appearance="subtle"
                    onClick={handleDownloadTemplate}
                    icon={<ArrowDownload24Regular />}
                  >
                    Download Template
                  </Button>
                  <Button
                    appearance="primary"
                    onClick={() => fileInputRef.current?.click()}
                    icon={<ArrowUpload24Regular />}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md"
                  >
                    Upload Excel
                  </Button>
                  <Button appearance="outline" onClick={openAddDialog} icon={<Add12Filled />}>
                    Add Manually
                  </Button>
                </div>
              )}
              {searchTerm && (
                <Button
                  appearance="primary"
                  onClick={() => setSearchTerm("")}
                  className="mt-6 px-6 py-2 rounded-lg shadow-md"
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ---- Add / Edit Dialog ---- */}
        <Dialog
          open={isFormDialogOpen}
          onOpenChange={(_, data) => !data.open && closeFormDialog()}
        >
          <DialogSurface className="!rounded-2xl !shadow-2xl !max-w-md">
            <DialogBody>
              <DialogTitle
                action={
                  <Button
                    appearance="subtle"
                    aria-label="close"
                    icon={<DismissRegular />}
                    onClick={closeFormDialog}
                  />
                }
              >
                {formState.id ? "Edit Holiday" : "Add New Holiday"}
              </DialogTitle>

              <DialogContent className="flex flex-col gap-4 pt-2">
                {/* Holiday Name */}
                <Field
                  label="Holiday Name"
                  required
                  validationState={formErrors.HolidayName ? "error" : "none"}
                  validationMessage={formErrors.HolidayName}
                >
                  <Input
                    placeholder="e.g. Republic Day"
                    value={formState.HolidayName}
                    onChange={(_, data) =>
                      setFormState((prev) => ({ ...prev, HolidayName: data.value }))
                    }
                  />
                </Field>

                {/* Date */}
                <Field
                  label="Date"
                  required
                  validationState={formErrors.HolidayDate ? "error" : "none"}
                  validationMessage={formErrors.HolidayDate}
                >
                  <Input
                    type="date"
                    value={formState.HolidayDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormState((prev) => ({ ...prev, HolidayDate: e.target.value }))
                    }
                  />
                </Field>

                {/* Type */}
                <Field
                  label="Type"
                  required
                  validationState={formErrors.HolidayType ? "error" : "none"}
                  validationMessage={formErrors.HolidayType}
                >
                  <Select
                    value={formState.HolidayType}
                    onChange={(_, data) =>
                      setFormState((prev) => ({
                        ...prev,
                        HolidayType: data.value as HolidayType,
                      }))
                    }
                  >
                    {HOLIDAY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </Field>

                {/* Is Location specific */}
                <Field>
                  <Checkbox
                    label="Only For Specific Location"
                    checked={formState.isLocationSpecific}
                    onChange={(_, data) =>
                      setFormState((prev) => ({
                        ...prev,
                        isLocationSpecific: data.checked as boolean,
                        locations: data.checked ? prev.locations : [],
                      }))
                    }
                  />
                </Field>

                {/* Office Location — shown only when isLocationSpecific is true */}
                {formState.isLocationSpecific && (
                  <Field label="Office Location">
                    <Select
                      value=""
                      onChange={(_, data) => {
                        const selectedLoc = OfficeLocations.find((l) => l.Id === data.value);
                        if (data.value && selectedLoc && !(formState.locations ?? []).some((loc) => loc.locationId === data.value)) {
                          setFormState((prev) => ({
                            ...prev,
                            locations: [...prev.locations, { id: data.value, Name: selectedLoc.Name, locationId: selectedLoc.Id }],
                          }));
                        }
                      }}
                    >
                      <option value="" disabled>Select a location…</option>
                      {OfficeLocations.filter(
                        (loc) => !(formState.locations ?? []).some((l) => l.locationId === loc.Id) && loc.Status === "active"
                      ).map((loc) => (
                        <option key={loc.Id} value={loc.Id}>
                          {loc.Name}
                        </option>
                      ))}
                    </Select>

                    {formState.locations.length > 0 && (
                      <TagGroup
                        className="mt-2 flex flex-wrap gap-1"
                        onDismiss={(_, data) =>
                          setFormState((prev) => ({
                            ...prev,
                            locations: prev.locations.filter((loc) => loc.locationId  !== data.value),
                          }))
                        }
                      >
                        {formState.locations.map((locItem) => (
                            <Tag
                              key={locItem.locationId}
                              value={locItem.locationId}
                              dismissible
                              dismissIcon={<Dismiss12Regular />}
                            >
                              {locItem.Name}
                            </Tag>
                          ))}
                      </TagGroup>
                    )}
                  </Field>
                )}
              </DialogContent>

              <DialogActions>
                <Button appearance="secondary" onClick={closeFormDialog}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  icon={isSaving ? <Spinner size="tiny" /> : undefined}
                >
                  {isSaving
                    ? "Saving..."
                    : formState.id
                    ? "Update Holiday"
                    : "Create Holiday"}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        {/* ---- Delete Confirmation Dialog ---- */}
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(_, data) => {
            if (!data.open) {
              setIsDeleteDialogOpen(false);
              setDeleteTarget(null);
            }
          }}
        >
          <DialogSurface className="!rounded-2xl !shadow-2xl !max-w-sm">
            <DialogBody>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogContent>
                Are you sure you want to delete{" "}
                <strong>{deleteTarget?.HolidayName}</strong>
                {deleteTarget
                  ? ` (${formatDate(deleteTarget.HolidayDate)})`
                  : ""}
                ? This action cannot be undone.
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setDeleteTarget(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleConfirmDelete}
                  style={{ backgroundColor: "#d13438", borderColor: "#d13438" }}
                >
                  Delete
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        {/* ---- Upload Strategy Selection Dialog ---- */}
        <Dialog
          open={isStrategyDialogOpen}
          onOpenChange={(_, data) => {
            if (!data.open) {
              setIsStrategyDialogOpen(false);
              setPendingFile(null);
            }
          }}
        >
          <DialogSurface className="!rounded-3xl !shadow-2xl !max-w-md">
            <DialogBody>
              <DialogTitle>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <ArrowUpload24Regular className="text-blue-600" />
                  </div>
                  <Text size={500} weight="bold">Excel Upload Strategy</Text>
                </div>
              </DialogTitle>
              <DialogContent className="pt-2">
                <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
                  Records already exist for <strong>{selectedYear}</strong>. Please choose how you want to handle the new data:
                </Text>
                
                <div className="flex flex-col gap-3 mt-6">
                  {/* Merge Option Card */}
                  <div 
                    onClick={handleMergeUpload}
                    className="p-4 border-2 border-transparent bg-blue-50/50 hover:bg-blue-50 hover:border-blue-200 rounded-2xl cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <CheckmarkCircle20Regular />
                      </div>
                      <div>
                        <Text weight="bold" size={300} block className="text-blue-900">Merge with Existing</Text>
                        <Text size={100} className="text-blue-700/80">Adds new data and combines names on date collisions.</Text>
                      </div>
                    </div>
                  </div>

                  {/* Replace Option Card */}
                  <div 
                    onClick={handleShowReplaceConfirm}
                    className="p-4 border-2 border-transparent bg-gray-50 hover:bg-red-50 hover:border-red-100 rounded-2xl cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 group-hover:bg-red-100 text-gray-600 group-hover:text-red-600 flex items-center justify-center flex-shrink-0 transition-colors">
                        <Warning24Filled />
                      </div>
                      <div>
                        <Text weight="bold" size={300} block className="group-hover:text-red-900">Replace All Data</Text>
                        <Text size={100} className="text-gray-500 group-hover:text-red-700/80">Clears current year records and starts fresh.</Text>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
              <DialogActions className="mt-4">
                <Button
                  appearance="subtle"
                  onClick={() => {
                    setIsStrategyDialogOpen(false);
                    setPendingFile(null);
                  }}
                  className="w-full !rounded-xl"
                >
                  Cancel Upload
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        {/* ---- Destructive Replace Confirmation Dialog ---- */}
        <Dialog
          open={isReplaceConfirmDialogOpen}
          onOpenChange={(_, data) => {
            if (!data.open) {
              setIsReplaceConfirmDialogOpen(false);
              setPendingFile(null);
            }
          }}
        >
          <DialogSurface className="!rounded-2xl !shadow-2xl !max-w-sm">
            <DialogBody>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <Warning24Filled className="text-amber-500" />
                  Confirm Replacement
                </div>
              </DialogTitle>
              <DialogContent>
                This will <strong>replace all {holidays.length} existing holidays</strong> for{" "}
                <strong>{selectedYear}</strong> with the data from the uploaded file. This action
                cannot be undone.
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => setIsReplaceConfirmDialogOpen(false)}
                >
                  Go Back
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleConfirmReplace}
                  style={{ backgroundColor: "#d13438", borderColor: "#d13438" }}
                >
                  Yes, Replace All
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>
    </FluentProvider>
  );
}

export default HolidayManagement;
