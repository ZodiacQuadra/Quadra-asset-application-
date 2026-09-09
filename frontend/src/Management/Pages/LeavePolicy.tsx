import React, { useState, useEffect, useId, useMemo } from "react";
import {
    Accordion,
    AccordionHeader,
    AccordionItem,
    AccordionPanel,
    Badge,
    Body1Strong,
    Button,
    Caption1,
    Card,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    Dropdown,
    Field,
    FluentProvider,
    Input,
    Option,
    SearchBox,
    Spinner,
    Subtitle2,
    Tab,
    TabList,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
    Text,
    Toast,
    ToastBody,
    ToastTitle,
    Toaster,
    useToastController,
} from "@fluentui/react-components";
import {
    Add12Filled,
    CheckmarkCircle20Regular,
    Delete20Regular,
    DismissRegular,
    EditRegular,
    ErrorCircle20Regular,
    PeopleRegular,
    TimeAndWeatherRegular,
    Warning20Regular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import {
    getAllShifts,
    upsertShift,
    deleteShift,
    Shift,
    UpsertShiftData,
} from "../../Services/ShiftService";
import {
    CreatePolicy,
    DeletePolicies,
    GetPolicies,
    UpdatePolicies,
    UpdateShiftData,
} from "../../Services/LeavePolicyService";
import { LeavePolicy } from "../../Types/LeavePolicyTypes";
import {
    CreateEmployeeLeavePolicy,
    DeleteEmployeeLeavePolicy,
    EmpLeavePolicyItem,
    GetEmployeeLeavePolicies,
    UpdateEmployeeLeavePolicy,
} from "../../Services/EmployeeLeavePolicyService";

// =============================================
// Helpers
// =============================================

const toTimeInput = (timeStr?: any): string => {
    if (!timeStr) return "";
    if (typeof timeStr === "string" && !timeStr.includes("T")) return timeStr.slice(0, 5);
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return "";
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const formatTime = (timeStr?: any): string => {
    if (!timeStr) return "—";
    let h: number, m: number;
    if (typeof timeStr === "string" && !timeStr.includes("T")) {
        const parts = timeStr.split(":").map(Number);
        h = parts[0]; m = parts[1];
    } else {
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return "—";
        h = date.getUTCHours(); m = date.getUTCMinutes();
    }
    if (isNaN(h) || isNaN(m)) return "—";
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** Auto-generate a Role ID from a role name: uppercase, strip non-alphanumeric, max 20 chars. */
const generateRoleId = (name: string): string =>
    name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);

// =============================================
// Types — Leave Policy tab
// =============================================

interface PolicyFormState { id: string | null; name: string; days: number; }
const emptyPolicyForm = (): PolicyFormState => ({ id: null, name: "", days: 0 });
interface PolicyFormErrors { name?: string; days?: string; }

// =============================================
// Types — Employee Leave Policy tab
// =============================================

interface RoleGroup {
    empRoleID: string;
    employeeRole: string;
    items: EmpLeavePolicyItem[];
}

type EmpFormMode = "new-role" | "add-leave" | "edit";

interface EmpPolicyFormState {
    id: string | null;
    empRoleID: string;
    employeeRole: string;
    leaveTypeID: string;
}

interface EmpFormErrors {
    empRoleID?: string;
    employeeRole?: string;
    leaveTypeID?: string;
}

const emptyEmpForm = (): EmpPolicyFormState => ({
    id: null, empRoleID: "", employeeRole: "", leaveTypeID: "",
});

// =============================================
// Component
// =============================================

const LeavePlolicy = () => {
    // ── Tab ──────────────────────────────────────
    const [activeTab, setActiveTab] = useState<"emp-leave-policy" | "leave-policy">("emp-leave-policy");

    // ── Leave Policy state ────────────────────────
    const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([]);
    const [lpSearch, setLpSearch] = useState("");
    const [lpLoading, setLpLoading] = useState(false);
    const [lpSaving, setLpSaving] = useState(false);
    const [lpDeletingId, setLpDeletingId] = useState<string | null>(null);
    const [lpDialogOpen, setLpDialogOpen] = useState(false);
    const [lpDeleteConfirmId, setLpDeleteConfirmId] = useState<string | null>(null);
    const [lpForm, setLpForm] = useState<PolicyFormState>(emptyPolicyForm());
    const [lpFormErrors, setLpFormErrors] = useState<PolicyFormErrors>({});
    const [isTransitioning, setIsTransitioning] = useState(false);

    // ── Employee Leave Policy state ───────────────
    const [empLeavePolicies, setEmpLeavePolicies] = useState<EmpLeavePolicyItem[]>([]);
    const [empLoading, setEmpLoading] = useState(false);
    const [empSaving, setEmpSaving] = useState(false);
    const [empDeletingId, setEmpDeletingId] = useState<any | null>(null);
    const [empDeleteConfirmId, setEmpDeleteConfirmId] = useState<string | null>(null);
    const [empDialogOpen, setEmpDialogOpen] = useState(false);
    const [empFormMode, setEmpFormMode] = useState<EmpFormMode>("new-role");
    const [empForm, setEmpForm] = useState<EmpPolicyFormState>(emptyEmpForm());
    const [empFormErrors, setEmpFormErrors] = useState<EmpFormErrors>({});
    const [roleIdAutoMode, setRoleIdAutoMode] = useState(true);
    const [empSearch, setEmpSearch] = useState("");

    const { accessToken } = useAuth();
    const toastId = useId();
    const { dispatchToast } = useToastController(toastId);
    const { currentUser } = useAuth() as any;

    useEffect(() => {
        if (!accessToken) return;
        fetchLeavePolicies();
        fetchEmpLeavePolicies();
    }, [accessToken]);

    // ── Grouped roles (memoised) ──────────────────
    const roleGroups = useMemo<RoleGroup[]>(() => {
        const map = new Map<string, RoleGroup>();
        for (const item of empLeavePolicies) {
            if (!map.has(item.empRoleID)) {
                map.set(item.empRoleID, {
                    empRoleID: item.empRoleID,
                    employeeRole: item.employeeRole,
                    items: [],
                });
            }
            map.get(item.empRoleID)!.items.push(item);
        }
        return Array.from(map.values()).sort((a, b) =>
            a.employeeRole.localeCompare(b.employeeRole)
        );
    }, [empLeavePolicies]);

    const filteredRoleGroups = useMemo<RoleGroup[]>(() => {
        const term = empSearch.trim().toLowerCase();
        if (!term) return roleGroups;
        return roleGroups.filter(
            g =>
                g.employeeRole.toLowerCase().includes(term) ||
                g.empRoleID.toLowerCase().includes(term)
        );
    }, [roleGroups, empSearch]);

    const filteredLeavePolicies = leavePolicies.filter(p =>
        p.name?.toLowerCase().includes(lpSearch.toLowerCase())
    );

    // ── Toast ─────────────────────────────────────
    const showToast = (intent: "success" | "error", title: string, body?: string) => {
        dispatchToast(
            <Toast>
                <ToastTitle
                    media={intent === "success" ? <CheckmarkCircle20Regular /> : <ErrorCircle20Regular />}
                >
                    {title}
                </ToastTitle>
                {body && <ToastBody>{body}</ToastBody>}
            </Toast>,
            { intent, toastId, timeout: 5000 }
        );
    };

    // ── Fetch ─────────────────────────────────────
    const fetchLeavePolicies = async () => {
        setLpLoading(true);
        try {
            if (accessToken) {
                const res = await GetPolicies(accessToken);
                if (res.status && res.data) setLeavePolicies(res.data?.data);
            }
        } catch {
            showToast("error", "Error", "Could not fetch leave policies.");
        } finally {
            setLpLoading(false);
        }
    };

    const fetchEmpLeavePolicies = async () => {
        setEmpLoading(true);
        try {
            if (accessToken) {
                const res = await GetEmployeeLeavePolicies(accessToken);
                if (res.success && res.data) setEmpLeavePolicies(res.data);
            }
        } catch {
            showToast("error", "Error", "Could not fetch employee leave policies.");
        } finally {
            setEmpLoading(false);
        }
    };

    // ── Leave Policy CRUD ─────────────────────────
    const validateLpForm = (): PolicyFormErrors => {
        const errs: PolicyFormErrors = {};
        if (!lpForm.name.trim()) errs.name = "Name is required";
        if (!lpForm.days) errs.days = "Number of days is required";
        return errs;
    };

    const openLpAdd = () => { setLpForm(emptyPolicyForm()); setLpFormErrors({}); setLpDialogOpen(true); };
    const openLpEdit = (p: LeavePolicy) => {
        if (!p.id) return;
        setLpForm({ id: p.id, name: p.name, days: p.days });
        setLpFormErrors({});
        setLpDialogOpen(true);
    };
    const closeLpDialog = () => { setLpDialogOpen(false); setLpForm(emptyPolicyForm()); setLpFormErrors({}); };

    const handleLpSave = async () => {
        const errs = validateLpForm();
        if (Object.keys(errs).length) { setLpFormErrors(errs); return; }
        setLpSaving(true);
        try {
            if (lpForm.id) {
                const res = await UpdatePolicies(
                    { id: lpForm.id, name: lpForm.name, days: lpForm.days },
                    currentUser?.userID || "",
                    accessToken!
                );
                if (res.success) { showToast("success", "Policy Updated", res.message); closeLpDialog(); await fetchLeavePolicies(); }
                else showToast("error", "Failed", res.message);
            } else {
                const res = await CreatePolicy({ name: lpForm.name, days: lpForm.days }, currentUser?.userID, accessToken!);
                if (res.success) { showToast("success", "Policy Created", res.message); closeLpDialog(); await fetchLeavePolicies(); }
                else showToast("error", "Failed", res.message);
            }
        } catch (e: any) {
            showToast("error", "Error", e?.error?.error || "Could not save policy.");
        } finally {
            setLpSaving(false);
        }
    };

    const handleLpDelete = async (id: string) => {
        if (!accessToken) return;
        setLpDeletingId(id);
        try {
            const res = await DeletePolicies(id, currentUser?.userID, accessToken);
            if (res.success) { showToast("success", "Policy Deleted", res.message); await fetchLeavePolicies(); }
            else showToast("error", "Failed", res.message);
        } catch {
            showToast("error", "Error", "Could not delete policy.");
        } finally {
            setLpDeletingId(null);
        }
    };

    // ── Employee Leave Policy helpers ─────────────
    const isRoleIdTaken = (roleId: string): boolean =>
        roleGroups.some(g => g.empRoleID.toUpperCase() === roleId.toUpperCase());

    /** Returns leave policies not yet assigned to a role (excludes currentLeaveTypeID if editing). */
    const getAvailableLeaveTypes = (empRoleID: string, currentLeaveTypeID?: string): LeavePolicy[] => {
        const group = roleGroups.find(g => g.empRoleID === empRoleID);
        const assigned = group ? group.items.map(i => i.leaveTypeID.toLowerCase()) : [];
        return leavePolicies.filter(
            lp => lp.id && (!assigned.includes(lp.id.toLowerCase()) || lp.id.toLowerCase() === currentLeaveTypeID?.toLowerCase())
        );
    };

    const openEmpAddRole = () => {
        setEmpFormMode("new-role");
        setEmpForm(emptyEmpForm());
        setEmpFormErrors({});
        setRoleIdAutoMode(true);
        setEmpDialogOpen(true);
    };

    const openEmpAddLeave = (group: RoleGroup) => {
        setEmpFormMode("add-leave");
        setEmpForm({ id: null, empRoleID: group.empRoleID, employeeRole: group.employeeRole, leaveTypeID: "" });
        setEmpFormErrors({});
        setEmpDialogOpen(true);
    };

    const openEmpEdit = (item: EmpLeavePolicyItem) => {
        setEmpFormMode("edit");
        setEmpForm({ id: item.id, empRoleID: item.empRoleID, employeeRole: item.employeeRole, leaveTypeID: item.leaveTypeID });
        setEmpFormErrors({});
        setEmpDialogOpen(true);
    };

    const closeEmpDialog = () => {
        setEmpDialogOpen(false);
        setEmpForm(emptyEmpForm());
        setEmpFormErrors({});
        setRoleIdAutoMode(true);
    };

    const validateEmpForm = (): EmpFormErrors => {
        const errs: EmpFormErrors = {};
        if (empFormMode === "new-role") {
            if (!empForm.employeeRole.trim()) errs.employeeRole = "Role name is required";
            if (!empForm.empRoleID.trim()) {
                errs.empRoleID = "Role ID is required";
            } else if (isRoleIdTaken(empForm.empRoleID.trim())) {
                errs.empRoleID = "Role ID already exists. Use a different ID or add a leave type to the existing role.";
            }
        }
        if (!empForm.leaveTypeID) errs.leaveTypeID = "Please select a leave type";
        return errs;
    };

    const handleEmpSave = async () => {
        const errs = validateEmpForm();
        if (Object.keys(errs).length) { setEmpFormErrors(errs); return; }
        setEmpSaving(true);
        try {
            if (empFormMode === "edit" && empForm.id !== null) {
                const res = await UpdateEmployeeLeavePolicy(
                    { id: empForm.id, leaveTypeID: empForm.leaveTypeID, modifiedBy: currentUser?.userID || "" },
                    accessToken!
                );
                if (res.success) { showToast("success", "Updated", "Leave type assignment updated."); closeEmpDialog(); await fetchEmpLeavePolicies(); }
                else showToast("error", "Failed", res.message);
            } else {
                const res = await CreateEmployeeLeavePolicy(
                    { empRoleID: empForm.empRoleID.trim(), employeeRole: empForm.employeeRole.trim(), leaveTypeID: empForm.leaveTypeID, createdBy: currentUser?.userID || "" },
                    accessToken!
                );
                if (res.success) { showToast("success", "Created", "Leave type assigned to role."); closeEmpDialog(); await fetchEmpLeavePolicies(); }
                else showToast("error", "Failed", res.message);
            }
        } catch {
            showToast("error", "Error", "Could not save employee leave policy.");
        } finally {
            setEmpSaving(false);
        }
    };

    const handleEmpDelete = async (id: any) => {
        if (!accessToken) return;
        setEmpDeletingId(id);
        try {
            const res = await DeleteEmployeeLeavePolicy(id, currentUser?.userID || "", accessToken);
            if (res.success) { showToast("success", "Removed", "Leave type assignment removed."); await fetchEmpLeavePolicies(); }
            else showToast("error", "Failed", res.message);
        } catch {
            showToast("error", "Error", "Could not remove leave type.");
        } finally {
            setEmpDeletingId(null);
        }
    };

    // ── Render ────────────────────────────────────
    return (
        <FluentProvider style={{ background: "transparent" }}>
            <div className="min-h-screen">
                <Toaster toasterId={toastId} />

                {/* Header */}
                <div className="flex justify-between items-center pb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Subtitle2 className="text-[#063762]">Leave Policy</Subtitle2>
                        </div>
                        <Caption1 className="text-gray-600">Define and manage leave policies</Caption1>
                    </div>
                </div>

                {/* Tabs */}
                <TabList
                    selectedValue={activeTab}
                    onTabSelect={(_, d) => setActiveTab(d.value as typeof activeTab)}
                    className="mb-5 border-b border-gray-200"
                >
                    <Tab value="emp-leave-policy" icon={<PeopleRegular />}>
                        Employee Leave Policy
                    </Tab>
                    <Tab value="leave-policy" icon={<TimeAndWeatherRegular />}>
                        Leave Policy
                    </Tab>
                </TabList>

                {/* ══════════════════════════════════════════
                    TAB 1 — Employee Leave Policy
                ══════════════════════════════════════════ */}
                {activeTab === "emp-leave-policy" && (
                    <div>
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
                            <div className="flex items-center gap-4 w-full md:w-1/4">
                                <SearchBox
                                    className="w-full !border-1 !border-[#E5E7EB] after:!border-0 !rounded-3xl"
                                    placeholder="Search roles..."
                                    value={empSearch}
                                    onChange={(_, d) => setEmpSearch(d.value)}
                                />
                            </div>
                            <Button
                                appearance="primary"
                                onClick={openEmpAddRole}
                                shape="circular"
                                icon={
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] flex items-center justify-center text-white">
                                        <Add12Filled />
                                    </div>
                                }
                                className="shadow !bg-white/50 !text-[#626262] border-1 !border-white"
                            >
                                Add New Role
                            </Button>
                        </div>

                        {/* Content */}
                        {empLoading ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <Spinner />
                                <Body1Strong className="mt-2">Loading Employee Leave Policies...</Body1Strong>
                            </div>
                        ) : filteredRoleGroups.length === 0 ? (
                            <div className="text-center py-20 flex flex-col items-center bg-white/50 rounded-lg shadow-sm border border-white">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                                    <PeopleRegular className="w-10 h-10 text-blue-600" />
                                </div>
                                <Subtitle2 className="mb-3 text-gray-700">No Employee Leave Policies Found</Subtitle2>
                                <Text className="text-gray-500 max-w-md mx-auto leading-relaxed">
                                    {empSearch
                                        ? `No roles match "${empSearch}". Try a different search.`
                                        : "Get started by adding your first employee role."}
                                </Text>
                                {!empSearch && (
                                    <Button
                                        appearance="primary"
                                        onClick={openEmpAddRole}
                                        className="mt-6 px-6"
                                        icon={<Add12Filled />}
                                    >
                                        Add New Role
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Accordion multiple collapsible className="flex flex-col gap-3">
                                {filteredRoleGroups.map(group => (
                                    <AccordionItem
                                        key={group.empRoleID}
                                        value={group.empRoleID}
                                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                                    >
                                        <AccordionHeader
                                            expandIconPosition="end"
                                            className="!px-5 !py-1 hover:bg-blue-50/50 transition-colors duration-150"
                                        >
                                            <div className="flex items-center gap-3 py-2">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                                                    {group.employeeRole.charAt(0)}
                                                </div>
                                                <div>
                                                    <Body1Strong className="text-gray-800 block">
                                                        {group.employeeRole}
                                                    </Body1Strong>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge appearance="tint" color="informative" size="small">
                                                            {group.empRoleID}
                                                        </Badge>
                                                        <Caption1 className="text-gray-400">
                                                            {group.items.length} leave type{group.items.length !== 1 ? "s" : ""}
                                                        </Caption1>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionHeader>

                                        <AccordionPanel className="!p-0 !m-0">
                                            <div className="border-t border-gray-100">
                                                <Table className="w-full">
                                                    <TableHeader className="bg-gray-50">
                                                        <TableRow>
                                                            <TableHeaderCell className="!py-2 !px-6">
                                                                <Caption1 className="font-semibold text-gray-500 uppercase tracking-wide">
                                                                    Leave Type
                                                                </Caption1>
                                                            </TableHeaderCell>
                                                            <TableHeaderCell className="!py-2 !px-6 w-28">
                                                                <Caption1 className="font-semibold text-gray-500 uppercase tracking-wide">
                                                                    Days
                                                                </Caption1>
                                                            </TableHeaderCell>
                                                            <TableHeaderCell className="!py-2 !px-6 w-24">
                                                                <Caption1 className="font-semibold text-gray-500 uppercase tracking-wide">
                                                                    Actions
                                                                </Caption1>
                                                            </TableHeaderCell>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {group.items.map(item => (
                                                            <TableRow
                                                                key={item.id}
                                                                className="hover:bg-blue-50/30 border-b border-gray-50 transition-colors"
                                                            >
                                                                <TableCell className="!px-6 !py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                                                        <Text className="text-gray-800">{item.leaveTypeName}</Text>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="!px-6 !py-3">
                                                                    <Badge appearance="filled" color="brand" size="medium">
                                                                        {item.days} days
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="!px-6 !py-3">
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            icon={<EditRegular />}
                                                                            onClick={() => openEmpEdit(item)}
                                                                            appearance="subtle"
                                                                            className="w-8 h-8 hover:bg-blue-100 hover:text-blue-700 rounded-lg"
                                                                            title="Edit"
                                                                        />
                                                                        <Button
                                                                            onClick={() => setEmpDeleteConfirmId(item.id)}
                                                                            icon={
                                                                                empDeletingId === item.id
                                                                                    ? <Spinner size="tiny" />
                                                                                    : <Delete20Regular />
                                                                            }
                                                                            disabled={empDeletingId === item.id}
                                                                            appearance="subtle"
                                                                            className="w-8 h-8 hover:bg-red-100 hover:text-red-700 rounded-lg"
                                                                            title="Remove"
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>

                                                {/* Add Leave Type footer */}
                                                <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100">
                                                    <Button
                                                        appearance="subtle"
                                                        icon={<Add12Filled />}
                                                        onClick={() => openEmpAddLeave(group)}
                                                        size="small"
                                                        className="text-blue-600 hover:bg-blue-50"
                                                    >
                                                        Add Leave Type
                                                    </Button>
                                                </div>
                                            </div>
                                        </AccordionPanel>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}

                        {/* ── Emp Delete Confirm ── */}
                        <Dialog
                            open={!!empDeleteConfirmId}
                            onOpenChange={(_, d) => !d.open && setEmpDeleteConfirmId(null)}
                        >
                            <DialogSurface className="!rounded-2xl !shadow-2xl !max-w-sm">
                                <DialogBody>
                                    <DialogTitle>
                                        <div className="flex items-center gap-2 text-red-600">
                                            <Warning20Regular /> Remove Leave Type
                                        </div>
                                    </DialogTitle>
                                    <DialogContent className="pt-2">
                                        <Text>Are you sure you want to remove this leave type assignment from the role?</Text>
                                    </DialogContent>
                                    <DialogActions>
                                        <Button appearance="secondary" onClick={() => setEmpDeleteConfirmId(null)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            appearance="primary"
                                            style={{ backgroundColor: "#dc2626" }}
                                            disabled={!!empDeletingId}
                                            icon={empDeletingId ? <Spinner size="tiny" /> : undefined}
                                            onClick={async () => {
                                                if (!empDeleteConfirmId) return;
                                                const id = empDeleteConfirmId;
                                                setEmpDeleteConfirmId(null);
                                                await handleEmpDelete(id);
                                            }}
                                        >
                                            {empDeletingId ? "Removing..." : "Remove"}
                                        </Button>
                                    </DialogActions>
                                </DialogBody>
                            </DialogSurface>
                        </Dialog>

                        {/* ── Emp Add / Edit Dialog ── */}
                        <Dialog open={empDialogOpen} onOpenChange={(_, d) => !d.open && closeEmpDialog()}>
                            <DialogSurface className="!rounded-2xl !shadow-2xl !max-w-md">
                                <DialogBody>
                                    <DialogTitle
                                        action={
                                            <Button
                                                appearance="subtle"
                                                icon={<DismissRegular />}
                                                onClick={closeEmpDialog}
                                            />
                                        }
                                    >
                                        {empFormMode === "new-role"
                                            ? "Add New Role"
                                            : empFormMode === "add-leave"
                                            ? `Add Leave Type — ${empForm.employeeRole}`
                                            : "Edit Leave Assignment"}
                                    </DialogTitle>

                                    <DialogContent className="flex flex-col gap-4 pt-2">
                                        {/* New Role fields */}
                                        {empFormMode === "new-role" && (
                                            <>
                                                <Field
                                                    label="Role Name"
                                                    required
                                                    validationState={empFormErrors.employeeRole ? "error" : "none"}
                                                    validationMessage={empFormErrors.employeeRole}
                                                >
                                                    <Input
                                                        placeholder="e.g. Senior Engineer"
                                                        value={empForm.employeeRole}
                                                        onChange={(_, d) => {
                                                            const name = d.value;
                                                            setEmpForm(prev => ({
                                                                ...prev,
                                                                employeeRole: name,
                                                                empRoleID: roleIdAutoMode ? generateRoleId(name) : prev.empRoleID,
                                                            }));
                                                            if (empFormErrors.employeeRole)
                                                                setEmpFormErrors(prev => ({ ...prev, employeeRole: undefined }));
                                                        }}
                                                    />
                                                </Field>

                                                <Field
                                                    label="Role ID"
                                                    required
                                                    validationState={empFormErrors.empRoleID ? "error" : "none"}
                                                    validationMessage={empFormErrors.empRoleID}
                                                    hint="Auto-generated from role name. Must be unique across all roles."
                                                >
                                                    <Input
                                                        placeholder="e.g. SRENG"
                                                        value={empForm.empRoleID}
                                                        onChange={(_, d) => {
                                                            setRoleIdAutoMode(false);
                                                            setEmpForm(prev => ({ ...prev, empRoleID: d.value.toUpperCase() }));
                                                            if (empFormErrors.empRoleID)
                                                                setEmpFormErrors(prev => ({ ...prev, empRoleID: undefined }));
                                                        }}
                                                    />
                                                </Field>
                                            </>
                                        )}

                                        {/* Existing role info banner (add-leave / edit modes) */}
                                        {(empFormMode === "add-leave" || empFormMode === "edit") && (
                                            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                    {empForm.employeeRole.charAt(0)}
                                                </div>
                                                <div>
                                                    <Body1Strong className="text-gray-800 text-sm block">
                                                        {empForm.employeeRole}
                                                    </Body1Strong>
                                                    <Badge appearance="tint" color="informative" size="small">
                                                        {empForm.empRoleID}
                                                    </Badge>
                                                </div>
                                            </div>
                                        )}

                                        {/* Leave Type dropdown */}
                                        <Field
                                            label="Leave Type"
                                            required
                                            validationState={empFormErrors.leaveTypeID ? "error" : "none"}
                                            validationMessage={empFormErrors.leaveTypeID}
                                        >
                                            <Dropdown
                                                placeholder="Select leave type"
                                                value={
                                                    leavePolicies.find(lp => lp.id === empForm.leaveTypeID)?.name || ""
                                                }
                                                selectedOptions={empForm.leaveTypeID ? [empForm.leaveTypeID] : []}
                                                onOptionSelect={(_, d) => {
                                                    setEmpForm(prev => ({ ...prev, leaveTypeID: d.optionValue || "" }));
                                                    if (empFormErrors.leaveTypeID)
                                                        setEmpFormErrors(prev => ({ ...prev, leaveTypeID: undefined }));
                                                }}
                                            >
                                                {getAvailableLeaveTypes(
                                                    empForm.empRoleID,
                                                    empFormMode === "edit" ? empForm.leaveTypeID : undefined
                                                ).map(lp => (
                                                    <Option
                                                        key={lp.id}
                                                        value={lp.id!}
                                                        text={`${lp.name} (${lp.days} days)`}
                                                    >
                                                        {`${lp.name} (${lp.days} days)`}
                                                    </Option>
                                                ))}
                                            </Dropdown>
                                        </Field>
                                    </DialogContent>

                                    <DialogActions>
                                        <Button appearance="secondary" onClick={closeEmpDialog}>
                                            Cancel
                                        </Button>
                                        <Button
                                            appearance="primary"
                                            onClick={handleEmpSave}
                                            disabled={empSaving}
                                            icon={empSaving ? <Spinner size="tiny" /> : undefined}
                                        >
                                            {empSaving ? "Saving..." : empFormMode === "edit" ? "Update" : "Create"}
                                        </Button>
                                    </DialogActions>
                                </DialogBody>
                            </DialogSurface>
                        </Dialog>
                    </div>
                )}

                {/* ══════════════════════════════════════════
                    TAB 2 — Leave Policy (existing)
                ══════════════════════════════════════════ */}
                {activeTab === "leave-policy" && (
                    <div>
                        {/* Controls */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
                            <div className="flex items-center gap-4 w-full md:w-1/4">
                                <div className="relative w-full">
                                    <SearchBox
                                        className={`w-full transition-all duration-200 ${
                                            isTransitioning ? "opacity-70 scale-[0.99]" : "opacity-100 scale-100"
                                        } !border-1 !border-[#E5E7EB] after:!border-0 !rounded-3xl`}
                                        placeholder="Search..."
                                        value={lpSearch}
                                        onChange={(_, d) => {
                                            setLpSearch(d.value);
                                            setIsTransitioning(true);
                                            setTimeout(() => setIsTransitioning(false), 150);
                                        }}
                                    />
                                </div>
                            </div>
                            <Button
                                appearance="primary"
                                onClick={openLpAdd}
                                shape="circular"
                                icon={
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] flex items-center justify-center text-white">
                                        <Add12Filled />
                                    </div>
                                }
                                className="shadow !bg-white/50 !text-[#626262] border-1 !border-white"
                            >
                                Add Leave
                            </Button>
                        </div>

                        {/* Table */}
                        {lpLoading ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <Spinner />
                                <Body1Strong className="mt-2">Loading Leave Policies...</Body1Strong>
                            </div>
                        ) : filteredLeavePolicies.length > 0 ? (
                            <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0">
                                <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    <Table sortable className="w-full">
                                        <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                                            <TableRow className="border-b-2 border-gray-100">
                                                <TableHeaderCell className="!py-3 !px-6 w-16">
                                                    <Body1Strong className="text-gray-900">#</Body1Strong>
                                                </TableHeaderCell>
                                                <TableHeaderCell className="!py-3 !px-6">
                                                    <Body1Strong className="text-gray-900">Name</Body1Strong>
                                                </TableHeaderCell>
                                                <TableHeaderCell className="!py-3 !px-6">
                                                    <Body1Strong className="text-gray-900">Days</Body1Strong>
                                                </TableHeaderCell>
                                                <TableHeaderCell className="!py-3 !px-6 w-28">
                                                    <Body1Strong className="text-gray-900">Actions</Body1Strong>
                                                </TableHeaderCell>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredLeavePolicies.map((policy, index) => (
                                                <TableRow
                                                    key={policy.id}
                                                    className={`hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 ${
                                                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                                                    }`}
                                                >
                                                    <TableCell className="px-6 py-4">
                                                        <Badge appearance="filled" color="brand" size="medium" className="font-semibold bg-blue-100 text-blue-800">
                                                            {index + 1}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <Text className="text-gray-800 font-medium">{policy.name}</Text>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <Text className="text-gray-700">{policy.days}</Text>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                icon={<EditRegular />}
                                                                onClick={() => openLpEdit(policy)}
                                                                appearance="subtle"
                                                                disabled={lpDeletingId === policy.id || policy.isDisabled || policy.isOptional}
                                                                className="w-8 h-8 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 rounded-lg"
                                                                title="Edit"
                                                            />
                                                            <Button
                                                                onClick={() => setLpDeleteConfirmId(policy.id as string)}
                                                                icon={
                                                                    lpDeletingId === policy.id
                                                                        ? <Spinner size="tiny" />
                                                                        : <Delete20Regular />
                                                                }
                                                                disabled={lpDeletingId === policy.id || policy.isDisabled || policy.isOptional}
                                                                appearance="subtle"
                                                                className="w-8 h-8 hover:bg-red-100 hover:text-red-700 transition-all duration-200 rounded-lg"
                                                                title="Delete"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="bg-gray-50 border-t border-gray-100 px-2 py-4">
                                    <Caption1 className="text-gray-600 font-medium">
                                        Showing {filteredLeavePolicies.length} of {leavePolicies.length} policies
                                    </Caption1>
                                </div>
                            </Card>
                        ) : (
                            <div className="text-center py-20 flex flex-col items-center bg-white/50 rounded-lg shadow-sm border border-white">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                                    <TimeAndWeatherRegular className="w-10 h-10 text-blue-600" />
                                </div>
                                <Subtitle2 className="mb-3 text-gray-700">No Policies Found</Subtitle2>
                                <Text className="text-gray-500 max-w-md mx-auto leading-relaxed">
                                    {lpSearch
                                        ? `No policies match "${lpSearch}". Try a different search.`
                                        : "Get started by adding your first leave policy"}
                                </Text>
                                {!lpSearch ? (
                                    <Button appearance="primary" onClick={openLpAdd} className="mt-6 px-6" icon={<Add12Filled />}>
                                        Add Leave
                                    </Button>
                                ) : (
                                    <Button appearance="primary" onClick={() => setLpSearch("")} className="mt-6 px-6">
                                        Clear Search
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Delete Confirm */}
                        <Dialog
                            open={!!lpDeleteConfirmId}
                            onOpenChange={(_, d) => !d.open && setLpDeleteConfirmId(null)}
                        >
                            <DialogSurface className="!rounded-2xl !shadow-2xl !max-w-sm">
                                <DialogBody>
                                    <DialogTitle>
                                        <div className="flex items-center gap-2 text-red-600">
                                            <Warning20Regular /> Delete Leave Policy
                                        </div>
                                    </DialogTitle>
                                    <DialogContent className="pt-2">
                                        <Text>Are you sure you want to delete this leave policy? This action cannot be undone.</Text>
                                    </DialogContent>
                                    <DialogActions>
                                        <Button appearance="secondary" onClick={() => setLpDeleteConfirmId(null)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            appearance="primary"
                                            style={{ backgroundColor: "#dc2626" }}
                                            disabled={!!lpDeletingId}
                                            icon={lpDeletingId ? <Spinner size="tiny" /> : undefined}
                                            onClick={async () => {
                                                if (!lpDeleteConfirmId) return;
                                                const id = lpDeleteConfirmId;
                                                setLpDeleteConfirmId(null);
                                                await handleLpDelete(id);
                                            }}
                                        >
                                            {lpDeletingId ? "Deleting..." : "Proceed"}
                                        </Button>
                                    </DialogActions>
                                </DialogBody>
                            </DialogSurface>
                        </Dialog>

                        {/* Add / Edit Dialog */}
                        <Dialog open={lpDialogOpen} onOpenChange={(_, d) => !d.open && closeLpDialog()}>
                            <DialogSurface className="!rounded-2xl !shadow-2xl !max-w-md">
                                <DialogBody>
                                    <DialogTitle
                                        action={
                                            <Button
                                                appearance="subtle"
                                                icon={<DismissRegular />}
                                                onClick={closeLpDialog}
                                            />
                                        }
                                    >
                                        {lpForm.id ? "Edit Policy" : "Add New Policy"}
                                    </DialogTitle>
                                    <DialogContent className="flex flex-col gap-4 pt-2">
                                        <Field
                                            label="Name"
                                            required
                                            validationState={lpFormErrors.name ? "error" : "none"}
                                            validationMessage={lpFormErrors.name}
                                        >
                                            <Input
                                                placeholder="e.g. Casual Leave"
                                                value={lpForm.name}
                                                onChange={(_, d) => setLpForm(prev => ({ ...prev, name: d.value }))}
                                            />
                                        </Field>
                                        <Field
                                            label="Days"
                                            required
                                            validationState={lpFormErrors.days ? "error" : "none"}
                                            validationMessage={lpFormErrors.days}
                                        >
                                            <Input
                                                type="text"
                                                value={lpForm.days ? lpForm.days.toString() : ""}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    setLpForm(prev => ({ ...prev, days: parseInt(e.target.value) || 0 }))
                                                }
                                            />
                                        </Field>
                                    </DialogContent>
                                    <DialogActions>
                                        <Button appearance="secondary" onClick={closeLpDialog}>
                                            Cancel
                                        </Button>
                                        <Button
                                            appearance="primary"
                                            onClick={handleLpSave}
                                            disabled={lpSaving}
                                            icon={lpSaving ? <Spinner size="tiny" /> : undefined}
                                        >
                                            {lpSaving ? "Saving..." : lpForm.id ? "Update" : "Create"}
                                        </Button>
                                    </DialogActions>
                                </DialogBody>
                            </DialogSurface>
                        </Dialog>
                    </div>
                )}
            </div>
        </FluentProvider>
    );
};

export default LeavePlolicy;
