import React, { useEffect, useMemo, useState } from "react";
import {
  Text,
  Badge,
  Button,
  Spinner,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableBody,
  TableCell,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTrigger,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import { WarningRegular, Dismiss24Regular } from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import TruncatedText from "../../Common/TruncatedText";
import {
  getAssetRoleMismatchSummary,
  getAssetRoleMismatchDetails,
  bulkReturnMismatchedAssets,
  AssetRoleMismatchGroup,
  AssetRoleMismatchDetailRow,
} from "../Services/AssetRoleTemplateService";

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN");

// One accordion entry. CategoryName null means "every category in this
// bucket" — used only for the consolidated "No Role" entry, so an employee
// with no role assigned doesn't produce one row per distinct category held
// company-wide (it's the same underlying cause, not N different problems).
interface DisplayGroup {
  key: string;
  RoleTemplateID: string | null;
  RoleName: string | null;
  CategoryName: string | null;
  CategoryCount: number;
  ExcessUnitCount: number;
}

const MismatchTable: React.FC<{ rows: AssetRoleMismatchDetailRow[]; showCategory?: boolean }> = ({ rows, showCategory }) => (
  <Table size="small">
    <TableHeader>
      <TableRow>
        <TableHeaderCell>Employee</TableHeaderCell>
        {showCategory && <TableHeaderCell>Category</TableHeaderCell>}
        <TableHeaderCell>Asset</TableHeaderCell>
        <TableHeaderCell>Assigned On</TableHeaderCell>
        <TableHeaderCell style={{ width: "100px" }}>Status</TableHeaderCell>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.MappingID}>
          <TableCell>
            <TruncatedText text={row.DisplayName} size={200} />
            <TruncatedText text={row.Mail} size={100} color="#605E5C" />
          </TableCell>
          {showCategory && <TableCell>{row.CategoryName}</TableCell>}
          <TableCell>
            <TruncatedText text={row.AssetName} size={200} />
            <TruncatedText text={row.AssetTagID} size={100} color="#605E5C" />
          </TableCell>
          <TableCell>{formatDate(row.AssignedAt)}</TableCell>
          <TableCell>
            {row.IsExcess ? (
              <Badge appearance="tint" color="danger">
                Excess
              </Badge>
            ) : (
              <Badge appearance="tint" color="informative">
                Within cap
              </Badge>
            )}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

interface AssetRoleMismatchPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCountChange?: (count: number) => void;
  onAssetsReturned?: () => void;
}

// Assets still assigned to an employee whose CURRENT Asset Role no longer
// covers them — the category was removed from the role, its quantity was
// reduced below what's held, or the employee's role was reassigned/cleared
// (including having no role at all). Admin-only: the summary loads quietly
// in the background so the Asset Inventory page can show a live count on
// its "Role Mismatches" button; the review panel itself only renders once
// that button is clicked (this component then opens as a Drawer, controlled
// by the `open`/`onOpenChange` props). Every mismatch — role-based or
// no-role — is shown the same way: one accordion row each, expand to see the
// affected employees/assets and a "Return All" action. No separate popup.
const AssetRoleMismatchPanel: React.FC<AssetRoleMismatchPanelProps> = ({ open, onOpenChange, onCountChange, onAssetsReturned }) => {
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("asset-role-mismatch-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [groups, setGroups] = useState<AssetRoleMismatchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsByKey, setDetailsByKey] = useState<Record<string, AssetRoleMismatchDetailRow[]>>({});
  const [detailsLoadingKey, setDetailsLoadingKey] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<DisplayGroup | null>(null);
  const [returning, setReturning] = useState(false);

  const displayGroups = useMemo<DisplayGroup[]>(() => {
    const roleGroups = groups
      .filter((g) => g.RoleTemplateID !== null)
      .map((g) => ({
        key: `${g.RoleTemplateID}::${g.CategoryName}`,
        RoleTemplateID: g.RoleTemplateID,
        RoleName: g.RoleName,
        CategoryName: g.CategoryName,
        CategoryCount: 1,
        ExcessUnitCount: g.ExcessUnitCount,
      }));
    const noRoleGroups = groups.filter((g) => g.RoleTemplateID === null);
    const consolidatedNoRole: DisplayGroup[] = noRoleGroups.length
      ? [
          {
            key: "no-role",
            RoleTemplateID: null,
            RoleName: null,
            CategoryName: null,
            CategoryCount: noRoleGroups.length,
            ExcessUnitCount: noRoleGroups.reduce((sum, g) => sum + g.ExcessUnitCount, 0),
          },
        ]
      : [];
    return [...consolidatedNoRole, ...roleGroups];
  }, [groups]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getAssetRoleMismatchSummary();
      setGroups(data);
      const roleGroupCount = data.filter((g) => g.RoleTemplateID !== null).length;
      const hasNoRoleGroup = data.some((g) => g.RoleTemplateID === null);
      onCountChange?.(roleGroupCount + (hasNoRoleGroup ? 1 : 0));
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load role mismatches"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDetails = async (group: DisplayGroup) => {
    if (detailsByKey[group.key]) return;
    setDetailsLoadingKey(group.key);
    try {
      const rows = await getAssetRoleMismatchDetails(group.RoleTemplateID, group.CategoryName);
      setDetailsByKey((prev) => ({ ...prev, [group.key]: rows }));
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load details"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setDetailsLoadingKey(null);
    }
  };

  const handleConfirmReturn = async () => {
    if (!confirmTarget || !currentUser?.userID) return;
    setReturning(true);
    try {
      const result = await bulkReturnMismatchedAssets({
        roleTemplateId: confirmTarget.RoleTemplateID,
        categoryName: confirmTarget.CategoryName,
        performedByUserId: currentUser.userID,
      });
      dispatchToast(
        <Toast>
          <ToastTitle>Returned {result.returnedCount} asset{result.returnedCount === 1 ? "" : "s"} to stock</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setConfirmTarget(null);
      setDetailsByKey({});
      await loadSummary();
      onAssetsReturned?.();
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to return assets"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setReturning(false);
    }
  };

  return (
    <>
      <Toaster toasterId={toasterId} />
      {portal}
      <Drawer type="overlay" separator open={open} position="end" size="large" onOpenChange={(_, data) => onOpenChange(data.open)}>
        <DrawerHeader>
          <DrawerHeaderTitle action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => onOpenChange(false)} />}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <WarningRegular style={{ color: "#7A5D00" }} />
              Asset Role Mismatches
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                <Spinner label="Checking for role mismatches..." />
              </div>
            ) : displayGroups.length === 0 ? (
              <Text style={{ color: "#605E5C" }}>No role mismatches right now.</Text>
            ) : (
              <>
                <Text size={200} style={{ color: "#605E5C" }}>
                  These employees hold assets their current Asset Role no longer covers — the category was removed or reduced, their
                  role changed, or they have no role at all. Review and return what's no longer needed.
                </Text>

                <Accordion
                  collapsible
                  onToggle={(_, data) => {
                    const group = displayGroups.find((g) => g.key === data.value);
                    if (group) loadDetails(group);
                  }}
                >
                  {displayGroups.map((group) => {
                    const rows = detailsByKey[group.key];
                    const isNoRole = group.RoleTemplateID === null;
                    const employeeCount = rows ? new Set(rows.map((r) => r.UserID)).size : null;
                    return (
                      <AccordionItem key={group.key} value={group.key}>
                        <AccordionHeader>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: "12px" }}>
                            <Text>
                              <strong>{group.RoleName ?? "No Role"}</strong>
                              {isNoRole
                                ? ` → ${group.CategoryCount} categor${group.CategoryCount === 1 ? "y" : "ies"}`
                                : ` → ${group.CategoryName}`}
                            </Text>
                            <Badge appearance="tint" color="danger">
                              {employeeCount !== null ? `${employeeCount} employee${employeeCount === 1 ? "" : "s"} · ` : ""}
                              {group.ExcessUnitCount} excess
                            </Badge>
                          </div>
                        </AccordionHeader>
                        <AccordionPanel>
                          {detailsLoadingKey === group.key || !rows ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
                              <Spinner size="tiny" />
                            </div>
                          ) : (
                            <>
                              <MismatchTable rows={rows} showCategory={isNoRole} />
                              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                                <Button appearance="primary" onClick={() => setConfirmTarget(group)}>
                                  Return All ({group.ExcessUnitCount})
                                </Button>
                              </div>
                            </>
                          )}
                        </AccordionPanel>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </>
            )}
          </div>
        </DrawerBody>
      </Drawer>

      <Dialog open={!!confirmTarget} onOpenChange={(_, data) => !data.open && setConfirmTarget(null)}>
        <DialogSurface mountNode={mountNode}>
          <DialogBody>
            <DialogTitle>Return {confirmTarget?.ExcessUnitCount} asset(s)?</DialogTitle>
            <DialogContent>
              <Text>
                Do you want to remove{" "}
                {confirmTarget?.CategoryName ? (
                  <>
                    <strong>{confirmTarget.CategoryName}</strong> access
                  </>
                ) : (
                  "access to every category listed"
                )}{" "}
                for <strong>{confirmTarget?.RoleName ?? "employees with no role"}</strong>? This will return{" "}
                {confirmTarget?.ExcessUnitCount} asset(s) back to stock. This cannot be undone.
              </Text>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" disabled={returning}>
                  Cancel
                </Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleConfirmReturn} disabled={returning}>
                {returning ? <Spinner size="tiny" /> : "Yes, Return All"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default AssetRoleMismatchPanel;
