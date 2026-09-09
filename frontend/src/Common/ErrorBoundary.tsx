import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Without this, any uncaught render error anywhere in the tree unmounts the
// whole app to a blank white screen with nothing in the console (React only
// logs synchronously at the moment the error is thrown — easy to miss if
// DevTools wasn't already open). This surfaces the actual error message
// instead, so a "white page" report always comes with a stack trace.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught render error:", error, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  handleGoDashboard = () => {
    this.setState({ error: null });
    window.location.hash = "#/Asset/dashboard";
  };

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: "48px 24px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            fontFamily: "var(--fontFamilyBase, sans-serif)",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "16px",
              padding: "36px 32px",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#FEF2F2",
                color: "#EF4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                margin: "0 auto 18px",
              }}
            >
              ⚠️
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>
              Unable to display this view
            </h2>
            <p style={{ fontSize: "14px", color: "#64748B", margin: "0 0 20px", lineHeight: "1.5" }}>
              A technical issue occurred while loading this section. You can try refreshing the component or returning to your Dashboard.
            </p>
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "12px",
                color: "#94A3B8",
                textAlign: "left",
                fontFamily: "monospace",
                maxHeight: "100px",
                overflowY: "auto",
                marginBottom: "24px",
              }}
            >
              {this.state.error.message || "Unknown error"}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button
                type="button"
                onClick={this.handleRetry}
                style={{
                  background: "#007ED5",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "9999px",
                  padding: "8px 22px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleGoDashboard}
                style={{
                  background: "#FFFFFF",
                  color: "#475569",
                  border: "1px solid #CBD5E1",
                  borderRadius: "9999px",
                  padding: "8px 22px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
