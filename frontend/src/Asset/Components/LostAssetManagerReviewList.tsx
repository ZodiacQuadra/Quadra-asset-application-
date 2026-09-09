import React, { useState } from "react";
import {
  Card,
  Button,
  Text,
  Badge,
  Spinner,
  Textarea,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import { CheckmarkCircleRegular, DismissCircleRegular, WarningRegular } from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import TruncatedText from "../../Common/TruncatedText";
import { AssetLostRequestRecord, managerActionOnLostRequest } from "../Services/AssetLostRequestService";

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN");

interface LostAssetManagerReviewListProps {
  requests: AssetLostRequestRecord[];
  onActionComplete: () => void;
}

// Manager's single batch decision on an Employee-filed Lost Asset report —
// one Approve/Reject for the whole request (confirming "yes this happened"),
// not per-asset; Admin still makes the per-asset stock/replacement calls
// afterward via the Lost Assets tab on Admin Approval, unchanged.
const LostAssetManagerReviewList: React.FC<LostAssetManagerReviewListProps> = ({ requests, onActionComplete }) => {
  const { currentUser } = useAuth();
  const toasterId = useId("lost-asset-manager-review-toaster");
  const { dispatchToast } = useToastController(toasterId);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const pending = requests.filter((r) => r.ManagerApprovalStatus === "Pending");

  const handleAction = async (request: AssetLostRequestRecord, action: "Approve" | "Reject", note?: string) => {
    if (!currentUser?.userID) return;
    setActingId(request.ID);
    try {
      await managerActionOnLostRequest(request.ID, action, currentUser.userID, currentUser.displayName, note);
      dispatchToast(
        <Toast>
          <ToastTitle>{action === "Approve" ? "Request approved — sent to Admin" : "Request rejected"}</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setRejectingId(null);
      setReason("");
      onActionComplete();
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to record decision"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setActingId(null);
    }
  };

  if (pending.length === 0) {
    return <Text style={{ color: "#605E5C", padding: "20px 0" }}>No lost asset reports awaiting your approval.</Text>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Toaster toasterId={toasterId} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
        {pending.map((request) => {
          const acting = actingId === request.ID;
          const rejecting = rejectingId === request.ID;
          return (
            <Card key={request.ID} className="border border-gray-200" style={{ padding: "16px", borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "#FDE7E9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <WarningRegular fontSize={18} style={{ color: "#D13438" }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <TruncatedText text={request.RequestNumber ?? request.ID} weight="semibold" />
                  <TruncatedText text={request.EmployeeName ?? "Unknown"} size={200} color="#605E5C" />
                </div>
                <Badge appearance="tint" color="danger">
                  {request.ItemCount} asset{request.ItemCount === 1 ? "" : "s"}
                </Badge>
              </div>

              <Text size={200} style={{ color: "#605E5C", display: "block", marginTop: "10px" }}>
                Lost on {formatDate(request.LostDate)}
              </Text>
              <Text size={200} style={{ display: "block", marginTop: "4px" }}>
                {request.HowLost}
              </Text>
              {request.AdditionalDetails && (
                <Text size={200} style={{ color: "#605E5C", display: "block", marginTop: "4px", whiteSpace: "pre-wrap" }}>
                  {request.AdditionalDetails}
                </Text>
              )}

              {!rejecting ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                    marginTop: "14px",
                    paddingTop: "10px",
                    borderTop: "1px solid #F3F2F1",
                  }}
                >
                  <Button
                    appearance="outline"
                    icon={<DismissCircleRegular />}
                    disabled={acting}
                    onClick={() => {
                      setRejectingId(request.ID);
                      setReason("");
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    appearance="primary"
                    style={{ background: "#007ED5", borderColor: "#007ED5" }}
                    icon={acting ? <Spinner size="tiny" /> : <CheckmarkCircleRegular />}
                    disabled={acting}
                    onClick={() => handleAction(request, "Approve")}
                  >
                    Approve
                  </Button>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: "14px",
                    paddingTop: "10px",
                    borderTop: "1px solid #F3F2F1",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <Textarea placeholder="Reason for rejecting this report..." value={reason} onChange={(_, d) => setReason(d.value)} rows={2} />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <Button appearance="secondary" size="small" disabled={acting} onClick={() => setRejectingId(null)}>
                      Cancel
                    </Button>
                    <Button
                      appearance="primary"
                      size="small"
                      disabled={acting || !reason.trim()}
                      icon={acting ? <Spinner size="tiny" /> : undefined}
                      onClick={() => handleAction(request, "Reject", reason)}
                    >
                      Confirm Reject
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LostAssetManagerReviewList;
