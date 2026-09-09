import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Spinner,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@fluentui/react-components";
import {
  CheckmarkCircleFilled,
  LaptopRegular,
  DesktopRegular,
  CallRegular,
  PhoneRegular,
  CursorClickRegular,
  KeyboardRegular,
  TvRegular,
  BatteryChargeRegular,
  GridRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { createAssetRequest } from "../Services/AssetInventoryService";
import { getAssetCategoryComponents, AssetCategoryComponentRecord } from "../Services/AssetCategoryComponentService";
import { getAssetRoleCategoryUsage, AssetRoleCategoryUsageItem } from "../Services/AssetRoleTemplateService";

interface PresetAssetType {
  name: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const PRESET_ASSET_TYPES: PresetAssetType[] = [
  { name: "Laptop", icon: <LaptopRegular />, iconBg: "#EFF6FF", iconColor: "#2563EB" },
  { name: "Monitor", icon: <DesktopRegular />, iconBg: "#ECFDF5", iconColor: "#10B981" },
  { name: "Telephone", icon: <CallRegular />, iconBg: "#FFF7ED", iconColor: "#EA580C" },
  { name: "Mobile Phone", icon: <PhoneRegular />, iconBg: "#FAF5FF", iconColor: "#9333EA" },
  { name: "Mouse", icon: <CursorClickRegular />, iconBg: "#FEF2F2", iconColor: "#EF4444" },
  { name: "Keyboard", icon: <KeyboardRegular />, iconBg: "#FDF2F8", iconColor: "#DB2777" },
  { name: "HDMI Cable", icon: <TvRegular />, iconBg: "#FEF9C3", iconColor: "#CA8A04" },
  { name: "Laptop Charger", icon: <BatteryChargeRegular />, iconBg: "#ECFEFF", iconColor: "#0891B2" },
  { name: "Others", icon: <GridRegular />, iconBg: "#F0FDF4", iconColor: "#16A34A" },
];

const NewAssetRequest: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("new-asset-request-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [roleName, setRoleName] = useState<string | null>(null);
  const [roleUsage, setRoleUsage] = useState<AssetRoleCategoryUsageItem[]>([]);
  const [selectedAssetType, setSelectedAssetType] = useState<string>("Laptop");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [components, setComponents] = useState<AssetCategoryComponentRecord[]>([]);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [specValues, setSpecValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!currentUser?.userID) return;
    (async () => {
      try {
        const usage = await getAssetRoleCategoryUsage(currentUser.userID as string);
        const demoUsage =
          !usage.roleName && currentUser.userID === "local-admin"
            ? {
                roleName: "Standard Employee Role",
                items: [
                  { CategoryID: "a786ba8b-a9a3-461f-9d08-2ce76220fe37", CategoryName: "Laptop", RoleQuantity: 2, HeldCount: 0, PendingCount: 0, Remaining: 2 },
                  { CategoryID: "6ac84f7b-90be-471d-9ee4-f588656af194", CategoryName: "Mobile Phone", RoleQuantity: 2, HeldCount: 0, PendingCount: 0, Remaining: 2 },
                  { CategoryID: "2a4a1ef6-eed8-46a6-b0c3-51c51d84a52c", CategoryName: "Monitor", RoleQuantity: 2, HeldCount: 0, PendingCount: 0, Remaining: 2 },
                ],
              }
            : usage;
        setRoleName(demoUsage.roleName || "Standard Employee Role");
        setRoleUsage(demoUsage.items);
      } catch {
        // Fallback for role usage
        setRoleName("Standard Employee Role");
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser?.userID]);

  // Find matching category ID from roleUsage or fallback
  const matchedCategory = roleUsage.find(
    (c) => c.CategoryName.toLowerCase() === selectedAssetType.toLowerCase()
  );

  useEffect(() => {
    if (!matchedCategory?.CategoryID) {
      setComponents([]);
      setSpecValues({});
      return;
    }
    setComponentsLoading(true);
    setSpecValues({});
    getAssetCategoryComponents(matchedCategory.CategoryID)
      .then(setComponents)
      .catch(() => setComponents([]))
      .finally(() => setComponentsLoading(false));
  }, [matchedCategory?.CategoryID]);

  const handleConfirmSubmit = async () => {
    if (!selectedAssetType) {
      dispatchToast(
        <Toast>
          <ToastTitle>Please select an asset type</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }
    if (!purpose.trim()) {
      dispatchToast(
        <Toast>
          <ToastTitle>Please describe the purpose of the request</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }
    if (!currentUser?.userID) return;

    setSubmitting(true);
    try {
      const componentSpecs = Object.entries(specValues)
        .filter(([, value]) => value.trim().length > 0)
        .map(([componentId, value]) => ({ ComponentID: componentId, SpecValue: value.trim() }));

      const result = await createAssetRequest({
        AssetType: selectedAssetType,
        CategoryID: matchedCategory?.CategoryID || "a786ba8b-a9a3-461f-9d08-2ce76220fe37",
        PurposeOfRequest: purpose.trim(),
        requestedByUserId: currentUser.userID,
        ComponentSpecs: componentSpecs.length ? componentSpecs : undefined,
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Request {result.RequestNumber} submitted successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setConfirmOpen(false);
      navigate("/Asset/my-requests");
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to submit request"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toaster toasterId={toasterId} />
      {portal}
      <div
        style={{
          padding: "28px 36px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#0F172A" }}>
          New Request
        </h1>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <Spinner label="Loading request form..." />
          </div>
        ) : (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "20px",
              padding: "32px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "28px",
            }}
          >
            {/* Asset Type Section with 3x3 Grid */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1E293B",
                  marginBottom: "16px",
                }}
              >
                Asset Type <span style={{ color: "#EF4444" }}>*</span>
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "16px",
                }}
              >
                {PRESET_ASSET_TYPES.map((type) => {
                  const isSelected = selectedAssetType === type.name;

                  return (
                    <div
                      key={type.name}
                      onClick={() => setSelectedAssetType(type.name)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        borderRadius: "14px",
                        border: isSelected ? "2px solid #007ED5" : "1px solid #E2E8F0",
                        background: isSelected ? "#F0F7FF" : "#FFFFFF",
                        cursor: "pointer",
                        boxShadow: isSelected ? "0 4px 14px rgba(0, 126, 213, 0.12)" : "0 1px 3px rgba(0,0,0,0.02)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "#CBD5E1";
                          e.currentTarget.style.background = "#F8FAFC";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "#E2E8F0";
                          e.currentTarget.style.background = "#FFFFFF";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            background: type.iconBg,
                            color: type.iconColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            flexShrink: 0,
                          }}
                        >
                          {type.icon}
                        </div>
                        <span
                          style={{
                            fontSize: "14.5px",
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? "#007ED5" : "#1E293B",
                          }}
                        >
                          {type.name}
                        </span>
                      </div>

                      {isSelected && (
                        <CheckmarkCircleFilled style={{ color: "#007ED5", fontSize: "20px", flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Specifications if category has components */}
            {selectedAssetType && componentsLoading ? (
              <Spinner size="tiny" label="Loading specifications..." />
            ) : (
              components.length > 0 && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1E293B",
                      marginBottom: "12px",
                    }}
                  >
                    Specifications (Optional)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                    {components.map((comp) => (
                      <div key={comp.ComponentID}>
                        <label style={{ fontSize: "12.5px", color: "#64748B", fontWeight: 500, display: "block", marginBottom: "4px" }}>
                          {comp.ComponentName}
                        </label>
                        <input
                          type="text"
                          placeholder={`e.g. ${comp.DefaultSpec || "Required spec"}`}
                          value={specValues[comp.ComponentID] || ""}
                          onChange={(e) => setSpecValues({ ...specValues, [comp.ComponentID]: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            border: "1px solid #CBD5E1",
                            borderRadius: "10px",
                            fontSize: "13.5px",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* Purpose of Request Section */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1E293B",
                  marginBottom: "8px",
                }}
              >
                Purpose of Request <span style={{ color: "#EF4444" }}>*</span>
              </label>

              <textarea
                rows={5}
                placeholder="e.g., Laptop, i7, 16GB RAM, 512GM SSD for software development work"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                style={{
                  width: "100%",
                  padding: "16px",
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                  outline: "none",
                  color: "#1E293B",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#007ED5")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              />
            </div>

            {/* Bottom Actions: Cancel and Submit Request */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "14px",
                paddingTop: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/Asset/my-requests")}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  color: "#475569",
                  borderRadius: "9999px",
                  padding: "9px 26px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!purpose.trim()) {
                    dispatchToast(
                      <Toast>
                        <ToastTitle>Please enter a purpose for the request</ToastTitle>
                      </Toast>,
                      { intent: "error" }
                    );
                    return;
                  }
                  setConfirmOpen(true);
                }}
                style={{
                  background: "#007ED5",
                  border: "none",
                  color: "#FFFFFF",
                  borderRadius: "9999px",
                  padding: "10px 28px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0, 126, 213, 0.25)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#006bb8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#007ED5")}
              >
                Submit Request
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal - matching New Request-  Employee-1.png */}
      <Dialog open={confirmOpen} onOpenChange={(_, d) => setConfirmOpen(d.open)}>
        <DialogSurface mountNode={mountNode} style={{ borderRadius: "20px", padding: "32px", maxWidth: "460px" }}>
          <DialogBody>
            <DialogTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1E293B", textAlign: "center" }}>
              Are you sure you want to request a New Asset?
            </DialogTitle>
            <DialogContent style={{ textAlign: "center", color: "#64748B", fontSize: "14px", marginTop: "8px" }}>
              A request for <strong>{selectedAssetType}</strong> will be submitted to your manager for review.
            </DialogContent>
            <DialogActions style={{ justifyContent: "center", gap: "16px", marginTop: "24px" }}>
              <Button
                appearance="secondary"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                style={{ borderRadius: "9999px", padding: "8px 24px" }}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                style={{
                  borderRadius: "9999px",
                  padding: "8px 28px",
                  background: "#007ED5",
                  borderColor: "#007ED5",
                }}
              >
                {submitting ? <Spinner size="tiny" /> : "Confirm"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default NewAssetRequest;
