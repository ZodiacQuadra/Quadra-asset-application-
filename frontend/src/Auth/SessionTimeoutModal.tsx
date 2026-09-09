import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogActions,
  ProgressBar,
  Text,
} from "@fluentui/react-components";
import {
  Warning28Filled,
  LockClosed28Filled,
} from "@fluentui/react-icons";

interface SessionTimeoutModalProps {
  open: boolean;
  countdown: number; // seconds remaining (0–300)
  reason: "inactivity" | "auth";
  onContinue: () => void;
  onLogout: () => void;
  isTeamsContext: boolean;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SessionTimeoutModal({
  open,
  countdown,
  reason,
  onContinue,
  onLogout,
  isTeamsContext,
}: SessionTimeoutModalProps) {
  const isInactivity = reason === "inactivity";
  const accentColor = isInactivity ? "#c47f17" : "#d13438";
  const accentBg = isInactivity ? "#fff8ec" : "#fdf3f3";

  return (
    <Dialog open={open} modalType="alert">
      <DialogSurface
        backdrop={{ style: { backgroundColor: "rgba(0, 0, 0, 0.55)", backdropFilter: "blur(2px)" } }}
        style={{
          maxWidth: 400,
          width: "100%",
          backgroundColor: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 16px 48px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)",
          padding: 0,
          overflow: "hidden",
          border: "none",
        }}
      >
        {/* Coloured top accent bar */}
        <div style={{ height: 4, backgroundColor: accentColor, width: "100%" }} />

        <DialogBody style={{ padding: "28px 28px 24px" }}>
          

          <DialogTitle
            style={{
              textAlign: "center",
              color: "#201f1e",
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: 0,
              padding: 0,
            }}
            action={null}
          >
            {isInactivity ? "Session About to Expire" : "Session Expired"}
          </DialogTitle>

          <DialogContent style={{ paddingTop: 12, paddingBottom: 20, textAlign: "center" }}>
            {isInactivity ? (
              <>
                <Text block style={{ color: "#605e5c", marginBottom: 20, lineHeight: 1.6 }}>
                  You've been inactive for a while. Your session will expire in
                </Text>

                {/* Countdown display */}
                <div
                  style={{
                    display: "inline-block",
                    backgroundColor: accentBg,
                    border: `1.5px solid ${accentColor}44`,
                    borderRadius: 8,
                    padding: "8px 24px",
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: accentColor,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: 1,
                    }}
                  >
                    {formatCountdown(countdown)}
                  </Text>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 6 }}>
                  <ProgressBar value={countdown / 300} color="warning" thickness="large" />
                </div>
                <Text size={200} style={{ color: "#a19f9d" }}>
                  Time remaining before automatic sign-out
                </Text>
              </>
            ) : isTeamsContext ? (
              <Text block style={{ color: "#605e5c", lineHeight: 1.6 }}>
                Your session has expired. Please close and re-open this tab to sign in again.
              </Text>
            ) : (
              <Text block style={{ color: "#605e5c", lineHeight: 1.6 }}>
                Your session has expired. Please sign in again to continue.
              </Text>
            )}
          </DialogContent>

          <DialogActions
            style={{
              flexDirection: "row",
              justifyContent: isInactivity ? "space-between" : "flex-end",
              gap: 12,
              paddingTop: 8,
              paddingBottom: 4,
              borderTop: "1px solid #f3f2f1",
              marginTop: 8,
            }}
          >
            <Button
              appearance="subtle"
              size="large"
              style={{
                flex: isInactivity ? 1 : undefined,
                minWidth: 120,
                borderRadius: 6,
                color: "#605e5c",
                height: 40,
              }}
              onClick={onLogout}
            >
              {isInactivity ? "Sign Out" : "Close"}
            </Button>
            {isInactivity && (
              <Button
                appearance="primary"
                size="large"
                style={{
                  flex: 1,
                  minWidth: 140,
                  backgroundColor: "#0078D4",
                  color: "#ffffff",
                  borderRadius: 6,
                  fontWeight: 600,
                  height: 40,
                }}
                onClick={onContinue}
              >
                Stay Signed In
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
