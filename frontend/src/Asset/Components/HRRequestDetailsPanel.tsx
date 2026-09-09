import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Text,
  Badge,
  Divider,
  Spinner,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Dropdown,
  Option,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import { Dismiss24Regular, WarningRegular } from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { getAvailableAssetsForCategory, AvailableAssetOption } from "../Services/AssetInventoryService";
import {
  getAssetHRRequestDetail,
  assignHRRequestItem,
  AssetHRRequestDetail,
  AssetHRRequestItemDetail,
} from "../Services/AssetHRRequestService";

const STATUS_COLOR: Record<string, "warning" | "informative" | "success" | "danger"> = {
  Pending: "warning",
  InProgress: "informative",
  Approved: "informative",
  Completed: "success",
  Rejected: "danger",
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

interface HRRequestDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hrRequestId: string | null;
  onActionComplete: () => void;
}

const HRRequestDetailsPanel: React.FC<HRRequestDetailsPanelProps> = ({ open, onOpenChange, hrRequestId, onActionComplete }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("hr-request-details-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [detail, setDetail] = useState<AssetHRRequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [assetsByCategory, setAssetsByCategory] = useState<Record<string, AvailableAssetOption[]>>({});
  const [selectedAssetByItem, setSelectedAssetByItem] = useState<Record<string, string>>({});
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null);

  const loadDetail = async () => {
    if (!hrRequestId) return;
    setLoading(true);
    try {
      const data = await getAssetHRRequestDetail(hrRequestId);
      setDetail(data);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load request details"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && hrRequestId) {
      setSelectedAssetByItem({});
      loadDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hrRequestId]);

  const itemsByApplicant = useMemo(() => {
    const map: Record<string, AssetHRRequestItemDetail[]> = {};
    (detail?.items ?? []).forEach((item) => {
      const list = map[item.ApplicantAssetHRReqID] ?? [];
      list.push(item);
      map[item.ApplicantAssetHRReqID] = list;
    });
    return map;
  }, [detail]);

  const ensureAssetsLoaded = async (categoryName: string) => {
    if (assetsByCategory[categoryName]) return;
    try {
      const assets = await getAvailableAssetsForCategory(categoryName);
      setAssetsByCategory((prev) => ({ ...prev, [categoryName]: assets }));
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load available assets"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  const handleAssign = async (item: AssetHRRequestItemDetail, resolvedUserId: string) => {
    const assetId = selectedAssetByItem[item.ID];
    if (!assetId || !currentUser?.userID) return;
    setAssigningItemId(item.ID);
    try {
      await assignHRRequestItem(item.ID, { assetId, resolvedUserId, actionedByUserId: currentUser.userID });
      dispatchToast(
        <Toast>
          <ToastTitle>Asset assigned successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      await loadDetail();
      onActionComplete();
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to assign asset"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setAssigningItemId(null);
    }
  };

  return (
    <Drawer
      type="overlay"
      separator
      open={open}
      position="end"
      onOpenChange={(_, data) => onOpenChange(data.open)}
      style={{
        width: "min(880px, 80vw)",
        maxWidth: "80vw",
        backgroundColor: "#FFFFFF",
        background: "#FFFFFF",
        boxShadow: "-10px 0 40px rgba(15, 23, 42, 0.18)",
      }}
    >
      <Toaster toasterId={toasterId} />
      {portal}
      <DrawerHeader style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
        <DrawerHeaderTitle
          action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => onOpenChange(false)} />}
        >
          HR Request Details
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody style={{ backgroundColor: "#FFFFFF" }}>
        {loading || !detail ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Spinner label="Loading..." />
          </div>
        ) : (
          <div style={{ paddingTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Text size={500} weight="semibold">
                  {detail.request.HRRequestID}
                </Text>
                <br />
                <Text size={200} style={{ color: "#605E5C" }}>
                  Raised by {detail.request.RequestedUserName} on {formatDate(detail.request.CreatedAt)}
                </Text>
              </div>
              <Badge appearance="tint" color={STATUS_COLOR[detail.request.Status]} size="large">
                {detail.request.Status}
              </Badge>
            </div>
            <Text size={200} style={{ color: "#605E5C", display: "block", marginTop: "6px" }}>
              Assigned Admin(s): {detail.request.AssignedAdminName ?? "-"}
            </Text>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <Button appearance="primary" onClick={() => navigate(`/Asset/hr-requests/${detail.request.ID}`)}>
                View Full Details
              </Button>
            </div>

            <Divider style={{ margin: "18px 0" }} />

            <Text weight="semibold" style={{ display: "block", marginBottom: "10px" }}>
              Applicants ({detail.applicants.length})
            </Text>

            <Accordion collapsible multiple>
              {detail.applicants.map((applicant) => {
                const items = itemsByApplicant[applicant.ID] ?? [];
                return (
                  <AccordionItem key={applicant.ID} value={applicant.ID}>
                    <AccordionHeader>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: "12px" }}>
                        <div>
                          <Text weight="medium">{applicant.ApplicantName}</Text>
                          <Text size={200} style={{ color: "#605E5C", marginLeft: "8px" }}>
                            {applicant.ApplicantMailID}
                          </Text>
                        </div>
                        <Badge appearance="tint" color={STATUS_COLOR[applicant.Status]}>
                          {applicant.Status}
                        </Badge>
                      </div>
                    </AccordionHeader>
                    <AccordionPanel>
                      {!applicant.HasEntraIdentity && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 12px",
                            background: "#FFF4CE",
                            border: "1px solid #F2C811",
                            borderRadius: "6px",
                            marginBottom: "10px",
                          }}
                        >
                          <WarningRegular style={{ color: "#7A5D00" }} />
                          <Text size={200} style={{ color: "#7A5D00" }}>
                            This user is not added on the Entra ID — assets can't be assigned until they have a work account.
                          </Text>
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {items.map((item) => {
                          const isPending = item.Status === "Pending";
                          const canAssign = isPending && applicant.HasEntraIdentity;
                          return (
                            <div
                              key={item.ID}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "10px 12px",
                                border: "1px solid #E1DFDD",
                                borderRadius: "8px",
                                flexWrap: "wrap",
                              }}
                            >
                              <Text weight="medium" style={{ minWidth: "140px" }}>
                                {item.CategoryName}
                              </Text>
                              <Badge appearance="tint" color={STATUS_COLOR[item.Status]}>
                                {item.Status}
                              </Badge>
                              {item.Status === "Completed" && (
                                <Text size={200} style={{ color: "#605E5C" }}>
                                  Approved by {item.ApprovedAdminName ?? "-"} on {formatDate(item.ApprovedDate)}
                                </Text>
                              )}
                              {canAssign && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                                  <Dropdown
                                    placeholder="Choose asset"
                                    mountNode={mountNode}
                                    style={{ minWidth: "220px" }}
                                    value={
                                      assetsByCategory[item.CategoryName]?.find((a) => a.ID === selectedAssetByItem[item.ID])
                                        ?.AssetName ?? ""
                                    }
                                    onOpenChange={(_, d) => d.open && ensureAssetsLoaded(item.CategoryName)}
                                    onOptionSelect={(_, d) =>
                                      setSelectedAssetByItem((prev) => ({ ...prev, [item.ID]: d.optionValue ?? "" }))
                                    }
                                  >
                                    {(assetsByCategory[item.CategoryName] ?? []).length === 0 ? (
                                      <Option key="none" value="" disabled>
                                        No in-stock assets available
                                      </Option>
                                    ) : (
                                      assetsByCategory[item.CategoryName].map((asset) => (
                                        <Option key={asset.ID} value={asset.ID} text={asset.AssetName}>
                                          {asset.AssetName} ({asset.AssetTagID})
                                        </Option>
                                      ))
                                    )}
                                  </Dropdown>
                                  <Button
                                    appearance="primary"
                                    disabled={!selectedAssetByItem[item.ID] || assigningItemId === item.ID}
                                    onClick={() => handleAssign(item, applicant.ResolvedUserID as string)}
                                  >
                                    {assigningItemId === item.ID ? <Spinner size="tiny" /> : "Add Asset"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionPanel>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}
      </DrawerBody>
    </Drawer>
  );
};

export default HRRequestDetailsPanel;
