import React, { useEffect, useState } from "react";
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Text,
  Field,
  Dropdown,
  Option,
  Textarea,
  Input,
  Spinner,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
  Card,
  Subtitle2,
} from "@fluentui/react-components";
import { 
  Dismiss24Regular, 
  AddCircleRegular, 
  WarningRegular, 
  WrenchRegular,
  ChevronLeftRegular
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { getAssetCategoryComponents, AssetCategoryComponentRecord } from "../Services/AssetCategoryComponentService";
import { createAssetUpgradeRequest, getAssetUpgradeRequests } from "../Services/AssetUpgradeRequestService";
import { getAssetComponentSpecs } from "../Services/AssetInventoryService";
import { RepairIssueTypeService, RepairProblemCategoryService, RepairMasterRecord } from "../Services/RepairRequestMasterService";
import { createAssetRepairRequest, uploadRepairRequestAttachments } from "../Services/AssetRepairRequestService";
import AssetFileUploadSection from "./AssetFileUploadSection";

type RequestType = "upgrade" | "repair";

interface AssetServiceRequestPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  categoryId: string;
  categoryName: string;
  initialRequestType?: RequestType;
  onSubmitted: () => void;
}

const AssetServiceRequestPanel: React.FC<AssetServiceRequestPanelProps> = ({
  open,
  onOpenChange,
  assetId,
  categoryId,
  categoryName,
  initialRequestType = "upgrade",
  onSubmitted,
}) => {
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("asset-service-request-toaster");
  const { dispatchToast } = useToastController(toasterId);

  // --- Common ---
  const [requestType, setRequestType] = useState<RequestType>(initialRequestType);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Upgrade form state ---
  const [components, setComponents] = useState<AssetCategoryComponentRecord[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [currentSpecsByComponent, setCurrentSpecsByComponent] = useState<Record<string, string>>({});
  const [pendingComponentIds, setPendingComponentIds] = useState<Set<string>>(new Set());
  const [componentId, setComponentId] = useState("");
  const [currentSpec, setCurrentSpec] = useState("");
  const [currentSpecLocked, setCurrentSpecLocked] = useState(false);
  const [requiredSpec, setRequiredSpec] = useState("");
  const [reason, setReason] = useState("");
  const [customComponent, setCustomComponent] = useState("");

  // --- Repair form state ---
  const [issueTypes, setIssueTypes] = useState<RepairMasterRecord[]>([]);
  const [problemCategories, setProblemCategories] = useState<RepairMasterRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [issueTypeId, setIssueTypeId] = useState("");
  const [customIssueType, setCustomIssueType] = useState("");
  const [problemCategoryId, setProblemCategoryId] = useState("");
  const [customProblemCategory, setCustomProblemCategory] = useState("");
  const [problem, setProblem] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);

  // Reset everything when panel opens
  useEffect(() => {
    if (!open || !currentUser?.userID) return;
    setRequestType(initialRequestType);
    setError(null);
    // Reset upgrade
    setComponentId("");
    setCurrentSpec("");
    setCurrentSpecLocked(false);
    setRequiredSpec("");
    setReason("");
    // Reset repair
    setIssueTypeId("");
    setProblemCategoryId("");
    setProblem("");
    setPendingAttachments([]);

    // Load upgrade data
    setLoadingComponents(true);
    Promise.all([
      getAssetCategoryComponents(categoryId),
      getAssetComponentSpecs(assetId),
      getAssetUpgradeRequests({ userId: currentUser.userID }),
    ])
      .then(([componentData, specData, myRequests]) => {
        setComponents(componentData);
        const map: Record<string, string> = {};
        specData.forEach((s) => {
          if (s.SpecValue) map[s.ComponentID] = s.SpecValue;
        });
        setCurrentSpecsByComponent(map);
        setPendingComponentIds(
          new Set(
            myRequests
              .filter((r) => r.ReqStatus === "Pending" || r.ReqStatus === "AdminApprovalPending")
              .map((r) => r.ComponentName)
          )
        );
      })
      .catch(() => {})
      .finally(() => setLoadingComponents(false));

    // Load repair data
    setLoadingOptions(true);
    Promise.all([RepairIssueTypeService.list(), RepairProblemCategoryService.list()])
      .then(([issues, problems]) => {
        setIssueTypes(issues);
        setProblemCategories(problems);
      })
      .catch(() => {})
      .finally(() => setLoadingOptions(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categoryId, assetId, currentUser?.userID]);

  const handleComponentSelect = (selectedComponentId: string) => {
    setComponentId(selectedComponentId);
    setError(null);
    const knownValue = currentSpecsByComponent[selectedComponentId];
    if (knownValue) {
      setCurrentSpec(knownValue);
      setCurrentSpecLocked(true);
    } else {
      setCurrentSpec("");
      setCurrentSpecLocked(false);
    }
  };

  const hasPendingRequestForSelected = componentId ? pendingComponentIds.has(componentId) : false;

  const handleSubmitUpgrade = async () => {
    if (!componentId) {
      setError("Please select a component to upgrade.");
      return;
    }
    if (componentId === "OTHER" && !customComponent.trim()) {
      setError("Please specify the custom component name.");
      return;
    }
    if (hasPendingRequestForSelected) {
      setError("You already have a pending upgrade request for this component.");
      return;
    }
    if (!currentSpec.trim() || !requiredSpec.trim()) {
      setError("Current and Requested Specification are required.");
      return;
    }
    if (!currentUser?.userID) return;

    setSubmitting(true);
    setError(null);
    try {
      const finalComponentId = componentId === "OTHER" ? (components[0]?.ID || "OTHER") : componentId;
      const combinedReason = componentId === "OTHER"
        ? `[Custom Component: ${customComponent.trim()}] ${reason.trim()}`
        : reason.trim() || undefined;

      await createAssetUpgradeRequest({
        CategoryID: categoryId,
        ComponentID: finalComponentId,
        CurrentSpecification: currentSpec.trim(),
        RequiredSpecfication: requiredSpec.trim(),
        ReasonForUpgrade: combinedReason,
        requestedByUserId: currentUser.userID,
        AssetID: assetId,
      });
      dispatchToast(
        <Toast>
          <ToastTitle>Upgrade request submitted</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      onOpenChange(false);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRepair = async () => {
    const issueTypeName = issueTypeId === "OTHER" ? (customIssueType.trim() || "Other Issue") : issueTypes.find((i) => i.ID === issueTypeId)?.Name;
    const problemCategoryName = problemCategoryId === "OTHER" ? (customProblemCategory.trim() || "General Hardware Issue") : problemCategories.find((p) => p.ID === problemCategoryId)?.Name;
    if (!issueTypeName) {
      setError("Please select an issue type or specify custom issue.");
      return;
    }
    if (!problemCategoryName) {
      setError("Please select a problem category.");
      return;
    }
    if (!problem.trim()) {
      setError("Please describe the problem.");
      return;
    }
    if (!currentUser?.userID) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await createAssetRepairRequest({
        AssetID: assetId,
        IssueType: issueTypeName,
        ProblemCategory: problemCategoryName,
        Problem: problem.trim(),
        requestedByUserId: currentUser.userID,
      });

      if (pendingAttachments.length) {
        try {
          await uploadRepairRequestAttachments(result.ID, pendingAttachments);
        } catch (uploadErr: any) {
          dispatchToast(
            <Toast>
              <ToastTitle>
                Request {result.RequestNumber} submitted, but attachments failed: {uploadErr?.message || "unknown error"}
              </ToastTitle>
            </Toast>,
            { intent: "warning" }
          );
        }
      }

      dispatchToast(
        <Toast>
          <ToastTitle>Repair request {result.RequestNumber} submitted</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      onOpenChange(false);
      onSubmitted();
    } catch (err: any) {
      setError(err?.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (requestType === "upgrade") handleSubmitUpgrade();
    else if (requestType === "repair") handleSubmitRepair();
  };

  const getIcon = () => {
    if (requestType === "upgrade") {
      return (
        <div style={{ background: "#E7F5EC", borderRadius: "8px", padding: "8px", color: "#107C10", display: "flex", alignItems: "center" }}>
          <AddCircleRegular />
        </div>
      );
    }
    return (
      <div style={{ background: "#FDE7E9", borderRadius: "8px", padding: "8px", color: "#D13438", display: "flex", alignItems: "center" }}>
        <WarningRegular />
      </div>
    );
  };

  return (
    <Drawer
      type="overlay"
      separator
      open={open}
      position="end"
      onOpenChange={(_, data) => onOpenChange(data.open)}
      style={{ width: "min(680px, 94vw)", background: "#ffffff" }}
    >
      <Toaster toasterId={toasterId} />
      {portal}
      <DrawerHeader style={{ borderBottom: "1px solid #E2E8F0", padding: "16px 24px" }}>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<Dismiss24Regular />}
              onClick={() => onOpenChange(false)}
            />
          }
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: requestType === "upgrade" ? "#ECFDF5" : "#FFFBEB",
                color: requestType === "upgrade" ? "#10B981" : "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              {getIcon()}
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                {requestType === "upgrade" ? "Hardware Upgrade Request" : "Report Issue & Request Repair"}
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 400 }}>
                {requestType === "upgrade"
                  ? "Submit a component specification upgrade for management approval"
                  : "Submit a breakdown or malfunction report for IT service"}
              </div>
            </div>
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* ===================== SEGMENTED CONTROL ===================== */}
          <div
            style={{
              display: "inline-flex",
              background: "#F1F5F9",
              border: "1px solid #E2E8F0",
              borderRadius: "9999px",
              padding: "4px",
              width: "fit-content",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setRequestType("upgrade");
                setError(null);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 20px",
                borderRadius: "9999px",
                border: "none",
                background: requestType === "upgrade" ? "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)" : "transparent",
                color: requestType === "upgrade" ? "#ffffff" : "#64748B",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.18s ease",
                fontSize: "13.5px",
                boxShadow: requestType === "upgrade" ? "0 2px 8px rgba(0, 126, 213, 0.28)" : "none",
              }}
            >
              <AddCircleRegular style={{ fontSize: "16px" }} />
              <span>Hardware Upgrade</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRequestType("repair");
                setError(null);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 20px",
                borderRadius: "9999px",
                border: "none",
                background: requestType === "repair" ? "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)" : "transparent",
                color: requestType === "repair" ? "#ffffff" : "#64748B",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.18s ease",
                fontSize: "13.5px",
                boxShadow: requestType === "repair" ? "0 2px 8px rgba(0, 126, 213, 0.28)" : "none",
              }}
            >
              <WrenchRegular style={{ fontSize: "16px" }} />
              <span>Request Repair</span>
            </button>
          </div>

          {/* ===================== UPGRADE FORM ===================== */}
          {requestType === "upgrade" && (
            <>
              <Field label="Component to Upgrade" required>
                <Dropdown
                  placeholder={loadingComponents ? "Loading..." : "Select Component"}
                  mountNode={mountNode}
                  disabled={loadingComponents}
                  value={componentId === "OTHER" ? "Other Component" : (components.find((c) => c.ID === componentId)?.ComponentName ?? "")}
                  onOptionSelect={(_, d) => handleComponentSelect(d.optionValue ?? "")}
                >
                  {components.length === 0 ? (
                    <Option key="none" value="" disabled>
                      {loadingComponents ? "Loading..." : `No components configured for ${categoryName}`}
                    </Option>
                  ) : (
                    components.map((c) => (
                      <Option key={c.ID} value={c.ID} text={c.ComponentName}>
                        {c.ComponentName}
                        {pendingComponentIds.has(c.ID) ? " (request pending)" : ""}
                      </Option>
                    ))
                  )}
                  <Option key="other-opt" value="OTHER" text="Other Component">
                    Others (Custom Component)
                  </Option>
                </Dropdown>
              </Field>

              {componentId === "OTHER" && (
                <Field label="Specify Other Component *" required>
                  <Input
                    placeholder="e.g., Dedicated GPU, Docking Station, Web Cam..."
                    value={customComponent}
                    onChange={(_, d) => setCustomComponent(d.value)}
                  />
                </Field>
              )}

              {hasPendingRequestForSelected && (
                <Text style={{ color: "#B8860B" }}>
                  You already have a pending upgrade request for this component. Wait for it to be decided before submitting another.
                </Text>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                <Field label="Current Specification" required>
                  <Input
                    placeholder="e.g., 16GB DDR4"
                    value={currentSpec}
                    disabled={currentSpecLocked}
                    onChange={(_, d) => setCurrentSpec(d.value)}
                  />
                </Field>
                <Field label="Requested Specification" required>
                  <Input
                    placeholder="e.g., 32GB DDR4"
                    value={requiredSpec}
                    onChange={(_, d) => setRequiredSpec(d.value)}
                  />
                </Field>
              </div>

              <Field label="Reason for Upgrade">
                <Textarea
                  placeholder="Please explain why you need this upgrade and how it will improve your productivity..."
                  resize="vertical"
                  rows={5}
                  value={reason}
                  onChange={(_, d) => setReason(d.value)}
                />
              </Field>
            </>
          )}

          {/* ===================== REPAIR FORM ===================== */}
          {requestType === "repair" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                <Field label="Issue Type" required>
                  <Dropdown
                    placeholder={loadingOptions ? "Loading..." : "Select Issue type"}
                    mountNode={mountNode}
                    disabled={loadingOptions}
                    value={issueTypeId === "OTHER" ? "Other Issue" : (issueTypes.find((i) => i.ID === issueTypeId)?.Name ?? "")}
                    onOptionSelect={(_, d) => setIssueTypeId(d.optionValue ?? "")}
                  >
                    {issueTypes.length === 0 ? (
                      <Option key="none" value="" disabled>
                        {loadingOptions ? "Loading..." : "No issue types configured"}
                      </Option>
                    ) : (
                      issueTypes.map((i) => (
                        <Option key={i.ID} value={i.ID}>
                          {i.Name}
                        </Option>
                      ))
                    )}
                    <Option key="other-issue-opt" value="OTHER">
                      Others (Custom Issue)
                    </Option>
                  </Dropdown>
                </Field>

                <Field label="Problem Category" required>
                  <Dropdown
                    placeholder={loadingOptions ? "Loading..." : "Select category"}
                    mountNode={mountNode}
                    disabled={loadingOptions}
                    value={problemCategoryId === "OTHER" ? "Other Category" : (problemCategories.find((p) => p.ID === problemCategoryId)?.Name ?? "")}
                    onOptionSelect={(_, d) => setProblemCategoryId(d.optionValue ?? "")}
                  >
                    {problemCategories.length === 0 ? (
                      <Option key="none" value="" disabled>
                        {loadingOptions ? "Loading..." : "No categories configured"}
                      </Option>
                    ) : (
                      problemCategories.map((p) => (
                        <Option key={p.ID} value={p.ID}>
                          {p.Name}
                        </Option>
                      ))
                    )}
                    <Option key="other-cat-opt" value="OTHER">
                      Others (General / Hardware)
                    </Option>
                  </Dropdown>
                </Field>
              </div>

              {issueTypeId === "OTHER" && (
                <Field label="Specify Issue Summary *" required>
                  <Input
                    placeholder="e.g., Display flickering, trackpad non-responsive..."
                    value={customIssueType}
                    onChange={(_, d) => setCustomIssueType(d.value)}
                  />
                </Field>
              )}

              <Field
                label="Problem Description"
                required
                hint="The more details you provide, the faster we can resolve the issue"
              >
                <Textarea
                  placeholder="Please describe the issue in detail. Include what happens, when it started, and any error messages..."
                  resize="vertical"
                  rows={6}
                  value={problem}
                  onChange={(_, d) => setProblem(d.value)}
                />
              </Field>

              <AssetFileUploadSection
                title="Attachment (Optional)"
                accept="image/jpeg,image/png"
                existingFiles={[]}
                pendingFiles={pendingAttachments}
                onFilesSelected={(files) => setPendingAttachments((prev) => [...prev, ...files])}
                onRemovePending={(index) => setPendingAttachments((prev) => prev.filter((_, i) => i !== index))}
                onDeleteExisting={async () => {}}
              />
            </>
          )}

          {error && <Text style={{ color: "var(--colorPaletteRedForeground1)" }}>{error}</Text>}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
              paddingTop: "16px",
              borderTop: "1px solid #E2E8F0",
              marginTop: "auto",
            }}
          >
            <Button appearance="secondary" onClick={() => onOpenChange(false)} disabled={submitting} style={{ borderRadius: "9999px", padding: "8px 22px" }}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={submitting || (requestType === "upgrade" && hasPendingRequestForSelected)}
              style={{
                background: "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)",
                borderRadius: "9999px",
                padding: "8px 26px",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0, 126, 213, 0.25)",
              }}
            >
              {submitting ? (
                <Spinner size="tiny" />
              ) : requestType === "upgrade" ? (
                "Submit Request"
              ) : (
                "Submit Repair Request"
              )}
            </Button>
          </div>
        </div>
      </DrawerBody>
    </Drawer>
  );
};

export default AssetServiceRequestPanel;
