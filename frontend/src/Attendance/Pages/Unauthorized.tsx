import React from "react";
import { Text, Button } from "@fluentui/react-components";
import { LockClosed24Regular } from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                minHeight: "100vh",
                backgroundColor: "transparent",
                padding: "24px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                    backgroundColor: "transparent",
                    borderRadius: "12px",
                    padding: "48px 40px",
                    maxWidth: "420px",
                    width: "100%",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        width: "72px",
                        height: "72px",
                        borderRadius: "50%",
                        backgroundColor: "#fdd0ce",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <LockClosed24Regular style={{ color: "#ce280b", fontSize: "32px" }} />
                </div>

                <Text
                    size={600}
                    weight="semibold"
                    style={{ color: "#242424" }}
                >
                    Access Restricted
                </Text>

                <Text
                    size={300}
                    style={{ color: "#605E5C", lineHeight: "1.5" ,textAlign:'center'}}
                >
                    You do not have permission to view this page. Please contact your administrator if you believe this is an error.
                </Text>

                {/* <Button
                    appearance="primary"
                    style={{ backgroundColor: "#0078D4", marginTop: "8px" }}
                    onClick={() => navigate(-1)}
                >
                    Go Back
                </Button> */}
            </div>
        </div>
    );
};

export default Unauthorized;