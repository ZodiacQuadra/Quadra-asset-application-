import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Badge, Text, Title2, Title3, Caption1, Spinner, Divider } from "@fluentui/react-components";
import { ArrowLeftRegular, WarningRegular, MailRegular, CalendarRegular, PersonRegular } from "@fluentui/react-icons";
import { getAssetHRRequestDetail, AssetHRRequestDetail, AssetHRRequestItemDetail } from "../Services/AssetHRRequestService";

const STATUS_COLOR: Record<string, "warning" | "informative" | "success" | "danger"> = {
  Pending: "warning",
  InProgress: "informative",
  Approved: "informative",
  Completed: "success",
  Rejected: "danger",
};

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN");
};

const formatDateTime = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
    <div style={{ color: "#605E5C", marginTop: "2px" }}>{icon}</div>
    <div>
      <Caption1 style={{ color: "#605E5C", display: "block" }}>{label}</Caption1>
      <Text weight="medium">{value}</Text>
    </div>
  </div>
);

const HRRequestFullDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<AssetHRRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAssetHRRequestDetail(id);
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load HR request details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const itemsByApplicant = (applicantId: string): AssetHRRequestItemDetail[] =>
    (detail?.items ?? []).filter((item) => item.ApplicantAssetHRReqID === applicantId);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
        <Spinner label="Loading request details..." />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: "16px" }}>
        <Button appearance="subtle" icon={<ArrowLeftRegular />} onClick={() => navigate("/Asset/admin-approval")}>
          Back to Admin Approval
        </Button>
        <Text style={{ display: "block", marginTop: "16px", color: "#A80000" }}>
          {error ?? "HR request not found"}
        </Text>
      </div>
    );
  }

  const { request, applicants } = detail;

  return (
    <div style={{ padding: "16px", maxWidth: "1100px", margin: "0 auto" }}>
      <Button appearance="subtle" icon={<ArrowLeftRegular />} onClick={() => navigate("/Asset/admin-approval")}>
        Back to Admin Approval
      </Button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
          marginTop: "18px",
        }}
      >
        <div>
          <Title2>{request.HRRequestID}</Title2>
          <Caption1 style={{ color: "#605E5C" }}>HR Asset Request — Full Details</Caption1>
        </div>
        <Badge appearance="tint" color={STATUS_COLOR[request.Status]} size="extra-large">
          {request.Status}
        </Badge>
      </div>

      <div
        style={{
          background: "#FAF9F8",
          border: "1px solid #E1DFDD",
          borderRadius: "10px",
          padding: "20px",
          marginTop: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "8px",
        }}
      >
        <InfoRow icon={<PersonRegular />} label="Requested By" value={request.RequestedUserName ?? "—"} />
        <InfoRow icon={<MailRegular />} label="Requestor Email" value={request.RequestedUserMailID ?? "—"} />
        <InfoRow icon={<PersonRegular />} label="Assigned Admin(s)" value={request.AssignedAdminName ?? "—"} />
        <InfoRow icon={<MailRegular />} label="Admin Email(s)" value={request.AssignedAdminMailID ?? "—"} />
        <InfoRow icon={<CalendarRegular />} label="Created On" value={formatDateTime(request.CreatedAt)} />
        <InfoRow icon={<CalendarRegular />} label="Last Modified" value={formatDateTime(request.ModifiedAt)} />
      </div>

      <Divider style={{ margin: "28px 0 16px" }} />

      <Title3>Applicants ({applicants.length})</Title3>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
        {applicants.map((applicant) => {
          const items = itemsByApplicant(applicant.ID);
          return (
            <div
              key={applicant.ID}
              style={{
                border: "1px solid #E1DFDD",
                borderRadius: "10px",
                padding: "18px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <Text size={400} weight="semibold">
                    {applicant.ApplicantName}
                  </Text>
                  <br />
                  <Caption1 style={{ color: "#605E5C" }}>{applicant.ApplicantMailID}</Caption1>
                </div>
                <Badge appearance="tint" color={STATUS_COLOR[applicant.Status]}>
                  {applicant.Status}
                </Badge>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "8px",
                  marginTop: "14px",
                }}
              >
                <InfoRow icon={<CalendarRegular />} label="Joining Date" value={formatDate(applicant.JoiningDate)} />
                <InfoRow icon={<MailRegular />} label="Work Email" value={applicant.WorkEmail ?? "—"} />
              </div>

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
                    margin: "10px 0",
                  }}
                >
                  <WarningRegular style={{ color: "#7A5D00" }} />
                  <Text size={200} style={{ color: "#7A5D00" }}>
                    This user is not added on the Entra ID — assets can't be assigned until they have a work account.
                  </Text>
                </div>
              )}

              <Divider style={{ margin: "14px 0" }} />

              <Caption1 style={{ color: "#605E5C", display: "block", marginBottom: "8px" }}>
                Requested Categories ({items.length})
              </Caption1>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {items.map((item) => (
                  <div
                    key={item.ID}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "8px",
                      padding: "10px 12px",
                      border: "1px solid #EDEBE9",
                      borderRadius: "8px",
                      background: "#FFFFFF",
                    }}
                  >
                    <Text weight="medium">{item.CategoryName}</Text>
                    <Badge appearance="tint" color={STATUS_COLOR[item.Status]}>
                      {item.Status}
                    </Badge>
                    {item.Status === "Completed" ? (
                      <Caption1 style={{ color: "#605E5C" }}>
                        Approved by {item.ApprovedAdminName ?? "—"} ({item.ApprovedAdminMailID ?? "—"}) on{" "}
                        {formatDateTime(item.ApprovedDate)}
                      </Caption1>
                    ) : (
                      <Caption1 style={{ color: "#605E5C" }}>Not yet assigned</Caption1>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HRRequestFullDetail;
