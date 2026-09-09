import React, { useState, useEffect, useId } from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Body1Strong,
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  FluentProvider,
  Input,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Subtitle2,
  SpinButton,
  Spinner,
  Toast,
  ToastBody,
  ToastTitle,
  Toaster,
  useToastController,
} from "@fluentui/react-components";
import {
  Add12Filled,
  BoxToolboxRegular,
  DismissRegular,
  EditRegular,
  DeleteRegular,
  CheckmarkCircle20Regular,
  ErrorCircle20Regular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { 
  AssetSLAConfigItem, 
  GetAssetSLAConfigurations, 
  CreateAssetSLAConfiguration, 
  UpdateAssetSLAConfiguration 
} from "../../Services/AssetSLAService";

// =============================================
// Types
// =============================================
interface FormState {
  name: string;
  managerApproval: boolean;
  adminApproval: boolean;
}

const emptyForm = (): FormState => ({
  name: "",
  managerApproval: false,
  adminApproval: false,
});

// =============================================
// Component
// =============================================
const AssetSLAConfiguration = () => {
  const { accessToken, currentUser } = useAuth() as any;
  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);

  // State
  const [requests, setRequests] = useState<AssetSLAConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [search, setSearch] = useState("");
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);

  // Edit Days State
  // We use a composite string for ID: "reqId-Manager" or "reqId-Admin"
  const [editingApprovalId, setEditingApprovalId] = useState<string | null>(null);
  const [editDaysValue, setEditDaysValue] = useState<number>(3);

  const showToast = (intent: "success" | "error", title: string, body?: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle media={intent === "success" ? <CheckmarkCircle20Regular /> : <ErrorCircle20Regular />}>
          {title}
        </ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent, toastId, timeout: 5000 }
    );
  };

  const fetchConfigurations = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await GetAssetSLAConfigurations(accessToken);
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (error) {
      showToast("error", "Error", "Could not fetch SLA configurations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, [accessToken]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingRequestId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const handleOpenEditApprovals = (req: AssetSLAConfigItem) => {
    setEditingRequestId(req.ID);
    setForm({
      name: req.RequestTypeName,
      managerApproval: req.ManagerApproval,
      adminApproval: req.AdminApproval,
    });
    setDialogOpen(true);
  };

  const handleCloseAdd = () => {
    setDialogOpen(false);
    setForm(emptyForm());
    setEditingRequestId(null);
  };

  const handleSaveRequest = async () => {
    if (!form.name.trim() || !accessToken) return;
    setSaving(true);
    try {
      if (editingRequestId) {
        // Find existing to preserve existing days if they were already active
        const existingReq = requests.find(r => r.ID === editingRequestId);
        const payload: any = {
          ID: editingRequestId,
          ModifiedBy: currentUser?.userID || "system",
          ManagerApproval: form.managerApproval,
          AdminApproval: form.adminApproval,
        };
        
        // If enabling manager approval for the first time or re-enabling, set default days if it was 0
        if (form.managerApproval && (!existingReq?.ManagerApproval || existingReq.ManagerApprovalDays === 0)) {
          payload.ManagerApprovalDays = 3;
        } else if (!form.managerApproval) {
          payload.ManagerApprovalDays = 0;
        }

        if (form.adminApproval && (!existingReq?.AdminApproval || existingReq.AdminApprovalDays === 0)) {
          payload.AdminApprovalDays = 3;
        } else if (!form.adminApproval) {
          payload.AdminApprovalDays = 0;
        }

        const res = await UpdateAssetSLAConfiguration(payload, accessToken);
        if (res.success) {
          showToast("success", "Updated", "Approvals updated successfully.");
          handleCloseAdd();
          fetchConfigurations();
        } else {
          showToast("error", "Failed", res.message);
        }
      } else {
        const payload = {
          RequestTypeName: form.name.trim(),
          ManagerApproval: form.managerApproval,
          AdminApproval: form.adminApproval,
          ManagerApprovalDays: form.managerApproval ? 3 : 0,
          AdminApprovalDays: form.adminApproval ? 3 : 0,
          CreatedBy: currentUser?.userID || "system",
        };

        const res = await CreateAssetSLAConfiguration(payload, accessToken);
        if (res.success) {
          showToast("success", "Created", "SLA Configuration created successfully.");
          handleCloseAdd();
          fetchConfigurations();
        } else {
          showToast("error", "Failed", res.message);
        }
      }
    } catch (error: any) {
      showToast("error", "Error", error?.message || "Could not save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (reqId: string, type: "Manager" | "Admin", currentDays: number) => {
    setEditingApprovalId(`${reqId}-${type}`);
    setEditDaysValue(currentDays);
  };

  const handleSaveEdit = async (req: AssetSLAConfigItem, type: "Manager" | "Admin") => {
    if (!accessToken) return;
    try {
      const payload: any = {
        ID: req.ID,
        ModifiedBy: currentUser?.userID || "system"
      };

      if (type === "Manager") {
        payload.ManagerApprovalDays = editDaysValue;
      } else {
        payload.AdminApprovalDays = editDaysValue;
      }

      const res = await UpdateAssetSLAConfiguration(payload, accessToken);
      if (res.success) {
        showToast("success", "Updated", "SLA days updated successfully.");
        setEditingApprovalId(null);
        fetchConfigurations();
      } else {
        showToast("error", "Failed", res.message);
      }
    } catch (error: any) {
      showToast("error", "Error", error?.message || "Could not update SLA days.");
    }
  };

  const handleDeleteApproval = async (req: AssetSLAConfigItem, type: "Manager" | "Admin") => {
    if (!accessToken) return;
    try {
      const payload: any = {
        ID: req.ID,
        ModifiedBy: currentUser?.userID || "system"
      };

      if (type === "Manager") {
        payload.ManagerApproval = false;
        payload.ManagerApprovalDays = 0;
      } else {
        payload.AdminApproval = false;
        payload.AdminApprovalDays = 0;
      }

      const res = await UpdateAssetSLAConfiguration(payload, accessToken);
      if (res.success) {
        showToast("success", "Deleted", `${type} approval step removed.`);
        fetchConfigurations();
      } else {
        showToast("error", "Failed", res.message);
      }
    } catch (error: any) {
      showToast("error", "Error", error?.message || "Could not delete approval step.");
    }
  };

  const handleDeleteRequest = async (req: AssetSLAConfigItem) => {
    if (!accessToken) return;
    try {
      const payload: any = {
        ID: req.ID,
        IsActive: false,
        ModifiedBy: currentUser?.userID || "system"
      };

      const res = await UpdateAssetSLAConfiguration(payload, accessToken);
      if (res.success) {
        showToast("success", "Deleted", "SLA Configuration removed.");
        fetchConfigurations();
      } else {
        showToast("error", "Failed", res.message);
      }
    } catch (error: any) {
      showToast("error", "Error", error?.message || "Could not delete configuration.");
    }
  };

  const handleCancelEdit = () => {
    setEditingApprovalId(null);
  };

  const filteredRequests = requests.filter(req =>
    req.RequestTypeName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <div className="min-h-screen">
        <Toaster toasterId={toastId} />
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-5 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Subtitle2 className="text-[#063762]">Asset SLA Configuration</Subtitle2>
            </div>
            <Caption1 className="text-gray-600">Define and manage SLA configurations for asset requests</Caption1>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div className="flex items-center gap-4 w-full md:w-1/4">
             <Input
               className="w-full !border-1 !border-[#E5E7EB] after:!border-0 !rounded-3xl"
               placeholder="Search requests..."
               value={search}
               onChange={(_, d) => setSearch(d.value)}
             />
          </div>
          <Button
            appearance="primary"
            onClick={handleOpenAdd}
            shape="circular"
            icon={
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] flex items-center justify-center text-white">
                <Add12Filled />
              </div>
            }
            className="shadow !bg-white/50 !text-[#626262] border-1 !border-white"
          >
            Add New Request
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner />
            <Body1Strong className="mt-2">Loading configurations...</Body1Strong>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center bg-white/50 rounded-lg shadow-sm border border-white">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
              <BoxToolboxRegular className="w-10 h-10 text-blue-600" />
            </div>
            <Subtitle2 className="mb-3 text-gray-700">No Requests Found</Subtitle2>
            <Text className="text-gray-500 max-w-md mx-auto leading-relaxed">
              {search
                ? `No requests match "${search}". Try a different search.`
                : "Get started by adding your first SLA configuration request."}
            </Text>
            {!search && (
              <Button
                appearance="primary"
                onClick={handleOpenAdd}
                className="mt-6 px-6"
                icon={<Add12Filled />}
              >
                Add New Request
              </Button>
            )}
          </div>
        ) : (
          <Accordion multiple collapsible className="flex flex-col gap-3">
            {filteredRequests.map(req => {
              const approvalCount = (req.ManagerApproval ? 1 : 0) + (req.AdminApproval ? 1 : 0);

              return (
                <AccordionItem
                  key={req.ID}
                  value={req.ID}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <AccordionHeader
                    expandIconPosition="end"
                    className="!px-5 !py-1 hover:bg-blue-50/50 transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                        {req.RequestTypeName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <Body1Strong className="text-gray-800 block">
                          {req.RequestTypeName}
                        </Body1Strong>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Caption1 className="text-gray-400">
                            {approvalCount} approval step{approvalCount !== 1 ? "s" : ""}
                          </Caption1>
                        </div>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Delete Request"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 w-8 h-8 rounded-full inline-flex items-center justify-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRequest(req);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteRequest(req);
                          }
                        }}
                        title="Delete Request"
                      >
                        <DeleteRegular />
                      </span>
                    </div>
                  </AccordionHeader>

                  <AccordionPanel className="!p-0 !m-0">
                    <div className="border-t border-gray-100">
                      <Table className="w-full">
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHeaderCell className="!py-2 !px-6">
                              <Caption1 className="font-semibold text-gray-500 uppercase tracking-wide">
                                Approval Stage
                              </Caption1>
                            </TableHeaderCell>
                            <TableHeaderCell className="!py-2 !px-6 w-32">
                              <Caption1 className="font-semibold text-gray-500 uppercase tracking-wide">
                                SLA (Days)
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
                          {approvalCount < 2 && (
                            <TableRow className="bg-gray-50/50">
                              <TableCell colSpan={3} className="!py-2 !px-6">
                                <Button
                                  appearance="transparent"
                                  icon={<Add12Filled />}
                                  className="text-blue-600 hover:text-blue-800"
                                  onClick={() => handleOpenEditApprovals(req)}
                                >
                                  Add Approval
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                          {req.ManagerApproval && (
                            <TableRow className="hover:bg-blue-50/30 border-b border-gray-50 transition-colors">
                              <TableCell className="!px-6 !py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                  <Text className="text-gray-800">Manager Approval</Text>
                                </div>
                              </TableCell>
                              <TableCell className="!px-6 !py-3">
                                {editingApprovalId === `${req.ID}-Manager` ? (
                                  <SpinButton
                                    size="small"
                                    min={0}
                                    max={30}
                                    value={editDaysValue}
                                    onChange={(_, d) => setEditDaysValue(d.value || 0)}
                                    className="w-20"
                                  />
                                ) : (
                                  <Badge appearance="filled" color="brand" size="medium">
                                    {req.ManagerApprovalDays} days
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="!px-6 !py-3">
                                <div className="flex items-center gap-1">
                                  {editingApprovalId === `${req.ID}-Manager` ? (
                                    <>
                                      <Button size="small" appearance="primary" onClick={() => handleSaveEdit(req, "Manager")}>
                                        Save
                                      </Button>
                                      <Button size="small" appearance="subtle" onClick={handleCancelEdit}>
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        icon={<EditRegular />}
                                        onClick={() => handleStartEdit(req.ID, "Manager", req.ManagerApprovalDays)}
                                        appearance="subtle"
                                        className="w-8 h-8 hover:bg-blue-100 hover:text-blue-700 rounded-lg"
                                        title="Edit"
                                      />
                                      <Button
                                        icon={<DeleteRegular />}
                                        onClick={() => handleDeleteApproval(req, "Manager")}
                                        appearance="subtle"
                                        className="w-8 h-8 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg"
                                        title="Delete"
                                      />
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          
                          {req.AdminApproval && (
                            <TableRow className="hover:bg-blue-50/30 border-b border-gray-50 transition-colors">
                              <TableCell className="!px-6 !py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                  <Text className="text-gray-800">Admin Approval</Text>
                                </div>
                              </TableCell>
                              <TableCell className="!px-6 !py-3">
                                {editingApprovalId === `${req.ID}-Admin` ? (
                                  <SpinButton
                                    size="small"
                                    min={0}
                                    max={30}
                                    value={editDaysValue}
                                    onChange={(_, d) => setEditDaysValue(d.value || 0)}
                                    className="w-20"
                                  />
                                ) : (
                                  <Badge appearance="filled" color="brand" size="medium">
                                    {req.AdminApprovalDays} days
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="!px-6 !py-3">
                                <div className="flex items-center gap-1">
                                  {editingApprovalId === `${req.ID}-Admin` ? (
                                    <>
                                      <Button size="small" appearance="primary" onClick={() => handleSaveEdit(req, "Admin")}>
                                        Save
                                      </Button>
                                      <Button size="small" appearance="subtle" onClick={handleCancelEdit}>
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        icon={<EditRegular />}
                                        onClick={() => handleStartEdit(req.ID, "Admin", req.AdminApprovalDays)}
                                        appearance="subtle"
                                        className="w-8 h-8 hover:bg-blue-100 hover:text-blue-700 rounded-lg"
                                        title="Edit"
                                      />
                                      <Button
                                        icon={<DeleteRegular />}
                                        onClick={() => handleDeleteApproval(req, "Admin")}
                                        appearance="subtle"
                                        className="w-8 h-8 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg"
                                        title="Delete"
                                      />
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}

                          {approvalCount === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                                No approvals configured.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* Add Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(_, d) => !d.open && handleCloseAdd()}>
          <DialogSurface className="!rounded-2xl !shadow-2xl !max-w-md">
            <DialogBody>
              <DialogTitle
                action={
                  <Button
                    appearance="subtle"
                    icon={<DismissRegular />}
                    onClick={handleCloseAdd}
                  />
                }
              >
                {editingRequestId ? "Edit Approvals" : "Add New Request"}
              </DialogTitle>
              <DialogContent className="flex flex-col gap-4 pt-2">
                <Field label="Request Name" required>
                  <Input
                    placeholder="e.g. Asset Handover"
                    value={form.name}
                    onChange={(_, d) => setForm(prev => ({ ...prev, name: d.value }))}
                    disabled={!!editingRequestId}
                  />
                </Field>
                <div className="flex items-center justify-between border border-gray-200 rounded-lg p-3 mt-2">
                  <div>
                    <Body1Strong className="block">Manager Approval</Body1Strong>
                    <Caption1 className="text-gray-500">Enable manager step</Caption1>
                  </div>
                  <Switch
                    checked={form.managerApproval}
                    onChange={(ev, data) => setForm(prev => ({ ...prev, managerApproval: data.checked }))}
                  />
                </div>
                <div className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                  <div>
                    <Body1Strong className="block">Admin Approval</Body1Strong>
                    <Caption1 className="text-gray-500">Enable admin step</Caption1>
                  </div>
                  <Switch
                    checked={form.adminApproval}
                    onChange={(ev, data) => setForm(prev => ({ ...prev, adminApproval: data.checked }))}
                  />
                </div>
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={handleCloseAdd} disabled={saving}>
                  Cancel
                </Button>
                <Button appearance="primary" onClick={handleSaveRequest} disabled={!form.name.trim() || saving}>
                  {saving ? <Spinner size="tiny" /> : "Save"}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

      </div>
    </FluentProvider>
  );
};

export default AssetSLAConfiguration;
