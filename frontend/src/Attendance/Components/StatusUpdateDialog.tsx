import * as React from "react";
import {
  Dialog,
  DialogSurface,
  Button,
  Avatar,
  Text,
  Badge,
  makeStyles,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import {
  Warning24Filled,
  CheckmarkCircle24Filled,
  PersonProhibited24Regular,
  PersonAvailable24Regular,
  CalendarMonth24Regular,
  ClockAlarm24Regular,
  LocationOff24Regular,
  TaskListLtr24Regular,
} from "@fluentui/react-icons";
import { EntraADUser } from "../../Services/EntraADUserService";

interface StatusUpdateDialogProps {
  user: EntraADUser | null;
  newStatus: boolean;
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const useStyles = makeStyles({
  banner: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    ...shorthands.padding("14px", "24px"),
  },
  bannerDisable: {
    background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
    borderBottom: "1px solid #fecdd3",
  },
  bannerEnable: {
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    borderBottom: "1px solid #bbf7d0",
  },
  bannerIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    ...shorthands.borderRadius("10px"),
    flexShrink: 0,
  },
  bannerIconDisable: { background: "#fee2e2" },
  bannerIconEnable: { background: "#dcfce7" },
  body: {
    ...shorthands.padding("20px", "24px", "8px"),
  },
  personaCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    ...shorthands.padding("14px", "16px"),
    ...shorthands.borderRadius("12px"),
    background: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: "20px",
  },
  personaMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
    flex: 1,
  },
  personaName: {
    fontWeight: 700,
    fontSize: "15px",
    color: tokens.colorNeutralForeground1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  personaSub: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  warningBox: {
    ...shorthands.borderRadius("10px"),
    ...shorthands.padding("14px", "16px"),
    marginBottom: "16px",
  },
  warningBoxDisable: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
  },
  warningBoxEnable: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
  },
  warningTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "10px",
  },
  impactList: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },
  impactItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  impactIconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "26px",
    height: "26px",
    ...shorthands.borderRadius("6px"),
    flexShrink: 0,
  },
  footerActions: {
    ...shorthands.padding("16px", "24px", "20px"),
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  confirmBtnDisable: {
    background: "#dc2626",
    color: "#fff",
    fontWeight: 700,
    ...shorthands.borderRadius("8px"),
    ":hover": { background: "#b91c1c" },
  },
  confirmBtnEnable: {
    background: "#16a34a",
    color: "#fff",
    fontWeight: 700,
    ...shorthands.borderRadius("8px"),
    ":hover": { background: "#15803d" },
  },
  cancelBtn: {
    fontWeight: 600,
    ...shorthands.borderRadius("8px"),
  },
});

const DISABLE_IMPACTS = [
  { icon: <CalendarMonth24Regular />, color: "#dc2626", bg: "#fee2e2", label: "Leave & attendance requests blocked" },
  { icon: <ClockAlarm24Regular />,    color: "#d97706", bg: "#fef3c7", label: "Check-in / Check-out access removed" },
  { icon: <LocationOff24Regular />,   color: "#7c3aed", bg: "#ede9fe", label: "Geofence tracking suspended" },
  { icon: <TaskListLtr24Regular />,   color: "#0369a1", bg: "#e0f2fe", label: "Regularisation & approvals disabled" },
];

const ENABLE_IMPACTS = [
  { icon: <CalendarMonth24Regular />, color: "#16a34a", bg: "#dcfce7", label: "Leave & attendance requests restored" },
  { icon: <ClockAlarm24Regular />,    color: "#0369a1", bg: "#e0f2fe", label: "Check-in / Check-out access reinstated" },
  { icon: <LocationOff24Regular />,   color: "#7c3aed", bg: "#ede9fe", label: "Geofence tracking re-activated" },
  { icon: <TaskListLtr24Regular />,   color: "#d97706", bg: "#fef3c7", label: "Regularisation & approvals available" },
];

export const StatusUpdateDialog: React.FC<StatusUpdateDialogProps> = ({
  user, newStatus, open, onClose, onSubmit, isLoading,
}) => {
  const styles = useStyles();
  const isDisabling = !newStatus;
  const impacts = isDisabling ? DISABLE_IMPACTS : ENABLE_IMPACTS;

  return (
    <Dialog
      open={open}
      onOpenChange={(_, data) => { if (!data.open) onClose(); }}
    >
      <DialogSurface style={{
        maxWidth: "480px",
        width: "100%",
        borderRadius: "16px",
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* ── Colour-coded Banner ── */}
          <div className={`${styles.banner} ${isDisabling ? styles.bannerDisable : styles.bannerEnable}`}>
            <div className={`${styles.bannerIcon} ${isDisabling ? styles.bannerIconDisable : styles.bannerIconEnable}`}>
              {isDisabling
                ? <Warning24Filled style={{ color: "#dc2626", fontSize: "20px" }} />
                : <CheckmarkCircle24Filled style={{ color: "#16a34a", fontSize: "20px" }} />
              }
            </div>
            <div>
              <Text weight="bold" size={400} style={{ color: isDisabling ? "#991b1b" : "#14532d", display: "block" }}>
                {isDisabling ? "Disable Account Access" : "Re-enable Account Access"}
              </Text>
              <Text size={200} style={{ color: isDisabling ? "#b91c1c" : "#166534" }}>
                {isDisabling
                  ? "This user will lose access to all attendance modules"
                  : "This user will regain full attendance module access"
                }
              </Text>
            </div>
          </div>

          {/* ── Body ── */}
          <div className={styles.body}>

            {/* Persona Card */}
            {user && (
              <div className={styles.personaCard}>
                <Avatar
                  name={user.DisplayName}
                  size={48}
                  color={isDisabling ? "dark-red" : "forest"}
                  badge={isDisabling ? { status: "blocked" } : { status: "available" }}
                />
                <div className={styles.personaMeta}>
                  <span className={styles.personaName}>{user.DisplayName}</span>
                  <span className={styles.personaSub}>{user.Mail}</span>
                  {(user.JobTitle || user.Department) && (
                    <span className={styles.personaSub}>
                      {[user.JobTitle, user.Department].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
                <Badge
                  appearance="filled"
                  color={isDisabling ? "danger" : "success"}
                  style={{ flexShrink: 0, fontWeight: 700 }}
                >
                  {isDisabling ? "Disabling" : "Enabling"}
                </Badge>
              </div>
            )}

            {/* Impact Box */}
            <div className={`${styles.warningBox} ${isDisabling ? styles.warningBoxDisable : styles.warningBoxEnable}`}>
              <div className={styles.warningTitle}>
                {isDisabling
                  ? <PersonProhibited24Regular style={{ color: "#ea580c", fontSize: "18px" }} />
                  : <PersonAvailable24Regular  style={{ color: "#16a34a", fontSize: "18px" }} />
                }
                <Text weight="semibold" size={300} style={{ color: isDisabling ? "#9a3412" : "#14532d" }}>
                  {isDisabling
                    ? "The following attendance capabilities will be restricted:"
                    : "The following attendance capabilities will be restored:"
                  }
                </Text>
              </div>
              <div className={styles.impactList}>
                {impacts.map((item, i) => (
                  <div key={i} className={styles.impactItem}>
                    <div className={styles.impactIconWrap} style={{ background: item.bg }}>
                      {React.cloneElement(item.icon as React.ReactElement, {
                        style: { color: item.color, fontSize: "14px" },
                      })}
                    </div>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                      {item.label}
                    </Text>
                  </div>
                ))}
              </div>
            </div>

            <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: "block", marginBottom: "4px" }}>
              {isDisabling
                ? "You can re-enable this account at any time. This action does not delete any data."
                : "The user will be able to log attendance, apply for leave, and use all modules immediately."
              }
            </Text>

          </div>

          {/* ── Footer Actions ── */}
          <div className={styles.footerActions}>
            <Button
              appearance="secondary"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              appearance="primary"
              className={isDisabling ? styles.confirmBtnDisable : styles.confirmBtnEnable}
              onClick={onSubmit}
              disabled={isLoading}
              icon={isDisabling ? <PersonProhibited24Regular /> : <PersonAvailable24Regular />}
            >
              {isLoading
                ? (isDisabling ? "Disabling…" : "Enabling…")
                : (isDisabling ? "Yes, Disable Access" : "Yes, Enable Access")
              }
            </Button>
          </div>

        </div>
      </DialogSurface>
    </Dialog>
  );
};