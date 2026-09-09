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
  Spinner,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import { Dismiss24Regular, WarningRegular } from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import AssetFileUploadSection from "./AssetFileUploadSection";
import { RepairIssueTypeService, RepairProblemCategoryService, RepairMasterRecord } from "../Services/RepairRequestMasterService";
import { createAssetRepairRequest, uploadRepairRequestAttachments } from "../Services/AssetRepairRequestService";

interface ReportIssueRepairPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  onSubmitted: () => void;
}

const ReportIssueRepairPanel: React.FC<ReportIssueRepairPanelProps> = ({ open, onOpenChange, assetId, onSubmitted }) => {
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("report-issue-repair-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [issueTypes, setIssueTypes] = useState<RepairMasterRecord[]>([]);
  const [problemCategories, setProblemCategories] = useState<RepairMasterRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [issueTypeId, setIssueTypeId] = useState("");
  const [problemCategoryId, setProblemCategoryId] = useState("");
  const [problem, setProblem] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setIssueTypeId("");
    setProblemCategoryId("");
    setProblem("");
    setPendingAttachments([]);
    setError(null);
    setLoadingOptions(true);
    Promise.all([RepairIssueTypeService.list(), RepairProblemCategoryService.list()])
      .then(([issues, problems]) => {
        setIssueTypes(issues);
        setProblemCategories(problems);
      })
      .catch((err) => {
        dispatchToast(
          <Toast>
            <ToastTitle>{err instanceof Error ? err.message : "Failed to load form options"}</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      })
      .finally(() => setLoadingOptions(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async () => {
    const issueTypeName = issueTypes.find((i) => i.ID === issueTypeId)?.Name;
    const problemCategoryName = problemCategories.find((p) => p.ID === problemCategoryId)?.Name;
    if (!issueTypeName) {
      setError("Please select an issue type.");
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
                Request {result.RequestNumber} submitted, but attachments failed to upload: {uploadErr?.message || "unknown error"}
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

  return (
    <Drawer type="overlay" separator open={open} position="end" onOpenChange={(_, data) => onOpenChange(data.open)} style={{ width: "min(520px, 90vw)" }}>
      <Toaster toasterId={toasterId} />
      {portal}
      <DrawerHeader>
        <DrawerHeaderTitle
          action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => onOpenChange(false)} />}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "#FDE7E9", borderRadius: "8px", padding: "8px", color: "#D13438" }}>
              <WarningRegular />
            </div>
            Report Issue &amp; Request Repair
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <Field label="Issue Type" required>
              <Dropdown
                placeholder={loadingOptions ? "Loading..." : "Select Issue type"}
                mountNode={mountNode}
                disabled={loadingOptions}
                value={issueTypes.find((i) => i.ID === issueTypeId)?.Name ?? ""}
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
              </Dropdown>
            </Field>
            <Field label="Problem Category" required>
              <Dropdown
                placeholder={loadingOptions ? "Loading..." : "Select category"}
                mountNode={mountNode}
                disabled={loadingOptions}
                value={problemCategories.find((p) => p.ID === problemCategoryId)?.Name ?? ""}
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
              </Dropdown>
            </Field>
          </div>

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

          {error && <Text style={{ color: "var(--colorPaletteRedForeground1)" }}>{error}</Text>}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <Button appearance="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Spinner size="tiny" /> : "Submit Repair Request"}
            </Button>
          </div>
        </div>
      </DrawerBody>
    </Drawer>
  );
};

export default ReportIssueRepairPanel;
